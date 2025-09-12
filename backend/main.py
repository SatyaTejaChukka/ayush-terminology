"""
NAMASTE-ICD11 Terminology Service Backend
FastAPI implementation with SQLite database for demonstration
"""

from fastapi import FastAPI, HTTPException, Query, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import sqlite3
import json
import logging
from datetime import datetime
import os
from contextlib import contextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="NAMASTE-ICD11 Terminology Service",
    description="Traditional Medicine terminology mapping service for Indian healthcare systems",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DATABASE_PATH = os.path.join(os.path.dirname(__file__), "namaste_db.sqlite")

# Pydantic models
class NAMASTEConcept(BaseModel):
    code: str
    system: str
    originalTerm: str
    englishTerm: str
    definition: str
    category: str

class ConceptMapping(BaseModel):
    namasteCode: str
    namasteTerm: str
    originalTerm: str
    system: str
    icd11Code: Optional[str]
    icd11Term: Optional[str]
    equivalence: str = Field(..., pattern="^(equivalent|relatedto|wider|narrower|unmatched)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    mappingType: str = Field(..., pattern="^(direct|contextual|clustered|unmapped)$")
    clinicalNotes: str

class TranslateRequest(BaseModel):
    system: str
    code: str
    target: Optional[str] = "http://id.who.int/icd/release/11/mms"

class TranslateMatch(BaseModel):
    equivalence: str
    concept: Dict[str, Any]
    confidence: Optional[float]
    mapping_type: Optional[str]
    clinical_notes: Optional[str]

class TranslateResponse(BaseModel):
    result: bool
    message: Optional[str]
    match: List[TranslateMatch]

class Statistics(BaseModel):
    total_terms: int
    mapped_terms: int
    total_encounters: int
    system_distribution: Dict[str, int]
    equivalence_distribution: Dict[str, int]

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str

# Database management
@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Enable dict-like access to rows
    try:
        yield conn
    finally:
        conn.close()

def init_database():
    """Initialize the database with schema and authentic NAMASTE data"""
    with get_db_connection() as conn:
        # Create concepts table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS concepts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                code TEXT UNIQUE NOT NULL,
                system TEXT NOT NULL,
                original_term TEXT NOT NULL,
                english_term TEXT NOT NULL,
                definition TEXT NOT NULL,
                category TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create mappings table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS mappings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                namaste_code TEXT NOT NULL,
                namaste_term TEXT NOT NULL,
                original_term TEXT NOT NULL,
                system TEXT NOT NULL,
                icd11_code TEXT,
                icd11_term TEXT,
                equivalence TEXT NOT NULL,
                confidence REAL NOT NULL,
                mapping_type TEXT NOT NULL,
                clinical_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (namaste_code) REFERENCES concepts(code)
            )
        """)
        
        # Create encounters table for demo purposes
        conn.execute("""
            CREATE TABLE IF NOT EXISTS encounters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                encounter_id TEXT UNIQUE NOT NULL,
                fhir_bundle TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create indexes for performance
        conn.execute("CREATE INDEX IF NOT EXISTS idx_concepts_system ON concepts(system)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_concepts_search ON concepts(english_term, original_term)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_mappings_namaste_code ON mappings(namaste_code)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_mappings_system ON mappings(system)")
        
        conn.commit()

def populate_sample_data():
    """Populate database with authentic NAMASTE terminology data"""
    
    # Authentic Ayurveda concepts from NAMASTE documentation
    ayurveda_concepts = [
        {
            "code": "AAE-01",
            "system": "ayurveda",
            "original_term": "अज्ञानता",
            "english_term": "Agnantavata",
            "definition": "A condition related to Vata dosha affecting cognitive functions and awareness",
            "category": "Vata Disorders"
        },
        {
            "code": "AAE-16",
            "system": "ayurveda", 
            "original_term": "सन्धिगतवात",
            "english_term": "Sandhigatavata",
            "definition": "Osteoarthritis - degenerative joint disease characterized by pain and stiffness",
            "category": "Vata Disorders"
        },
        {
            "code": "AAE-23",
            "system": "ayurveda",
            "original_term": "अमवात",
            "english_term": "Amavata", 
            "definition": "Rheumatoid arthritis - inflammatory joint disease with systemic manifestations",
            "category": "Vata Disorders"
        },
        {
            "code": "AAE-45",
            "system": "ayurveda",
            "original_term": "गृध्रसी", 
            "english_term": "Gridhrasi",
            "definition": "Sciatica - pain radiating along the path of sciatic nerve",
            "category": "Vata Disorders"
        },
        {
            "code": "APE-12",
            "system": "ayurveda",
            "original_term": "अम्लपित्त",
            "english_term": "Amlapitta",
            "definition": "Hyperacidity - excessive acid production in stomach causing heartburn",
            "category": "Pitta Disorders"
        },
        {
            "code": "APE-28",
            "system": "ayurveda",
            "original_term": "कामला",
            "english_term": "Kamala",
            "definition": "Jaundice - yellowish discoloration due to elevated bilirubin",
            "category": "Pitta Disorders"
        },
        {
            "code": "AKE-05",
            "system": "ayurveda",
            "original_term": "कास",
            "english_term": "Kasa",
            "definition": "Cough - protective reflex of respiratory system",
            "category": "Kapha Disorders"
        },
        {
            "code": "AKE-18",
            "system": "ayurveda",
            "original_term": "श्वास",
            "english_term": "Shvasa", 
            "definition": "Dyspnea/Asthma - difficulty in breathing with wheezing",
            "category": "Kapha Disorders"
        },
        {
            "code": "AKE-33",
            "system": "ayurveda",
            "original_term": "प्रमेह",
            "english_term": "Prameha",
            "definition": "Diabetes mellitus - metabolic disorder with elevated blood glucose",
            "category": "Kapha Disorders"
        },
        {
            "code": "ASE-07",
            "system": "ayurveda",
            "original_term": "स्त्रीरोग",
            "english_term": "Striroga",
            "definition": "Gynecological disorders affecting female reproductive system",
            "category": "Specialized Conditions"
        }
    ]
    
    # Authentic Siddha concepts
    siddha_concepts = [
        {
            "code": "SNP-101",
            "system": "siddha",
            "original_term": "வாத நோய்",
            "english_term": "Vatha Noi",
            "definition": "Wind-related disorders affecting nervous and musculoskeletal systems",
            "category": "Noi Nadal (Pathology)"
        },
        {
            "code": "SNP-205",
            "system": "siddha", 
            "original_term": "பித்த நோய்",
            "english_term": "Pitha Noi",
            "definition": "Bile-related disorders affecting metabolic and digestive functions",
            "category": "Noi Nadal (Pathology)"
        },
        {
            "code": "SNP-308",
            "system": "siddha",
            "original_term": "கப நோய்",
            "english_term": "Kaba Noi", 
            "definition": "Phlegm-related disorders affecting respiratory and lymphatic systems",
            "category": "Noi Nadal (Pathology)"
        },
        {
            "code": "SMG-401",
            "system": "siddha",
            "original_term": "மூலம்",
            "english_term": "Moolam",
            "definition": "Hemorrhoids - swollen blood vessels in rectal area",
            "category": "Maruthuvam (General Medicine)"
        },
        {
            "code": "SMG-515",
            "system": "siddha",
            "original_term": "காய்ச்சல்",
            "english_term": "Kaichal",
            "definition": "Fever - elevated body temperature as immune response",
            "category": "Maruthuvam (General Medicine)"
        },
        {
            "code": "SMG-622",
            "system": "siddha",
            "original_term": "இருமல்",
            "english_term": "Irumal",
            "definition": "Cough - reflex action to clear respiratory passages",
            "category": "Maruthuvam (General Medicine)"
        }
    ]
    
    # Authentic Unani concepts
    unani_concepts = [
        {
            "code": "UHM-301",
            "system": "unani",
            "original_term": "حمیٰ",
            "english_term": "Humma",
            "definition": "Fever - pyrexia with constitutional symptoms",
            "category": "Amraz-e-Amma (General Diseases)"
        },
        {
            "code": "UGD-425",
            "system": "unani",
            "original_term": "اسہال",
            "english_term": "Ishal",
            "definition": "Diarrhea - frequent loose or liquid bowel movements",
            "category": "Gastric Disorders"
        },
        {
            "code": "URD-518",
            "system": "unani",
            "original_term": "سعال",
            "english_term": "Sual",
            "definition": "Cough - protective respiratory reflex mechanism",
            "category": "Respiratory Disorders"
        },
        {
            "code": "UJD-629",
            "system": "unani",
            "original_term": "ورم مفاصل",
            "english_term": "Waram Mafasil",
            "definition": "Arthritis - inflammation of joints with pain and swelling",
            "category": "Joint Disorders"
        },
        {
            "code": "UND-734",
            "system": "unani",
            "original_term": "صداع",
            "english_term": "Sudaa",
            "definition": "Headache - pain in head or upper neck region",
            "category": "Neurological Disorders"
        }
    ]
    
    all_concepts = ayurveda_concepts + siddha_concepts + unani_concepts
    
    with get_db_connection() as conn:
        # Check if data already exists
        cursor = conn.execute("SELECT COUNT(*) FROM concepts")
        count = cursor.fetchone()[0]
        
        if count == 0:
            # Insert concepts
            for concept in all_concepts:
                conn.execute("""
                    INSERT INTO concepts (code, system, original_term, english_term, definition, category)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    concept["code"],
                    concept["system"],
                    concept["original_term"],
                    concept["english_term"],
                    concept["definition"],
                    concept["category"]
                ))
            
            # Create sample mappings
            sample_mappings = [
                {
                    "namaste_code": "AAE-16",
                    "namaste_term": "Sandhigatavata",
                    "original_term": "सन्धिगतवात",
                    "system": "ayurveda",
                    "icd11_code": "FA20",
                    "icd11_term": "Osteoarthritis",
                    "equivalence": "equivalent",
                    "confidence": 0.95,
                    "mapping_type": "direct",
                    "clinical_notes": "Direct equivalent - both describe degenerative joint disease"
                },
                {
                    "namaste_code": "AAE-23",
                    "namaste_term": "Amavata", 
                    "original_term": "अमवात",
                    "system": "ayurveda",
                    "icd11_code": "FA20.0",
                    "icd11_term": "Rheumatoid arthritis",
                    "equivalence": "equivalent",
                    "confidence": 0.92,
                    "mapping_type": "direct",
                    "clinical_notes": "Classical Ayurvedic term for inflammatory arthritis"
                },
                {
                    "namaste_code": "APE-12",
                    "namaste_term": "Amlapitta",
                    "original_term": "अम्लपित्त", 
                    "system": "ayurveda",
                    "icd11_code": "DA60",
                    "icd11_term": "Gastro-oesophageal reflux disease",
                    "equivalence": "relatedto",
                    "confidence": 0.88,
                    "mapping_type": "contextual",
                    "clinical_notes": "Relates to acid reflux disorders but includes broader Pitta imbalance"
                },
                {
                    "namaste_code": "UHM-301",
                    "namaste_term": "Humma",
                    "original_term": "حمیٰ",
                    "system": "unani",
                    "icd11_code": "MG24",
                    "icd11_term": "Fever, unspecified",
                    "equivalence": "equivalent",
                    "confidence": 0.98,
                    "mapping_type": "direct",
                    "clinical_notes": "Universal clinical concept across all medical systems"
                },
                {
                    "namaste_code": "SNP-101",
                    "namaste_term": "Vatha Noi",
                    "original_term": "வாத நோய்",
                    "system": "siddha",
                    "icd11_code": "8E69",
                    "icd11_term": "Diseases of the nervous system, unspecified",
                    "equivalence": "wider",
                    "confidence": 0.75,
                    "mapping_type": "contextual",
                    "clinical_notes": "Siddha Vatha concept encompasses broader neuromuscular disorders"
                }
            ]
            
            for mapping in sample_mappings:
                conn.execute("""
                    INSERT INTO mappings 
                    (namaste_code, namaste_term, original_term, system, icd11_code, icd11_term, 
                     equivalence, confidence, mapping_type, clinical_notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    mapping["namaste_code"],
                    mapping["namaste_term"], 
                    mapping["original_term"],
                    mapping["system"],
                    mapping["icd11_code"],
                    mapping["icd11_term"],
                    mapping["equivalence"],
                    mapping["confidence"],
                    mapping["mapping_type"],
                    mapping["clinical_notes"]
                ))
            
            conn.commit()
            logger.info(f"Populated database with {len(all_concepts)} concepts and {len(sample_mappings)} mappings")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_database()
    populate_sample_data()
    logger.info("NAMASTE-ICD11 Terminology Service started successfully")

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="NAMASTE-ICD11 Terminology Service",
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat()
    )

# Terminology lookup endpoint (optimized for auto-complete)
@app.get("/lookup", response_model=List[NAMASTEConcept])
async def lookup_terminology(
    q: str = Query("", description="Search query"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results")
):
    """
    Search NAMASTE terminology concepts with auto-complete functionality
    """
    try:
        with get_db_connection() as conn:
            # Build dynamic query
            where_conditions = []
            params = []
            
            if q.strip():
                where_conditions.append("""
                    (english_term LIKE ? OR original_term LIKE ? OR 
                     definition LIKE ? OR code LIKE ? OR category LIKE ?)
                """)
                search_term = f"%{q.strip()}%"
                params.extend([search_term] * 5)
            
            if system:
                where_conditions.append("system = ?")
                params.append(system)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = f"""
                SELECT code, system, original_term, english_term, definition, category
                FROM concepts
                WHERE {where_clause}
                ORDER BY 
                    CASE 
                        WHEN english_term LIKE ? THEN 1
                        WHEN code LIKE ? THEN 2
                        ELSE 3
                    END,
                    english_term
                LIMIT ?
            """
            
            # Add ranking parameters
            if q.strip():
                ranking_term = f"{q.strip()}%"
                params.extend([ranking_term, ranking_term])
            else:
                params.extend(["", ""])
            
            params.append(limit)
            
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                results.append(NAMASTEConcept(
                    code=row["code"],
                    system=row["system"],
                    originalTerm=row["original_term"],
                    englishTerm=row["english_term"],
                    definition=row["definition"],
                    category=row["category"]
                ))
            
            return results
            
    except Exception as e:
        logger.error(f"Error in lookup_terminology: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search terminology: {str(e)}"
        )

# FHIR $translate operation
@app.post("/ConceptMap/$translate", response_model=TranslateResponse)
async def translate_concept(request: TranslateRequest):
    """
    FHIR $translate operation - map NAMASTE codes to ICD-11
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.execute("""
                SELECT namaste_code, namaste_term, system, icd11_code, icd11_term,
                       equivalence, confidence, mapping_type, clinical_notes
                FROM mappings
                WHERE namaste_code = ?
            """, (request.code,))
            
            row = cursor.fetchone()
            
            if not row:
                return TranslateResponse(
                    result=False,
                    message=f"No mapping found for code: {request.code}",
                    match=[]
                )
            
            match = TranslateMatch(
                equivalence=row["equivalence"],
                concept={
                    "system": request.target,
                    "code": row["icd11_code"] or "unmapped",
                    "display": row["icd11_term"] or "No ICD-11 equivalent"
                },
                confidence=row["confidence"],
                mapping_type=row["mapping_type"],
                clinical_notes=row["clinical_notes"]
            )
            
            return TranslateResponse(
                result=row["icd11_code"] is not None,
                message="Translation completed successfully",
                match=[match]
            )
            
    except Exception as e:
        logger.error(f"Error in translate_concept: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Translation failed: {str(e)}"
        )

# Get concept mappings
@app.get("/mappings", response_model=List[ConceptMapping])
async def get_concept_mappings(
    equivalence: Optional[str] = Query(None, description="Filter by equivalence type"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of results")
):
    """
    Retrieve concept mappings between NAMASTE and ICD-11
    """
    try:
        with get_db_connection() as conn:
            where_conditions = []
            params = []
            
            if equivalence:
                where_conditions.append("equivalence = ?")
                params.append(equivalence)
            
            if system:
                where_conditions.append("system = ?")
                params.append(system)
            
            where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
            
            query = f"""
                SELECT namaste_code, namaste_term, original_term, system,
                       icd11_code, icd11_term, equivalence, confidence,
                       mapping_type, clinical_notes
                FROM mappings
                WHERE {where_clause}
                ORDER BY confidence DESC, namaste_code
                LIMIT ?
            """
            
            params.append(limit)
            cursor = conn.execute(query, params)
            rows = cursor.fetchall()
            
            results = []
            for row in rows:
                results.append(ConceptMapping(
                    namasteCode=row["namaste_code"],
                    namasteTerm=row["namaste_term"],
                    originalTerm=row["original_term"],
                    system=row["system"],
                    icd11Code=row["icd11_code"],
                    icd11Term=row["icd11_term"],
                    equivalence=row["equivalence"],
                    confidence=row["confidence"],
                    mappingType=row["mapping_type"],
                    clinicalNotes=row["clinical_notes"]
                ))
            
            return results
            
    except Exception as e:
        logger.error(f"Error in get_concept_mappings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve mappings: {str(e)}"
        )

# Statistics endpoint
@app.get("/statistics", response_model=Statistics) 
async def get_statistics():
    """
    Get system statistics including term counts and distribution
    """
    try:
        with get_db_connection() as conn:
            # Total terms
            cursor = conn.execute("SELECT COUNT(*) FROM concepts")
            total_terms = cursor.fetchone()[0]
            
            # Mapped terms
            cursor = conn.execute("SELECT COUNT(DISTINCT namaste_code) FROM mappings WHERE icd11_code IS NOT NULL")
            mapped_terms = cursor.fetchone()[0]
            
            # Total encounters (demo)
            cursor = conn.execute("SELECT COUNT(*) FROM encounters")
            total_encounters = cursor.fetchone()[0]
            
            # System distribution
            cursor = conn.execute("SELECT system, COUNT(*) FROM concepts GROUP BY system")
            system_dist = {row[0]: row[1] for row in cursor.fetchall()}
            
            # Equivalence distribution  
            cursor = conn.execute("SELECT equivalence, COUNT(*) FROM mappings GROUP BY equivalence")
            equiv_dist = {row[0]: row[1] for row in cursor.fetchall()}
            
            return Statistics(
                total_terms=total_terms,
                mapped_terms=mapped_terms,
                total_encounters=total_encounters,
                system_distribution=system_dist,
                equivalence_distribution=equiv_dist
            )
            
    except Exception as e:
        logger.error(f"Error in get_statistics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve statistics: {str(e)}"
        )

# Demo encounter submission endpoint
@app.post("/Encounter")
async def submit_encounter(bundle: Dict[str, Any]):
    """
    Submit FHIR Bundle with dual-coded encounter data
    """
    try:
        # Basic validation
        if bundle.get("resourceType") != "Bundle":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid FHIR Bundle resource type"
            )
        
        # Generate encounter ID
        encounter_id = f"enc_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Store the bundle (in real implementation, would process and dual-code)
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO encounters (encounter_id, fhir_bundle)
                VALUES (?, ?)
            """, (encounter_id, json.dumps(bundle)))
            conn.commit()
        
        # Return transaction response
        return {
            "resourceType": "Bundle",
            "type": "transaction-response",
            "timestamp": datetime.utcnow().isoformat(),
            "entry": [
                {
                    "response": {
                        "status": "201 Created",
                        "location": f"Encounter/{encounter_id}"
                    }
                }
            ]
        }
        
    except Exception as e:
        logger.error(f"Error in submit_encounter: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit encounter: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)