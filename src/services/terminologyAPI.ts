import { useState, useEffect } from 'react'

/**
 * NAMASTE-ICD11 Terminology Service API
 * Provides integration with the FastAPI backend for traditional medicine terminology services
 */

// Types for NAMASTE terminology concepts
  definition: string
  code: string
  display: string
  originalTerm: string
  definition: string
  system: 'ayurveda' | 'siddha' | 'unani'
 

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


// Types for translation requests and responses
export interface TranslateRequest {
}
  code: string
  concepts: NAMAS
}

    unani: number
  equivalence_dis
    relatedto: num
    narrower: number
}

const API_BASE_URL = 'http://local

  private b

    this.baseUrl
}

    const headers: HeadersInit = 
      ...options.headers,

}

    const response = await fetch(url
      headers,
    })
    if (!response.ok)
    }
    return response.j

  async lookup(r
      q: request.q,
      ...(request.l


  // Translation endpoint
    return this.request<Trans
      body: JSON.stri
        parameter: [
          { name: 'code'
        ],
    })

  a
      method: 'POST',
        resourceType: 
        entry: [
            resou
              id: en
              subject
   
 

                  {
                    code: encounter.namasteC
                  },

            },
        ],
    })

  async getStatistics(): Promise<Statistics> {
  }
  // Health check
   

// Sample data for demonstration when backend is not available
  {
    display: 'Sandhigatavata',
    definition: 'Degenerative joint disor
  },
    c

    system: 'ayurveda'
  {
    display: 'Prameha',
    d

    code: 'AAE-67',
    originalTerm:
    system: 'a
  {
    di

  },
    code: 'SSE-12',
    o

  {
   

  },
    code: 'SSE-56',
    originalTerm: 'கபம்',
    system: 'siddha
  {
    display: 'Gunmam',
    de

    code: 'SSE-90',
   

  {
    display: 'Balgham',
    definition: 'Phlegmatic temperament disorders causing cold and moi
      method: 'POST',
    code: 'UUE-22',
    originalTerm: 'صفرا',
    system: 'unani'
  {
    display: 'Sauda',
    definition: 'Melancholic temperament causing cold and dry pathological stat
  },
    code:
    })
  }

    display: 'Waram',
    definition: 'Inflammatory conditions characterized by swelling, heat, redness and pain',
  }

  {
    namasteCode: "AAE-16",
    system: "ayurveda",
    icd11Term: "
    confide
    clinicalNotes: "Str
  {
    namasteCode: "AAE-23", 
    system: "ayurveda",
    icd11Term: "Rheumatoid arthritis",
    confidence
    clinical
  {
    namasteCode: "AAE-4
    system: "ayurveda", 
    icd11Term: "Type 
    confidence: 0.7,
    clinicalNotes: 
  {
    namasteCode: "AAE-67",
    system: "ayurveda",
    icd11Term: "Dise
    confidence: 0.
    clinicalNote
  {
    namasteCod
    system: 
    icd11T
    confi
    cl
  {

    system: "siddha",
  async getStatistics(): Promise<Statistics> {
    confidence: 0.6,
  }

    namasteCode: 
    system: "siddha",
    icd11Term: "Diseases of the digestive system",
   
}

    namasteCode: "SSE-56", 
    system: "siddha",
   
    confidence: 0.5
    clinicalNotes: "Kabam viti
  {
    namasteCode: "SSE-78",
    system: "siddha", 
    
   
    clinicalNotes: 
  {
    namasteCode: "SSE-90",
    system: "siddha",
    icd11Term: "Diseas
    
   
  {
    namasteCode: "UUE-1
    system: "unani",
    icd11Term: "Diseases of the respiratory system",
    confidence: 0.6,
    
  {
    namasteCode: "U
    system: "unani",
    icd11Term: "Diseases of 
    confidence: 0.6,
    clinicalNotes: "Sa
  {
   
    system: "unani"
    icd11Term: "Mental
    confidence: 0.5,
    clinicalNotes: "Sauda temperament often manifests as melancholic and depressive
  {
    
   
    icd11Term: "Dis
    confidence: 0.7,
    clinicalNotes: "Dam te
  {
    namasteCode: "UU
    
   
    confidence: 0.9
    clinicalNotes: "Wa
]
// Create API instance

cons

    try {
    } catch (error) {
      const filtered = sa
                           concept.originalTerm.toLowerCase().includes(request.q.toLowerCase()) |
        const matche
    
   
      return {
        totalCount: fi
    }

    try {
    
   
      )
      return {
        message: mappings.len
      }
  },
  as
   
  }): Promise<Conce
      // This would cal
      return response
      // Fallback to sample data with filtering

    

        filtered = 

        filtered = filter

    }
}
// 
  const [statistics
  const [error, setEr
  useEffect(() => {
      setLoading(true)

    
   
        setError(er
        // Provide 
          setError("Bac
            total_terms: 31,
            system_
    
   
              equiv
              wider: 
              unmatched:
          })
          setStatis
   
 

  }, [])
  r














































































































































































































      }
    }
















    }

















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

            total_terms: 31,
            total_encounters: 156,
            system_distribution: {
              ayurveda: 15,
              siddha: 8,
              unani: 8

            equivalence_distribution: {
              equivalent: 7,




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

