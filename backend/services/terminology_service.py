"""
Terminology Service - Handles NAMASTE concept search and FHIR CodeSystem operations
"""

import aiosqlite
from typing import List, Optional, Dict, Any
import logging
from database import get_database_connection
from models import NAMASTEConcept

logger = logging.getLogger(__name__)

class TerminologyService:
    """Service for managing NAMASTE terminology concepts and search operations"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the terminology service"""
        self.initialized = True
        logger.info("Terminology service initialized")
    
    async def search_concepts(
        self, 
        query: str, 
        system: Optional[str] = None, 
        limit: int = 10
    ) -> List[NAMASTEConcept]:
        """
        Search NAMASTE concepts with fuzzy matching
        Supports search across code, English term, original term, and definition
        """
        if not query.strip():
            return []
        
        # Build search query with LIKE patterns for fuzzy matching
        search_terms = query.lower().split()
        conditions = []
        params = []
        
        # Search across multiple fields
        for term in search_terms:
            search_pattern = f"%{term}%"
            field_conditions = [
                "LOWER(code) LIKE ?",
                "LOWER(english_term) LIKE ?", 
                "LOWER(original_term) LIKE ?",
                "LOWER(definition) LIKE ?",
                "LOWER(category) LIKE ?"
            ]
            conditions.append(f"({' OR '.join(field_conditions)})")
            params.extend([search_pattern] * 5)
        
        # Combine all search conditions
        where_clause = " AND ".join(conditions)
        
        # Add system filter if specified
        if system:
            where_clause += " AND system = ?"
            params.append(system)
        
        sql = f"""
            SELECT code, system, original_term, english_term, definition, category
            FROM namaste_concepts 
            WHERE {where_clause}
            ORDER BY 
                CASE WHEN LOWER(code) LIKE ? THEN 1 ELSE 2 END,
                CASE WHEN LOWER(english_term) LIKE ? THEN 1 ELSE 2 END,
                english_term
            LIMIT ?
        """
        
        # Add parameters for ordering and limit
        first_term = search_terms[0] if search_terms else ""
        params.extend([f"%{first_term.lower()}%", f"%{first_term.lower()}%", limit])
        
        async with await get_database_connection() as db:
            try:
                cursor = await db.execute(sql, params)
                rows = await cursor.fetchall()
                
                concepts = []
                for row in rows:
                    concept = NAMASTEConcept(
                        code=row[0],
                        system=row[1], 
                        originalTerm=row[2],
                        englishTerm=row[3],
                        definition=row[4],
                        category=row[5]
                    )
                    concepts.append(concept)
                
                logger.info(f"Found {len(concepts)} concepts for query: {query}")
                return concepts
                
            except Exception as e:
                logger.error(f"Search error: {str(e)}")
                raise
    
    async def get_concept_by_code(self, code: str) -> Optional[NAMASTEConcept]:
        """Retrieve a specific NAMASTE concept by its code"""
        sql = """
            SELECT code, system, original_term, english_term, definition, category
            FROM namaste_concepts 
            WHERE code = ?
        """
        
        async with await get_database_connection() as db:
            cursor = await db.execute(sql, (code,))
            row = await cursor.fetchone()
            
            if row:
                return NAMASTEConcept(
                    code=row[0],
                    system=row[1],
                    originalTerm=row[2], 
                    englishTerm=row[3],
                    definition=row[4],
                    category=row[5]
                )
            return None
    
    async def get_concepts_by_system(self, system: str, limit: int = 100) -> List[NAMASTEConcept]:
        """Retrieve all concepts for a specific AYUSH system"""
        sql = """
            SELECT code, system, original_term, english_term, definition, category
            FROM namaste_concepts 
            WHERE system = ?
            ORDER BY english_term
            LIMIT ?
        """
        
        async with await get_database_connection() as db:
            cursor = await db.execute(sql, (system, limit))
            rows = await cursor.fetchall()
            
            return [
                NAMASTEConcept(
                    code=row[0],
                    system=row[1],
                    originalTerm=row[2],
                    englishTerm=row[3], 
                    definition=row[4],
                    category=row[5]
                )
                for row in rows
            ]
    
    async def get_fhir_codesystem(self) -> Dict[str, Any]:
        """
        Generate FHIR R4 CodeSystem resource for NAMASTE terminologies
        Compliant with FHIR specification for terminology services
        """
        # Get all concepts from database
        sql = """
            SELECT code, system, original_term, english_term, definition, category
            FROM namaste_concepts 
            ORDER BY system, code
        """
        
        async with await get_database_connection() as db:
            cursor = await db.execute(sql)
            rows = await cursor.fetchall()
        
        # Build FHIR CodeSystem resource
        concepts = []
        for row in rows:
            concept = {
                "code": row[0],
                "display": row[3],  # English term
                "definition": row[4],
                "designation": [
                    {
                        "language": self._get_language_code(row[1]),
                        "use": {
                            "system": "http://terminology.hl7.org/CodeSystem/designation-usage",
                            "code": "display"
                        },
                        "value": row[2]  # Original term
                    }
                ],
                "property": [
                    {
                        "code": "ayush-system",
                        "valueCode": row[1]  # System (ayurveda/siddha/unani)
                    },
                    {
                        "code": "category", 
                        "valueString": row[5]  # Category
                    }
                ]
            }
            concepts.append(concept)
        
        codesystem = {
            "resourceType": "CodeSystem",
            "id": "namaste-terminology",
            "url": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
            "version": "1.0.0",
            "name": "NAMASTETerminology",
            "title": "National AYUSH Morbidity and Standardized Terminologies Electronic (NAMASTE)",
            "status": "active",
            "experimental": False,
            "date": "2024-01-15",
            "publisher": "Ministry of AYUSH, Government of India",
            "description": "Comprehensive terminology system for traditional medicine diagnostic codes from Ayurveda, Siddha, and Unani systems",
            "content": "complete",
            "count": len(concepts),
            "property": [
                {
                    "code": "ayush-system",
                    "uri": "http://namstp.ayush.gov.in/fhir/property/ayush-system",
                    "description": "The AYUSH system this concept belongs to",
                    "type": "code"
                },
                {
                    "code": "category",
                    "uri": "http://namstp.ayush.gov.in/fhir/property/category", 
                    "description": "Classification category within the system",
                    "type": "string"
                }
            ],
            "concept": concepts
        }
        
        return codesystem
    
    def _get_language_code(self, system: str) -> str:
        """Map AYUSH system to appropriate language code"""
        language_map = {
            "ayurveda": "sa",  # Sanskrit
            "siddha": "ta",    # Tamil
            "unani": "ar"      # Arabic
        }
        return language_map.get(system, "en")