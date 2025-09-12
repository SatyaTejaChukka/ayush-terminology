import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MagnifyingGlass, Leaf, Globe, BookOpen, Spinner } from '@phosphor-icons/react'
import { useTerminologySearch, useStatistics, type NAMASTEConcept } from '@/services/terminologyAPI'

export default function TerminologyExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSystem, setSelectedSystem] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState<NAMASTEConcept | null>(null)
  const [allTerminologies, setAllTerminologies] = useState<NAMASTEConcept[]>([])

  // Use the real API for search
  const { results: searchResults, loading: searchLoading, error: searchError } = useTerminologySearch(
    searchTerm, 
    selectedSystem === 'all' ? undefined : selectedSystem
  )

  // Get statistics for counts
  const { statistics, loading: statsLoading } = useStatistics()

  // Effect to load initial data when no search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Load some initial terms for display
      const loadInitialTerms = async () => {
        try {
          const { terminologyAPI } = await import('@/services/terminologyAPI')
          const initialTerms = await terminologyAPI.searchTerminology('', selectedSystem === 'all' ? undefined : selectedSystem, 20)
          setAllTerminologies(initialTerms)
        } catch (error) {
          console.error('Failed to load initial terms:', error)
        }
      }
      loadInitialTerms()
    }
  }, [selectedSystem])

  // Use search results if searching, otherwise use all terminologies
  const terminologies = searchTerm.trim() ? searchResults : allTerminologies

  const filteredTerminologies = terminologies.filter(term => {
    const matchesSystem = selectedSystem === 'all' || term.system === selectedSystem
    return matchesSystem
  })

  const getSystemIcon = (system: string) => {
    switch (system) {
      case 'ayurveda':
        return <Leaf className="h-4 w-4" />
      case 'siddha':
        return <Globe className="h-4 w-4" />
      case 'unani':
        return <BookOpen className="h-4 w-4" />
      default:
        return <MagnifyingGlass className="h-4 w-4" />
    }
  }

  const getSystemColor = (system: string) => {
    switch (system) {
      case 'ayurveda':
        return 'bg-traditional'
      case 'siddha':
        return 'bg-accent'
      case 'unani':
        return 'bg-secondary'
      default:
        return 'bg-muted'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Search and Filter Panel */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MagnifyingGlass className="h-5 w-5" />
              Search Terminologies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                placeholder="Search by code, term, or definition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Tabs value={selectedSystem} onValueChange={setSelectedSystem}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="all">All Systems</TabsTrigger>
                <TabsTrigger value="ayurveda">Filter</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="w-full justify-start">
                    {statsLoading ? (
                      <div className="flex items-center gap-2">
                        <Spinner className="h-3 w-3 animate-spin" />
                        Loading...
                      </div>
                    ) : (
                      `${statistics?.total_terms || 0} Total Terms`
                    )}
                  </Badge>
                </div>
              </TabsContent>
              <TabsContent value="ayurveda" className="mt-4">
                <div className="space-y-2">
                  {['ayurveda', 'siddha', 'unani'].map(system => (
                    <Button
                      key={system}
                      variant={selectedSystem === system ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedSystem(system)}
                      className="w-full justify-start"
                    >
                      {getSystemIcon(system)}
                      <span className="ml-2 capitalize">{system}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {statsLoading ? "..." : (statistics?.system_distribution?.[system] || 0)}
                      </Badge>
                    </Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ayurveda Terms</span>
                <Badge className={getSystemColor('ayurveda')}>
                  {statsLoading ? "..." : (statistics?.system_distribution?.ayurveda || 0)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Siddha Terms</span>
                <Badge className={getSystemColor('siddha')}>
                  {statsLoading ? "..." : (statistics?.system_distribution?.siddha || 0)}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unani Terms</span>
                <Badge className={getSystemColor('unani')}>
                  {statsLoading ? "..." : (statistics?.system_distribution?.unani || 0)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-2 space-y-4">
        {selectedTerm ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Term Details</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setSelectedTerm(null)}>
                  Back to Results
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NAMASTE Code</label>
                  <p className="text-lg font-mono">{selectedTerm.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">System</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getSystemIcon(selectedTerm.system)}
                    <span className="capitalize font-medium">{selectedTerm.system}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Original Term</label>
                <p className="text-2xl font-medium mt-1">{selectedTerm.originalTerm}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">English Translation</label>
                <p className="text-xl mt-1">{selectedTerm.englishTerm}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Clinical Definition</label>
                <p className="mt-1 leading-relaxed">{selectedTerm.definition}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <Badge variant="outline" className="mt-1">
                  {selectedTerm.category}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Search Results ({filteredTerminologies.length})
              </h3>
              {searchTerm && (
                <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {(searchLoading || statsLoading) && (
                <div className="flex items-center justify-center p-8">
                  <Spinner className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-muted-foreground">Loading...</span>
                </div>
              )}

              {searchError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{searchError}</p>
                </div>
              )}

              {!searchLoading && !searchError && filteredTerminologies.map((term) => (
                <Card 
                  key={term.code}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTerm(term)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {term.code}
                          </Badge>
                          <Badge className={`${getSystemColor(term.system)} text-xs`}>
                            {getSystemIcon(term.system)}
                            <span className="ml-1 capitalize">{term.system}</span>
                          </Badge>
                        </div>
                        <h4 className="font-medium text-lg truncate">{term.englishTerm}</h4>
                        <p className="text-muted-foreground text-sm mb-2">{term.originalTerm}</p>
                        <p className="text-sm line-clamp-2">{term.definition}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {!searchLoading && !searchError && filteredTerminologies.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MagnifyingGlass className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-medium mb-2">No terms found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your search criteria or browse all systems.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}