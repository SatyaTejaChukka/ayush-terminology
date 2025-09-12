"""
NAMASTE-ICD11 Terminology Service
A FastAPI-based microservice for traditional medicine terminology integration

This service provides:
- FHIR-compliant terminology lookup and translation
- NAMASTE to ICD-11 mapping
- Clinical encounter data ingestion with dual coding
- OAuth 2.0/ABHA integration for authentication
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from typing import List, Optional
import logging

from models import (
    NAMASTEConcept, ConceptMapping, TranslateRequest, TranslateResponse, 
    FHIRBundle, Statistics, HealthResponse
)
from database import get_database_connection, init_database
from services.terminology_service import TerminologyService
from services.mapping_service import MappingService
from services.statistics_service import StatisticsService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize services
terminology_service = TerminologyService()
mapping_service = MappingService()
statistics_service = StatisticsService()
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and services on startup"""
    logger.info("Initializing NAMASTE Terminology Service...")
    
    # Initialize database schema and sample data
    await init_database()
    
    # Load terminology data
    await terminology_service.initialize()
    await mapping_service.initialize()
    
    logger.info("Service initialization complete")
    yield
    
    logger.info("Shutting down NAMASTE Terminology Service...")

app = FastAPI(
    title="NAMASTE-ICD11 Terminology Service",
    description="FHIR-compliant microservice for traditional medicine terminology integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "https://*.github.dev"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication dependency (simplified for demo)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Validate ABHA JWT token (simplified for demonstration)
    In production, this would validate against ABDM's JWKS endpoint
    """
    token = credentials.credentials
    
    # For demo purposes, accept any token starting with "demo_"
    if token.startswith("demo_"):
        return {"user_id": "demo_user", "scopes": ["terminology:read", "encounter:write"]}
    
    # In production, implement full JWT validation here
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for service monitoring"""
    return HealthResponse(
        status="healthy",
        service="NAMASTE-ICD11 Terminology Service",
        version="1.0.0"
    )

@app.get("/lookup", response_model=List[NAMASTEConcept])
async def lookup_terminology(
    q: str = Query(..., description="Search query string"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system (ayurveda, siddha, unani)"),
    limit: int = Query(10, description="Maximum number of results", ge=1, le=100)
):
    """
    Fast auto-complete search for NAMASTE terminology concepts
    Optimized for real-time UI integration
    """
    try:
        results = await terminology_service.search_concepts(q, system, limit)
        return results
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@app.post("/ConceptMap/$translate", response_model=TranslateResponse)
async def translate_concept(
    request: TranslateRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    FHIR $translate operation
    Translates NAMASTE codes to ICD-11 equivalents based on ConceptMap
    """
    try:
        translation = await mapping_service.translate_concept(
            request.system, request.code, request.target
        )
        return translation
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.get("/mappings", response_model=List[ConceptMapping])
async def get_concept_mappings(
    equivalence: Optional[str] = Query(None, description="Filter by equivalence type"),
    system: Optional[str] = Query(None, description="Filter by AYUSH system"),
    limit: int = Query(50, description="Maximum number of results", ge=1, le=200)
):
    """
    Retrieve concept mappings between NAMASTE and ICD-11
    Supports filtering by equivalence type and AYUSH system
    """
    try:
        mappings = await mapping_service.get_mappings(equivalence, system, limit)
        return mappings
    except Exception as e:
        logger.error(f"Mappings retrieval error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mappings: {str(e)}")

@app.post("/Encounter")
async def submit_encounter(
    bundle: FHIRBundle,
    current_user: dict = Depends(get_current_user)
):
    """
    Submit clinical encounter with automatic dual-coding
    Processes FHIR Bundle and adds ICD-11 mappings to NAMASTE diagnoses
    """
    try:
        # Validate FHIR Bundle structure
        if bundle.resourceType != "Bundle" or bundle.type != "transaction":
            raise HTTPException(
                status_code=400, 
                detail="Invalid FHIR Bundle: must be transaction type"
            )
        
        # Process bundle and add dual coding
        processed_bundle = await mapping_service.process_encounter_bundle(bundle)
        
        # In a production system, persist to database here
        # For demo, we'll just return the processed bundle
        
        return {
            "resourceType": "Bundle",
            "type": "transaction-response",
            "timestamp": bundle.timestamp,
            "total": len(processed_bundle.entry),
            "entry": processed_bundle.entry
        }
        
    except Exception as e:
        logger.error(f"Encounter submission error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Encounter submission failed: {str(e)}")

@app.get("/statistics", response_model=Statistics)
async def get_service_statistics():
    """
    Retrieve service statistics including mapping coverage and usage metrics
    """
    try:
        stats = await statistics_service.get_comprehensive_statistics()
        return stats
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve statistics: {str(e)}")

@app.get("/CodeSystem/NAMASTE")
async def get_namaste_codesystem():
    """
    FHIR CodeSystem resource for NAMASTE terminologies
    """
    try:
        codesystem = await terminology_service.get_fhir_codesystem()
        return codesystem
    except Exception as e:
        logger.error(f"CodeSystem error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve CodeSystem")

@app.get("/ConceptMap/namaste-to-icd11")
async def get_concept_map():
    """
    FHIR ConceptMap resource for NAMASTE to ICD-11 mappings
    """
    try:
        concept_map = await mapping_service.get_fhir_conceptmap()
        return concept_map
    except Exception as e:
        logger.error(f"ConceptMap error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve ConceptMap")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )