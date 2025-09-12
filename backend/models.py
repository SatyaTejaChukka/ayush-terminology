"""
Pydantic models for NAMASTE-ICD11 Terminology Service
Defines the data structures for API requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AyushSystem(str, Enum):
    AYURVEDA = "ayurveda"
    SIDDHA = "siddha"
    UNANI = "unani"

class EquivalenceType(str, Enum):
    EQUIVALENT = "equivalent"
    RELATEDTO = "relatedto"
    WIDER = "wider"
    NARROWER = "narrower"
    UNMATCHED = "unmatched"

class MappingType(str, Enum):
    DIRECT = "direct"
    CONTEXTUAL = "contextual"
    CLUSTERED = "clustered"
    UNMAPPED = "unmapped"

class NAMASTEConcept(BaseModel):
    """Represents a single NAMASTE terminology concept"""
    code: str = Field(..., description="Unique NAMASTE code (e.g., AAE-16)")
    system: AyushSystem = Field(..., description="AYUSH system this concept belongs to")
    originalTerm: str = Field(..., description="Term in original language (Sanskrit/Tamil/Arabic)")
    englishTerm: str = Field(..., description="Standardized English translation")
    definition: str = Field(..., description="Clinical definition of the term")
    category: str = Field(..., description="Classification category within the system")

    class Config:
        schema_extra = {
            "example": {
                "code": "AAE-16",
                "system": "ayurveda",
                "originalTerm": "सन्धिगतवात",
                "englishTerm": "Sandhigatavata",
                "definition": "Osteoarthritis - degenerative joint disease characterized by pain and stiffness",
                "category": "Vata Disorders"
            }
        }

class ConceptMapping(BaseModel):
    """Represents a mapping between NAMASTE and ICD-11 concepts"""
    namasteCode: str = Field(..., description="Source NAMASTE code")
    namasteTerm: str = Field(..., description="English term from NAMASTE")
    originalTerm: str = Field(..., description="Original language term")
    system: AyushSystem = Field(..., description="AYUSH system")
    icd11Code: Optional[str] = Field(None, description="Target ICD-11 code (null if unmatched)")
    icd11Term: Optional[str] = Field(None, description="ICD-11 preferred term")
    equivalence: EquivalenceType = Field(..., description="Type of mapping relationship")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0.0-1.0)")
    mappingType: MappingType = Field(..., description="Classification of mapping approach")
    clinicalNotes: str = Field(..., description="Clinical notes about the mapping")

    class Config:
        schema_extra = {
            "example": {
                "namasteCode": "AAE-16",
                "namasteTerm": "Sandhigatavata",
                "originalTerm": "सन्धिगतवात",
                "system": "ayurveda",
                "icd11Code": "FA3Z",
                "icd11Term": "Osteoarthritis",
                "equivalence": "equivalent",
                "confidence": 0.95,
                "mappingType": "direct",
                "clinicalNotes": "Direct mapping to ICD-11 osteoarthritis category"
            }
        }

class TranslateRequest(BaseModel):
    """Request payload for FHIR $translate operation"""
    system: str = Field(..., description="Source code system URI")
    code: str = Field(..., description="Source concept code")
    target: Optional[str] = Field("http://id.who.int/icd/release/11/mms", description="Target code system")

    class Config:
        schema_extra = {
            "example": {
                "system": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
                "code": "AAE-16",
                "target": "http://id.who.int/icd/release/11/mms"
            }
        }

class TranslateMatch(BaseModel):
    """Individual match in translation response"""
    equivalence: EquivalenceType
    concept: Dict[str, str] = Field(..., description="Target concept with system, code, display")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    mapping_type: Optional[MappingType] = None
    clinical_notes: Optional[str] = None

class TranslateResponse(BaseModel):
    """Response from FHIR $translate operation"""
    result: bool = Field(..., description="Whether translation was successful")
    message: Optional[str] = Field(None, description="Human-readable result message")
    match: List[TranslateMatch] = Field(default_factory=list, description="Array of translation matches")

    class Config:
        schema_extra = {
            "example": {
                "result": True,
                "message": "Translation successful",
                "match": [
                    {
                        "equivalence": "equivalent",
                        "concept": {
                            "system": "http://id.who.int/icd/release/11/mms",
                            "code": "FA3Z",
                            "display": "Osteoarthritis"
                        },
                        "confidence": 0.95,
                        "mapping_type": "direct",
                        "clinical_notes": "Direct mapping to ICD-11 osteoarthritis"
                    }
                ]
            }
        }

class FHIRCoding(BaseModel):
    """FHIR Coding datatype"""
    system: Optional[str] = None
    version: Optional[str] = None
    code: str
    display: Optional[str] = None

class FHIRCodeableConcept(BaseModel):
    """FHIR CodeableConcept datatype"""
    coding: List[FHIRCoding] = Field(default_factory=list)
    text: Optional[str] = None

class FHIRCondition(BaseModel):
    """Simplified FHIR Condition resource"""
    resourceType: str = Field(default="Condition")
    id: Optional[str] = None
    code: FHIRCodeableConcept
    subject: Dict[str, str]  # Reference to Patient
    encounter: Optional[Dict[str, str]] = None  # Reference to Encounter

class FHIRBundleEntry(BaseModel):
    """FHIR Bundle entry"""
    resource: Dict[str, Any]
    request: Optional[Dict[str, str]] = None

class FHIRBundle(BaseModel):
    """FHIR Bundle resource for encounter submission"""
    resourceType: str = Field(default="Bundle")
    type: str = Field(..., description="Bundle type (must be 'transaction')")
    timestamp: str = Field(..., description="ISO datetime when bundle was created")
    entry: List[FHIRBundleEntry] = Field(..., description="Bundle entries containing resources")

    @validator('type')
    def validate_bundle_type(cls, v):
        if v != 'transaction':
            raise ValueError('Bundle type must be "transaction"')
        return v

    class Config:
        schema_extra = {
            "example": {
                "resourceType": "Bundle",
                "type": "transaction",
                "timestamp": "2024-01-15T10:30:00Z",
                "entry": [
                    {
                        "resource": {
                            "resourceType": "Condition",
                            "code": {
                                "coding": [
                                    {
                                        "system": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
                                        "code": "AAE-16",
                                        "display": "Sandhigatavata"
                                    }
                                ]
                            },
                            "subject": {"reference": "Patient/123"}
                        }
                    }
                ]
            }
        }

class Statistics(BaseModel):
    """Service statistics and metrics"""
    total_terms: int = Field(..., description="Total number of NAMASTE terms")
    mapped_terms: int = Field(..., description="Number of terms with ICD-11 mappings")
    total_encounters: int = Field(..., description="Total encounters processed")
    system_distribution: Dict[str, int] = Field(..., description="Distribution across AYUSH systems")
    equivalence_distribution: Dict[str, int] = Field(..., description="Distribution of mapping types")

    class Config:
        schema_extra = {
            "example": {
                "total_terms": 2888,
                "mapped_terms": 2156,
                "total_encounters": 15420,
                "system_distribution": {
                    "ayurveda": 1523,
                    "siddha": 789,
                    "unani": 576
                },
                "equivalence_distribution": {
                    "equivalent": 1245,
                    "relatedto": 567,
                    "wider": 234,
                    "narrower": 110,
                    "unmatched": 732
                }
            }
        }

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service health status")
    service: str = Field(..., description="Service name")
    version: str = Field(..., description="Service version")
    timestamp: datetime = Field(default_factory=datetime.now)

    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "service": "NAMASTE-ICD11 Terminology Service",
                "version": "1.0.0",
                "timestamp": "2024-01-15T10:30:00Z"
            }
        }