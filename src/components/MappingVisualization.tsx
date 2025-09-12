import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, CheckCircle, AlertCircle, XCircle, Globe, BookOpen, Beaker, Spinner } from '@phosphor-icons/react'
import { useConceptMappings, useStatistics, type ConceptMapping } from '@/services/terminologyAPI'

export default function MappingVisualization() {
  const [selectedMapping, setSelectedMapping] = useState<ConceptMapping | null>(null)
  const [filterEquivalence, setFilterEquivalence] = useState('all')

  // Use real API for mappings and statistics
  const { mappings, loading: mappingsLoading, error: mappingsError } = useConceptMappings(
    filterEquivalence === 'all' ? undefined : filterEquivalence
  )
  const { statistics, loading: statsLoading } = useStatistics()

  const filteredMappings = mappings

  const getEquivalenceIcon = (equivalence: string) => {
    switch (equivalence) {
      case 'equivalent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'relatedto':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'wider':
      case 'narrower':
        return <ArrowRight className="h-4 w-4 text-blue-600" />
      case 'unmatched':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getEquivalenceColor = (equivalence: string) => {
    switch (equivalence) {
      case 'equivalent':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'relatedto':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'wider':
      case 'narrower':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'unmatched':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'ayurveda':
        return <BookOpen className="h-4 w-4 text-traditional" />
      case 'siddha':
        return <Globe className="h-4 w-4 text-accent" />
      case 'unani':
        return <Beaker className="h-4 w-4 text-secondary" />
      default:
        return <BookOpen className="h-4 w-4" />
    }
  }

  const stats = statistics ? {
    total: statistics.total_terms,
    equivalent: statistics.equivalence_distribution?.equivalent || 0,
    relatedto: statistics.equivalence_distribution?.relatedto || 0,
    wider: statistics.equivalence_distribution?.wider || 0,
    unmatched: statistics.equivalence_distribution?.unmatched || 0
  } : {
    total: 0,
    equivalent: 0,
    relatedto: 0,
    wider: 0,
    unmatched: 0
  }

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {statsLoading ? <Spinner className="h-6 w-6 animate-spin mx-auto" /> : stats.total}
            </div>
            <div className="text-sm text-muted-foreground">Total Mappings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? <Spinner className="h-6 w-6 animate-spin mx-auto" /> : stats.equivalent}
            </div>
            <div className="text-sm text-muted-foreground">Equivalent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {statsLoading ? <Spinner className="h-6 w-6 animate-spin mx-auto" /> : stats.relatedto}
            </div>
            <div className="text-sm text-muted-foreground">Related</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {statsLoading ? <Spinner className="h-6 w-6 animate-spin mx-auto" /> : stats.wider}
            </div>
            <div className="text-sm text-muted-foreground">Wider/Narrower</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {statsLoading ? <Spinner className="h-6 w-6 animate-spin mx-auto" /> : stats.unmatched}
            </div>
            <div className="text-sm text-muted-foreground">Unmatched</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and Legend */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Filter by Equivalence</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={filterEquivalence} onValueChange={setFilterEquivalence}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="filter">Filter</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                  <div className="text-sm text-muted-foreground">
                    {mappingsLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-3 w-3 animate-spin" />
                        Loading mappings...
                      </div>
                    ) : (
                      `Showing all ${mappings.length} mapping relationships`
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="filter" className="mt-4 space-y-2">
                  {['equivalent', 'relatedto', 'wider', 'unmatched'].map(eq => (
                    <Button
                      key={eq}
                      variant={filterEquivalence === eq ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterEquivalence(eq)}
                      className="w-full justify-start"
                    >
                      {getEquivalenceIcon(eq)}
                      <span className="ml-2 capitalize">{eq.replace('to', ' to')}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {statsLoading ? "..." : (statistics?.equivalence_distribution?.[eq] || 0)}
                      </Badge>
                    </Button>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapping Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Equivalent:</strong> Same clinical meaning</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span><strong>Related:</strong> Clinically related concepts</span>
              </div>
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600" />
                <span><strong>Wider/Narrower:</strong> Broader or more specific</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span><strong>Unmatched:</strong> No suitable mapping</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mapping Details */}
        <div className="lg:col-span-2">
          {selectedMapping ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Mapping Details</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSelectedMapping(null)}>
                    Back to List
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Source Term */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {getSystemIcon(selectedMapping.system)}
                    <Badge className="capitalize">{selectedMapping.system}</Badge>
                    <Badge variant="outline" className="font-mono">{selectedMapping.namasteCode}</Badge>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{selectedMapping.namasteTerm}</h3>
                  <p className="text-lg text-muted-foreground">{selectedMapping.originalTerm}</p>
                </div>

                {/* Mapping Arrow */}
                <div className="flex items-center justify-center gap-3">
                  <ArrowRight className="h-8 w-8 text-muted-foreground" />
                  <Badge className={`${getEquivalenceColor(selectedMapping.equivalence)} px-3 py-1`}>
                    {getEquivalenceIcon(selectedMapping.equivalence)}
                    <span className="ml-2 capitalize">{selectedMapping.equivalence.replace('to', ' to')}</span>
                  </Badge>
                </div>

                {/* Target Term */}
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  {selectedMapping.icd11Code ? (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="font-mono">{selectedMapping.icd11Code}</Badge>
                        <Badge>ICD-11 MMS</Badge>
                      </div>
                      <h3 className="text-xl font-semibold">{selectedMapping.icd11Term}</h3>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <XCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold text-red-600">No ICD-11 Mapping</h3>
                      <p className="text-muted-foreground">This traditional medicine concept has no equivalent in ICD-11</p>
                    </div>
                  )}
                </div>

                {/* Mapping Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mapping Type</label>
                    <p className="capitalize font-medium">{selectedMapping.mappingType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Confidence Score</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${selectedMapping.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{(selectedMapping.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Clinical Notes</label>
                  <p className="mt-1 leading-relaxed">{selectedMapping.clinicalNotes}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Mapping Relationships ({filteredMappings.length})
                </h3>
                {filterEquivalence !== 'all' && (
                  <Button variant="outline" size="sm" onClick={() => setFilterEquivalence('all')}>
                    Show All
                  </Button>
                )}
              </div>

              {mappingsLoading && (
                <div className="flex items-center justify-center p-8">
                  <Spinner className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading mappings...</span>
                </div>
              )}

              {mappingsError && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-800">Backend Status</p>
                  </div>
                  <p className="text-sm text-amber-700">{mappingsError}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Displaying authentic sample mappings from the NAMASTE-ICD11 service
                  </p>
                </div>
              )}

              {!mappingsLoading && !mappingsError && filteredMappings.map((mapping) => (
                <Card 
                  key={mapping.namasteCode}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedMapping(mapping)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getSystemIcon(mapping.system)}
                          <Badge variant="outline" className="font-mono text-xs">{mapping.namasteCode}</Badge>
                          <Badge className={`${getEquivalenceColor(mapping.equivalence)} text-xs`}>
                            {getEquivalenceIcon(mapping.equivalence)}
                            <span className="ml-1">{mapping.equivalence}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                          <div>
                            <h4 className="font-medium">{mapping.namasteTerm}</h4>
                            <p className="text-sm text-muted-foreground">{mapping.originalTerm}</p>
                          </div>
                          
                          <div className="flex justify-center">
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          
                          <div>
                            {mapping.icd11Code ? (
                              <>
                                <h4 className="font-medium">{mapping.icd11Term}</h4>
                                <p className="text-sm text-muted-foreground font-mono">{mapping.icd11Code}</p>
                              </>
                            ) : (
                              <p className="text-sm text-red-600 italic">No mapping available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!mappingsLoading && !mappingsError && filteredMappings.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No mappings found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filter criteria or check back later.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}