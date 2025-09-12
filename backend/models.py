"""
Database models for NAMASTE-ICD11 Terminology Service
Comprehensive SQLAlchemy models for traditional medicine terminologies
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class NAMASTECode(Base):
    """
    NAMASTE Terminology Codes for Ayurveda, Siddha, and Unani systems
    Contains authentic codes from the Ministry of AYUSH
    """
    __tablename__ = "namaste_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    display = Column(String(200), nullable=False)
    original_term = Column(String(200), nullable=False)  # Sanskrit/Tamil/Arabic
    definition = Column(Text, nullable=False)
    system = Column(String(20), nullable=False, index=True)  # ayurveda, siddha, unani
    category = Column(String(100), nullable=True)  # Disease category
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ICD11Code(Base):
    """
    ICD-11 Classification Codes from WHO
    Focus on Traditional Medicine Module 2 (TM2) and related codes
    """
    __tablename__ = "icd11_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    title = Column(String(300), nullable=False)
    definition = Column(Text, nullable=True)
    parent_code = Column(String(20), nullable=True)
    chapter = Column(String(100), nullable=True)
    linearization = Column(String(50), default='mms', nullable=False)
    is_tm2_module = Column(String(10), default='false', nullable=False)  # Traditional Medicine Module 2
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ConceptMapping(Base):
    """
    Mappings between NAMASTE and ICD-11 codes
    Expert-curated mappings with equivalence relationships
    """
    __tablename__ = "concept_mappings"
    
    id = Column(Integer, primary_key=True, index=True)
    namaste_code = Column(String(20), nullable=False, index=True)
    icd11_code = Column(String(20), nullable=True)  # Can be null for unmatched
    icd11_term = Column(String(300), nullable=True)
    equivalence = Column(String(20), nullable=False)  # equivalent, relatedto, wider, narrower, unmatched
    confidence = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    mapping_type = Column(String(20), nullable=False)  # direct, contextual, clustered, unmapped
    clinical_notes = Column(Text, nullable=True)
    mapped_by = Column(String(100), nullable=True)  # Expert who created mapping
    validated_by = Column(String(100), nullable=True)  # Expert who validated mapping
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class EncounterRecord(Base):
    """
    Clinical encounter records with dual coding
    Stores FHIR Bundle data for encounters using NAMASTE terminologies
    """
    __tablename__ = "encounter_records"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(String(100), nullable=False, index=True)
    patient_id = Column(String(100), nullable=False, index=True)
    namaste_codes = Column(String(500), nullable=False)  # Comma-separated list
    icd11_codes = Column(String(500), nullable=True)  # Auto-generated from mappings
    fhir_bundle = Column(JSON, nullable=False)  # Complete FHIR Bundle
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TerminologyVersion(Base):
    """
    Version tracking for terminology updates
    Maintains history of NAMASTE and ICD-11 updates
    """
    __tablename__ = "terminology_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    terminology_type = Column(String(20), nullable=False)  # namaste, icd11
    version = Column(String(20), nullable=False)
    release_date = Column(DateTime(timezone=True), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(String(10), default='true', nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())