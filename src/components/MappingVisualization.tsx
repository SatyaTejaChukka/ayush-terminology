import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight, CheckCircle, ExclamationTriangle, Info, Globe } from '@phosphor-icons/react'

interface TermMapping {
  namasteCode: string
  namasteDisplay: string
  namasteSystem: 'ayurveda' | 'siddha' | 'unani'
  icd11Code: string
  icd11Display: string
  equivalence: 'equivalent' | 'wider' | 'narrower' | 'relatedto' | 'unmatched'
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

const sampleMappings: TermMapping[] = [
  {
    namasteCode: 'AAE-16',
    namasteDisplay: 'Sandhigatavata',
    namasteSystem: 'ayurveda',
    icd11Code: 'FA20',
    icd11Display: 'Osteoarthritis',
    equivalence: 'equivalent',
    confidence: 'high',
    notes: 'Direct conceptual match - both describe degenerative joint disease'
  },
  {
    namasteCode: 'AAE-23',
    namasteDisplay: 'Amavata',
    namasteSystem: 'ayurveda',
    icd11Code: 'FA20.0',
    icd11Display: 'Rheumatoid arthritis',
    equivalence: 'equivalent',
    confidence: 'high',
    notes: 'Strong clinical correlation with autoimmune joint inflammation'
  },
  {
    namasteCode: 'ASE-42',
    namasteDisplay: 'Pittajanya Jwara',
    namasteSystem: 'ayurveda',
    icd11Code: 'MG26',
    icd11Display: 'Fever, unspecified',
    equivalence: 'wider',
    confidence: 'medium',
    notes: 'NAMASTE term is more specific about etiology (Pitta imbalance)'
  },
  {
    namasteCode: 'SSE-15',
    namasteDisplay: 'Keel Vayu',
    namasteSystem: 'siddha',
    icd11Code: 'FA20&XK9L',
    icd11Display: 'Osteoarthritis with joint effusion',
    equivalence: 'narrower',
    confidence: 'medium',
    notes: 'ICD-11 cluster provides additional specificity for joint fluid involvement'
  },
  {
    namasteCode: 'USE-11',
    namasteDisplay: 'Waja ul Mafasil',
    namasteSystem: 'unani',
    icd11Code: 'FA20',
    icd11Display: 'Osteoarthritis',
    equivalence: 'relatedto',
    confidence: 'medium',
    notes: 'General joint pain concept with multiple possible underlying conditions'
  }
]

export default function MappingVisualization() {
  const [selectedMapping, setSelectedMapping] = useState<TermMapping>(sampleMappings[0])
  const [filterSystem, setFilterSystem] = useState<'all' | 'ayurveda' | 'siddha' | 'unani'>('all')
  const [filterEquivalence, setFilterEquivalence] = useState<'all' | 'equivalent' | 'wider' | 'narrower' | 'relatedto' | 'unmatched'>('all')

  const filteredMappings = sampleMappings.filter(mapping => {
    if (filterSystem !== 'all' && mapping.namasteSystem !== filterSystem) return false
    if (filterEquivalence !== 'all' && mapping.equivalence !== filterEquivalence) return false
    return true
  })

  const getEquivalenceBadge = (equivalence: string) => {
    const variants = {
      equivalent: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      wider: { variant: 'secondary' as const, icon: ArrowRight, color: 'text-blue-600' },
      narrower: { variant: 'secondary' as const, icon: ArrowRight, color: 'text-blue-600' },
      relatedto: { variant: 'outline' as const, icon: Info, color: 'text-yellow-600' },
      unmatched: { variant: 'destructive' as const, icon: ExclamationTriangle, color: 'text-red-600' }
    }
    
    const config = variants[equivalence as keyof typeof variants]
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {equivalence}
      </Badge>
    )
  }

  const getEquivalenceDescription = (equivalence: string) => {
    const descriptions = {
      equivalent: 'The traditional medicine term and ICD-11 code represent the same clinical concept',
      wider: 'The traditional medicine term covers a broader concept than the specific ICD-11 code',
      narrower: 'The traditional medicine term is more specific than the broader ICD-11 code',
      relatedto: 'The terms are clinically related but not directly equivalent',
      unmatched: 'No suitable equivalent found in ICD-11 classification'
    }
    return descriptions[equivalence as keyof typeof descriptions]
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Mapping Filters</CardTitle>
          <CardDescription>
            Filter mappings by traditional medicine system and equivalence type
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Medicine System</label>
            <Select value={filterSystem} onValueChange={(value) => setFilterSystem(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Systems</SelectItem>
                <SelectItem value="ayurveda">Ayurveda</SelectItem>
                <SelectItem value="siddha">Siddha</SelectItem>
                <SelectItem value="unani">Unani</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Equivalence Type</label>
            <Select value={filterEquivalence} onValueChange={(value) => setFilterEquivalence(value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="equivalent">Equivalent</SelectItem>
                <SelectItem value="wider">Wider</SelectItem>
                <SelectItem value="narrower">Narrower</SelectItem>
                <SelectItem value="relatedto">Related To</SelectItem>
                <SelectItem value="unmatched">Unmatched</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mapping List */}
        <Card>
          <CardHeader>
            <CardTitle>Terminology Mappings</CardTitle>
            <CardDescription>
              {filteredMappings.length} mappings found
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredMappings.map((mapping) => (
              <Card 
                key={mapping.namasteCode}
                className={`cursor-pointer transition-all ${
                  selectedMapping.namasteCode === mapping.namasteCode 
                    ? 'ring-2 ring-primary shadow-md' 
                    : 'hover:shadow-sm'
                }`}
                onClick={() => setSelectedMapping(mapping)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{mapping.namasteDisplay}</h4>
                        <p className="text-sm text-muted-foreground">{mapping.namasteCode}</p>
                      </div>
                      <Badge 
                        variant={mapping.namasteSystem === 'ayurveda' ? 'default' : 
                                mapping.namasteSystem === 'siddha' ? 'secondary' : 'outline'}
                        className="text-xs capitalize"
                      >
                        {mapping.namasteSystem}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {mapping.icd11Display}
                          </h4>
                          <p className="text-sm text-muted-foreground">{mapping.icd11Code}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {getEquivalenceBadge(mapping.equivalence)}
                        <Badge variant="outline" className="text-xs">
                          {mapping.confidence} confidence
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Detailed Mapping View */}
        <Card>
          <CardHeader>
            <CardTitle>Mapping Details</CardTitle>
            <CardDescription>
              Detailed analysis of the selected terminology mapping
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* NAMASTE Term */}
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Traditional Medicine Term</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{selectedMapping.namasteDisplay}</h4>
                      <Badge 
                        variant={selectedMapping.namasteSystem === 'ayurveda' ? 'default' : 
                                selectedMapping.namasteSystem === 'siddha' ? 'secondary' : 'outline'}
                        className="capitalize"
                      >
                        {selectedMapping.namasteSystem}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Code: {selectedMapping.namasteCode}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ICD-11 Term */}
            <div className="space-y-3">
              <h3 className="font-semibold text-accent">ICD-11 International Standard</h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        {selectedMapping.icd11Display}
                      </h4>
                    </div>
                    <p className="text-sm text-muted-foreground">Code: {selectedMapping.icd11Code}</p>
                    {selectedMapping.icd11Code.includes('&') && (
                      <Badge variant="outline" className="text-xs">
                        Post-coordinated (clustered) code
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Equivalence Analysis */}
            <div className="space-y-3">
              <h3 className="font-semibold">Equivalence Analysis</h3>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Relationship:</span>
                      {getEquivalenceBadge(selectedMapping.equivalence)}
                    </div>
                    <p className="text-sm">
                      {getEquivalenceDescription(selectedMapping.equivalence)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Confidence:</span>
                      <Badge variant="outline">{selectedMapping.confidence}</Badge>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            </div>

            {/* Clinical Notes */}
            {selectedMapping.notes && (
              <div className="space-y-3">
                <h3 className="font-semibold">Clinical Notes</h3>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{selectedMapping.notes}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* FHIR ConceptMap Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold">FHIR ConceptMap Structure</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "resourceType": "ConceptMap",
  "source": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
  "target": "http://id.who.int/icd/release/11/mms",
  "group": [{
    "source": "${selectedMapping.namasteCode}",
    "target": [{
      "code": "${selectedMapping.icd11Code}",
      "equivalence": "${selectedMapping.equivalence}"
    }]
  }]
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}