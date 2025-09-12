"""
Mock Backend Server for Development Testing
Creates a simple HTTP server that mimics the NAMASTE API responses
"""

import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime

# Sample NAMASTE data
SAMPLE_CONCEPTS = [
    {
        "code": "AAE-16",
        "system": "ayurveda",
        "originalTerm": "सन्धिगतवात",
        "englishTerm": "Sandhigatavata",
        "definition": "Osteoarthritis - degenerative joint disease characterized by pain and stiffness",
        "category": "Vata Disorders"
    },
    {
        "code": "AAE-23", 
        "system": "ayurveda",
        "originalTerm": "अमवात",
        "englishTerm": "Amavata",
        "definition": "Rheumatoid arthritis - inflammatory joint disease with systemic manifestations",
        "category": "Vata Disorders"
    },
    {
        "code": "APE-12",
        "system": "ayurveda", 
        "originalTerm": "अम्लपित्त",
        "englishTerm": "Amlapitta",
        "definition": "Hyperacidity - excessive acid production in stomach causing heartburn",
        "category": "Pitta Disorders"
    },
    {
        "code": "SNP-101",
        "system": "siddha",
        "originalTerm": "வாத நோய்",
        "englishTerm": "Vatha Noi", 
        "definition": "Wind-related disorders affecting nervous and musculoskeletal systems",
        "category": "Noi Nadal (Pathology)"
    },
    {
        "code": "UHM-301",
        "system": "unani",
        "originalTerm": "حمیٰ",
        "englishTerm": "Humma",
        "definition": "Fever - pyrexia with constitutional symptoms",
        "category": "Amraz-e-Amma (General Diseases)"
    }
]

SAMPLE_STATISTICS = {
    "total_terms": 21,
    "mapped_terms": 15,
    "total_encounters": 42,
    "system_distribution": {
        "ayurveda": 10,
        "siddha": 6,
        "unani": 5
    },
    "equivalence_distribution": {
        "equivalent": 8,
        "relatedto": 4,
        "wider": 2,
        "narrower": 1
    }
}

class NAMASTERequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        # Parse URL
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        query_params = urllib.parse.parse_qs(parsed_path.query)
        
        # Set CORS headers
        self.send_cors_headers()
        
        if path == '/health':
            self.handle_health()
        elif path == '/lookup':
            self.handle_lookup(query_params)
        elif path == '/statistics':
            self.handle_statistics()
        elif path == '/mappings':
            self.handle_mappings(query_params)
        else:
            self.send_error(404, "Not Found")

    def do_POST(self):
        # Set CORS headers
        self.send_cors_headers()
        
        if self.path == '/ConceptMap/$translate':
            self.handle_translate()
        elif self.path == '/Encounter':
            self.handle_encounter()
        else:
            self.send_error(404, "Not Found")

    def send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json_response(self, data, status_code=200):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        
        json_data = json.dumps(data, indent=2)
        self.wfile.write(json_data.encode('utf-8'))

    def handle_health(self):
        response = {
            "status": "healthy",
            "service": "NAMASTE-ICD11 Terminology Service",
            "version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }
        self.send_json_response(response)

    def handle_lookup(self, query_params):
        query = query_params.get('q', [''])[0].lower()
        system = query_params.get('system', [None])[0]
        limit = int(query_params.get('limit', ['10'])[0])
        
        # Filter concepts based on query
        results = []
        for concept in SAMPLE_CONCEPTS:
            if system and concept['system'] != system:
                continue
                
            # Search in multiple fields
            if (query in concept['englishTerm'].lower() or 
                query in concept['definition'].lower() or 
                query in concept['code'].lower() or
                query in concept['category'].lower()):
                results.append(concept)
                
            if len(results) >= limit:
                break
        
        self.send_json_response(results)

    def handle_statistics(self):
        self.send_json_response(SAMPLE_STATISTICS)

    def handle_mappings(self, query_params):
        # Return sample mappings
        mappings = [
            {
                "namasteCode": "AAE-16",
                "namasteTerm": "Sandhigatavata", 
                "originalTerm": "सन्धिगतवात",
                "system": "ayurveda",
                "icd11Code": "FA20",
                "icd11Term": "Osteoarthritis",
                "equivalence": "equivalent",
                "confidence": 0.95,
                "mappingType": "direct",
                "clinicalNotes": "Direct equivalent - both describe degenerative joint disease"
            }
        ]
        self.send_json_response(mappings)

    def handle_translate(self):
        # Read request body
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            request_data = json.loads(post_data.decode('utf-8'))
            code = request_data.get('code', '')
            
            # Mock translation response
            response = {
                "result": True,
                "message": "Translation completed successfully",
                "match": [
                    {
                        "equivalence": "equivalent",
                        "concept": {
                            "system": "http://id.who.int/icd/release/11/mms",
                            "code": "FA20",
                            "display": "Osteoarthritis"
                        },
                        "confidence": 0.95,
                        "mapping_type": "direct",
                        "clinical_notes": "Direct mapping to ICD-11"
                    }
                ]
            }
            self.send_json_response(response)
            
        except json.JSONDecodeError:
            self.send_error(400, "Invalid JSON")

    def handle_encounter(self):
        # Mock encounter submission
        response = {
            "resourceType": "Bundle",
            "type": "transaction-response", 
            "timestamp": datetime.utcnow().isoformat(),
            "entry": [
                {
                    "response": {
                        "status": "201 Created",
                        "location": f"Encounter/enc_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
                    }
                }
            ]
        }
        self.send_json_response(response)

if __name__ == "__main__":
    PORT = 8000
    
    print(f"🏥 NAMASTE Mock Backend Server")
    print(f"🌐 Server: http://localhost:{PORT}")
    print(f"📖 Health: http://localhost:{PORT}/health")
    print(f"🔍 Search: http://localhost:{PORT}/lookup?q=fever")
    print("Press Ctrl+C to stop")
    print("-" * 50)
    
    with socketserver.TCPServer(("", PORT), NAMASTERequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")
            httpd.shutdown()