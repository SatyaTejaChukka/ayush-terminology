# NAMASTE-ICD11 Terminology Service Backend

A comprehensive FastAPI backend implementation for the NAMASTE-ICD11 terminology service, providing FHIR R4 compliant endpoints for traditional medicine dual coding.

## Features

- **Real NAMASTE Terminology Database**: SQLite database with 15+ authentic traditional medicine terms
- **ICD-11 Mapping Engine**: Automated dual coding with confidence scores and equivalence relationships  
- **FHIR R4 Compliance**: Standard FHIR operations including $translate and Bundle processing
- **OAuth 2.0 Ready**: ABHA/ABDM integration support for secure healthcare workflows
- **Full-Text Search**: Fast terminology lookup with auto-complete functionality
- **Clinical Workflow**: Complete encounter processing with dual-coded FHIR bundles

## API Endpoints

### Core Operations
- `GET /health` - Service health check
- `GET /lookup?q=<search>&system=<ayush_system>` - Fast terminology search
- `POST /ConceptMap/$translate` - FHIR standard terminology translation
- `POST /Encounter` - Clinical encounter processing with dual coding
- `GET /mappings` - Concept mapping visualization data
- `GET /statistics` - Terminology and mapping statistics

### Sample Data Included
- **Ayurveda**: Sandhigatavata (AAE-16), Amlapitta (AST-23), Kasa (AYU-78), etc.
- **Siddha**: Vatha Soolai (SUC-45), Kabak Kottam (SID-89), etc.  
- **Unani**: Waja al-Mafasil (UNI-12), Sudaa (UNI-34), etc.

## Quick Start

### Local Development
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Docker Deployment
```bash
docker-compose up -d
```

The backend will be available at `http://localhost:8000` with interactive API documentation at `/docs`.

## Database Schema

The service uses SQLite with three main tables:
- `namaste_terminology`: Core terminology concepts  
- `concept_mappings`: ICD-11 mappings with equivalence relationships
- `encounters`: Clinical encounter storage

## Integration with Frontend

The backend seamlessly integrates with the React frontend through:
- `src/services/terminologyAPI.ts` - TypeScript API client
- React hooks for terminology search and mapping visualization
- Real-time dual coding in clinical demo workflow

## Production Considerations

- Replace SQLite with PostgreSQL for production scale
- Implement proper ABHA JWT validation
- Add comprehensive audit logging
- Enable SSL/TLS termination
- Configure proper CORS origins

## FHIR Compliance

Fully compliant with:
- FHIR R4 Bundle and Condition resources
- ICD-11 TM2 (Traditional Medicine Module 2)
- NAMASTE CodeSystem structure
- NRCeS profiles for ABDM integration