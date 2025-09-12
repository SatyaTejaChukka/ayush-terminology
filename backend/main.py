"""
NAMASTE-ICD11 Terminology Service Backend
A FHIR-compliant FastAPI microservice for traditional medicine terminology integration
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime

from database import get_db, engine
from models import NAMASTECode, ICD11Code, ConceptMapping, EncounterRecord
import models
from schemas import (
    NAMASTEConceptResponse, 
    LookupResponse, 
    TranslateRequest, 
    TranslateResponse,
    StatisticsResponse,
    EncounterRequest,
    HealthResponse
)
from data_loader import initialize_database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="NAMASTE-ICD11 Terminology Service",
    description="FHIR-compliant microservice for traditional medicine terminology integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database with terminology data on startup"""
    try:
        logger.info("Initializing database...")
        models.Base.metadata.create_all(bind=engine)
        
        # Initialize with real terminology data
        db = next(get_db())
        await initialize_database(db)
        logger.info("Database initialization completed successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        version="1.0.0",
        database_status="connected"
    )

@app.get("/lookup", response_model=LookupResponse)
async def lookup_concepts(
    q: str = Query(..., description="Search query"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system"),
    limit: int = Query(10, description="Maximum results to return"),
    db: Session = Depends(get_db)
):
    """
    Search NAMASTE terminology concepts with auto-complete functionality
    Supports full-text search across codes, display terms, and definitions
    """
    try:
        query = db.query(NAMASTECode)
        
        # Apply search filter
        if q:
            search_filter = (
                NAMASTECode.display.ilike(f"%{q}%") |
                NAMASTECode.original_term.ilike(f"%{q}%") |
                NAMASTECode.definition.ilike(f"%{q}%") |
                NAMASTECode.code.ilike(f"%{q}%")
            )
            query = query.filter(search_filter)
        
        # Apply system filter
        if system and system in ['ayurveda', 'siddha', 'unani']:
            query = query.filter(NAMASTECode.system == system)
        
        # Apply limit and execute
        concepts = query.limit(limit).all()
        total_count = query.count()
        
        # Convert to response format
        concept_responses = [
            NAMASTEConceptResponse(
                code=concept.code,
                display=concept.display,
                originalTerm=concept.original_term,
                definition=concept.definition,
                system=concept.system
            )
            for concept in concepts
        ]
        
        return LookupResponse(
            concepts=concept_responses,
            totalCount=total_count
        )
        
    except Exception as e:
        logger.error(f"Lookup failed: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/ConceptMap/$translate", response_model=TranslateResponse)
async def translate_concept(
    request: TranslateRequest,
    db: Session = Depends(get_db)
):
    """
    FHIR $translate operation for mapping NAMASTE codes to ICD-11
    Implements standard FHIR ConceptMap translation semantics
    """
    try:
        # Extract parameters from FHIR Parameters resource
        system = None
        code = None
        target = None
        
        for param in request.parameter:
            if param.name == "system":
                system = param.valueUri
            elif param.name == "code":
                code = param.valueCode
            elif param.name == "target":
                target = param.valueUri
        
        if not all([system, code, target]):
            raise HTTPException(
                status_code=400, 
                detail="Missing required parameters: system, code, target"
            )
        
        # Find the mapping
        mapping = db.query(ConceptMapping).filter(
            ConceptMapping.namaste_code == code
        ).first()
        
        if not mapping:
            return TranslateResponse(
                result=False,
                message=f"No mapping found for code {code}"
            )
        
        # Get the NAMASTE concept details
        namaste_concept = db.query(NAMASTECode).filter(
            NAMASTECode.code == code
        ).first()
        
        if not namaste_concept:
            raise HTTPException(status_code=404, detail=f"NAMASTE concept {code} not found")
        
        # Get ICD-11 concept details if mapped
        icd11_concept = None
        if mapping.icd11_code:
            icd11_concept = db.query(ICD11Code).filter(
                ICD11Code.code == mapping.icd11_code
            ).first()
        
        # Build response
        match_data = {
            "namasteCode": mapping.namaste_code,
            "namasteTerm": namaste_concept.display,
            "originalTerm": namaste_concept.original_term,
            "system": namaste_concept.system,
            "icd11Code": mapping.icd11_code,
            "icd11Term": icd11_concept.title if icd11_concept else None,
            "equivalence": mapping.equivalence,
            "confidence": mapping.confidence,
            "mappingType": mapping.mapping_type,
            "clinicalNotes": mapping.clinical_notes
        }
        
        return TranslateResponse(
            result=True,
            message=f"Translation found for {code}",
            match=[match_data]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Translation error: {str(e)}")

@app.post("/Encounter")
async def ingest_encounter(
    request: EncounterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    FHIR Bundle ingestion endpoint for dual-coded clinical encounters
    Accepts FHIR Bundle, performs dual coding, and persists data
    """
    try:
        # Extract encounter and condition data from FHIR Bundle
        encounter_id = None
        patient_id = None
        namaste_codes = []
        
        for entry in request.entry:
            resource = entry.resource
            
            if resource["resourceType"] == "Encounter":
                encounter_id = resource.get("id")
                if "subject" in resource:
                    patient_id = resource["subject"]["reference"].split("/")[-1]
            
            elif resource["resourceType"] == "Condition":
                if "code" in resource and "coding" in resource["code"]:
                    for coding in resource["code"]["coding"]:
                        if "namstp.ayush.gov.in" in coding.get("system", ""):
                            namaste_codes.append(coding["code"])
        
        if not all([encounter_id, patient_id, namaste_codes]):
            raise HTTPException(
                status_code=400,
                detail="Invalid FHIR Bundle: missing required encounter data"
            )
        
        # Process each NAMASTE code and add dual coding
        processed_entries = []
        
        for entry in request.entry:
            resource = entry.resource
            
            if resource["resourceType"] == "Condition":
                # Find mappings for NAMASTE codes in this condition
                for coding in resource["code"]["coding"]:
                    if "namstp.ayush.gov.in" in coding.get("system", ""):
                        namaste_code = coding["code"]
                        
                        # Look up ICD-11 mapping
                        mapping = db.query(ConceptMapping).filter(
                            ConceptMapping.namaste_code == namaste_code
                        ).first()
                        
                        if mapping and mapping.icd11_code:
                            # Add ICD-11 coding to the condition
                            icd11_coding = {
                                "system": "http://id.who.int/icd/release/11/mms",
                                "code": mapping.icd11_code,
                                "display": mapping.icd11_term
                            }
                            resource["code"]["coding"].append(icd11_coding)
            
            processed_entries.append(entry)
        
        # Store encounter record
        encounter_record = EncounterRecord(
            encounter_id=encounter_id,
            patient_id=patient_id,
            namaste_codes=",".join(namaste_codes),
            fhir_bundle=request.dict(),
            created_at=datetime.utcnow()
        )
        
        db.add(encounter_record)
        db.commit()
        
        # Return FHIR Bundle transaction response
        response_entries = []
        for i, entry in enumerate(processed_entries):
            response_entries.append({
                "response": {
                    "status": "201 Created",
                    "location": f"{entry.resource['resourceType']}/{entry.resource.get('id', f'temp-{i}')}"
                }
            })
        
        return {
            "resourceType": "Bundle",
            "type": "transaction-response",
            "entry": response_entries
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Encounter ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Encounter processing error: {str(e)}")

@app.get("/statistics", response_model=StatisticsResponse)
async def get_statistics(db: Session = Depends(get_db)):
    """
    Get comprehensive statistics about the terminology database
    """
    try:
        # Count total terms by system
        total_terms = db.query(NAMASTECode).count()
        ayurveda_count = db.query(NAMASTECode).filter(NAMASTECode.system == 'ayurveda').count()
        siddha_count = db.query(NAMASTECode).filter(NAMASTECode.system == 'siddha').count()
        unani_count = db.query(NAMASTECode).filter(NAMASTECode.system == 'unani').count()
        
        # Count encounters
        total_encounters = db.query(EncounterRecord).count()
        
        # Count mappings by equivalence type
        equiv_counts = {}
        for equiv_type in ['equivalent', 'relatedto', 'wider', 'narrower', 'unmatched']:
            count = db.query(ConceptMapping).filter(
                ConceptMapping.equivalence == equiv_type
            ).count()
            equiv_counts[equiv_type] = count
        
        return StatisticsResponse(
            total_terms=total_terms,
            total_encounters=total_encounters,
            system_distribution={
                "ayurveda": ayurveda_count,
                "siddha": siddha_count,
                "unani": unani_count
            },
            equivalence_distribution=equiv_counts
        )
        
    except Exception as e:
        logger.error(f"Statistics retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Statistics error: {str(e)}")

@app.get("/mappings/{namaste_code}")
async def get_concept_mapping(namaste_code: str, db: Session = Depends(get_db)):
    """
    Get detailed mapping information for a specific NAMASTE code
    """
    try:
        mapping = db.query(ConceptMapping).filter(
            ConceptMapping.namaste_code == namaste_code
        ).first()
        
        if not mapping:
            raise HTTPException(status_code=404, detail=f"No mapping found for {namaste_code}")
        
        # Get full concept details
        namaste_concept = db.query(NAMASTECode).filter(
            NAMASTECode.code == namaste_code
        ).first()
        
        icd11_concept = None
        if mapping.icd11_code:
            icd11_concept = db.query(ICD11Code).filter(
                ICD11Code.code == mapping.icd11_code
            ).first()
        
        return {
            "namaste": {
                "code": namaste_concept.code,
                "display": namaste_concept.display,
                "originalTerm": namaste_concept.original_term,
                "definition": namaste_concept.definition,
                "system": namaste_concept.system
            },
            "icd11": {
                "code": icd11_concept.code if icd11_concept else None,
                "title": icd11_concept.title if icd11_concept else None,
                "definition": icd11_concept.definition if icd11_concept else None
            } if icd11_concept else None,
            "mapping": {
                "equivalence": mapping.equivalence,
                "confidence": mapping.confidence,
                "mappingType": mapping.mapping_type,
                "clinicalNotes": mapping.clinical_notes
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mapping retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Mapping error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)