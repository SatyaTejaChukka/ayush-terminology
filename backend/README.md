# NAMASTE-ICD11 Terminology Service Backend

A comprehensive FastAPI-based microservice implementing authentic NAMASTE terminology integration with ICD-11 mappings, following FHIR R4 standards.

## 🏥 Features

- **Authentic NAMASTE Terminology**: Real traditional medicine diagnostic codes from Ayurveda, Siddha, and Unani systems
- **ICD-11 Integration**: Professional mappings between traditional medicine and international health standards
- **FHIR R4 Compliance**: Standard-compliant terminology services and ConceptMap operations
- **Real-time Search**: Optimized fuzzy search across multiple languages (Sanskrit, Tamil, Arabic, English)
- **Dual Coding**: Automatic ICD-11 code assignment to traditional medicine diagnoses
- **Comprehensive Analytics**: Statistics and quality metrics for mapping coverage

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Virtual environment (recommended)

### Installation and Setup

1. **Navigate to the backend directory:**
   ```bash
   cd /workspaces/spark-template/backend
   ```

2. **Create and activate virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the service:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

5. **Access the service:**
   - Service URL: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - ReDoc Documentation: http://localhost:8000/redoc

## 📊 Database

The service automatically creates and populates a SQLite database (`namaste_terminology.db`) with:
- **31 authentic NAMASTE concepts** from all three systems
- **Professional ICD-11 mappings** with clinical notes
- **Quality metrics** including confidence scores and equivalence types

### Database Schema

- `namaste_concepts`: Traditional medicine terminology
- `icd11_concepts`: ICD-11 reference codes
- `concept_mappings`: Professional mappings between systems
- `encounters`: Clinical encounter data (for dual coding)

## 🔍 API Endpoints

### Core Terminology Services

- **GET `/lookup`** - Fast auto-complete search for NAMASTE terms
- **POST `/ConceptMap/$translate`** - FHIR $translate operation
- **GET `/mappings`** - Retrieve concept mappings with filtering
- **GET `/statistics`** - Comprehensive service statistics

### FHIR Resource Endpoints

- **GET `/CodeSystem/NAMASTE`** - FHIR CodeSystem resource
- **GET `/ConceptMap/namaste-to-icd11`** - FHIR ConceptMap resource
- **POST `/Encounter`** - Clinical encounter submission with dual coding

### Utility Endpoints

- **GET `/health`** - Service health check

## 📈 Sample Data Highlights

### Ayurveda Examples
- **AAE-16**: Sandhigatavata (सन्धिगतवात) → ICD-11: FA3Z (Osteoarthritis)
- **AAE-23**: Amavata (अमवात) → ICD-11: FA2Z (Rheumatoid arthritis)
- **APE-12**: Amlapitta (अम्लपित्त) → ICD-11: DA00 (GERD)

### Siddha Examples
- **SGM-515**: Kaichal (காய்ச்சல்) → ICD-11: 1C62 (Fever)
- **SNP-101**: Vatha Noi (வாத நோய்) → Related to FA3Z (Osteoarthritis)

### Unani Examples
- **UGA-301**: Humma (حمیٰ) → ICD-11: 1C62 (Fever)
- **UJD-629**: Waram Mafasil (ورم مفاصل) → Related to FA2Z (Rheumatoid arthritis)

## 🔐 Authentication

The service implements OAuth 2.0/JWT authentication compatible with India's ABHA (Ayushman Bharat Health Account) system:

- For demo purposes, use any token starting with `demo_` in the Authorization header
- Production implementation validates against ABDM's JWKS endpoint

## 🎯 Frontend Integration

The service is designed to work seamlessly with the frontend React application:

1. Start the backend: `uvicorn main:app --host 0.0.0.0 --port 8000 --reload`
2. The frontend automatically connects to `http://localhost:8000`
3. All API calls include proper error handling and fallback sample data

## 📚 Technical Architecture

### Service Layer Architecture
- **TerminologyService**: Handles NAMASTE concept search and FHIR CodeSystem
- **MappingService**: Manages ICD-11 mappings and FHIR translation operations
- **StatisticsService**: Provides comprehensive analytics and quality metrics

### Data Quality Features
- **Confidence Scoring**: Each mapping includes professional confidence assessment
- **Clinical Notes**: Detailed explanations for mapping decisions
- **Equivalence Types**: equivalent, relatedto, wider, narrower, unmatched
- **Mapping Types**: direct, contextual, clustered, unmapped

## 🔧 Development

### Adding New Terminology
1. Add concepts to `database.py` in the `terminology_data` array
2. Create mappings in the `mapping_data` array
3. Restart the service to load new data

### Extending API
- Add new endpoints in `main.py`
- Implement business logic in appropriate service classes
- Update Pydantic models in `models.py`

## 📖 Standards Compliance

- **FHIR R4**: Full compliance with CodeSystem, ConceptMap, and Bundle resources
- **ICD-11**: Mappings to WHO ICD-11 MMS linearization
- **ABDM**: Compatible with India's Ayushman Bharat Digital Mission
- **ISO 639**: Proper language codes for multilingual support

## 🛠️ Troubleshooting

### Common Issues

1. **Database not found**: The service creates the database automatically on first run
2. **Import errors**: Ensure all dependencies are installed: `pip install -r requirements.txt`
3. **Port conflicts**: Change the port with `--port 8001` if 8000 is in use

### Logs and Monitoring
- Service logs are output to console
- All database operations are logged
- API request/response patterns are tracked

---

This backend provides a production-ready foundation for traditional medicine terminology integration, demonstrating how authentic AYUSH diagnostic codes can be professionally mapped to international health standards while maintaining clinical accuracy and cultural sensitivity.