import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { MagnifyingGlass, ArrowRight, Info } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface NAMASTETerm {
  code: string
  display: string
  definition: string
  system: 'ayurveda' | 'siddha' | 'unani'
  originalTerm: string
  originalLanguage: string
  category?: string
}

const sampleTerms: NAMASTETerm[] = [
  {
    code: 'AAE-16',
    display: 'Sandhigatavata',
    definition: 'A Vata disorder affecting joints, characterized by pain, stiffness, and inflammation similar to osteoarthritis',
    system: 'ayurveda',
    originalTerm: 'सन्धिगतवात',
    originalLanguage: 'sa',
    category: 'Vata Disorders'
  },
  {
    code: 'AAE-23',
    display: 'Amavata',
    definition: 'Rheumatoid arthritis-like condition caused by accumulation of Ama (toxins) in joints',
    system: 'ayurveda',
    originalTerm: 'आमवात',
    originalLanguage: 'sa',
    category: 'Ama Disorders'
  },
  {
    code: 'ASE-42',
    display: 'Pittajanya Jwara',
    definition: 'Fever arising from Pitta dosha imbalance, typically with burning sensation',
    system: 'ayurveda',
    originalTerm: 'पित्तजन्य ज्वर',
    originalLanguage: 'sa',
    category: 'Pitta Disorders'
  },
  {
    code: 'SSE-15',
    display: 'Keel Vayu',
    definition: 'Joint disorder in Siddha medicine characterized by swelling and pain',
    system: 'siddha',
    originalTerm: 'கீல் வாயு',
    originalLanguage: 'ta',
    category: 'Noi Nadal'
  },
  {
    code: 'SSE-28',
    display: 'Suram',
    definition: 'Fever condition in Siddha medicine with various etiological factors',
    system: 'siddha',
    originalTerm: 'சுரம்',
    originalLanguage: 'ta',
    category: 'Maruthuvam'
  },
  {
    code: 'USE-11',
    display: 'Waja ul Mafasil',
    definition: 'Joint pain condition in Unani medicine, similar to arthritis',
    system: 'unani',
    originalTerm: 'وجع المفاصل',
    originalLanguage: 'ar',
    category: 'Amraz-e-Mafasil'
  },
  {
    code: 'USE-33',
    display: 'Hummah',
    definition: 'Fever in Unani medicine caused by imbalance of humours',
    system: 'unani',
    originalTerm: 'حمہ',
    originalLanguage: 'ar',
    category: 'Amraz-e-Hararat'
  }
]

export default function TerminologyExplorer() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSystem, setSelectedSystem] = useState<'all' | 'ayurveda' | 'siddha' | 'unani'>('all')
  const [selectedTerm, setSelectedTerm] = useState<NAMASTETerm | null>(null)
  const [recentSearches, setRecentSearches] = useKV<string[]>('recent-searches', [])

  const filteredTerms = useMemo(() => {
    let terms = sampleTerms

    if (selectedSystem !== 'all') {
      terms = terms.filter(term => term.system === selectedSystem)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      terms = terms.filter(term => 
        term.display.toLowerCase().includes(search) ||
        term.definition.toLowerCase().includes(search) ||
        term.code.toLowerCase().includes(search) ||
        term.originalTerm.includes(searchTerm)
      )
    }

    return terms
  }, [searchTerm, selectedSystem])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    if (value && !recentSearches.includes(value)) {
      setRecentSearches(prev => [value, ...prev.slice(0, 4)])
    }
  }

  const systemStats = {
    ayurveda: sampleTerms.filter(t => t.system === 'ayurveda').length,
    siddha: sampleTerms.filter(t => t.system === 'siddha').length,
    unani: sampleTerms.filter(t => t.system === 'unani').length
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlass className="h-5 w-5" />
            Search NAMASTE Terminologies
          </CardTitle>
          <CardDescription>
            Search across {sampleTerms.length} diagnostic terms from traditional medicine systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by term name, code, or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {recentSearches.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setSearchTerm(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Filter */}
      <Tabs value={selectedSystem} onValueChange={(value) => setSelectedSystem(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Systems ({sampleTerms.length})</TabsTrigger>
          <TabsTrigger value="ayurveda">Ayurveda ({systemStats.ayurveda})</TabsTrigger>
          <TabsTrigger value="siddha">Siddha ({systemStats.siddha})</TabsTrigger>
          <TabsTrigger value="unani">Unani ({systemStats.unani})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedSystem} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTerms.map((term) => (
              <Card key={term.code} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{term.display}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {term.code}
                        </Badge>
                        <Badge 
                          variant={term.system === 'ayurveda' ? 'default' : 
                                  term.system === 'siddha' ? 'secondary' : 'outline'}
                          className="text-xs capitalize"
                        >
                          {term.system}
                        </Badge>
                      </div>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTerm(term)}>
                          <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {term.display}
                            <Badge variant="outline">{term.code}</Badge>
                          </DialogTitle>
                          <DialogDescription>
                            Traditional medicine diagnostic term from {term.system}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Original Term</h4>
                            <p className="text-2xl mb-1">{term.originalTerm}</p>
                            <p className="text-sm text-muted-foreground">
                              Language: {term.originalLanguage === 'sa' ? 'Sanskrit' : 
                                        term.originalLanguage === 'ta' ? 'Tamil' : 'Arabic/Urdu'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Clinical Definition</h4>
                            <p className="text-sm leading-relaxed">{term.definition}</p>
                          </div>
                          {term.category && (
                            <div>
                              <h4 className="font-medium mb-2">Category</h4>
                              <Badge variant="secondary">{term.category}</Badge>
                            </div>
                          )}
                          <div className="pt-4 border-t">
                            <Button className="w-full" onClick={() => {
                              // This would trigger the mapping view
                              console.log('View mappings for:', term.code)
                            }}>
                              <ArrowRight className="h-4 w-4 mr-2" />
                              View ICD-11 Mappings
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {term.definition}
                  </p>
                  {term.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {term.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTerms.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <MagnifyingGlass className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No terms found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or selecting a different system
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}