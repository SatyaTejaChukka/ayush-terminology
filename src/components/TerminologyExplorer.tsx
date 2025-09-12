import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MagnifyingGlass, Leaf, Globe, BookOpen } from '@phosphor-icons/react'

// Sample NAMASTE terminology data
const sampleTerminologies = [
  {
    code: 'AAE-16',
    system: 'ayurveda',
    originalTerm: 'सन्धिगतवात',
    englishTerm: 'Sandhigatavata',
    definition: 'Osteoarthritis - degenerative joint disease characterized by Vata dosha imbalance',
    category: 'Musculoskeletal Disorders'
  },
  {
    code: 'AST-23',
    system: 'ayurveda', 
    originalTerm: 'अम्लपित्त',
    englishTerm: 'Amlapitta',
    definition: 'Hyperacidity - excess acid production due to Pitta dosha aggravation',
    category: 'Digestive Disorders'
  },
  {
    code: 'SUC-45',
    system: 'siddha',
    originalTerm: 'வாத சூலை',
    englishTerm: 'Vatha Soolai',
    definition: 'Rheumatoid arthritis - inflammatory joint condition',
    category: 'Noi Nadal (Pathology)'
  },
  {
    code: 'UNI-12',
    system: 'unani',
    originalTerm: 'وجع المفاصل',
    englishTerm: 'Waja al-Mafasil',
    definition: 'Joint pain syndrome - musculoskeletal disorder in Unani medicine',
    category: 'Musculoskeletal'
  },
  {
    code: 'AYU-78',
    system: 'ayurveda',
    originalTerm: 'कास',
    englishTerm: 'Kasa',
    definition: 'Cough - respiratory disorder with various etiologies',
    category: 'Respiratory Disorders'
  },
  {
    code: 'SID-89',
    system: 'siddha',
    originalTerm: 'கபக் கோட்டம்',
    englishTerm: 'Kabak Kottam',
    definition: 'Bronchial asthma - chronic respiratory condition',
    category: 'Maruthuvam (General Medicine)'
  }
]

export default function TerminologyExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSystem, setSelectedSystem] = useState('all')
  const [selectedTerm, setSelectedTerm] = useState<typeof sampleTerminologies[0] | null>(null)

  const filteredTerminologies = sampleTerminologies.filter(term => {
    const matchesSearch = searchTerm === '' || 
      term.englishTerm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.originalTerm.includes(searchTerm) ||
      term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.code.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesSystem = selectedSystem === 'all' || term.system === selectedSystem
    
    return matchesSearch && matchesSystem
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
                    {sampleTerminologies.length} Total Terms
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
                        {sampleTerminologies.filter(t => t.system === system).length}
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
                  {sampleTerminologies.filter(t => t.system === 'ayurveda').length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Siddha Terms</span>
                <Badge className={getSystemColor('siddha')}>
                  {sampleTerminologies.filter(t => t.system === 'siddha').length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Unani Terms</span>
                <Badge className={getSystemColor('unani')}>
                  {sampleTerminologies.filter(t => t.system === 'unani').length}
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
              {filteredTerminologies.map((term) => (
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

              {filteredTerminologies.length === 0 && (
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