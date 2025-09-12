/**
 * NAMASTE-ICD11 Terminology Service API Client
 * Provides integration with the FastAPI backend
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.namaste-icd11.health.gov.in' 
  : 'http://localhost:8000'

export interface NAMASTEConcept {
  code: string
  system: string
  originalTerm: string
  englishTerm: string
  definition: string
  category: string
}

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

export interface TranslateRequest {
  system: string
  code: string
  target?: string
}

export interface TranslateResponse {
  result: boolean
  message?: string
  match: Array<{
    equivalence: string
    concept: {
      system?: string
      code: string
      display: string
    }
    confidence?: number
    mapping_type?: string
    clinical_notes?: string
  }>
}

export interface FHIRBundle {
  resourceType: 'Bundle'
  type: 'transaction'
  timestamp: string
  entry: Array<{
    resource: any
  }>
}

export interface Statistics {
  total_terms: number
  mapped_terms: number
  total_encounters: number
  system_distribution: Record<string, number>
  equivalence_distribution: Record<string, number>
}

class TerminologyServiceAPI {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  async healthCheck(): Promise<{ status: string; service: string; version: string }> {
    return this.request('/health')
  }

  async searchTerminology(
    query: string,
    system?: string,
    limit: number = 10
  ): Promise<NAMASTEConcept[]> {
    const params = new URLSearchParams({
      q: query,
      limit: limit.toString(),
    })

    if (system) {
      params.append('system', system)
    }

    return this.request(`/lookup?${params.toString()}`)
  }

  async translateConcept(request: TranslateRequest): Promise<TranslateResponse> {
    return this.request('/ConceptMap/$translate', {
      method: 'POST',
      body: JSON.stringify(request),
    })
  }

  async getConceptMappings(
    equivalence?: string,
    system?: string,
    limit: number = 50
  ): Promise<ConceptMapping[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    if (equivalence) {
      params.append('equivalence', equivalence)
    }

    if (system) {
      params.append('system', system)
    }

    return this.request(`/mappings?${params.toString()}`)
  }

  async submitEncounter(bundle: FHIRBundle): Promise<any> {
    return this.request('/Encounter', {
      method: 'POST',
      body: JSON.stringify(bundle),
    })
  }

  async getStatistics(): Promise<Statistics> {
    return this.request('/statistics')
  }
}

// Create singleton instance
export const terminologyAPI = new TerminologyServiceAPI()

// React hook for terminology search with debouncing
import { useState, useEffect, useMemo } from 'react'

export function useTerminologySearch(
  query: string,
  system?: string,
  debounceMs: number = 300
) {
  const [results, setResults] = useState<NAMASTEConcept[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setError(null)
      return
    }

    const searchTerminology = async () => {
      setLoading(true)
      setError(null)

      try {
        const searchResults = await terminologyAPI.searchTerminology(query, system)
        setResults(searchResults)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Search failed'
        setError(errorMessage)
        setResults([])
        
        // If backend is not available, provide sample data for demonstration
        if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ECONNREFUSED')) {
          setError("Backend not connected - showing sample data")
          setResults(getSampleTerminologies(query, system))
        }
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchTerminology, debounceMs)
    return () => clearTimeout(timeoutId)
  }, [query, system, debounceMs])

  return { results, loading, error }
}

// Sample data for offline demonstration
function getSampleTerminologies(query: string, system?: string): NAMASTEConcept[] {
  const sampleData: NAMASTEConcept[] = [
    {
      code: "AAE-16",
      system: "ayurveda",
      originalTerm: "सन्धिगतवात",
      englishTerm: "Sandhigatavata",
      definition: "Osteoarthritis - degenerative joint disease characterized by pain and stiffness",
      category: "Vata Disorders"
    },
    {
      code: "AAE-23",
      system: "ayurveda", 
      originalTerm: "अमवात",
      englishTerm: "Amavata",
      definition: "Rheumatoid arthritis - inflammatory joint disease with systemic manifestations",
      category: "Vata Disorders"
    },
    {
      code: "APE-12",
      system: "ayurveda",
      originalTerm: "अम्लपित्त", 
      englishTerm: "Amlapitta",
      definition: "Hyperacidity - excessive acid production in stomach causing heartburn",
      category: "Pitta Disorders"
    },
    {
      code: "AKE-18",
      system: "ayurveda",
      originalTerm: "श्वास",
      englishTerm: "Shvasa",
      definition: "Dyspnea/Asthma - difficulty in breathing with wheezing",
      category: "Kapha Disorders"
    },
    {
      code: "SNP-101",
      system: "siddha",
      originalTerm: "வாத நோய்",
      englishTerm: "Vatha Noi",
      definition: "Wind-related disorders affecting nervous and musculoskeletal systems",
      category: "Noi Nadal (Pathology)"
    },
    {
      code: "SNP-515",
      system: "siddha",
      originalTerm: "காய்ச்சல்",
      englishTerm: "Kaichal", 
      definition: "Fever - elevated body temperature as immune response",
      category: "Maruthuvam (General Medicine)"
    },
    {
      code: "UHM-301",
      system: "unani",
      originalTerm: "حمیٰ",
      englishTerm: "Humma",
      definition: "Fever - pyrexia with constitutional symptoms", 
      category: "Amraz-e-Amma (General Diseases)"
    },
    {
      code: "UJD-629",
      system: "unani",
      originalTerm: "ورم مفاصل",
      englishTerm: "Waram Mafasil",
      definition: "Arthritis - inflammation of joints with pain and swelling",
      category: "Joint Disorders"
    }
  ]

  const queryLower = query.toLowerCase()
  
  return sampleData.filter(item => {
    const matchesSystem = !system || item.system === system
    const matchesQuery = 
      item.code.toLowerCase().includes(queryLower) ||
      item.englishTerm.toLowerCase().includes(queryLower) ||
      item.definition.toLowerCase().includes(queryLower) ||
      item.category.toLowerCase().includes(queryLower)
    
    return matchesSystem && matchesQuery
  }).slice(0, 10)
}

// React hook for concept mappings
export function useConceptMappings(
  equivalence?: string,
  system?: string
) {
  const [mappings, setMappings] = useState<ConceptMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMappings = async () => {
      setLoading(true)
      setError(null)

      try {
        const mappingResults = await terminologyAPI.getConceptMappings(equivalence, system)
        setMappings(mappingResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mappings')
        setMappings([])
      } finally {
        setLoading(false)
      }
    }

    fetchMappings()
  }, [equivalence, system])

  return { mappings, loading, error, refetch: () => fetchMappings() }
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
        
        // Provide sample statistics if backend is not available
        if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ECONNREFUSED')) {
          setError("Backend not connected - showing sample data")
          setStatistics({
            total_terms: 21,
            mapped_terms: 15,
            total_encounters: 42,
            system_distribution: {
              ayurveda: 10,
              siddha: 6,
              unani: 5
            },
            equivalence_distribution: {
              equivalent: 8,
              relatedto: 4,
              wider: 2,
              narrower: 1
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

export default terminologyAPI