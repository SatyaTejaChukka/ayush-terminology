/**
 * Provides integration with the FastAPI backen

  ?

  code: string
  originalTerm: string
  definition: string

export interface ConceptMapping {
  namasteTerm:
  system: string
  icd11Term: string | 
  confidence: number
  clinicalNotes: str

 


  result: boolean
  namasteTerm: string
  originalTerm: string
  system: string
  icd11Code: string | null
  icd11Term: string | null
  equivalence: 'equivalent' | 'relatedto' | 'wider' | 'narrower' | 'unmatched'
  confidence: number
  mappingType: 'direct' | 'contextual' | 'clustered' | 'unmapped'
  clinicalNotes: string
e

export interface TranslateRequest {
  system: string
  code: string
  target?: string
 

export interface TranslateResponse {
  result: boolean
  message?: string
  }
  private async request
    options: R
    const url = `${th
    const headers:
      ...options.head

      headers['Authoriz

      ...options,
    
 


  }
  async healthCheck()
  }
  async searchTe
    system?: stri
  ):
 

    if (system) {
    }
    return this.reques

    return this.request('/ConceptMap/$transla
      body: JSON.stringify(request),
 

    system?: string,
  ): Promise<ConceptMappi
      limit: limit.toString(),

      params.append('equivalence', equivalence)

   

  }
  async submitEncounter(bu
   


    return this.reques
}
// Create singlet

if (
}
// React hook for terminology search with

  que

  const [results, setResu
  const [error, setError] = useState<string | null>(null)
  use

      return

      setLoadi


      } catch (err) {
        setError(errorMessage)
        
     

      } finally {
   

    return () => clearTimeout(timeoutId)

}

  const sampleData: NAMAST
    {
      system: "ayurv
      englishTerm: "Sa
      category: "Vata Disorders"
    {
      system: "
      englishTerm: "Amavata",
      

      system: "ay
      englishTerm: "Gridhrasi",
     

    {
   

      category: "Pitta Disorders"
    {
      method: 'POST',
      englishTerm: "Kamala",
      
   

      system: "ayurveda",
      englishTerm: "Shvas
      category: "Kap
    {
      system: "ayurveda",
      englishTerm: "Kasa",
      category: "Kapha Disorde
    {

      englishTerm: "Pr
      category: "Kapha Disorders"
    

      system: "si
      englishTerm: "Vatha Noi",
     

      system: "siddha",
   

    
    {
      system: "siddha
      body: JSON.stringify(bundle),
    })
  }

  async getStatistics(): Promise<Statistics> {
    return this.request('/statistics')
  }
}

// Create singleton instance with demo authentication
export const terminologyAPI = new TerminologyServiceAPI()

// Set demo token for development
if (process.env.NODE_ENV === 'development') {
  terminologyAPI.setAuthToken('demo_abha_token_for_development')
}

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
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch mappings'
        setError(errorMessage)
        
        // If backend is not available, provide sample mappings for demonstration
        if (errorMessage.includes('fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ECONNREFUSED')) {
          setError("Backend not connected - showing sample data")
          setMappings(getSampleMappings(equivalence, system))
        } else {
          setMappings([])
        }
      } finally {
        setLoading(false)
      }
    }

    {
  }, [equivalence, system])

  return { mappings, loading, error, refetch: () => fetchMappings() }
 

// Sample mapping data for offline demonstration
function getSampleMappings(equivalence?: string, system?: string): ConceptMapping[] {
    {
    {
      namasteCode: "AAE-16",
      namasteTerm: "Sandhigatavata", 
      originalTerm: "सन्धिगतवात",
      system: "ayurveda",
      mappingType: "cont
      icd11Term: "Osteoarthritis",
    {
      confidence: 0.95,
      mappingType: "direct",
      clinicalNotes: "Direct mapping - Sandhigatavata corresponds precisely to ICD-11 osteoarthritis with similar pathophysiology"
      
    {
      namasteCode: "AAE-23",
      namasteTerm: "Amavata",
      originalTerm: "अमवात", 
      system: "ayurveda",
      originalTerm: "இரு
      icd11Term: "Rheumatoid arthritis",
      equivalence: "equivalent",
      confidence: 0.92,
      mappingType: "unmapped
      clinicalNotes: "Amavata matches rheumatoid arthritis profile with inflammatory joint involvement and systemic effects"
    {
    {
      originalTerm: "முக்குற
      namasteTerm: "Amlapitta",
      originalTerm: "अम्लपित्त",
      system: "ayurveda", 
      icd11Code: "DA00",
      icd11Term: "Gastro-oesophageal reflux disease",
      equivalence: "equivalent",
      confidence: 0.85,
      mappingType: "direct",
      clinicalNotes: "Amlapitta corresponds to GERD with acid reflux and hyperacidity symptoms"
    fi
    {
      namasteCode: "AKE-18",
      namasteTerm: "Shvasa",
      originalTerm: "श्वास",
      system: "ayurveda",
      icd11Code: "CA20", 
      icd11Term: "Asthma",
  const [statistics, setStatisti
      confidence: 0.87,
      mappingType: "direct",
      clinicalNotes: "Shvasa maps to asthma with similar respiratory obstruction and wheezing patterns"
      
    {
      namasteCode: "SGM-515", 
      namasteTerm: "Kaichal",
      originalTerm: "காய்ச்சல்",
      system: "siddha",
        
      icd11Term: "Fever, unspecified",
          setError("Backend not c
      confidence: 0.94,
      mappingType: "direct",
      clinicalNotes: "Kaichal directly corresponds to fever with elevated temperature and constitutional symptoms"
      
    {
            },
      namasteTerm: "Vatha Noi", 
      originalTerm: "வாத நோய்",
      system: "siddha",
      icd11Code: "FA3Z",
      icd11Term: "Osteoarthritis",
        } else {
      confidence: 0.75,
      } finally {
      clinicalNotes: "Vatha Noi represents broader wind-related musculoskeletal disorders; osteoarthritis is a common manifestation"
    }
    {
  }, [])
      namasteTerm: "Humma",
      originalTerm: "حمیٰ",
      system: "unani",
      icd11Code: "1C62", 
      icd11Term: "Fever, unspecified",
      equivalence: "equivalent",
      confidence: 0.95,
      mappingType: "direct",
      clinicalNotes: "Humma directly corresponds to fever with similar presentation of elevated temperature and systemic symptoms"
    },
    {
      namasteCode: "UJD-629",
      namasteTerm: "Waram Mafasil",

      system: "unani",

      icd11Term: "Rheumatoid arthritis",

      confidence: 0.82,
      mappingType: "contextual", 
      clinicalNotes: "Waram Mafasil encompasses various arthritides; rheumatoid arthritis represents prototypical inflammatory joint disease"

    {
      namasteCode: "AKE-61",
      namasteTerm: "Prameha", 
      originalTerm: "प्रमेह",
      system: "ayurveda",

      icd11Term: "Type 2 diabetes mellitus",

      confidence: 0.78,

      clinicalNotes: "Prameha encompasses broader urinary disorders; Type 2 diabetes represents the most common modern equivalent"
    },
    {
      namasteCode: "AAE-89",
      namasteTerm: "Gridhrasi",
      originalTerm: "गृध्रसी",
      system: "ayurveda",

      icd11Term: null,

      confidence: 0.0,

      clinicalNotes: "Gridhrasi represents complex traditional understanding of sciatic pain requiring specific anatomical context for precise ICD-11 mapping"

    {
      namasteCode: "SGM-628",
      namasteTerm: "Irumal",
      originalTerm: "இருமல்",
      system: "siddha",
      icd11Code: null,
      icd11Term: null,
      equivalence: "unmatched",
      confidence: 0.0, 
      mappingType: "unmapped",
      clinicalNotes: "Irumal (cough) requires more specific ICD-11 classification based on underlying etiology"

    {

      namasteTerm: "Mukkutra Noi",
      originalTerm: "முக்குற்ற நோய்",
      system: "siddha",
      icd11Code: null,
      icd11Term: null,
      equivalence: "unmatched",
      confidence: 0.0,
      mappingType: "unmapped", 
      clinicalNotes: "Mukkutra Noi represents tri-dosha vitiation - a holistic traditional concept without direct biomedical equivalent"

  ]

  // Apply filters



    filtered = filtered.filter(mapping => mapping.equivalence === equivalence)


  if (system) {
    filtered = filtered.filter(mapping => mapping.system === system)



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

            total_terms: 31,

            total_encounters: 156,
            system_distribution: {
              ayurveda: 15,
              siddha: 8,
              unani: 8

            equivalence_distribution: {
              equivalent: 7,
              relatedto: 2,

              narrower: 0,

            }

        } else {

        }
      } finally {
        setLoading(false)
      }
    }

    fetchStatistics()


  return { statistics, loading, error, refetch: () => fetchStatistics() }
}

export default terminologyAPI