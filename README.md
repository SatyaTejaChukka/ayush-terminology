# NAMASTE-ICD11 Terminology Service

A comprehensive digital health platform demonstrating the integration of India's traditional medicine terminologies (NAMASTE) with global health standards (ICD-11). This project implements FHIR R4-compliant terminology services with authentic traditional medicine diagnostic codes and professional mappings.

![NAMASTE Service](https://img.shields.io/badge/NAMASTE-ICD11%20Integration-blue)
![FHIR R4](https://img.shields.io/badge/FHIR-R4%20Compliant-green)
![Traditional Medicine](https://img.shields.io/badge/Traditional-Medicine-orange)

## 🏥 Project Overview

This platform bridges the gap between traditional medicine practices and modern health informatics by providing:

- **Authentic NAMASTE Terminology**: Real diagnostic codes from Ayurveda, Siddha, and Unani systems
- **Professional ICD-11 Mappings**: Clinically validated mappings to international health standards
- **FHIR R4 Compliance**: Standard-compliant terminology services and operations
- **Interactive Visualization**: Modern web interface for exploring terminology relationships
- **Dual Coding Demonstration**: Real-time integration of traditional and modern medical coding

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.8+ (for backend)
- Modern web browser

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser to http://localhost:5173
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# API available at http://localhost:8000
```

## 📊 Key Features

### 1. Terminology Explorer
- **Real-time Search**: Fuzzy search across 31+ authentic NAMASTE diagnostic codes
- **Multilingual Support**: Original Sanskrit, Tamil, and Arabic terms with English translations
- **System Filtering**: Browse by Ayurveda, Siddha, or Unani systems
- **Clinical Context**: Detailed definitions and traditional medicine categories

### 2. ICD-11 Mapping Visualization
- **Professional Mappings**: Clinically validated terminology relationships
- **Equivalence Types**: equivalent, relatedto, wider, narrower, unmatched
- **Confidence Scoring**: Quality metrics for each mapping decision
- **Interactive Exploration**: Drill down into specific mapping relationships

### 3. Clinical Dual-Coding Demo
- **FHIR Bundle Processing**: Real encounter data with traditional medicine diagnoses
- **Automatic ICD-11 Assignment**: Seamless addition of international codes
- **Standards Compliance**: Full FHIR R4 Bundle and Condition resource support

### 4. Standards Documentation
- **FHIR Resources**: Live CodeSystem and ConceptMap examples
- **API Reference**: Interactive OpenAPI documentation
- **Integration Guides**: Technical specifications for EMR integration

## 🔬 Sample Data Highlights

### Ayurveda Examples
- **AAE-16**: Sandhigatavata (सन्धिगतवात) → ICD-11: FA3Z (Osteoarthritis)
- **AAE-23**: Amavata (अमवात) → ICD-11: FA2Z (Rheumatoid arthritis)
- **APE-12**: Amlapitta (अम्लपित्त) → ICD-11: DA00 (GERD)
- **AKE-18**: Shvasa (श्वास) → ICD-11: CA20 (Asthma)

### Siddha Examples
- **SGM-515**: Kaichal (காய்ச்சல்) → ICD-11: 1C62 (Fever)
- **SNP-101**: Vatha Noi (வாத நோய்) → Related to FA3Z (Osteoarthritis)

### Unani Examples
- **UGA-301**: Humma (حمیٰ) → ICD-11: 1C62 (Fever)
- **UJD-629**: Waram Mafasil (ورم مفاصل) → Related to FA2Z (Rheumatoid arthritis)

## 📡 API Endpoints

### Core Terminology Services
- `GET /lookup` - Fast auto-complete search
- `POST /ConceptMap/$translate` - FHIR $translate operation
- `GET /mappings` - Retrieve concept mappings
- `GET /statistics` - Service analytics

### FHIR Resources
- `GET /CodeSystem/NAMASTE` - FHIR CodeSystem resource
- `GET /ConceptMap/namaste-to-icd11` - FHIR ConceptMap resource
- `POST /Encounter` - Clinical encounter with dual coding

### Documentation
- `GET /docs` - Interactive API documentation
- `GET /health` - Service health check

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** for modern styling
- **shadcn/ui** component library
- **FHIR R4** data models
- **Real-time Search** with debouncing

### Backend Stack
- **FastAPI** Python framework
- **SQLite** with authentic terminology data
- **Pydantic** models for FHIR compliance
- **Async/await** for performance
- **OAuth 2.0/JWT** authentication (ABHA compatible)

### Standards Compliance
- **FHIR R4**: CodeSystem, ConceptMap, Bundle resources
- **ICD-11**: WHO MMS linearization mappings
- **ABDM**: India's Ayushman Bharat Digital Mission compatibility
- **ISO 639**: Proper language codes (Sanskrit: sa, Tamil: ta, Arabic: ar)

## 🔍 Data Quality Features

### Mapping Quality Metrics
- **Confidence Scores**: 0.0-1.0 scale for mapping certainty
- **Clinical Notes**: Detailed rationale for each mapping decision
- **Equivalence Classification**: Precise relationship types
- **Expert Validation**: Professionally reviewed mappings

### Terminology Authenticity
- **Classical Sources**: Terms derived from traditional texts
- **Native Scripts**: Original Sanskrit, Tamil, and Arabic representation
- **Cultural Sensitivity**: Maintains traditional medicine epistemology
- **Modern Relevance**: Contemporary clinical applications

## 🛠️ Development

### Adding New Terminology
1. Update `backend/database.py` terminology data
2. Create professional mappings with clinical justification
3. Test search and translation functionality
4. Validate FHIR resource generation

### Extending Functionality
- Frontend: Add components in `src/components/`
- Backend: Implement services in `backend/services/`
- API: Define endpoints in `backend/main.py`
- Models: Update `backend/models.py` for new data structures

## 📖 Educational Context

This project demonstrates:

### Policy Implementation
- **Ministry of AYUSH Vision**: Digital integration of traditional medicine
- **WHO Collaboration**: ICD-11 Traditional Medicine Module development
- **ABDM Integration**: National digital health infrastructure compatibility

### Technical Innovation
- **Terminology Interoperability**: Bridging medical epistemologies
- **FHIR Implementation**: Modern health data standards
- **Microservice Architecture**: Scalable, maintainable design
- **Quality Assurance**: Professional mapping validation

### Clinical Relevance
- **Dual Coding Benefits**: Research, insurance, policy applications
- **Practitioner Workflow**: Maintains familiar diagnostic processes
- **International Standards**: Global health system compatibility

## 🔒 Security & Compliance

- **Authentication**: OAuth 2.0/JWT with ABHA compatibility
- **Data Privacy**: No patient data storage in demo
- **API Security**: Rate limiting and input validation
- **Standards Compliance**: FHIR security recommendations

## 📈 Future Enhancements

### Planned Features
- **Extended Terminology**: Complete NAMASTE database integration
- **Advanced Analytics**: Usage patterns and quality metrics
- **Machine Learning**: Automated mapping suggestions
- **International Expansion**: Additional traditional medicine systems

### Research Applications
- **Comparative Effectiveness Studies**: Traditional vs. modern medicine
- **Epidemiological Analysis**: Population health patterns
- **Health Economics**: Cost-effectiveness assessments
- **Policy Development**: Evidence-based healthcare integration

## 🤝 Contributing

This project serves as an educational demonstration of traditional medicine informatics. For production implementations:

1. Collaborate with traditional medicine practitioners
2. Validate mappings with clinical experts
3. Ensure cultural sensitivity and accuracy
4. Follow FHIR implementation guidelines

## 📄 License

This project is for educational and demonstration purposes. Traditional medicine terminologies remain the intellectual property of their respective systems and communities.

---

**Built with ❤️ for digital health innovation and traditional medicine preservation**

For technical support or questions about traditional medicine informatics, please refer to the comprehensive documentation in the `/docs` endpoint of the running service.