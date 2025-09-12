import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Code, Shield, Globe, Database, ArrowRight, CheckCircle, ExternalLink } from '@phosphor-icons/react'

export default function DocumentationHub() {
  const [activeSection, setActiveSection] = useState('overview')

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/lookup',
      description: 'Auto-complete search for NAMASTE terminology',
      params: ['q (string, required)', 'system (string, optional)', 'limit (integer, optional)']
    },
    {
      method: 'POST',
      path: '/ConceptMap/$translate',
      description: 'FHIR $translate operation for code mapping',
      params: ['FHIR Parameters resource with system, code, and target']
    },
    {
      method: 'POST',
      path: '/Encounter',
      description: 'Clinical encounter ingestion with dual-coding',
      params: ['FHIR Bundle of type: transaction']
    }
  ]

  const fhirResources = [
    {
      resource: 'CodeSystem',
      purpose: 'Defines the complete NAMASTE terminology with hierarchical structure',
      url: 'http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE'
    },
    {
      resource: 'ValueSet',
      purpose: 'Creates usable subsets of NAMASTE codes for specific clinical contexts',
      url: 'http://namstp.ayush.gov.in/fhir/ValueSet/*'
    },
    {
      resource: 'ConceptMap',
      purpose: 'Defines explicit mappings between NAMASTE and ICD-11 codes',
      url: 'http://namstp.ayush.gov.in/fhir/ConceptMap/namaste-to-icd11-mms'
    }
  ]

  return (
    <div className="space-y-6">
      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="fhir">FHIR R4</TabsTrigger>
          <TabsTrigger value="api">API Spec</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Architecture Overview
              </CardTitle>
              <CardDescription>
                Comprehensive guide to the NAMASTE-ICD11 Terminology Service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">System Purpose</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  The NAMASTE Terminology Service enables seamless integration between India's traditional medicine 
                  terminologies (Ayurveda, Siddha, Unani) and international health standards (WHO ICD-11). It provides 
                  a dual-coding system that preserves clinical richness while ensuring global interoperability.
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Key Features</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">FHIR R4 Compliance</p>
                        <p className="text-xs text-muted-foreground">Full conformance to HL7 FHIR R4 specifications</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">ABDM Integration</p>
                        <p className="text-xs text-muted-foreground">OAuth 2.0 authentication with ABHA tokens</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Microservice Architecture</p>
                        <p className="text-xs text-muted-foreground">Containerized, scalable service design</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Dual Coding System</p>
                        <p className="text-xs text-muted-foreground">Simultaneous traditional and international coding</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Real-time Search</p>
                        <p className="text-xs text-muted-foreground">Fast auto-complete for clinical workflows</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">WHO Collaboration</p>
                        <p className="text-xs text-muted-foreground">Built on official ICD-11 TM2 module</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Stakeholder Benefits</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Healthcare Practitioners</h4>
                    <p className="text-xs text-muted-foreground">
                      Continue using familiar traditional medicine terminologies while automatically generating 
                      internationally recognized diagnostic codes for comprehensive patient records.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Researchers & Policymakers</h4>
                    <p className="text-xs text-muted-foreground">
                      Access unified datasets enabling comparative effectiveness studies, morbidity analysis, 
                      and evidence-based health policy development across medical paradigms.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Insurers & Payers</h4>
                    <p className="text-xs text-muted-foreground">
                      Process claims and create coverage packages using standardized, globally recognized 
                      codes that align with modern healthcare administrative frameworks.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fhir" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                FHIR R4 Resource Specifications
              </CardTitle>
              <CardDescription>
                Detailed FHIR resource structures and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  All FHIR resources conform to HL7 FHIR R4 specification and India's NRCeS profiles for ABDM compliance.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {fhirResources.map((resource, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{resource.resource}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{resource.purpose}</p>
                      <div className="bg-muted p-3 rounded">
                        <p className="text-xs font-mono">{resource.url}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">CodeSystem Structure Example</h3>
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "resourceType": "CodeSystem",
  "url": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
  "version": "1.0.0",
  "name": "NAMASTETerminology",
  "title": "National AYUSH Morbidity and Standardized Terminologies",
  "status": "active",
  "publisher": "Ministry of AYUSH, Government of India",
  "content": "complete",
  "concept": [
    {
      "code": "AAE-16",
      "display": "Sandhigatavata",
      "definition": "Vata disorder affecting joints...",
      "designation": [
        {
          "language": "sa",
          "use": { "code": "original-term" },
          "value": "सन्धिगतवात"
        }
      ],
      "property": [
        {
          "code": "ayush-system",
          "valueCode": "ayurveda"
        }
      ]
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3">ConceptMap Structure Example</h3>
                <Card>
                  <CardContent className="p-4">
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{`{
  "resourceType": "ConceptMap",
  "url": "http://namstp.ayush.gov.in/fhir/ConceptMap/namaste-to-icd11-mms",
  "sourceCanonical": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
  "targetCanonical": "http://id.who.int/icd/release/11/mms",
  "group": [
    {
      "source": "http://namstp.ayush.gov.in/fhir/CodeSystem/NAMASTE",
      "target": "http://id.who.int/icd/release/11/mms",
      "element": [
        {
          "code": "AAE-16",
          "target": [
            {
              "code": "FA20",
              "display": "Osteoarthritis",
              "equivalence": "equivalent"
            }
          ]
        }
      ]
    }
  ]
}`}
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                RESTful API Specification
              </CardTitle>
              <CardDescription>
                Complete API endpoint documentation with request/response examples
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  All endpoints require valid ABHA authentication tokens and return JSON responses.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {apiEndpoints.map((endpoint, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={endpoint.method === 'GET' ? 'secondary' : 'default'}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm">{endpoint.path}</code>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Parameters</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {endpoint.params.map((param, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <ArrowRight className="h-3 w-3" />
                              {param}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Response Codes</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Badge variant="secondary">200 OK</Badge>
                    <p className="text-xs text-muted-foreground">Successful request with response data</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="destructive">400 Bad Request</Badge>
                    <p className="text-xs text-muted-foreground">Invalid request parameters or format</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="destructive">401 Unauthorized</Badge>
                    <p className="text-xs text-muted-foreground">Missing or invalid ABHA token</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline">404 Not Found</Badge>
                    <p className="text-xs text-muted-foreground">Requested resource or mapping not found</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Authentication
              </CardTitle>
              <CardDescription>
                ABDM-integrated OAuth 2.0 security framework and compliance requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All API access requires valid ABHA (Ayushman Bharat Health Account) authentication tokens 
                  issued by the ABDM identity service.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-3">Authentication Flow</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</div>
                    <div>
                      <p className="text-sm font-medium">Token Acquisition</p>
                      <p className="text-xs text-muted-foreground">
                        EMR system authenticates clinician against ABDM identity service and receives JWT token
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</div>
                    <div>
                      <p className="text-sm font-medium">API Request</p>
                      <p className="text-xs text-muted-foreground">
                        EMR includes ABHA token in Authorization header using Bearer scheme
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</div>
                    <div>
                      <p className="text-sm font-medium">Token Validation</p>
                      <p className="text-xs text-muted-foreground">
                        Service verifies JWT signature, expiration, issuer, and audience claims
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">4</div>
                    <div>
                      <p className="text-sm font-medium">Scope Enforcement</p>
                      <p className="text-xs text-muted-foreground">
                        Service checks token scopes and enforces appropriate access permissions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Required Scopes</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">terminology:read</Badge>
                    <p className="text-sm text-muted-foreground">Access to lookup and search operations</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">encounter:write</Badge>
                    <p className="text-sm text-muted-foreground">Permission to submit clinical encounter data</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">conceptmap:read</Badge>
                    <p className="text-sm text-muted-foreground">Access to terminology translation operations</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Compliance Standards</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">EHR Standards for India (2016)</h4>
                    <p className="text-xs text-muted-foreground">
                      Compliance with national EHR standards including ISO 22600 for privilege management
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">FHIR R4 Security</h4>
                    <p className="text-xs text-muted-foreground">
                      Implementation of FHIR security recommendations and smart-on-fhir specifications
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Patient Consent</h4>
                    <p className="text-xs text-muted-foreground">
                      Integration with ABDM Consent Manager for patient data protection
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Data Encryption</h4>
                    <p className="text-xs text-muted-foreground">
                      TLS 1.2+ for data in transit and AES-256 for data at rest
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Integration Guidelines
              </CardTitle>
              <CardDescription>
                Step-by-step integration guide for EMR systems and healthcare platforms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Prerequisites</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">ABDM registered healthcare application</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">FHIR R4 compatible EMR system</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">OAuth 2.0 client credentials or authorization code flow</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm">HTTPS endpoint capability for secure communication</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Integration Steps</h3>
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Phase 1: Authentication Setup</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Configure OAuth 2.0 client credentials with ABDM and implement token management
                      </p>
                      <div className="text-xs space-y-1">
                        <p>• Register application with ABDM identity service</p>
                        <p>• Implement JWT token validation and caching</p>
                        <p>• Configure required scopes for terminology access</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Phase 2: Terminology Integration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Integrate auto-complete search and terminology lookup in clinical workflows
                      </p>
                      <div className="text-xs space-y-1">
                        <p>• Implement real-time search UI components</p>
                        <p>• Connect to /lookup endpoint for NAMASTE terms</p>
                        <p>• Display traditional medicine diagnosis options</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Phase 3: Dual-Coding Implementation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enable automatic ICD-11 mapping and dual-coded record generation
                      </p>
                      <div className="text-xs space-y-1">
                        <p>• Integrate $translate operation for code mapping</p>
                        <p>• Modify condition recording to include both codes</p>
                        <p>• Implement FHIR Bundle structure for encounters</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Phase 4: Data Submission</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Configure clinical encounter data submission with dual-coded diagnoses
                      </p>
                      <div className="text-xs space-y-1">
                        <p>• Implement FHIR Bundle creation for encounters</p>
                        <p>• Connect to /Encounter endpoint for data submission</p>
                        <p>• Handle response processing and error scenarios</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3">Testing & Validation</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Sandbox Environment</h4>
                    <p className="text-xs text-muted-foreground">
                      Use ABDM sandbox for initial testing and validation before production deployment
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">FHIR Validation</h4>
                    <p className="text-xs text-muted-foreground">
                      Validate all FHIR resources against NRCeS profiles using official validation tools
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">End-to-End Testing</h4>
                    <p className="text-xs text-muted-foreground">
                      Test complete clinical workflows from search to dual-coded record submission
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}