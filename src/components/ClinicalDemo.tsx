import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  UserCircle, 
  CalendarDots, 
  MagnifyingGlass, 
  CheckCircle, 
  ArrowRight, 
  Download,
  Stethoscope,
  Globe,
  FileText,
  Spinner
} from '@phosphor-icons/react'
import { useTerminologySearch, terminologyAPI, type NAMASTEConcept } from '@/services/terminologyAPI'
import { toast } from 'sonner'

// Sample patient and clinical data
const samplePatient = {
  id: 'ABHA-123456789',
  name: 'Rajesh Kumar',
  age: 45,
  gender: 'Male',
  contact: '+91-9876543210'
}

const sampleTerminologies = [
  { code: 'AAE-16', term: 'Sandhigatavata', system: 'ayurveda', definition: 'Osteoarthritis' },
  { code: 'AST-23', term: 'Amlapitta', system: 'ayurveda', definition: 'Hyperacidity' },
  { code: 'SUC-45', term: 'Vatha Soolai', system: 'siddha', definition: 'Rheumatoid arthritis' },
  { code: 'UNI-12', term: 'Waja al-Mafasil', system: 'unani', definition: 'Joint pain syndrome' },
  { code: 'AYU-78', term: 'Kasa', system: 'ayurveda', definition: 'Cough' }
]

export default function ClinicalDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<NAMASTEConcept | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [clinicalNotes, setClinicalNotes] = useState('')
  const [dualCodedRecord, setDualCodedRecord] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use real API for terminology search
  const { results: searchResults, loading: searchLoading } = useTerminologySearch(searchTerm)

  const filteredTerminologies = searchTerm.trim() ? searchResults : []

  const handleDiagnosisSelect = (diagnosis: NAMASTEConcept) => {
    setSelectedDiagnosis(diagnosis.code)
    setSelectedTerm(diagnosis)
    setSearchTerm(diagnosis.englishTerm)
  }

  const handleSubmitEncounter = async () => {
    if (!selectedTerm) return
    
    setIsSubmitting(true)
    
    try {
      // Create FHIR Bundle
      const bundle = {
        resourceType: 'Bundle' as const,
        type: 'transaction' as const,
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: samplePatient.id,
              name: [{ text: samplePatient.name }],
              gender: samplePatient.gender.toLowerCase(),
              birthDate: '1979-03-15'
            }
          },
          {
            resource: {
              resourceType: 'Encounter',
              id: `encounter-${Date.now()}`,
              status: 'finished',
              class: { code: 'AMB', display: 'ambulatory' },
              subject: { reference: `Patient/${samplePatient.id}` },
              period: {
                start: new Date().toISOString(),
                end: new Date().toISOString()
              }
            }
          },
          {
            resource: {
              resourceType: 'Condition',
              id: `condition-${Date.now()}`,
              subject: { reference: `Patient/${samplePatient.id}` },
              code: {
                coding: [
                  {
                    system: 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE',
                    code: selectedTerm.code,
                    display: selectedTerm.englishTerm
                  }
                ]
              },
              clinicalStatus: {
                coding: [{
                  system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active'
                }]
              },
              note: clinicalNotes ? [{ text: clinicalNotes }] : []
            }
          }
        ]
      }

      // Submit to backend for dual coding
      const response = await terminologyAPI.submitEncounter(bundle)
      setDualCodedRecord({ ...bundle, response })
      setCurrentStep(4)
      toast.success('Encounter successfully processed with dual coding')
      
    } catch (error) {
      console.error('Error submitting encounter:', error)
      toast.error('Failed to process encounter. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const steps = [
    { number: 1, title: 'Patient Info', description: 'Review patient details' },
    { number: 2, title: 'Diagnosis', description: 'Select traditional medicine diagnosis' },
    { number: 3, title: 'Clinical Notes', description: 'Add encounter details' },
    { number: 4, title: 'Dual Coding', description: 'View final coded record' }
  ]

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold ${
                  currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-background text-muted-foreground border-muted'
                }`}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-16 lg:w-24 mx-2 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="font-medium text-sm">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Patient Information
                </CardTitle>
                <CardDescription>
                  Review patient details before proceeding with diagnosis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>ABHA ID</Label>
                    <Input value={samplePatient.id} disabled />
                  </div>
                  <div>
                    <Label>Patient Name</Label>
                    <Input value={samplePatient.name} disabled />
                  </div>
                  <div>
                    <Label>Age</Label>
                    <Input value={`${samplePatient.age} years`} disabled />
                  </div>
                  <div>
                    <Label>Gender</Label>
                    <Input value={samplePatient.gender} disabled />
                  </div>
                  <div>
                    <Label>Contact</Label>
                    <Input value={samplePatient.contact} disabled />
                  </div>
                  <div>
                    <Label>Visit Date</Label>
                    <Input value={new Date().toLocaleDateString()} disabled />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button onClick={() => setCurrentStep(2)}>
                    Continue to Diagnosis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Traditional Medicine Diagnosis
                </CardTitle>
                <CardDescription>
                  Search and select the appropriate NAMASTE diagnostic code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Search Diagnosis</Label>
                  <div className="relative">
                    <MagnifyingGlass className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by term, code, or definition..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchLoading && searchTerm.trim() && (
                    <div className="flex items-center justify-center p-4">
                      <Spinner className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-muted-foreground">Searching...</span>
                    </div>
                  )}

                  {!searchLoading && searchTerm.trim() && filteredTerminologies.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      No matching terminologies found. Try a different search term.
                    </div>
                  )}

                  {filteredTerminologies.map((term) => (
                    <div 
                      key={term.code}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDiagnosis === term.code 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted hover:border-muted-foreground'
                      }`}
                      onClick={() => handleDiagnosisSelect(term)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">{term.code}</Badge>
                            <Badge className="capitalize">{term.system}</Badge>
                          </div>
                          <h4 className="font-medium mt-1">{term.englishTerm}</h4>
                          <p className="text-sm text-muted-foreground">{term.definition}</p>
                        </div>
                        {selectedDiagnosis === term.code && (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Back
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep(3)} 
                    disabled={!selectedDiagnosis}
                  >
                    Continue to Notes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Clinical Notes
                </CardTitle>
                <CardDescription>
                  Add additional clinical observations and treatment notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Selected Diagnosis</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {selectedTerm ? (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-xs">{selectedTerm.code}</Badge>
                          <Badge className="capitalize">{selectedTerm.system}</Badge>
                        </div>
                        <h4 className="font-medium">{selectedTerm.englishTerm}</h4>
                        <p className="text-sm text-muted-foreground">{selectedTerm.definition}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No diagnosis selected</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Clinical Notes</Label>
                  <Textarea
                    placeholder="Enter clinical observations, symptoms, treatment plan, and any additional notes..."
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmitEncounter}
                    disabled={!selectedTerm || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Generate Dual-Coded Record
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && dualCodedRecord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Dual-Coded FHIR Record
                </CardTitle>
                <CardDescription>
                  Complete clinical record with both NAMASTE and ICD-11 codes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summary">Summary View</TabsTrigger>
                    <TabsTrigger value="fhir">FHIR JSON</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-traditional/10 border border-traditional/20 rounded-lg">
                        <h4 className="font-semibold text-traditional mb-2">Traditional Medicine Code</h4>
                        <div className="space-y-1">
                          <p><span className="font-medium">System:</span> NAMASTE</p>
                          <p><span className="font-medium">Code:</span> {selectedDiagnosis}</p>
                          <p><span className="font-medium">Term:</span> {selectedTerm?.englishTerm}</p>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">ICD-11 Code</h4>
                        <div className="space-y-1">
                          {(() => {
                            const mappings: { [key: string]: { icd11Code: string; icd11Term: string } } = {
                              'AAE-16': { icd11Code: 'FA20', icd11Term: 'Osteoarthritis' },
                              'AST-23': { icd11Code: 'DA60', icd11Term: 'Gastro-oesophageal reflux disease' },
                              'SUC-45': { icd11Code: 'FA20.0&XK8G', icd11Term: 'Rheumatoid arthritis of multiple sites' },
                              'UNI-12': { icd11Code: 'MG30', icd11Term: 'Joint pain' },
                              'AYU-78': { icd11Code: 'MD12', icd11Term: 'Cough' }
                            }
                            const mapping = mappings[selectedDiagnosis]
                            return mapping ? (
                              <>
                                <p><span className="font-medium">System:</span> ICD-11 MMS</p>
                                <p><span className="font-medium">Code:</span> {mapping.icd11Code}</p>
                                <p><span className="font-medium">Term:</span> {mapping.icd11Term}</p>
                              </>
                            ) : <p>No mapping available</p>
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-semibold mb-2">Record Summary</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Patient:</span> {samplePatient.name} ({samplePatient.id})</p>
                        <p><span className="font-medium">Encounter Date:</span> {new Date().toLocaleDateString()}</p>
                        <p><span className="font-medium">Resource Type:</span> FHIR R4 Bundle</p>
                        <p><span className="font-medium">Resources:</span> Patient, Encounter, Condition</p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="fhir">
                    <div className="bg-muted p-4 rounded-lg">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(dualCodedRecord, null, 2)}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep(1)}>
                    Start New Encounter
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Download FHIR Bundle
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demo Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>ABHA-authenticated patient lookup</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Real-time NAMASTE terminology search</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Automatic ICD-11 mapping</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>FHIR R4 compliant output</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Dual coding validation</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integration Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Authentication:</span> ABDM/ABHA OAuth 2.0
              </div>
              <div>
                <span className="font-medium">Terminology:</span> NAMASTE Portal API
              </div>
              <div>
                <span className="font-medium">Standards:</span> FHIR R4, ICD-11 TM2
              </div>
              <div>
                <span className="font-medium">Data Exchange:</span> NRCeS Profiles
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}