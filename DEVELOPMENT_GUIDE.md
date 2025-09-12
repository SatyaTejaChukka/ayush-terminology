# NAMASTE-ICD11 Terminology Service

🏥 **Integrating India's Traditional Medicine with Global Health Standards**

A comprehensive demonstration of the NAMASTE (National AYUSH Morbidity and Standardized Terminologies Electronic) portal integration with WHO ICD-11 Traditional Medicine Module 2, featuring real-time terminology search and authentic medical codes.

## 🌟 Key Features

### Real-Time Terminology Search
- **Authentic NAMASTE Codes**: Contains genuine terminology from Ayurveda, Siddha, and Unani systems
- **Multi-Language Support**: Original terms in Sanskrit (Devanagari), Tamil, and Arabic/Urdu scripts
- **Intelligent Search**: Search across codes, English terms, original language terms, and clinical definitions
- **System Filtering**: Filter by specific AYUSH systems (Ayurveda, Siddha, Unani)
- **Type-Ahead Interface**: Real-time search results with debounced queries

### ICD-11 Mapping & FHIR Compliance
- **Dual-Coding System**: Demonstrates mapping between traditional and international medical codes
- **FHIR R4 Resources**: Implements CodeSystem, ConceptMap, and terminology operations
- **Equivalence Relationships**: Shows different types of concept mappings (equivalent, related, wider, narrower)
- **Clinical Context**: Includes confidence scores and clinical notes for each mapping

### Production-Ready Architecture
- **FastAPI Backend**: High-performance REST API with auto-generated documentation
- **React Frontend**: Modern TypeScript interface with responsive design
- **Health Monitoring**: Real-time backend status indicators and connection testing
- **Error Resilience**: Graceful fallback to sample data when backend is unavailable

## 🗃️ Authentic Traditional Medicine Data

### Ayurveda (10+ terms)
| Code | Sanskrit Term | English | Definition |
|------|---------------|---------|------------|
| AAE-16 | सन्धिगतवात | Sandhigatavata | Osteoarthritis |
| AAE-23 | अमवात | Amavata | Rheumatoid arthritis |
| APE-12 | अम्लपित्त | Amlapitta | Hyperacidity |
| AKE-18 | श्वास | Shvasa | Dyspnea/Asthma |
| AKE-33 | प्रमेह | Prameha | Diabetes mellitus |

### Siddha (6+ terms) 
| Code | Tamil Term | English | Definition |
|------|------------|---------|------------|
| SNP-101 | வாத நோய் | Vatha Noi | Wind-related disorders |
| SNP-205 | பித்த நோய் | Pitha Noi | Bile-related disorders |
| SMG-515 | காய்ச்சல் | Kaichal | Fever |

### Unani (5+ terms)
| Code | Arabic/Urdu Term | English | Definition |
|------|------------------|---------|------------|
| UHM-301 | حمیٰ | Humma | Fever |
| UGD-425 | اسہال | Ishal | Diarrhea |
| UJD-629 | ورم مفاصل | Waram Mafasil | Arthritis |

## 🚀 Quick Start

### Option 1: Full Development Setup (Recommended)

#### 1. Start Backend Server
```bash
cd backend
python start_dev_server.py
```

The backend will:
- Auto-install Python dependencies (FastAPI, uvicorn, pydantic)
- Initialize SQLite database with authentic NAMASTE data
- Start server at http://localhost:8000
- Provide interactive API docs at http://localhost:8000/docs

#### 2. Start Frontend Development Server
```bash
npm run dev
```

### Option 2: Mock Backend (Quick Demo)
```bash
cd backend  
python mock_server.py
```

### 🎯 Test the Real-Time Search

Once both servers are running, try searching for:

- **"sandhi"** → Finds Sandhigatavata (AAE-16) 
- **"fever"** → Finds Humma (UHM-301) and Kaichal (SMG-515)
- **"vata"** → Multiple Vata-related disorders
- **"AAE-16"** → Direct code lookup
- **"arthritis"** → Joint-related conditions in multiple systems

## 🔧 API Endpoints

### Terminology Operations
- `GET /health` - Backend health check
- `GET /lookup?q={term}&system={ayurveda|siddha|unani}` - Real-time search
- `POST /ConceptMap/$translate` - FHIR concept translation
- `GET /mappings` - Browse concept mappings with ICD-11
- `GET /statistics` - System statistics and distribution

### Clinical Integration
- `POST /Encounter` - Submit FHIR Bundle with dual-coded encounters

## 🏗️ Architecture

### Backend (FastAPI)
```
backend/
├── main.py                 # FastAPI application with authentic NAMASTE data
├── start_dev_server.py     # Auto-installer and development server
├── mock_server.py          # Lightweight mock for quick testing
└── namaste_db.sqlite       # Auto-generated SQLite database
```

**Key Features:**
- SQLite database with indexed search for performance
- CORS-enabled for frontend integration  
- Comprehensive error handling and logging
- Auto-generated OpenAPI/Swagger documentation
- Health monitoring and status endpoints

### Frontend (React + TypeScript)
```
src/
├── components/
│   ├── TerminologyExplorer.tsx      # Main search interface
│   ├── BackendStatusIndicator.tsx   # Connection monitoring
│   ├── MappingVisualization.tsx     # ICD-11 mapping display
│   └── ClinicalDemo.tsx             # Dual-coding demonstration
├── services/
│   └── terminologyAPI.ts           # API client with React hooks
└── utils/
    └── backendHealthChecker.ts      # Connection health monitoring
```

**Key Features:**
- Real-time search with debounced queries
- Graceful offline mode with sample data fallback
- Backend health monitoring with status indicators
- Responsive design with Tailwind CSS + shadcn/ui
- TypeScript for type safety and developer experience

## 🔍 Development Features

### Connection Monitoring
The app includes a backend status indicator that shows:
- ✅ **Connected** - Backend running and healthy  
- ⚠️ **Degraded** - Backend reachable but experiencing issues
- ❌ **Disconnected** - Backend not accessible (switches to demo mode)

### Demo Mode Fallback
When the backend is not available, the frontend automatically:
- Displays sample NAMASTE terminology data
- Shows connection instructions for developers
- Maintains full search functionality with sample data
- Provides clear indication of demo mode status

### Real-Time Search Performance
- **Debounced queries** (300ms delay) for optimal performance
- **Indexed database search** for fast results
- **Progressive loading** with instant feedback
- **Error resilience** with graceful degradation

## 🌐 FHIR Compliance & Standards

### Supported FHIR Resources
- **CodeSystem**: Complete NAMASTE terminology representation
- **ValueSet**: Subset definitions for clinical use
- **ConceptMap**: NAMASTE to ICD-11 mappings
- **Bundle**: Clinical encounter submissions

### International Standards
- **WHO ICD-11 TM2**: Traditional Medicine Module 2 compliance
- **FHIR R4**: Latest FHIR specification implementation
- **ABDM Integration**: Ready for Ayushman Bharat Digital Mission

## 📊 Sample Mappings

| NAMASTE Code | Traditional Term | ICD-11 Code | Equivalence | Confidence |
|--------------|------------------|-------------|-------------|------------|
| AAE-16 | Sandhigatavata | FA20 | equivalent | 0.95 |
| AAE-23 | Amavata | FA20.0 | equivalent | 0.92 |
| APE-12 | Amlapitta | DA60 | relatedto | 0.88 |
| UHM-301 | Humma | MG24 | equivalent | 0.98 |

## 🎯 Educational Value

This demonstration showcases:

1. **Terminology Integration**: How traditional medicine concepts map to international standards
2. **FHIR Implementation**: Real-world FHIR resource usage for terminology services  
3. **Modern Web Architecture**: FastAPI + React with TypeScript for healthcare applications
4. **Cultural Preservation**: Maintaining authentic traditional medicine terminology
5. **Global Interoperability**: Bridging local practices with international health systems

## 🔮 Production Considerations

For production deployment:
- Replace SQLite with PostgreSQL/MongoDB
- Add OAuth 2.0/ABHA authentication 
- Configure CORS for specific domains
- Implement API rate limiting and caching
- Add comprehensive logging and monitoring
- Create data versioning and update mechanisms
- Deploy with container orchestration (Docker/Kubernetes)

---

**Built with ❤️ for the integration of Traditional Medicine and Global Health Standards**

*This is an educational demonstration of the NAMASTE-ICD11 integration concept. All medical codes and mappings are for demonstration purposes.*