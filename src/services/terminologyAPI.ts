import { useState, useEffect } from 'react'

/**
 * NAMASTE-ICD11 Terminology Service API
 * Provides integration with the FastAPI backend for traditional medicine terminology services
 */

// Types for NAMASTE terminology concepts
export interface NAMASTEConcept {
  code: string
  display: string
  originalTerm: string
  definition: string
  system: 'ayurveda' | 'siddha' | 'unani'
}

// Types for concept mappings between NAMASTE and ICD-11
export interface ConceptMapping {
  namasteCode: string
  namasteTerm: string
  originalTerm: string
  system: string
  icd11Code: string | null
  icd11Term: string | null
  equivalence: 'equivalent' | 'relatedto' | 'wider' | 'narrower' | 'unmatched'
  confidence: number
  mappingType: 'direct' | 'contextual' | 'clustered' | 'unmapped'
  clinicalNotes: string
}

// Types for lookup requests and responses
export interface LookupRequest {
  q: string
  system?: 'ayurveda' | 'siddha' | 'unani'
  limit?: number
}

export interface LookupResponse {
  concepts: NAMASTEConcept[]
  totalCount: number
}

// Types for translation requests and responses
export interface TranslateRequest {
  system: string
  code: string
  target: string
}

export interface TranslateResponse {
  result: boolean
  message?: string
  match?: ConceptMapping[]
}

// Types for encounter ingestion
export interface EncounterData {
  patientId: string
  encounterId: string
  namasteCode: string
  clinicalNotes?: string
}

// Statistics interface
export interface Statistics {
  total_terms: number
  total_encounters: number
  system_distribution: {
    ayurveda: number
    siddha: number
    unani: number
  }
  equivalence_distribution: {
    equivalent: number
    relatedto: number
    wider: number
    narrower: number
    unmatched: number
  }
}

const API_BASE_URL = 'http://localhost:8000'

class TerminologyAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  // Lookup endpoint
  async lookup(request: LookupRequest): Promise<LookupResponse> {
    const params = new URLSearchParams({
      q: request.q,
      ...(request.system && { system: request.system }),
      ...(request.limit && { limit: request.limit.toString() }),
    })

    return this.request<LookupResponse>(`/lookup?${params}`)
  }

  // Translation endpoint
  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    return this.request<TranslateResponse>('/ConceptMap/$translate', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: 'Parameters',
        parameter: [
          { name: 'system', valueUri: request.system },
          { name: 'code', valueCode: request.code },
          { name: 'target', valueUri: request.target },
        ],
      }),
    })
  }

  // Encounter ingestion endpoint
  async ingestEncounter(encounter: EncounterData): Promise<any> {
    return this.request('/Encounter', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: encounter.encounterId,
              subject: { reference: `Patient/${encounter.patientId}` },
              status: 'finished',
            },
          },
          {
            resource: {
              resourceType: 'Condition',
              subject: { reference: `Patient/${encounter.patientId}` },
              encounter: { reference: `Encounter/${encounter.encounterId}` },
              code: {
                coding: [
                  {
                    system: 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE',
                    code: encounter.namasteCode,
                  },
                ],
              },
            },
          },
        ],
      }),
    })
  }

  // Statistics endpoint
  async getStatistics(): Promise<Statistics> {
    return this.request<Statistics>('/statistics')
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health')
  }
}

// Sample data for demonstration when backend is not available
const sampleConcepts: NAMASTEConcept[] = [
  {
    code: 'AAE-16',
    display: 'Sandhigatavata',
    originalTerm: 'सन्धिगतवात',
    definition: 'Degenerative joint disorder characterized by pain, stiffness, and reduced mobility',
    system: 'ayurveda'
  },
  {
    code: 'AAE-23',
    display: 'Amavata',
    originalTerm: 'आमवात',
    definition: 'Rheumatoid arthritis-like condition with systemic inflammation',
    system: 'ayurveda'
  },
  {
    code: 'AAE-45',
    display: 'Prameha',
    originalTerm: 'प्रमेह',
    definition: 'Urinary disorders including diabetes mellitus',
    system: 'ayurveda'
  },
  {
    code: 'AAE-67',
    display: 'Grahani',
    originalTerm: 'ग्रहणी',
    definition: 'Digestive disorders affecting small intestine function',
    system: 'ayurveda'
  },
  {
    code: 'AAE-89',
    display: 'Unmada',
    originalTerm: 'उन्माद',
    definition: 'Mental disorders including psychosis and severe anxiety',
    system: 'ayurveda'
  },
  {
    code: 'SSE-12',
    display: 'Vali Gunmam',
    originalTerm: 'வாலி குன்மம்',
    definition: 'Abdominal tumors and masses in Siddha medicine',
    system: 'siddha'
  },
  {
    code: 'SSE-34',
    display: 'Kirigai',
    originalTerm: 'கிரிகை',
    definition: 'Digestive fire disorders affecting metabolism',
    system: 'siddha'
  },
  {
    code: 'SSE-56',
    display: 'Kabam',
    originalTerm: 'கபம்',
    definition: 'Phlegmatic humor imbalances causing respiratory issues',
    system: 'siddha'
  },
  {
    code: 'SSE-78',
    display: 'Pittam',
    originalTerm: 'பித்தம்',
    definition: 'Bilious humor disorders affecting liver and digestion',
    system: 'siddha'
  },
  {
    code: 'SSE-90',
    display: 'Gunmam',
    originalTerm: 'குன்மம்',
    definition: 'Diseases of the abdomen including various digestive disorders',
    system: 'siddha'
  },
  {
    code: 'UUE-11',
    display: 'Balgham',
    originalTerm: 'بلغم',
    definition: 'Phlegmatic temperament disorders causing cold and moist conditions',
    system: 'unani'
  },
  {
    code: 'UUE-22',
    display: 'Safra',
    originalTerm: 'صفرا',
    definition: 'Bilious temperament causing hot and dry pathological states',
    system: 'unani'
  },
  {
    code: 'UUE-33',
    display: 'Sauda',
    originalTerm: 'سودا',
    definition: 'Melancholic temperament causing cold and dry pathological states',
    system: 'unani'
  },
  {
    code: 'UUE-44',
    display: 'Dam',
    originalTerm: 'دم',
    definition: 'Sanguine temperament disorders affecting blood and circulation',
    system: 'unani'
  },
  {
    code: 'UUE-55',
    display: 'Waram',
    originalTerm: 'ورام',
    definition: 'Inflammatory conditions characterized by swelling, heat, redness and pain',
    system: 'unani'
  }
]

const sampleMappings: ConceptMapping[] = [
  {
    namasteCode: "AAE-16",
    namasteTerm: "Sandhigatavata",
    originalTerm: "सन्धिगतवात",
    system: "ayurveda",
    icd11Code: "FA3Z",
    icd11Term: "Osteoarthritis, unspecified",
    equivalence: "equivalent",
    confidence: 0.85,
    mappingType: "direct",
    clinicalNotes: "Strong correlation between Sandhigatavata and osteoarthritis symptoms"
  },
  {
    namasteCode: "AAE-23", 
    namasteTerm: "Amavata",
    originalTerm: "आमवात",
    system: "ayurveda",
    icd11Code: "FA20.0",
    icd11Term: "Rheumatoid arthritis",
    equivalence: "equivalent",
    confidence: 0.8,
    mappingType: "direct",
    clinicalNotes: "Amavata presentation closely matches rheumatoid arthritis criteria"
  },
  {
    namasteCode: "AAE-45",
    namasteTerm: "Prameha",
    originalTerm: "प्रमेह",
    system: "ayurveda", 
    icd11Code: "5A11",
    icd11Term: "Type 2 diabetes mellitus",
    equivalence: "wider",
    confidence: 0.7,
    mappingType: "contextual",
    clinicalNotes: "Prameha encompasses broader urinary disorders; diabetes is primary subset"
  },
  {
    namasteCode: "AAE-67",
    namasteTerm: "Grahani",
    originalTerm: "ग्रहणी",
    system: "ayurveda",
    icd11Code: "DA90",
    icd11Term: "Diseases of small intestine, unspecified",
    equivalence: "relatedto",
    confidence: 0.65,
    mappingType: "contextual",
    clinicalNotes: "Grahani covers digestive function; modern classification more anatomical"
  },
  {
    namasteCode: "AAE-89",
    namasteTerm: "Unmada",
    originalTerm: "उन्माद",
    system: "ayurveda",
    icd11Code: "6A20",
    icd11Term: "Schizophrenia",
    equivalence: "wider",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Unmada broader concept; schizophrenia one manifestation"
  },
  {
    namasteCode: "SSE-12",
    namasteTerm: "Vali Gunmam",
    originalTerm: "வாலி குன்மம்",
    system: "siddha",
    icd11Code: "2C7Y",
    icd11Term: "Benign neoplasm of abdomen, unspecified",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Traditional concept of abdominal masses; modern classification more specific"
  },
  {
    namasteCode: "SSE-34",
    namasteTerm: "Kirigai",
    originalTerm: "கிரிகை",
    system: "siddha",
    icd11Code: "DA94",
    icd11Term: "Diseases of the digestive system",
    equivalence: "wider",
    confidence: 0.55,
    mappingType: "contextual",
    clinicalNotes: "Kirigai relates to digestive fire; broad category mapping"
  },
  {
    namasteCode: "SSE-56", 
    namasteTerm: "Kabam",
    originalTerm: "கபம்",
    system: "siddha",
    icd11Code: "CA20",
    icd11Term: "Diseases of the respiratory system",
    equivalence: "relatedto",
    confidence: 0.5,
    mappingType: "contextual",
    clinicalNotes: "Kabam vitiation often manifests in respiratory symptoms"
  },
  {
    namasteCode: "SSE-78",
    namasteTerm: "Pittam",
    originalTerm: "பித்தம்",
    system: "siddha", 
    icd11Code: "5C64",
    icd11Term: "Diseases of liver",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Pittam disorders commonly affect hepatobiliary system"
  },
  {
    namasteCode: "SSE-90",
    namasteTerm: "Gunmam",
    originalTerm: "குன்மம்",
    system: "siddha",
    icd11Code: "DA90",
    icd11Term: "Diseases of abdomen",
    equivalence: "equivalent",
    confidence: 0.75,
    mappingType: "direct",
    clinicalNotes: "Strong anatomical correlation for abdominal diseases"
  },
  {
    namasteCode: "UUE-11",
    namasteTerm: "Balgham",
    originalTerm: "بلغم",
    system: "unani",
    icd11Code: "CA20",
    icd11Term: "Diseases of the respiratory system",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Balgham temperament primarily affects respiratory functions"
  },
  {
    namasteCode: "UUE-22",
    namasteTerm: "Safra",
    originalTerm: "صفرا",
    system: "unani",
    icd11Code: "5C64",
    icd11Term: "Diseases of the hepatobiliary system",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Safra temperament disorders commonly manifest in liver conditions"
  },
  {
    namasteCode: "UUE-33",
    namasteTerm: "Sauda",
    originalTerm: "سودا",
    system: "unani",
    icd11Code: "6A70",
    icd11Term: "Mental, behavioural or neurodevelopmental disorders",
    equivalence: "relatedto",
    confidence: 0.5,
    mappingType: "contextual",
    clinicalNotes: "Sauda temperament often manifests as melancholic and depressive conditions"
  },
  {
    namasteCode: "UUE-44",
    namasteTerm: "Dam",
    originalTerm: "دم",
    system: "unani",
    icd11Code: "BA00",
    icd11Term: "Diseases of the circulatory system",
    equivalence: "relatedto",
    confidence: 0.7,
    mappingType: "contextual",
    clinicalNotes: "Dam temperament primarily affects blood and circulatory disorders"
  },
  {
    namasteCode: "UUE-55",
    namasteTerm: "Waram",
    originalTerm: "ورام",
    system: "unani",
    icd11Code: "EH90",
    icd11Term: "Inflammatory conditions",
    equivalence: "equivalent",
    confidence: 0.9,
    mappingType: "direct",
    clinicalNotes: "Waram directly corresponds to modern inflammatory disease classification"
  }
]

// Create API instance
const terminologyAPI = new TerminologyAPI()

// Enhanced lookup function with fallback to sample data
async function lookupConcepts(request: LookupRequest): Promise<LookupResponse> {
  try {
    return await terminologyAPI.lookup(request)
  } catch (error) {
    console.warn('Backend not available, using sample data:', error)
    
    // Filter sample data based on search query
    const filtered = sampleConcepts.filter(concept => 
      concept.display.toLowerCase().includes(request.q.toLowerCase()) ||
      concept.originalTerm.toLowerCase().includes(request.q.toLowerCase()) ||
      concept.definition.toLowerCase().includes(request.q.toLowerCase())
    )
    
    // Apply system filter if specified
    const systemFiltered = request.system 
      ? filtered.filter(concept => concept.system === request.system)
      : filtered
    
    // Apply limit
    const limited = systemFiltered.slice(0, request.limit || 10)
    
    return {
      concepts: limited,
      totalCount: systemFiltered.length
    }
  }
}

// Enhanced translate function with fallback
async function translateConcept(request: TranslateRequest): Promise<TranslateResponse> {
  try {
    return await terminologyAPI.translate(request)
  } catch (error) {
    console.warn('Backend not available, using sample mappings:', error)
    
    // Find mapping in sample data
    const mapping = sampleMappings.find(m => m.namasteCode === request.code)
    
    if (mapping) {
      return {
        result: true,
        message: `Found mapping for ${request.code}`,
        match: [mapping]
      }
    } else {
      return {
        result: false,
        message: `No mapping found for ${request.code}`
      }
    }
  }
}

// Enhanced statistics function with fallback
async function getStatistics(): Promise<Statistics> {
  try {
    return await terminologyAPI.getStatistics()
  } catch (error) {
    console.warn('Backend not available, using sample statistics:', error)
    
    // Calculate statistics from sample data
    const systemCounts = sampleConcepts.reduce((acc, concept) => {
      acc[concept.system] = (acc[concept.system] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const equivalenceCounts = sampleMappings.reduce((acc, mapping) => {
      acc[mapping.equivalence] = (acc[mapping.equivalence] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return {
      total_terms: sampleConcepts.length,
      total_encounters: 156, // Sample number
      system_distribution: {
        ayurveda: systemCounts.ayurveda || 0,
        siddha: systemCounts.siddha || 0,
        unani: systemCounts.unani || 0
      },
      equivalence_distribution: {
        equivalent: equivalenceCounts.equivalent || 0,
        relatedto: equivalenceCounts.relatedto || 0,
        wider: equivalenceCounts.wider || 0,
        narrower: equivalenceCounts.narrower || 0,
        unmatched: equivalenceCounts.unmatched || 0
      }
    }
  }
}

// Export enhanced functions
export { terminologyAPI, lookupConcepts, translateConcept, getStatistics }

// React hook for statistics
export function useStatistics() {
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true)
      setError(null)

      try {
        const stats = await getStatistics()
        setStatistics(stats)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  const refetch = async () => {
    const stats = await getStatistics()
    setStatistics(stats)
  }

  return { statistics, loading, error, refetch }
}