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

  // Debounce the query
  const debouncedQuery = useMemo(() => {
    const timeoutId = setTimeout(() => query, debounceMs)
    return () => clearTimeout(timeoutId)
  }, [query, debounceMs])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const searchTerminology = async () => {
      setLoading(true)
      setError(null)

      try {
        const searchResults = await terminologyAPI.searchTerminology(query, system)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchTerminology, debounceMs)
    return () => clearTimeout(timeoutId)
  }, [query, system, debounceMs])

  return { results, loading, error }
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
        setError(err instanceof Error ? err.message : 'Failed to fetch statistics')
        setStatistics(null)
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  return { statistics, loading, error, refetch: () => fetchStatistics() }
}

export default terminologyAPI