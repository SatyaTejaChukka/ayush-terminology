#!/usr/bin/env python3
"""
Development server startup script for NAMASTE-ICD11 Backend
Installs dependencies and starts the FastAPI server
"""

import subprocess
import sys
import os
from pathlib import Path

def install_dependencies():
    """Install required Python packages"""
    print("📦 Installing backend dependencies...")
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ])
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        sys.exit(1)

def start_server():
    """Start the FastAPI development server"""
    print("🚀 Starting NAMASTE-ICD11 Terminology Service...")
    print("📊 Backend will be available at: http://localhost:8000")
    print("📖 API Documentation: http://localhost:8000/docs")
    print("🔍 Alternative docs: http://localhost:8000/redoc")
    print("\n🔄 Starting server with auto-reload enabled...")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload",
            "--log-level", "info"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

def main():
    """Main function"""
    print("🏥 NAMASTE-ICD11 Terminology Service - Development Setup")
    print("=" * 60)
    
    # Ensure we're in the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Check if requirements.txt exists
    if not Path("requirements.txt").exists():
        print("❌ requirements.txt not found")
        sys.exit(1)
    
    # Install dependencies
    install_dependencies()
    
    print("\n" + "=" * 60)
    print("🎯 NAMASTE-ICD11 Backend Features:")
    print("   • Real NAMASTE terminology codes from AYUSH")
    print("   • Authentic ICD-11 mappings with TM2 module")
    print("   • FHIR R4 compliant API endpoints") 
    print("   • Expert-curated concept mappings")
    print("   • Production-ready SQLAlchemy ORM")
    print("   • Comprehensive statistics and analytics")
    print("=" * 60)
    
    # Start the server
    start_server()

if __name__ == "__main__":
    main()