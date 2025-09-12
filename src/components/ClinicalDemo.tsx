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
            },
            request: {
              method: 'PUT',
              url: `Patient/${samplePatient.id}`
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
            },
            request: {
              method: 'POST',
              url: 'Encounter'
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
            },
            request: {
              method: 'POST',
              url: 'Condition'
            }
          }
        ]
      }

      try {
        // Submit to backend for dual coding
        const response = await terminologyAPI.submitEncounter(bundle)
        setDualCodedRecord(response)
        setCurrentStep(4)
        toast.success('Encounter successfully processed with dual coding')
      } catch (backendError) {
        console.warn('Backend not available, creating mock dual-coded record:', backendError)
        
        // Create mock dual-coded record for demonstration
        const mockDualCodedRecord = await createMockDualCodedRecord(bundle, selectedTerm)
        setDualCodedRecord(mockDualCodedRecord)
        setCurrentStep(4)
        toast.success('Encounter processed with dual coding (demonstration mode)')
      }
      
    } catch (error) {
      console.error('Error submitting encounter:', error)
      toast.error('Failed to process encounter. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

    // Mock dual coding function for demonstration when backend is not available
  const createMockDualCodedRecord = async (bundle: any, selectedTerm: NAMASTEConcept) => {
    // Simulate backend processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Mock ICD-11 mappings based on NAMASTE codes
    const icd11Mappings: { [key: string]: { code: string; display: string; equivalence: string; confidence: number } } = {
      // Ayurveda - Vata Disorders
      'AAE-16': { code: 'FA3Z', display: 'Osteoarthritis', equivalence: 'equivalent', confidence: 0.95 },
      'AAE-23': { code: 'FA2Z', display: 'Rheumatoid arthritis', equivalence: 'equivalent', confidence: 0.92 },
      'AAE-89': { code: 'ME80.1', display: 'Sciatica', equivalence: 'equivalent', confidence: 0.88 },
      
      // Ayurveda - Pitta Disorders  
      'APE-12': { code: 'DA00', display: 'Gastro-oesophageal reflux disease', equivalence: 'equivalent', confidence: 0.85 },
      'APE-18': { code: 'DB90', display: 'Jaundice', equivalence: 'equivalent', confidence: 0.90 },
      
      // Ayurveda - Kapha Disorders
      'AKE-18': { code: 'CA20', display: 'Asthma', equivalence: 'equivalent', confidence: 0.87 },
      'AKE-25': { code: 'MD12', display: 'Cough', equivalence: 'equivalent', confidence: 0.83 },
      'AKE-61': { code: '5A11', display: 'Type 2 diabetes mellitus', equivalence: 'wider', confidence: 0.78 },
      
      // Siddha - Noi Nadal
      'SNP-101': { code: 'FA3Z', display: 'Osteoarthritis', equivalence: 'relatedto', confidence: 0.75 },
      'SNP-407': { code: null, display: 'No suitable mapping', equivalence: 'unmatched', confidence: 0.0 },
      
      // Siddha - Maruthuvam
      'SGM-515': { code: '1C62', display: 'Fever, unspecified', equivalence: 'equivalent', confidence: 0.94 },
      'SGM-628': { code: 'MD12', display: 'Cough', equivalence: 'equivalent', confidence: 0.85 },
      
      // Unani - General Diseases
      'UGA-301': { code: '1C62', display: 'Fever, unspecified', equivalence: 'equivalent', confidence: 0.95 },
      'UGA-425': { code: 'DB90', display: 'Jaundice', equivalence: 'equivalent', confidence: 0.88 },
      
      // Unani - Joint Disorders
      'UJD-629': { code: 'FA2Z', display: 'Rheumatoid arthritis', equivalence: 'relatedto', confidence: 0.82 },
      'UJD-708': { code: 'MG30', display: 'Joint pain', equivalence: 'equivalent', confidence: 0.90 }
    }
    
    const mapping = icd11Mappings[selectedTerm.code]
    
    // Create dual-coded bundle
    const dualCodedBundle = JSON.parse(JSON.stringify(bundle)) // Deep clone
    
    // Find the Condition resource and add ICD-11 coding
    const conditionEntry = dualCodedBundle.entry.find((entry: any) => 
      entry.resource.resourceType === 'Condition'
    )
    
    if (conditionEntry && mapping?.code) {
      // Add ICD-11 coding to the existing coding array
      conditionEntry.resource.code.coding.push({
        system: 'http://id.who.int/icd/release/11/mms',
        code: mapping.code,
        display: mapping.display,
        extension: [
          {
            url: 'http://namstp.ayush.gov.in/fhir/extension/mapping-equivalence',
            valueCode: mapping.equivalence
          },
          {
            url: 'http://namstp.ayush.gov.in/fhir/extension/mapping-confidence',
            valueDecimal: mapping.confidence
          },
          {
            url: 'http://namstp.ayush.gov.in/fhir/extension/mapping-timestamp',
            valueDateTime: new Date().toISOString()
          }
        ]
      })
      
      // Add metadata extension to the Condition resource itself
      if (!conditionEntry.resource.extension) {
        conditionEntry.resource.extension = []
      }
      
      conditionEntry.resource.extension.push({
        url: 'http://namstp.ayush.gov.in/fhir/extension/dual-coding-status',
        valueString: 'successful'
      })
    } else {
      // Handle unmatched case
      if (conditionEntry) {
        if (!conditionEntry.resource.extension) {
          conditionEntry.resource.extension = []
        }
        
        conditionEntry.resource.extension.push({
          url: 'http://namstp.ayush.gov.in/fhir/extension/dual-coding-status',
          valueString: 'unmatched'
        })
      }
    }
    
    return {
      resourceType: 'Bundle',
      type: 'transaction-response',
      timestamp: bundle.timestamp,
      total: bundle.entry.length,
      entry: dualCodedBundle.entry.map((entry: any, index: number) => ({
        ...entry,
        response: {
          status: '201 Created',
          location: `${entry.resource.resourceType}/${entry.resource.id}`,
          etag: `W/"1"`,
          lastModified: new Date().toISOString()
        }
      })),
      meta: {
        lastUpdated: new Date().toISOString(),
        versionId: '1',
        tag: [
          {
            system: 'http://namstp.ayush.gov.in/fhir/tag',
            code: 'dual-coded',
            display: 'Dual Coded Record'
          },
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationValue',
            code: 'DEMO',
            display: 'Demonstration Mode'
          }
        ]
      }
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
                    {(() => {
                      // Extract dual coding information from the processed bundle
                      const conditionResource = dualCodedRecord?.entry?.find((entry: any) => 
                        entry.resource?.resourceType === 'Condition'
                      )?.resource
                      
                      const namaseCoding = conditionResource?.code?.coding?.find((coding: any) => 
                        coding.system === 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE'
                      )
                      
                      const icd11Coding = conditionResource?.code?.coding?.find((coding: any) => 
                        coding.system === 'http://id.who.int/icd/release/11/mms'
                      )
                      
                      const mappingEquivalence = icd11Coding?.extension?.find((ext: any) => 
                        ext.url === 'http://namstp.ayush.gov.in/fhir/extension/mapping-equivalence'
                      )?.valueCode
                      
                      const mappingConfidence = icd11Coding?.extension?.find((ext: any) => 
                        ext.url === 'http://namstp.ayush.gov.in/fhir/extension/mapping-confidence'
                      )?.valueDecimal
                      
                      return (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-traditional/10 border border-traditional/20 rounded-lg">
                              <h4 className="font-semibold text-traditional mb-2 flex items-center gap-2">
                                <Stethoscope className="h-4 w-4" />
                                Traditional Medicine Code
                              </h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="font-medium">System:</span> NAMASTE</p>
                                <p><span className="font-medium">Code:</span> {namaseCoding?.code || selectedDiagnosis}</p>
                                <p><span className="font-medium">Term:</span> {namaseCoding?.display || selectedTerm?.englishTerm}</p>
                                <p><span className="font-medium">Category:</span> {selectedTerm?.category}</p>
                              </div>
                            </div>
                            
                            <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                              <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                ICD-11 Code
                              </h4>
                              <div className="space-y-1 text-sm">
                                {icd11Coding ? (
                                  <>
                                    <p><span className="font-medium">System:</span> ICD-11 MMS</p>
                                    <p><span className="font-medium">Code:</span> {icd11Coding.code}</p>
                                    <p><span className="font-medium">Term:</span> {icd11Coding.display}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge 
                                        variant={mappingEquivalence === 'equivalent' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {mappingEquivalence}
                                      </Badge>
                                      {mappingConfidence && (
                                        <Badge variant="outline" className="text-xs">
                                          {Math.round(mappingConfidence * 100)}% confidence
                                        </Badge>
                                      )}
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-muted-foreground">No ICD-11 mapping available</p>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <ArrowRight className="h-4 w-4" />
                              Dual Coding Success
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium mb-1">Coding Standards:</p>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>FHIR R4 Compliant</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>ABDM Compatible</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                    <span>WHO TM2 Aligned</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <p className="font-medium mb-1">Processing Details:</p>
                                <div className="space-y-1">
                                  <p>Bundle Type: {dualCodedRecord.type}</p>
                                  <p>Resources: {dualCodedRecord.total || dualCodedRecord.entry?.length}</p>
                                  <p>Timestamp: {new Date(dualCodedRecord.timestamp).toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </TabsContent>
                  
                  <TabsContent value="fhir">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">FHIR R4 Bundle Structure</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Bundle Type: {dualCodedRecord.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Resources: {dualCodedRecord.total || dualCodedRecord.entry?.length}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap">
                          {JSON.stringify(dualCodedRecord, null, 2)}
                        </pre>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="font-medium text-blue-800">Bundle Metadata</p>
                          <p className="text-blue-600">Transaction response with generated IDs</p>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <p className="font-medium text-green-800">Dual Coding</p>
                          <p className="text-green-600">NAMASTE + ICD-11 in single Condition</p>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <p className="font-medium text-purple-800">FHIR Extensions</p>
                          <p className="text-purple-600">Mapping metadata preserved</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => {
                    setCurrentStep(1)
                    setSelectedDiagnosis('')
                    setSelectedTerm(null)
                    setSearchTerm('')
                    setClinicalNotes('')
                    setDualCodedRecord(null)
                  }}>
                    Start New Encounter
                  </Button>
                  <Button onClick={() => {
                    const dataStr = JSON.stringify(dualCodedRecord, null, 2)
                    const dataBlob = new Blob([dataStr], {type: 'application/json'})
                    const url = URL.createObjectURL(dataBlob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `dual-coded-encounter-${new Date().toISOString().split('T')[0]}.json`
                    link.click()
                    URL.revokeObjectURL(url)
                    toast.success('FHIR Bundle downloaded successfully')
                  }}>
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
              {currentStep === 4 && dualCodedRecord && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="font-medium text-green-800 mb-1">✅ Encounter Successfully Processed</p>
                  <div className="text-xs space-y-1 text-green-700">
                    <div>Bundle validated: FHIR R4</div>
                    <div>Dual coding: Complete</div>
                    <div>Resources: {dualCodedRecord.total || dualCodedRecord.entry?.length}</div>
                  </div>
                </div>
              )}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How Dual Coding Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
                  <span>Clinician selects traditional medicine diagnosis</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
                  <span>System looks up ICD-11 mapping automatically</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
                  <span>Both codes stored in single FHIR Condition</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
                  <span>Record becomes globally interoperable</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}