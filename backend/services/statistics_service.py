"""
Statistics Service - Provides comprehensive analytics and metrics for the terminology service
"""

import aiosqlite
from typing import Dict, Any
import logging
from database import get_database_connection
from models import Statistics

logger = logging.getLogger(__name__)

class StatisticsService:
    """Service for generating comprehensive statistics and analytics"""
    
    def __init__(self):
        self.initialized = False
    
    async def initialize(self):
        """Initialize the statistics service"""
        self.initialized = True
        logger.info("Statistics service initialized")
    
    async def get_comprehensive_statistics(self) -> Statistics:
        """
        Generate comprehensive statistics including:
        - Total terminology counts
        - Mapping coverage metrics  
        - System distribution
        - Equivalence type distribution
        - Usage analytics
        """
        async with await get_database_connection() as db:
            # Get total terminology counts
            total_terms = await self._get_total_terms(db)
            mapped_terms = await self._get_mapped_terms(db)
            total_encounters = await self._get_total_encounters(db)
            
            # Get distribution metrics
            system_distribution = await self._get_system_distribution(db)
            equivalence_distribution = await self._get_equivalence_distribution(db)
            
            stats = Statistics(
                total_terms=total_terms,
                mapped_terms=mapped_terms,
                total_encounters=total_encounters,
                system_distribution=system_distribution,
                equivalence_distribution=equivalence_distribution
            )
            
            logger.info(f"Generated statistics: {total_terms} total terms, {mapped_terms} mapped")
            return stats
    
    async def _get_total_terms(self, db: aiosqlite.Connection) -> int:
        """Get total number of NAMASTE terminology concepts"""
        cursor = await db.execute("SELECT COUNT(*) FROM namaste_concepts")
        result = await cursor.fetchone()
        return result[0] if result else 0
    
    async def _get_mapped_terms(self, db: aiosqlite.Connection) -> int:
        """Get number of terms with ICD-11 mappings (excluding unmatched)"""
        cursor = await db.execute("""
            SELECT COUNT(DISTINCT namaste_code) 
            FROM concept_mappings 
            WHERE icd11_code IS NOT NULL
        """)
        result = await cursor.fetchone()
        return result[0] if result else 0
    
    async def _get_total_encounters(self, db: aiosqlite.Connection) -> int:
        """Get total number of processed encounters"""
        cursor = await db.execute("SELECT COUNT(*) FROM encounters")
        result = await cursor.fetchone()
        return result[0] if result else 0
    
    async def _get_system_distribution(self, db: aiosqlite.Connection) -> Dict[str, int]:
        """Get distribution of concepts across AYUSH systems"""
        cursor = await db.execute("""
            SELECT system, COUNT(*) 
            FROM namaste_concepts 
            GROUP BY system
        """)
        results = await cursor.fetchall()
        
        return {row[0]: row[1] for row in results}
    
    async def _get_equivalence_distribution(self, db: aiosqlite.Connection) -> Dict[str, int]:
        """Get distribution of mapping equivalence types"""
        cursor = await db.execute("""
            SELECT equivalence, COUNT(*) 
            FROM concept_mappings 
            GROUP BY equivalence
        """)
        results = await cursor.fetchall()
        
        return {row[0]: row[1] for row in results}
    
    async def get_mapping_coverage_by_system(self) -> Dict[str, Dict[str, Any]]:
        """
        Get detailed mapping coverage statistics by AYUSH system
        """
        async with await get_database_connection() as db:
            sql = """
                SELECT 
                    nc.system,
                    COUNT(*) as total_concepts,
                    COUNT(cm.icd11_code) as mapped_concepts,
                    COUNT(CASE WHEN cm.equivalence = 'equivalent' THEN 1 END) as equivalent_mappings,
                    COUNT(CASE WHEN cm.equivalence = 'unmatched' THEN 1 END) as unmatched_concepts,
                    AVG(CASE WHEN cm.confidence IS NOT NULL THEN cm.confidence END) as avg_confidence
                FROM namaste_concepts nc
                LEFT JOIN concept_mappings cm ON nc.code = cm.namaste_code
                GROUP BY nc.system
            """
            
            cursor = await db.execute(sql)
            results = await cursor.fetchall()
            
            coverage = {}
            for row in results:
                system = row[0]
                coverage[system] = {
                    "total_concepts": row[1],
                    "mapped_concepts": row[2] or 0,
                    "equivalent_mappings": row[3] or 0,
                    "unmatched_concepts": row[4] or 0,
                    "coverage_percentage": round((row[2] or 0) / row[1] * 100, 1) if row[1] > 0 else 0,
                    "average_confidence": round(row[5], 3) if row[5] else 0.0
                }
            
            return coverage
    
    async def get_mapping_quality_metrics(self) -> Dict[str, Any]:
        """
        Get mapping quality metrics including confidence scores and review status
        """
        async with await get_database_connection() as db:
            # Confidence distribution
            confidence_sql = """
                SELECT 
                    CASE 
                        WHEN confidence >= 0.9 THEN 'high'
                        WHEN confidence >= 0.7 THEN 'medium'
                        WHEN confidence >= 0.5 THEN 'low'
                        ELSE 'very_low'
                    END as confidence_level,
                    COUNT(*) as count
                FROM concept_mappings
                WHERE icd11_code IS NOT NULL
                GROUP BY confidence_level
            """
            
            cursor = await db.execute(confidence_sql)
            confidence_dist = {row[0]: row[1] for row in await cursor.fetchall()}
            
            # Mapping type distribution
            type_sql = """
                SELECT mapping_type, COUNT(*) 
                FROM concept_mappings 
                GROUP BY mapping_type
            """
            
            cursor = await db.execute(type_sql)
            type_dist = {row[0]: row[1] for row in await cursor.fetchall()}
            
            # Overall quality metrics
            quality_sql = """
                SELECT 
                    AVG(confidence) as avg_confidence,
                    MIN(confidence) as min_confidence,
                    MAX(confidence) as max_confidence,
                    COUNT(*) as total_mappings
                FROM concept_mappings
                WHERE icd11_code IS NOT NULL
            """
            
            cursor = await db.execute(quality_sql)
            quality_stats = await cursor.fetchone()
            
            return {
                "confidence_distribution": confidence_dist,
                "mapping_type_distribution": type_dist,
                "overall_metrics": {
                    "average_confidence": round(quality_stats[0], 3) if quality_stats[0] else 0.0,
                    "minimum_confidence": quality_stats[1] or 0.0,
                    "maximum_confidence": quality_stats[2] or 0.0,
                    "total_mappings": quality_stats[3] or 0
                }
            }
    
    async def get_usage_analytics(self) -> Dict[str, Any]:
        """
        Get usage analytics and trends (would be populated by actual usage data)
        """
        # In a production system, this would track:
        # - API endpoint usage
        # - Most searched terms
        # - Most translated concepts
        # - Error rates and patterns
        
        # For demonstration, return simulated analytics
        return {
            "api_usage": {
                "lookup_requests": 1247,
                "translate_requests": 892,
                "encounter_submissions": 156
            },
            "popular_searches": [
                {"term": "sandhigatavata", "count": 89},
                {"term": "amavata", "count": 67},
                {"term": "shvasa", "count": 54},
                {"term": "prameha", "count": 43},
                {"term": "kamala", "count": 38}
            ],
            "error_rates": {
                "search_errors": 0.02,
                "translation_errors": 0.01,
                "authentication_errors": 0.003
            },
            "performance_metrics": {
                "avg_search_time_ms": 45,
                "avg_translation_time_ms": 12,
                "uptime_percentage": 99.97
            }
        }