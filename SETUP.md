# NAMASTE-ICD11 Terminology Service Setup Guide

## Overview
This guide will help you set up the complete NAMASTE-ICD11 terminology service with both frontend and backend components.

## Architecture
- **Frontend**: React + TypeScript with Vite
- **Backend**: FastAPI + SQLite with FHIR R4 compliance
- **Integration**: REST API with real-time search and dual coding

## Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker (optional)

## Option 1: Quick Start with Docker

1. **Clone and start the complete stack:**
```bash
git clone <repository>
cd namaste-icd11-service
docker-compose up -d
```

2. **Access the applications:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Option 2: Local Development Setup

### Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Start the backend server:**
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend will automatically:
- Create SQLite database with sample data
- Initialize 15+ traditional medicine terminologies
- Set up ICD-11 concept mappings
- Enable FHIR R4 compliant endpoints

### Frontend Setup

1. **Navigate to project root:**
```bash
cd ..  # From backend directory
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

The frontend will be available at http://localhost:5173

## Testing the Integration

### 1. Terminology Search
- Navigate to the Explorer tab
- Search for terms like "Sandhigatavata", "joint", or "AAE-16"
- Filter by medical system (Ayurveda, Siddha, Unani)

### 2. Mapping Visualization
- Go to the Mapping tab
- Explore different equivalence types
- View confidence scores and clinical notes

### 3. Clinical Demo
- Access the Demo tab
- Complete the 4-step clinical workflow
- Generate dual-coded FHIR bundles

### 4. API Testing
Visit http://localhost:8000/docs for interactive API documentation:

```bash
# Test terminology search
curl "http://localhost:8000/lookup?q=joint&limit=5"

# Test FHIR translation
curl -X POST "http://localhost:8000/ConceptMap/\$translate" \
  -H "Content-Type: application/json" \
  -d '{
    "system": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
    "code": "AAE-16",
    "target": "http://id.who.int/icd/release/11/mms"
  }'

# Get statistics
curl "http://localhost:8000/statistics"
```

## Sample Data Included

### Traditional Medicine Terms
- **Ayurveda**: Sandhigatavata (AAE-16), Amlapitta (AST-23), Kasa (AYU-78)
- **Siddha**: Vatha Soolai (SUC-45), Kabak Kottam (SID-89)
- **Unani**: Waja al-Mafasil (UNI-12), Sudaa (UNI-34)

### ICD-11 Mappings
- Direct equivalents (FA20 - Osteoarthritis)
- Related concepts (DA60 - GERD) 
- Complex clusters (FA20.0&XK8G - Rheumatoid arthritis)
- Unmatched concepts for research

## Customization Options

### Adding New Terminology
1. Update the terminology data in `backend/main.py`
2. Add corresponding ICD-11 mappings
3. Restart the backend service

### Modifying the Frontend
1. Update components in `src/components/`
2. Modify API integration in `src/services/terminologyAPI.ts`
3. Customize styling in `src/index.css`

### Extending the API
1. Add new endpoints in `backend/main.py`
2. Update Pydantic models for validation
3. Enhance database schema as needed

## Production Deployment

### Backend
- Replace SQLite with PostgreSQL
- Implement proper ABHA JWT validation
- Configure SSL/TLS certificates
- Set up monitoring and logging

### Frontend
- Build optimized production bundle
- Configure CDN for static assets
- Set proper CORS origins
- Enable compression and caching

### Security
- Implement rate limiting
- Add request validation
- Configure firewalls
- Enable audit logging

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check Python version (3.11+ required)
- Verify all dependencies installed
- Ensure port 8000 is available

**Frontend can't connect to backend:**
- Verify backend is running on localhost:8000
- Check CORS configuration
- Confirm network connectivity

**Database issues:**
- Delete `namaste_terminology.db` to reset
- Check file permissions
- Verify SQLite installation

### Support Resources
- API Documentation: http://localhost:8000/docs
- Frontend Dev Tools: Browser console for errors
- Backend Logs: Check terminal output for errors

## Next Steps

1. **Explore the Documentation tab** for comprehensive technical details
2. **Review the PRD** in `src/prd.md` for full feature specifications  
3. **Examine the code** to understand implementation patterns
4. **Customize** for your specific traditional medicine use case

This implementation serves as a complete reference for building traditional medicine terminology services that bridge ancient wisdom with modern healthcare standards.