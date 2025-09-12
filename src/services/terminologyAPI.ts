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
  namasteTerm: string
  namasteCode: string
  originalTerm: string
  system: string
  icd11Code: string | null
  icd11Term: string | null
  equivalence: 'equivalent' | 'relatedto' | 'wider' | 'narrower' | 'unmatched'
  confidence: number
  mappingType: 'direct' | 'contextual' | 'clustered' | 'unmapped'
  clinicalNotes: string
}

// Types for translation requests and responses
export interface TranslateRequest {
  system: string
  code: string
  target?: string
}

export interface TranslateResponse {
  result: boolean
  message?: string
  matches: ConceptMapping[]
}

// Types for lookup search results
export interface LookupRequest {
  q: string
  system?: string
  limit?: number
}

export interface LookupResponse {
  concepts: NAMASTEConcept[]
  totalCount: number
}

// Types for clinical encounter data
export interface ClinicalEncounter {
  patientId: string
  encounterId: string
  namasteCode: string
  namasteTerm: string
  originalTerm: string
  system: string
  clinicalNotes?: string
  timestamp: string
}

// Types for system statistics
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

// API Configuration
const API_BASE_URL = 'http://localhost:8000'
const API_TIMEOUT = 10000

class TerminologyAPI {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // Add authorization header if available
    if (options.headers && 'Authorization' in options.headers) {
      headers['Authorization'] = options.headers['Authorization'] as string
    }

    const response = await fetch(url, {
      ...options,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Terminology lookup endpoint
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
          { name: 'system', valueUri: 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE' },
          { name: 'code', valueCode: request.code },
          { name: 'target', valueUri: 'http://id.who.int/icd/release/11/mms' },
        ],
      }),
    })
  }

  // Clinical encounter submission
  async submitEncounter(encounter: ClinicalEncounter): Promise<{ success: boolean; encounterId: string }> {
    return this.request<{ success: boolean; encounterId: string }>('/Encounter', {
      method: 'POST',
      body: JSON.stringify({
        resourceType: 'Bundle',
        type: 'transaction',
        entry: [
          {
            resource: {
              resourceType: 'Encounter',
              id: encounter.encounterId,
              status: 'finished',
              subject: { reference: `Patient/${encounter.patientId}` },
            },
          },
          {
            resource: {
              resourceType: 'Condition',
              code: {
                coding: [
                  {
                    system: 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE',
                    code: encounter.namasteCode,
                    display: encounter.namasteTerm,
                  },
                ],
              },
              subject: { reference: `Patient/${encounter.patientId}` },
            },
          },
        ],
      }),
    })
  }

  // System statistics
  async getStatistics(): Promise<Statistics> {
    return this.request<Statistics>('/statistics')
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health')
  }
}

// Sample data for demonstration when backend is not available
const sampleTerminology: NAMASTEConcept[] = [
  {
    code: 'AAE-16',
    display: 'Sandhigatavata',
    originalTerm: 'सन्धिगतवात',
    definition: 'Degenerative joint disorder characterized by Vata vitiation in the joints',
    system: 'ayurveda'
  },
  {
    code: 'AAE-23',
    display: 'Amavata',
    originalTerm: 'आमवात',
    definition: 'Rheumatoid arthritis-like condition with Ama and Vata involvement',
    system: 'ayurveda'
  },
  {
    code: 'AAE-45',
    display: 'Prameha',
    originalTerm: 'प्रमेह',
    definition: 'Metabolic disorder characterized by excessive urination and sweet taste',
    system: 'ayurveda'
  },
  {
    code: 'AAE-67',
    display: 'Hridayaroga',
    originalTerm: 'हृदयरोग',
    definition: 'Cardiac disorders affecting the heart organ and its functions',
    system: 'ayurveda'
  },
  {
    code: 'AAE-89',
    display: 'Unmada',
    originalTerm: 'उन्माद',
    definition: 'Psychiatric disorder characterized by disturbed mental faculties',
    system: 'ayurveda'
  },
  {
    code: 'SSE-12',
    display: 'Vatham',
    originalTerm: 'வாதம்',
    definition: 'Conditions related to Vatham dosha vitiation affecting movement and nervous system',
    system: 'siddha'
  },
  {
    code: 'SSE-34',
    display: 'Pitham',
    originalTerm: 'பித்தம்',
    definition: 'Disorders caused by Pitham dosha affecting metabolism and heat regulation',
    system: 'siddha'
  },
  {
    code: 'SSE-56',
    display: 'Kabam',
    originalTerm: 'கபம்',
    definition: 'Conditions arising from Kabam dosha vitiation affecting structure and immunity',
    system: 'siddha'
  },
  {
    code: 'SSE-78',
    display: 'Gunmam',
    originalTerm: 'குன்மம்',
    definition: 'Abdominal disorders characterized by lumps or growths in the abdomen',
    system: 'siddha'
  },
  {
    code: 'SSE-90',
    display: 'Mega Noi',
    originalTerm: 'மேக நோய்',
    definition: 'Urogenital disorders affecting reproductive and urinary systems',
    system: 'siddha'
  },
  {
    code: 'UUE-11',
    display: 'Balgham',
    originalTerm: 'بلغم',
    definition: 'Phlegmatic temperament disorders causing cold and moist pathological conditions',
    system: 'unani'
  },
  {
    code: 'UUE-22',
    display: 'Safra',
    originalTerm: 'صفرا',
    definition: 'Bilious temperament disorders characterized by heat and dryness',
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
    originalTerm: 'ورم',
    definition: 'Inflammatory conditions characterized by swelling, heat, redness and pain',
    system: 'unani'
  }
]

const sampleMappings: ConceptMapping[] = [
  {
    namasteTerm: "Sandhigatavata",
    namasteCode: "AAE-16",
    originalTerm: "सन्धिगतवात",
    system: "ayurveda",
    icd11Code: "FA20",
    icd11Term: "Osteoarthritis",
    equivalence: "equivalent",
    confidence: 0.9,
    mappingType: "direct",
    clinicalNotes: "Strong correlation between Sandhigatavata and biomedical osteoarthritis diagnosis"
  },
  {
    namasteTerm: "Amavata",
    namasteCode: "AAE-23", 
    originalTerm: "आमवात",
    system: "ayurveda",
    icd11Code: "FA20.0",
    icd11Term: "Rheumatoid arthritis",
    equivalence: "relatedto",
    confidence: 0.8,
    mappingType: "contextual",
    clinicalNotes: "Amavata shares clinical features with rheumatoid arthritis but includes broader systemic involvement"
  },
  {
    namasteTerm: "Prameha",
    namasteCode: "AAE-45",
    originalTerm: "प्रमेह",
    system: "ayurveda", 
    icd11Code: "5A10",
    icd11Term: "Type 2 diabetes mellitus",
    equivalence: "wider",
    confidence: 0.7,
    mappingType: "contextual",
    clinicalNotes: "Prameha encompasses various urinary disorders including but not limited to diabetes mellitus"
  },
  {
    namasteTerm: "Hridayaroga",
    namasteCode: "AAE-67",
    originalTerm: "हृदयरोग",
    system: "ayurveda",
    icd11Code: "BA00-BE2Z",
    icd11Term: "Diseases of the circulatory system", 
    equivalence: "wider",
    confidence: 0.6,
    mappingType: "clustered",
    clinicalNotes: "Hridayaroga is a broad category requiring specific subtype identification for precise ICD-11 mapping"
  },
  {
    namasteTerm: "Unmada",
    namasteCode: "AAE-89",
    originalTerm: "उन्माद",
    system: "ayurveda",
    icd11Code: "6A00-6E8Z",
    icd11Term: "Mental, behavioural or neurodevelopmental disorders",
    equivalence: "wider", 
    confidence: 0.5,
    mappingType: "clustered",
    clinicalNotes: "Unmada covers various psychiatric conditions requiring detailed assessment for specific mapping"
  },
  {
    namasteTerm: "Vatham",
    namasteCode: "SSE-12",
    originalTerm: "வாதம்",
    system: "siddha",
    icd11Code: "8A00-8E7Z",
    icd11Term: "Diseases of the nervous system",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual", 
    clinicalNotes: "Vatham encompasses neurological and movement disorders with some overlap to biomedical neurology"
  },
  {
    namasteTerm: "Pitham", 
    namasteCode: "SSE-34",
    originalTerm: "பித்தம்",
    system: "siddha",
    icd11Code: "DB90-DC8Z", 
    icd11Term: "Diseases of the digestive system",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Pitham affects digestion, metabolism and heat regulation with primary digestive system involvement"
  },
  {
    namasteTerm: "Kabam",
    namasteCode: "SSE-56", 
    originalTerm: "கபம்",
    system: "siddha",
    icd11Code: "CB00-CB8Z",
    icd11Term: "Diseases of the respiratory system",
    equivalence: "relatedto",
    confidence: 0.5,
    mappingType: "contextual",
    clinicalNotes: "Kabam vitiation often manifests as respiratory and structural disorders"
  },
  {
    namasteTerm: "Gunmam",
    namasteCode: "SSE-78",
    originalTerm: "குன்மம்",
    system: "siddha", 
    icd11Code: "DD80",
    icd11Term: "Abdominal mass",
    equivalence: "equivalent",
    confidence: 0.8,
    mappingType: "direct",
    clinicalNotes: "Gunmam directly correlates with palpable abdominal masses or lumps"
  },
  {
    namasteTerm: "Mega Noi",
    namasteCode: "SSE-90",
    originalTerm: "மேக நோய்",
    system: "siddha",
    icd11Code: "GC00-GC4Z", 
    icd11Term: "Diseases of the genitourinary system",
    equivalence: "relatedto",
    confidence: 0.7,
    mappingType: "contextual",
    clinicalNotes: "Mega Noi encompasses urogenital disorders with broader traditional medicine context"
  },
  {
    namasteTerm: "Balgham",
    namasteCode: "UUE-11",
    originalTerm: "بلغم",
    system: "unani",
    icd11Code: "CB00-CB8Z",
    icd11Term: "Diseases of the respiratory system",
    equivalence: "relatedto", 
    confidence: 0.6,
    mappingType: "contextual",
    clinicalNotes: "Balgham temperament primarily affects respiratory system with cold, moist pathology"
  },
  {
    namasteTerm: "Safra",
    namasteCode: "UUE-22",
    originalTerm: "صفرا",
    system: "unani",
    icd11Code: "DB90-DC8Z",
    icd11Term: "Diseases of the digestive system",
    equivalence: "relatedto",
    confidence: 0.6,
    mappingType: "contextual", 
    clinicalNotes: "Safra temperament affects biliary and digestive functions with heat-related pathology"
  },
  {
    namasteTerm: "Sauda",
    namasteCode: "UUE-33",
    originalTerm: "سودا",
    system: "unani",
    icd11Code: "6A00-6E8Z",
    icd11Term: "Mental, behavioural or neurodevelopmental disorders",
    equivalence: "relatedto",
    confidence: 0.5,
    mappingType: "contextual",
    clinicalNotes: "Sauda temperament often manifests as melancholic and depressive conditions"
  },
  {
    namasteTerm: "Dam",
    namasteCode: "UUE-44", 
    originalTerm: "دم",
    system: "unani",
    icd11Code: "BA00-BE2Z",
    icd11Term: "Diseases of the circulatory system",
    equivalence: "relatedto",
    confidence: 0.7,
    mappingType: "contextual",
    clinicalNotes: "Dam temperament primarily affects blood and circulatory system functions"
  },
  {
    namasteTerm: "Waram",
    namasteCode: "UUE-55",
    originalTerm: "ورم", 
    system: "unani",
    icd11Code: "MH70",
    icd11Term: "Inflammatory response",
    equivalence: "equivalent",
    confidence: 0.9,
    mappingType: "direct",
    clinicalNotes: "Waram directly corresponds to inflammatory conditions with classical signs of inflammation"
  }
]

// Create API instance
const terminologyAPI = new TerminologyAPI()

// Enhanced API methods with fallback to sample data
const enhancedAPI = {
  ...terminologyAPI,

  async lookup(request: LookupRequest): Promise<LookupResponse> {
    try {
      return await terminologyAPI.lookup(request)
    } catch (error) {
      // Fallback to sample data with filtering
      const filtered = sampleTerminology.filter(concept => {
        const matchesQuery = concept.display.toLowerCase().includes(request.q.toLowerCase()) ||
                           concept.originalTerm.toLowerCase().includes(request.q.toLowerCase()) ||
                           concept.definition.toLowerCase().includes(request.q.toLowerCase())
        const matchesSystem = !request.system || concept.system === request.system
        return matchesQuery && matchesSystem
      })

      const limited = filtered.slice(0, request.limit || 10)
      
      return {
        concepts: limited,
        totalCount: filtered.length
      }
    }
  },

  async translate(request: TranslateRequest): Promise<TranslateResponse> {
    try {
      return await terminologyAPI.translate(request)
    } catch (error) {
      // Fallback to sample mapping data
      const mappings = sampleMappings.filter(mapping => 
        mapping.namasteCode === request.code
      )

      return {
        result: mappings.length > 0,
        message: mappings.length > 0 ? 'Translation found' : 'No translation available',
        matches: mappings
      }
    }
  },

  async getMappings(filters?: {
    system?: string
    equivalence?: string
    limit?: number
  }): Promise<ConceptMapping[]> {
    try {
      // This would call a real backend endpoint for mappings
      const response = await terminologyAPI.request<ConceptMapping[]>('/mappings')
      return response
    } catch (error) {
      // Fallback to sample data with filtering
      let filtered = [...sampleMappings]

      if (filters?.equivalence) {
        filtered = filtered.filter(mapping => mapping.equivalence === filters.equivalence)
      }

      if (filters?.system) {
        filtered = filtered.filter(mapping => mapping.system === filters.system)
      }

      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit)
      }

      return filtered
    }
  }
}

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
        const stats = await terminologyAPI.getStatistics()
        setStatistics(stats)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch statistics'
        setError(errorMessage)

        // Provide realistic sample statistics based on the mapping data
        if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ECONNREFUSED')) {
          setError("Backend not connected - showing sample data")
          setStatistics({
            total_terms: 31,
            total_encounters: 156,
            system_distribution: {
              ayurveda: 15,
              siddha: 8,
              unani: 8
            },
            equivalence_distribution: {
              equivalent: 7,
              relatedto: 12,
              wider: 8,
              narrower: 3,
              unmatched: 1
            }
          })
        } else {
          setStatistics(null)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  return { statistics, loading, error, refetch: () => fetchStatistics() }
}

export default enhancedAPI