# NAMASTE-ICD11 Terminology Service Backend

A production-ready FastAPI microservice providing FHIR-compliant traditional medicine terminology integration.

## 🏥 Features

- **Authentic NAMASTE Codes**: Real terminology from Ayurveda, Siddha, and Unani systems
- **ICD-11 Integration**: Complete mappings to WHO ICD-11 including TM2 module
- **FHIR R4 Compliance**: Standard-compliant API endpoints and data models
- **Expert Mappings**: Clinically validated concept mappings with confidence scores
- **Production Ready**: SQLAlchemy ORM, comprehensive error handling, logging

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip

### Development Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start development server:**
   ```bash
   python start_dev_server.py
   ```
   
   Or manually:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Access the service:**
   - API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Alternative docs: http://localhost:8000/redoc

## 📊 Database Content

### NAMASTE Terminology
- **Ayurveda**: 30+ authentic codes from Charaka Samhita & Sushruta Samhita
- **Siddha**: 20+ traditional diagnostic categories
- **Unani**: 20+ classical Unani diagnostic terms

### ICD-11 Mappings
- Standard ICD-11 MMS codes
- Traditional Medicine Module 2 (TM2) codes
- Expert-curated mappings with equivalence relationships

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/health` | GET | Health check |
| `/lookup` | GET | Search NAMASTE terminology |
| `/ConceptMap/$translate` | POST | Translate NAMASTE to ICD-11 |
| `/Encounter` | POST | Ingest dual-coded encounters |
| `/statistics` | GET | System statistics |
| `/mappings/{code}` | GET | Detailed concept mapping |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   FastAPI       │───▶│   SQLAlchemy    │
│   React App     │    │   Backend       │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components
- **FastAPI**: Modern, high-performance web framework
- **SQLAlchemy**: Production-ready ORM with connection pooling
- **Pydantic**: Data validation and serialization
- **SQLite**: Development database (configurable for PostgreSQL)

## 🔒 Security

- CORS enabled for development
- Input validation with Pydantic schemas
- SQL injection protection via SQLAlchemy ORM
- Error handling without sensitive data exposure

## 📁 Project Structure

```
backend/
├── main.py              # FastAPI application
├── models.py            # SQLAlchemy database models
├── schemas.py           # Pydantic request/response models
├── database.py          # Database connection setup
├── data_loader.py       # Terminology data initialization
├── requirements.txt     # Python dependencies
├── start_dev_server.py  # Development server script
└── README.md           # This file
```

## 🧪 Testing

The backend includes comprehensive test data and error handling:

- Real NAMASTE terminology codes
- Authentic ICD-11 mappings
- Expert-validated clinical correlations
- Fallback mechanisms for offline development

## 🔧 Configuration

Environment variables:
- `DATABASE_URL`: Database connection string (defaults to SQLite)

## 📈 Statistics

The `/statistics` endpoint provides:
- Total terminology counts by system
- Mapping equivalence distribution
- Clinical encounter statistics
- System health metrics

## 🤝 Contributing

This backend implements the NAMASTE-ICD11 integration specification:
- WHO ICD-11 Traditional Medicine Module 2 compliance
- Ministry of AYUSH NAMASTE portal alignment
- FHIR R4 terminology services standards

## 📞 Support

For technical issues or questions about the terminology mappings, refer to:
- API Documentation: `/docs` endpoint
- FHIR Terminology Services: https://www.hl7.org/fhir/terminology-service.html
- WHO ICD-11: https://icd.who.int/en