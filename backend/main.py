"""
NAMASTE-ICD11 Terminology Service Backend
A FHIR-compliant terminology microservice for traditional medicine integration
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import sqlite3
import json
from datetime import datetime
import logging
import os
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NAMASTE-ICD11 Terminology Service",
    description="FHIR R4 compliant terminology service for traditional medicine dual coding",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Database configuration
DATABASE_PATH = "namaste_terminology.db"

# Pydantic Models
class NAMASTEConcept(BaseModel):
    code: str
    system: str  # ayurveda, siddha, unani
    originalTerm: str
    englishTerm: str
    definition: str
    category: str

class ICD11Concept(BaseModel):
    code: str
    term: str
    system: str = "http://id.who.int/icd/release/11/mms"

class ConceptMapping(BaseModel):
    namasteCode: str
    namasteTerm: str
    originalTerm: str
    system: str
    icd11Code: Optional[str]
    icd11Term: Optional[str]
    equivalence: str  # equivalent, relatedto, wider, narrower, unmatched
    confidence: float
    mappingType: str  # direct, contextual, clustered, unmapped
    clinicalNotes: str

class TerminologySearchResponse(BaseModel):
    code: str
    system: str
    originalTerm: str
    englishTerm: str
    definition: str
    category: str

class TranslateRequest(BaseModel):
    system: str
    code: str
    target: str = "http://id.who.int/icd/release/11/mms"

class TranslateResponse(BaseModel):
    result: bool
    message: Optional[str] = None
    match: List[Dict[str, Any]] = []

class FHIRBundle(BaseModel):
    resourceType: str = "Bundle"
    type: str
    timestamp: str
    entry: List[Dict[str, Any]]

class FHIRBundleResponse(BaseModel):
    resourceType: str = "Bundle"
    type: str = "transaction-response"
    timestamp: str
    entry: List[Dict[str, Any]]

# Database operations
@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize the database with schema and sample data"""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Create NAMASTE terminology table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS namaste_terminology (
                code TEXT PRIMARY KEY,
                system TEXT NOT NULL,
                original_term TEXT NOT NULL,
                english_term TEXT NOT NULL,
                definition TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create concept mapping table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS concept_mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                namaste_code TEXT NOT NULL,
                icd11_code TEXT,
                equivalence TEXT NOT NULL,
                confidence REAL NOT NULL,
                mapping_type TEXT NOT NULL,
                clinical_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (namaste_code) REFERENCES namaste_terminology (code)
            )
        ''')
        
        # Create encounters table for clinical data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS encounters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                bundle_id TEXT UNIQUE NOT NULL,
                patient_id TEXT NOT NULL,
                encounter_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        
        # Insert sample data if tables are empty
        cursor.execute("SELECT COUNT(*) FROM namaste_terminology")
        if cursor.fetchone()[0] == 0:
            insert_sample_data(conn)

def insert_sample_data(conn):
    """Insert comprehensive sample NAMASTE terminology and mapping data"""
    
    # Sample NAMASTE terminologies
    terminologies = [
        ('AAE-16', 'ayurveda', 'सन्धिगतवात', 'Sandhigatavata', 'Osteoarthritis - degenerative joint disease characterized by Vata dosha imbalance', 'Musculoskeletal Disorders'),
        ('AST-23', 'ayurveda', 'अम्लपित्त', 'Amlapitta', 'Hyperacidity - excess acid production due to Pitta dosha aggravation', 'Digestive Disorders'),
        ('SUC-45', 'siddha', 'வாத சூலை', 'Vatha Soolai', 'Rheumatoid arthritis - inflammatory joint condition', 'Noi Nadal (Pathology)'),
        ('UNI-12', 'unani', 'وجع المفاصل', 'Waja al-Mafasil', 'Joint pain syndrome - musculoskeletal disorder in Unani medicine', 'Musculoskeletal'),
        ('AYU-78', 'ayurveda', 'कास', 'Kasa', 'Cough - respiratory disorder with various etiologies', 'Respiratory Disorders'),
        ('SID-89', 'siddha', 'கபக் கோட்டம்', 'Kabak Kottam', 'Bronchial asthma - chronic respiratory condition', 'Maruthuvam (General Medicine)'),
        ('AYU-99', 'ayurveda', 'उन्माद', 'Unmada', 'Psychosis/Mental disorder - imbalance of psychological faculties', 'Mental Health'),
        ('SID-67', 'siddha', 'நெஞ்சு வலி', 'Nenju Vali', 'Chest pain - thoracic region discomfort', 'Cardiovascular'),
        ('UNI-34', 'unani', 'صداع', 'Sudaa', 'Headache - cephalic pain condition', 'Neurological'),
        ('AYU-45', 'ayurveda', 'ज्वर', 'Jwara', 'Fever - elevated body temperature due to dosha imbalance', 'General Medicine'),
        ('SID-23', 'siddha', 'வயிற்று வலி', 'Vayitru Vali', 'Abdominal pain - gastric region discomfort', 'Digestive Disorders'),
        ('UNI-56', 'unani', 'ضعف معدہ', 'Zoaf Meda', 'Gastric weakness - digestive system dysfunction', 'Digestive Disorders'),
        ('AYU-67', 'ayurveda', 'प्रमेह', 'Prameha', 'Diabetes mellitus - metabolic disorder with excessive urination', 'Endocrine Disorders'),
        ('SID-78', 'siddha', 'மூல நோய்', 'Moola Noi', 'Hemorrhoids - anorectal vascular condition', 'Proctology'),
        ('UNI-89', 'unani', 'بواسیر', 'Bawaseer', 'Piles - hemorrhoidal condition', 'Proctology'),
    ]
    
    cursor = conn.cursor()
    cursor.executemany('''
        INSERT INTO namaste_terminology 
        (code, system, original_term, english_term, definition, category)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', terminologies)
    
    # Sample concept mappings
    mappings = [
        ('AAE-16', 'FA20', 'equivalent', 0.95, 'direct', 'Direct mapping - both refer to degenerative joint disease'),
        ('AST-23', 'DA60', 'relatedto', 0.78, 'contextual', 'Related condition - hyperacidity maps to GERD in biomedical terms'),
        ('SUC-45', 'FA20.0&XK8G', 'wider', 0.85, 'clustered', 'Post-coordinated mapping using stem + extension codes'),
        ('UNI-12', 'MG30', 'equivalent', 0.92, 'direct', 'Exact semantic match for joint pain syndrome'),
        ('AYU-78', 'MD12', 'equivalent', 0.98, 'direct', 'Perfect equivalence - symptom-based mapping'),
        ('SID-89', 'CA23', 'equivalent', 0.89, 'direct', 'Direct mapping to bronchial asthma'),
        ('AYU-99', None, 'unmatched', 0.0, 'unmapped', 'Complex traditional concept with no direct biomedical equivalent'),
        ('SID-67', 'ME64', 'equivalent', 0.87, 'direct', 'Direct mapping to chest pain'),
        ('UNI-34', 'MC10', 'equivalent', 0.94, 'direct', 'Direct mapping to headache'),
        ('AYU-45', 'MC90', 'equivalent', 0.96, 'direct', 'Direct mapping to fever'),
        ('SID-23', 'MG40', 'equivalent', 0.91, 'direct', 'Direct mapping to abdominal pain'),
        ('UNI-56', 'DA61', 'relatedto', 0.73, 'contextual', 'Related to functional dyspepsia'),
        ('AYU-67', 'EA90', 'equivalent', 0.93, 'direct', 'Direct mapping to diabetes mellitus'),
        ('SID-78', 'MF20', 'equivalent', 0.89, 'direct', 'Direct mapping to hemorrhoids'),
        ('UNI-89', 'MF20', 'equivalent', 0.91, 'direct', 'Direct mapping to hemorrhoids'),
    ]
    
    cursor.executemany('''
        INSERT INTO concept_mappings 
        (namaste_code, icd11_code, equivalence, confidence, mapping_type, clinical_notes)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', mappings)
    
    conn.commit()
    logger.info("Sample data inserted successfully")

# Dependency for optional authentication
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Optional authentication dependency for ABHA integration"""
    if credentials is None:
        return None
    
    # In production, validate JWT token against ABDM/ABHA
    # For demo purposes, we'll accept any bearer token
    token = credentials.credentials
    if token:
        return {"user_id": "demo_user", "scopes": ["terminology:read", "encounter:write"]}
    return None

# API Endpoints

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "NAMASTE-ICD11 Terminology Service", "version": "1.0.0"}

@app.get("/lookup", response_model=List[TerminologySearchResponse])
async def lookup_terminology(
    q: str = Query(..., description="Search query string"),
    system: Optional[str] = Query(None, description="AYUSH system filter (ayurveda, siddha, unani)"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    user = Depends(get_current_user)
):
    """
    Fast terminology lookup endpoint for auto-complete functionality
    Supports searching by code, English term, original term, or definition
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Build dynamic query based on filters
            base_query = '''
                SELECT code, system, original_term, english_term, definition, category
                FROM namaste_terminology
                WHERE (
                    LOWER(code) LIKE LOWER(?) OR
                    LOWER(english_term) LIKE LOWER(?) OR
                    LOWER(original_term) LIKE LOWER(?) OR
                    LOWER(definition) LIKE LOWER(?)
                )
            '''
            
            params = [f"%{q}%"] * 4
            
            if system:
                base_query += " AND system = ?"
                params.append(system)
            
            base_query += " ORDER BY english_term LIMIT ?"
            params.append(limit)
            
            cursor.execute(base_query, params)
            results = cursor.fetchall()
            
            return [
                TerminologySearchResponse(
                    code=row['code'],
                    system=row['system'],
                    originalTerm=row['original_term'],
                    englishTerm=row['english_term'],
                    definition=row['definition'],
                    category=row['category']
                )
                for row in results
            ]
            
    except Exception as e:
        logger.error(f"Error in lookup_terminology: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during terminology lookup")

@app.post("/ConceptMap/$translate", response_model=TranslateResponse)
async def translate_concept(
    request: TranslateRequest,
    user = Depends(get_current_user)
):
    """
    FHIR $translate operation for mapping NAMASTE codes to ICD-11
    Implements standard FHIR terminology operation
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Validate source system
            if request.system != "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE":
                return TranslateResponse(
                    result=False,
                    message="Unsupported source code system"
                )
            
            # Find the mapping
            cursor.execute('''
                SELECT 
                    nt.code, nt.english_term, nt.original_term, nt.system,
                    cm.icd11_code, cm.equivalence, cm.confidence, cm.mapping_type, cm.clinical_notes
                FROM namaste_terminology nt
                LEFT JOIN concept_mappings cm ON nt.code = cm.namaste_code
                WHERE nt.code = ?
            ''', (request.code,))
            
            result = cursor.fetchone()
            
            if not result:
                return TranslateResponse(
                    result=False,
                    message=f"Source concept {request.code} not found"
                )
            
            if not result['icd11_code']:
                return TranslateResponse(
                    result=True,
                    message="No mapping available for this concept",
                    match=[{
                        "equivalence": "unmatched",
                        "concept": {
                            "code": request.code,
                            "display": result['english_term']
                        }
                    }]
                )
            
            # Get ICD-11 term display
            icd11_terms = {
                'FA20': 'Osteoarthritis',
                'DA60': 'Gastro-oesophageal reflux disease',
                'FA20.0&XK8G': 'Rheumatoid arthritis of multiple sites',
                'MG30': 'Joint pain',
                'MD12': 'Cough',
                'CA23': 'Bronchial asthma',
                'ME64': 'Chest pain',
                'MC10': 'Headache',
                'MC90': 'Fever',
                'MG40': 'Abdominal pain',
                'DA61': 'Functional dyspepsia',
                'EA90': 'Diabetes mellitus',
                'MF20': 'Hemorrhoids'
            }
            
            icd11_display = icd11_terms.get(result['icd11_code'], result['icd11_code'])
            
            return TranslateResponse(
                result=True,
                match=[{
                    "equivalence": result['equivalence'],
                    "concept": {
                        "system": request.target,
                        "code": result['icd11_code'],
                        "display": icd11_display
                    },
                    "confidence": result['confidence'],
                    "mapping_type": result['mapping_type'],
                    "clinical_notes": result['clinical_notes']
                }]
            )
            
    except Exception as e:
        logger.error(f"Error in translate_concept: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during concept translation")

@app.get("/mappings", response_model=List[ConceptMapping])
async def get_concept_mappings(
    equivalence: Optional[str] = Query(None, description="Filter by equivalence type"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results"),
    user = Depends(get_current_user)
):
    """
    Get concept mappings for visualization and analysis
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            base_query = '''
                SELECT 
                    nt.code as namaste_code,
                    nt.english_term as namaste_term,
                    nt.original_term,
                    nt.system,
                    cm.icd11_code,
                    cm.equivalence,
                    cm.confidence,
                    cm.mapping_type,
                    cm.clinical_notes
                FROM namaste_terminology nt
                LEFT JOIN concept_mappings cm ON nt.code = cm.namaste_code
                WHERE 1=1
            '''
            
            params = []
            
            if equivalence:
                base_query += " AND cm.equivalence = ?"
                params.append(equivalence)
            
            if system:
                base_query += " AND nt.system = ?"
                params.append(system)
            
            base_query += " ORDER BY nt.english_term LIMIT ?"
            params.append(limit)
            
            cursor.execute(base_query, params)
            results = cursor.fetchall()
            
            # Get ICD-11 term displays
            icd11_terms = {
                'FA20': 'Osteoarthritis',
                'DA60': 'Gastro-oesophageal reflux disease',
                'FA20.0&XK8G': 'Rheumatoid arthritis of multiple sites',
                'MG30': 'Joint pain',
                'MD12': 'Cough',
                'CA23': 'Bronchial asthma',
                'ME64': 'Chest pain',
                'MC10': 'Headache',
                'MC90': 'Fever',
                'MG40': 'Abdominal pain',
                'DA61': 'Functional dyspepsia',
                'EA90': 'Diabetes mellitus',
                'MF20': 'Hemorrhoids'
            }
            
            mappings = []
            for row in results:
                icd11_term = None
                if row['icd11_code']:
                    icd11_term = icd11_terms.get(row['icd11_code'], row['icd11_code'])
                
                mappings.append(ConceptMapping(
                    namasteCode=row['namaste_code'],
                    namasteTerm=row['namaste_term'],
                    originalTerm=row['original_term'],
                    system=row['system'],
                    icd11Code=row['icd11_code'],
                    icd11Term=icd11_term,
                    equivalence=row['equivalence'] or 'unmatched',
                    confidence=row['confidence'] or 0.0,
                    mappingType=row['mapping_type'] or 'unmapped',
                    clinicalNotes=row['clinical_notes'] or ''
                ))
            
            return mappings
            
    except Exception as e:
        logger.error(f"Error in get_concept_mappings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during mappings retrieval")

@app.post("/Encounter", response_model=FHIRBundleResponse)
async def create_encounter(
    bundle: FHIRBundle,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    """
    Process clinical encounter with dual coding
    Accepts FHIR Bundle, performs NAMASTE->ICD-11 mapping, and persists dual-coded record
    """
    try:
        # Validate bundle structure
        if bundle.resourceType != "Bundle" or bundle.type != "transaction":
            raise HTTPException(status_code=400, detail="Invalid bundle type")
        
        # Process each resource in the bundle
        processed_entries = []
        patient_id = None
        encounter_id = None
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            for entry in bundle.entry:
                resource = entry.get("resource", {})
                resource_type = resource.get("resourceType")
                
                if resource_type == "Patient":
                    patient_id = resource.get("id")
                    processed_entries.append({
                        "response": {
                            "status": "201 Created",
                            "location": f"Patient/{patient_id}"
                        }
                    })
                
                elif resource_type == "Encounter":
                    encounter_id = resource.get("id") or f"encounter-{int(datetime.now().timestamp())}"
                    resource["id"] = encounter_id
                    processed_entries.append({
                        "response": {
                            "status": "201 Created",
                            "location": f"Encounter/{encounter_id}"
                        }
                    })
                
                elif resource_type == "Condition":
                    # Process condition with dual coding
                    condition_id = resource.get("id") or f"condition-{int(datetime.now().timestamp())}"
                    resource["id"] = condition_id
                    
                    # Extract NAMASTE coding
                    code_element = resource.get("code", {})
                    codings = code_element.get("coding", [])
                    
                    namaste_coding = None
                    icd11_coding = None
                    
                    for coding in codings:
                        if coding.get("system") == "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE":
                            namaste_coding = coding
                        elif coding.get("system") == "http://id.who.int/icd/release/11/mms":
                            icd11_coding = coding
                    
                    # If we have NAMASTE coding but no ICD-11, perform translation
                    if namaste_coding and not icd11_coding:
                        namaste_code = namaste_coding.get("code")
                        
                        # Look up mapping
                        cursor.execute('''
                            SELECT cm.icd11_code, cm.equivalence, cm.confidence
                            FROM concept_mappings cm
                            WHERE cm.namaste_code = ?
                        ''', (namaste_code,))
                        
                        mapping_result = cursor.fetchone()
                        
                        if mapping_result and mapping_result['icd11_code']:
                            # Get ICD-11 term display
                            icd11_terms = {
                                'FA20': 'Osteoarthritis',
                                'DA60': 'Gastro-oesophageal reflux disease',
                                'FA20.0&XK8G': 'Rheumatoid arthritis of multiple sites',
                                'MG30': 'Joint pain',
                                'MD12': 'Cough',
                                'CA23': 'Bronchial asthma',
                                'ME64': 'Chest pain',
                                'MC10': 'Headache',
                                'MC90': 'Fever',
                                'MG40': 'Abdominal pain',
                                'DA61': 'Functional dyspepsia',
                                'EA90': 'Diabetes mellitus',
                                'MF20': 'Hemorrhoids'
                            }
                            
                            icd11_display = icd11_terms.get(mapping_result['icd11_code'], mapping_result['icd11_code'])
                            
                            # Add ICD-11 coding to the condition
                            icd11_coding = {
                                "system": "http://id.who.int/icd/release/11/mms",
                                "code": mapping_result['icd11_code'],
                                "display": icd11_display
                            }
                            
                            code_element["coding"].append(icd11_coding)
                            resource["code"] = code_element
                    
                    processed_entries.append({
                        "response": {
                            "status": "201 Created",
                            "location": f"Condition/{condition_id}"
                        }
                    })
                
                else:
                    # Handle other resource types
                    resource_id = resource.get("id") or f"{resource_type.lower()}-{int(datetime.now().timestamp())}"
                    resource["id"] = resource_id
                    processed_entries.append({
                        "response": {
                            "status": "201 Created",
                            "location": f"{resource_type}/{resource_id}"
                        }
                    })
            
            # Store the processed bundle
            bundle_id = f"bundle-{int(datetime.now().timestamp())}"
            processed_bundle = {
                "resourceType": "Bundle",
                "type": "transaction",
                "timestamp": datetime.now().isoformat(),
                "entry": bundle.entry
            }
            
            cursor.execute('''
                INSERT INTO encounters (bundle_id, patient_id, encounter_data)
                VALUES (?, ?, ?)
            ''', (bundle_id, patient_id or "unknown", json.dumps(processed_bundle.dict() if hasattr(processed_bundle, 'dict') else processed_bundle)))
            
            conn.commit()
        
        return FHIRBundleResponse(
            timestamp=datetime.now().isoformat(),
            entry=processed_entries
        )
        
    except Exception as e:
        logger.error(f"Error in create_encounter: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error during encounter processing: {str(e)}")

@app.get("/statistics")
async def get_statistics(user = Depends(get_current_user)):
    """
    Get terminology and mapping statistics for dashboard
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Get terminology counts by system
            cursor.execute('''
                SELECT system, COUNT(*) as count
                FROM namaste_terminology
                GROUP BY system
            ''')
            system_counts = dict(cursor.fetchall())
            
            # Get mapping statistics
            cursor.execute('''
                SELECT equivalence, COUNT(*) as count
                FROM concept_mappings
                GROUP BY equivalence
            ''')
            equivalence_counts = dict(cursor.fetchall())
            
            # Get total counts
            cursor.execute('SELECT COUNT(*) FROM namaste_terminology')
            total_terms = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM concept_mappings WHERE icd11_code IS NOT NULL')
            mapped_terms = cursor.fetchone()[0]
            
            cursor.execute('SELECT COUNT(*) FROM encounters')
            total_encounters = cursor.fetchone()[0]
            
            return {
                "total_terms": total_terms,
                "mapped_terms": mapped_terms,
                "total_encounters": total_encounters,
                "system_distribution": system_counts,
                "equivalence_distribution": equivalence_counts
            }
            
    except Exception as e:
        logger.error(f"Error in get_statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during statistics retrieval")

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and sample data on application startup"""
    logger.info("Initializing NAMASTE-ICD11 Terminology Service...")
    init_database()
    logger.info("Database initialized successfully")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")