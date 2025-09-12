"""
Mapping Service - Handles NAMASTE to ICD-11 concept mappings and FHIR translation operations
"""

import aiosqlite
from typing import List, Optional, Dict, Any
import logging
from database import get_database_connection
from models import ConceptMapping, TranslateRequest, TranslateResponse, TranslateMatch, FHIRBundle
from services.terminology_service import TerminologyService

logger = logging.getLogger(__name__)

class MappingService:
    """Service for managing concept mappings between NAMASTE and ICD-11"""
    
    def __init__(self):
        self.initialized = False
        self.terminology_service = TerminologyService()
    
    async def initialize(self):
        """Initialize the mapping service"""
        self.initialized = True
        logger.info("Mapping service initialized")
    
    async def translate_concept(
        self, 
        system: str, 
        code: str, 
        target: Optional[str] = None
    ) -> TranslateResponse:
        """
        FHIR $translate operation implementation
        Translates NAMASTE codes to ICD-11 equivalents
        """
        try:
            # Validate source system
            if "namaste" not in system.lower():
                return TranslateResponse(
                    result=False,
                    message=f"Unsupported source system: {system}",
                    match=[]
                )
            
            # Get mapping from database
            sql = """
                SELECT 
                    cm.namaste_code, cm.icd11_code, cm.equivalence, 
                    cm.confidence, cm.mapping_type, cm.clinical_notes,
                    nc.english_term as namaste_term,
                    ic.title as icd11_term
                FROM concept_mappings cm
                JOIN namaste_concepts nc ON cm.namaste_code = nc.code
                LEFT JOIN icd11_concepts ic ON cm.icd11_code = ic.code
                WHERE cm.namaste_code = ?
            """
            
            async with await get_database_connection() as db:
                cursor = await db.execute(sql, (code,))
                row = await cursor.fetchone()
                
                if not row:
                    return TranslateResponse(
                        result=False,
                        message=f"No mapping found for code: {code}",
                        match=[]
                    )
                
                # Handle unmatched concepts
                if row[1] is None:  # icd11_code is None
                    return TranslateResponse(
                        result=True,
                        message=f"Concept {code} has no ICD-11 equivalent",
                        match=[
                            TranslateMatch(
                                equivalence=row[2],  # equivalence
                                concept={
                                    "system": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
                                    "code": code,
                                    "display": "No ICD-11 mapping available"
                                },
                                confidence=row[3],  # confidence
                                mapping_type=row[4],  # mapping_type
                                clinical_notes=row[5]  # clinical_notes
                            )
                        ]
                    )
                
                # Successful mapping
                match = TranslateMatch(
                    equivalence=row[2],  # equivalence
                    concept={
                        "system": target or "http://id.who.int/icd/release/11/mms",
                        "code": row[1],  # icd11_code
                        "display": row[7] or "ICD-11 Concept"  # icd11_term
                    },
                    confidence=row[3],  # confidence
                    mapping_type=row[4],  # mapping_type
                    clinical_notes=row[5]  # clinical_notes
                )
                
                return TranslateResponse(
                    result=True,
                    message="Translation successful",
                    match=[match]
                )
                
        except Exception as e:
            logger.error(f"Translation error for {code}: {str(e)}")
            return TranslateResponse(
                result=False,
                message=f"Translation failed: {str(e)}",
                match=[]
            )
    
    async def get_mappings(
        self, 
        equivalence: Optional[str] = None, 
        system: Optional[str] = None, 
        limit: int = 50
    ) -> List[ConceptMapping]:
        """
        Retrieve concept mappings with optional filtering
        """
        conditions = []
        params = []
        
        if equivalence:
            conditions.append("cm.equivalence = ?")
            params.append(equivalence)
        
        if system:
            conditions.append("nc.system = ?")
            params.append(system)
        
        where_clause = ""
        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)
        
        sql = f"""
            SELECT 
                cm.namaste_code, nc.english_term as namaste_term, nc.original_term,
                nc.system, cm.icd11_code, ic.title as icd11_term,
                cm.equivalence, cm.confidence, cm.mapping_type, cm.clinical_notes
            FROM concept_mappings cm
            JOIN namaste_concepts nc ON cm.namaste_code = nc.code
            LEFT JOIN icd11_concepts ic ON cm.icd11_code = ic.code
            {where_clause}
            ORDER BY nc.system, cm.namaste_code
            LIMIT ?
        """
        
        params.append(limit)
        
        async with await get_database_connection() as db:
            cursor = await db.execute(sql, params)
            rows = await cursor.fetchall()
            
            mappings = []
            for row in rows:
                mapping = ConceptMapping(
                    namasteCode=row[0],
                    namasteTerm=row[1],
                    originalTerm=row[2],
                    system=row[3],
                    icd11Code=row[4],
                    icd11Term=row[5],
                    equivalence=row[6],
                    confidence=row[7],
                    mappingType=row[8],
                    clinicalNotes=row[9]
                )
                mappings.append(mapping)
            
            logger.info(f"Retrieved {len(mappings)} mappings")
            return mappings
    
    async def process_encounter_bundle(self, bundle: FHIRBundle) -> FHIRBundle:
        """
        Process FHIR Bundle and add dual coding to Condition resources
        """
        processed_entries = []
        
        for entry in bundle.entry:
            resource = entry.resource
            
            # Process Condition resources
            if resource.get("resourceType") == "Condition":
                processed_resource = await self._add_dual_coding_to_condition(resource)
                processed_entries.append({
                    "resource": processed_resource,
                    "request": entry.request
                })
            else:
                # Pass through other resources unchanged
                processed_entries.append(entry.dict())
        
        # Return processed bundle
        processed_bundle = FHIRBundle(
            resourceType="Bundle",
            type=bundle.type,
            timestamp=bundle.timestamp,
            entry=processed_entries
        )
        
        return processed_bundle
    
    async def _add_dual_coding_to_condition(self, condition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Add ICD-11 coding to a Condition resource that has NAMASTE coding
        """
        if "code" not in condition or "coding" not in condition["code"]:
            return condition
        
        coding_list = condition["code"]["coding"]
        namaste_system = "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE"
        
        # Find NAMASTE coding
        namaste_coding = None
        for coding in coding_list:
            if coding.get("system") == namaste_system:
                namaste_coding = coding
                break
        
        if not namaste_coding:
            return condition
        
        # Get ICD-11 mapping
        translation = await self.translate_concept(
            namaste_system, 
            namaste_coding["code"]
        )
        
        if translation.result and translation.match:
            match = translation.match[0]
            
            # Only add ICD-11 coding if there's a valid mapping
            if match.concept.get("code") and match.equivalence != "unmatched":
                icd11_coding = {
                    "system": match.concept["system"],
                    "code": match.concept["code"],
                    "display": match.concept["display"]
                }
                
                # Add extension for mapping metadata
                icd11_coding["extension"] = [
                    {
                        "url": "http://namstp.ayush.gov.in/fhir/extension/mapping-equivalence",
                        "valueCode": match.equivalence
                    },
                    {
                        "url": "http://namstp.ayush.gov.in/fhir/extension/mapping-confidence", 
                        "valueDecimal": match.confidence
                    }
                ]
                
                # Add to coding list
                coding_list.append(icd11_coding)
                
                logger.info(f"Added dual coding: {namaste_coding['code']} -> {icd11_coding['code']}")
        
        return condition
    
    async def get_fhir_conceptmap(self) -> Dict[str, Any]:
        """
        Generate FHIR R4 ConceptMap resource for NAMASTE to ICD-11 mappings
        """
        # Get all mappings from database
        sql = """
            SELECT 
                cm.namaste_code, cm.icd11_code, cm.equivalence,
                cm.confidence, cm.mapping_type, cm.clinical_notes,
                nc.english_term as namaste_term,
                ic.title as icd11_term
            FROM concept_mappings cm
            JOIN namaste_concepts nc ON cm.namaste_code = nc.code
            LEFT JOIN icd11_concepts ic ON cm.icd11_code = ic.code
            ORDER BY cm.namaste_code
        """
        
        async with await get_database_connection() as db:
            cursor = await db.execute(sql)
            rows = await cursor.fetchall()
        
        # Build mapping elements
        elements = []
        for row in rows:
            element = {
                "code": row[0],  # namaste_code
                "display": row[6],  # namaste_term
            }
            
            # Add target mapping if exists
            if row[1]:  # icd11_code exists
                element["target"] = [
                    {
                        "code": row[1],  # icd11_code
                        "display": row[7] or "ICD-11 Concept",  # icd11_term
                        "equivalence": row[2],  # equivalence
                        "comment": row[5] if row[5] else f"Mapping type: {row[4]}, Confidence: {row[3]}"
                    }
                ]
            else:
                # Unmatched concept
                element["target"] = [
                    {
                        "equivalence": "unmatched",
                        "comment": row[5] or "No suitable ICD-11 equivalent found"
                    }
                ]
            
            elements.append(element)
        
        # Build FHIR ConceptMap resource
        concept_map = {
            "resourceType": "ConceptMap",
            "id": "namaste-to-icd11-mms",
            "url": "http://namstp.ayush.gov.in/fhir/ConceptMap/namaste-to-icd11-mms",
            "version": "1.0.0",
            "name": "NAMASTEToICD11MMS",
            "title": "NAMASTE to ICD-11 MMS Concept Map",
            "status": "active",
            "experimental": False,
            "date": "2024-01-15",
            "publisher": "Ministry of AYUSH, Government of India",
            "description": "Concept map defining equivalences between NAMASTE traditional medicine codes and ICD-11 MMS codes",
            "sourceCanonical": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
            "targetCanonical": "http://id.who.int/icd/release/11/mms",
            "group": [
                {
                    "source": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
                    "target": "http://id.who.int/icd/release/11/mms",
                    "element": elements
                }
            ]
        }
        
        return concept_map