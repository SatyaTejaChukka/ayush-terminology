import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, User, Calendar, Stethoscope, ArrowRight, FileText, Globe } from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface ClinicalEncounter {
  patientId: string
  patientName: string
  encounterDate: string
  chiefComplaint: string
  symptoms: string[]
  selectedSystem: 'ayurveda' | 'siddha' | 'unani'
  namasteCode: string
  namasteDisplay: string
  icd11Code: string
  icd11Display: string
  practitionerNotes: string
}

const symptomSuggestions = [
  'Joint pain and stiffness',
  'Morning stiffness',
  'Swelling in joints',
  'Reduced range of motion',
  'Fever with burning sensation',
  'Fatigue and weakness',
  'Digestive issues',
  'Sleep disturbances'
]

const namasteOptions = {
  ayurveda: [
    { code: 'AAE-16', display: 'Sandhigatavata', icd11: { code: 'FA20', display: 'Osteoarthritis' }},
    { code: 'AAE-23', display: 'Amavata', icd11: { code: 'FA20.0', display: 'Rheumatoid arthritis' }},
    { code: 'ASE-42', display: 'Pittajanya Jwara', icd11: { code: 'MG26', display: 'Fever, unspecified' }}
  ],
  siddha: [
    { code: 'SSE-15', display: 'Keel Vayu', icd11: { code: 'FA20&XK9L', display: 'Osteoarthritis with joint effusion' }},
    { code: 'SSE-28', display: 'Suram', icd11: { code: 'MG26', display: 'Fever, unspecified' }}
  ],
  unani: [
    { code: 'USE-11', display: 'Waja ul Mafasil', icd11: { code: 'FA20', display: 'Osteoarthritis' }},
    { code: 'USE-33', display: 'Hummah', icd11: { code: 'MG26', display: 'Fever, unspecified' }}
  ]
}

export default function ClinicalDemo() {
  const [currentStep, setCurrentStep] = useState(1)
  const [encounter, setEncounter] = useState<Partial<ClinicalEncounter>>({
    encounterDate: new Date().toISOString().split('T')[0]
  })
  const [completedEncounters, setCompletedEncounters] = useKV<ClinicalEncounter[]>('demo-encounters', [])

  const steps = [
    { number: 1, title: 'Patient Information', icon: User },
    { number: 2, title: 'Clinical Assessment', icon: Stethoscope },
    { number: 3, title: 'Traditional Diagnosis', icon: FileText },
    { number: 4, title: 'Dual-Coded Record', icon: CheckCircle }
  ]

  const handleSymptomToggle = (symptom: string) => {
    setEncounter(prev => ({
      ...prev,
      symptoms: prev.symptoms?.includes(symptom) 
        ? prev.symptoms.filter(s => s !== symptom)
        : [...(prev.symptoms || []), symptom]
    }))
  }

  const handleDiagnosisSelect = (code: string) => {
    const system = encounter.selectedSystem!
    const diagnosis = namasteOptions[system].find(d => d.code === code)
    if (diagnosis) {
      setEncounter(prev => ({
        ...prev,
        namasteCode: diagnosis.code,
        namasteDisplay: diagnosis.display,
        icd11Code: diagnosis.icd11.code,
        icd11Display: diagnosis.icd11.display
      }))
    }
  }

  const completeEncounter = () => {
    if (encounter.patientId && encounter.namasteCode) {
      const newEncounter: ClinicalEncounter = {
        patientId: encounter.patientId!,
        patientName: encounter.patientName!,
        encounterDate: encounter.encounterDate!,
        chiefComplaint: encounter.chiefComplaint!,
        symptoms: encounter.symptoms || [],
        selectedSystem: encounter.selectedSystem!,
        namasteCode: encounter.namasteCode!,
        namasteDisplay: encounter.namasteDisplay!,
        icd11Code: encounter.icd11Code!,
        icd11Display: encounter.icd11Display!,
        practitionerNotes: encounter.practitionerNotes || ''
      }
      
      setCompletedEncounters(prev => [newEncounter, ...prev.slice(0, 4)])
      
      // Reset for new encounter
      setEncounter({ encounterDate: new Date().toISOString().split('T')[0] })
      setCurrentStep(1)
    }
  }

  const canProceed = (step: number) => {
    switch (step) {
      case 1: return encounter.patientId && encounter.patientName
      case 2: return encounter.chiefComplaint && encounter.symptoms?.length
      case 3: return encounter.selectedSystem && encounter.namasteCode
      case 4: return true
      default: return false
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.number
              const isCompleted = currentStep > step.number
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCompleted ? 'bg-primary border-primary text-primary-foreground' :
                    isActive ? 'border-primary text-primary' :
                    'border-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-primary' : 
                      isCompleted ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </CardTitle>
            <CardDescription>
              Enter basic patient details for this clinical encounter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID</Label>
                <Input
                  id="patientId"
                  placeholder="e.g., PAT-2024-001"
                  value={encounter.patientId || ''}
                  onChange={(e) => setEncounter(prev => ({ ...prev, patientId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  placeholder="e.g., Rajesh Kumar"
                  value={encounter.patientName || ''}
                  onChange={(e) => setEncounter(prev => ({ ...prev, patientName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="encounterDate">Encounter Date</Label>
              <Input
                id="encounterDate"
                type="date"
                value={encounter.encounterDate || ''}
                onChange={(e) => setEncounter(prev => ({ ...prev, encounterDate: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={() => setCurrentStep(2)} 
                disabled={!canProceed(1)}
              >
                Next: Clinical Assessment
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
              Clinical Assessment
            </CardTitle>
            <CardDescription>
              Document the patient's chief complaint and symptoms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chiefComplaint">Chief Complaint</Label>
              <Input
                id="chiefComplaint"
                placeholder="e.g., Joint pain and stiffness for 3 months"
                value={encounter.chiefComplaint || ''}
                onChange={(e) => setEncounter(prev => ({ ...prev, chiefComplaint: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Associated Symptoms</Label>
              <div className="grid grid-cols-2 gap-2">
                {symptomSuggestions.map((symptom) => (
                  <Button
                    key={symptom}
                    variant={encounter.symptoms?.includes(symptom) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleSymptomToggle(symptom)}
                    className="justify-start text-left h-auto py-2"
                  >
                    {symptom}
                  </Button>
                ))}
              </div>
              {encounter.symptoms && encounter.symptoms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {encounter.symptoms.map((symptom) => (
                    <Badge key={symptom} variant="secondary" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(3)} 
                disabled={!canProceed(2)}
              >
                Next: Diagnosis
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
              Traditional Medicine Diagnosis
            </CardTitle>
            <CardDescription>
              Select the traditional medicine system and appropriate diagnosis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Traditional Medicine System</Label>
              <Select 
                value={encounter.selectedSystem || ''} 
                onValueChange={(value) => setEncounter(prev => ({ 
                  ...prev, 
                  selectedSystem: value as any,
                  namasteCode: '',
                  namasteDisplay: '',
                  icd11Code: '',
                  icd11Display: ''
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a traditional medicine system" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ayurveda">Ayurveda</SelectItem>
                  <SelectItem value="siddha">Siddha</SelectItem>
                  <SelectItem value="unani">Unani</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {encounter.selectedSystem && (
              <div className="space-y-2">
                <Label>Diagnosis Code</Label>
                <Select 
                  value={encounter.namasteCode || ''} 
                  onValueChange={handleDiagnosisSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select appropriate diagnosis" />
                  </SelectTrigger>
                  <SelectContent>
                    {namasteOptions[encounter.selectedSystem].map((option) => (
                      <SelectItem key={option.code} value={option.code}>
                        {option.display} ({option.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {encounter.namasteCode && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Selected Diagnosis:</p>
                    <div className="bg-muted p-3 rounded">
                      <p className="font-medium">{encounter.namasteDisplay}</p>
                      <p className="text-sm text-muted-foreground">Code: {encounter.namasteCode}</p>
                      <p className="text-sm text-muted-foreground">System: {encounter.selectedSystem}</p>
                    </div>
                    <p className="text-sm">
                      This will automatically map to ICD-11 code: <strong>{encounter.icd11Code}</strong> ({encounter.icd11Display})
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="practitionerNotes">Practitioner Notes (Optional)</Label>
              <Textarea
                id="practitionerNotes"
                placeholder="Additional clinical observations and treatment plan..."
                value={encounter.practitionerNotes || ''}
                onChange={(e) => setEncounter(prev => ({ ...prev, practitionerNotes: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep(4)} 
                disabled={!canProceed(3)}
              >
                Generate Dual-Coded Record
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Dual-Coded Clinical Record
            </CardTitle>
            <CardDescription>
              Complete encounter record with both traditional and international coding
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Patient Summary */}
            <div>
              <h3 className="font-semibold mb-3">Patient Summary</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Patient ID</p>
                    <p className="text-sm">{encounter.patientId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-sm">{encounter.patientName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm">{encounter.encounterDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Chief Complaint</p>
                    <p className="text-sm">{encounter.chiefComplaint}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dual Coding */}
            <div>
              <h3 className="font-semibold mb-3">Dual-Coded Diagnosis</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-primary">Traditional Medicine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{encounter.namasteDisplay}</p>
                      <p className="text-sm text-muted-foreground">Code: {encounter.namasteCode}</p>
                      <Badge variant="default" className="capitalize">
                        {encounter.selectedSystem}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-accent flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      ICD-11 International
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="font-medium">{encounter.icd11Display}</p>
                      <p className="text-sm text-muted-foreground">Code: {encounter.icd11Code}</p>
                      <Badge variant="outline">WHO Standard</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* FHIR Bundle Preview */}
            <div>
              <h3 className="font-semibold mb-3">FHIR Bundle Structure</h3>
              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Encounter",
        "status": "finished",
        "subject": { "reference": "Patient/${encounter.patientId}" }
      }
    },
    {
      "resource": {
        "resourceType": "Condition",
        "code": {
          "coding": [
            {
              "system": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
              "code": "${encounter.namasteCode}",
              "display": "${encounter.namasteDisplay}"
            },
            {
              "system": "http://id.who.int/icd/release/11/mms",
              "code": "${encounter.icd11Code}",
              "display": "${encounter.icd11Display}"
            }
          ]
        }
      }
    }
  ]
}`}
                  </pre>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(3)}>
                Back to Edit
              </Button>
              <Button onClick={completeEncounter} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Encounter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Encounters */}
      {completedEncounters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Demo Encounters</CardTitle>
            <CardDescription>
              Previously completed dual-coded clinical encounters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {completedEncounters.map((enc, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{enc.patientName} ({enc.patientId})</p>
                        <p className="text-sm text-muted-foreground">{enc.encounterDate}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">{enc.namasteCode}</Badge>
                        <p className="text-xs text-muted-foreground">→ {enc.icd11Code}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}