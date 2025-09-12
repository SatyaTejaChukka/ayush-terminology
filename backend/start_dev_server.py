#!/usr/bin/env python3
"""
NAMASTE-ICD11 Development Server
Auto-installer and runner for the backend service
"""

import subprocess
import sys
import os
import time
import json
from pathlib import Path

def check_python():
    """Check if Python 3.8+ is available"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} detected")

def install_dependencies():
    """Install required packages with better error handling"""
    packages = [
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "pydantic>=2.5.0",
        "python-multipart>=0.0.6"
    ]
    
    print("📦 Installing backend dependencies...")
    
    for package in packages:
        try:
            print(f"  Installing {package}...")
            result = subprocess.run(
                [sys.executable, "-m", "pip", "install", package, "--quiet"],
                capture_output=True,
                text=True,
                check=True
            )
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e.stderr}")
            return False
    
    print("✅ All dependencies installed successfully")
    return True

def test_imports():
    """Test if all required modules can be imported"""
    required_modules = ["fastapi", "uvicorn", "pydantic", "sqlite3"]
    
    for module in required_modules:
        try:
            __import__(module)
        except ImportError as e:
            print(f"❌ Cannot import {module}: {e}")
            return False
    
    print("✅ All modules imported successfully")
    return True

def create_database():
    """Initialize the SQLite database"""
    try:
        backend_dir = Path(__file__).parent
        db_path = backend_dir / "namaste_db.sqlite"
        
        if db_path.exists():
            print("✅ Database already exists")
            return True
            
        print("🗄️  Initializing database...")
        
        # Import and run database initialization
        sys.path.insert(0, str(backend_dir))
        from main import init_database, populate_sample_data
        
        init_database()
        populate_sample_data()
        
        print("✅ Database initialized with sample data")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def start_server():
    """Start the FastAPI development server"""
    try:
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        print("\n🚀 Starting NAMASTE-ICD11 Terminology Service...")
        print("🌐 API Server: http://localhost:8000")
        print("📖 API Docs: http://localhost:8000/docs")
        print("🔧 Interactive API: http://localhost:8000/redoc")
        print("\n⚡ Server starting... (Press Ctrl+C to stop)")
        print("-" * 50)
        
        # Import uvicorn and start server
        import uvicorn
        
        # Start the server with proper configuration
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[str(backend_dir)],
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Server failed to start: {e}")
        return False

def main():
    """Main function to orchestrate the setup and server start"""
    print("🏥 NAMASTE-ICD11 Terminology Service")
    print("=" * 50)
    
    # Check Python version
    check_python()
    
    # Install dependencies if needed
    if not test_imports():
        if not install_dependencies():
            print("❌ Failed to install dependencies")
            sys.exit(1)
        
        # Test imports again after installation
        if not test_imports():
            print("❌ Dependencies installed but import still fails")
            sys.exit(1)
    
    # Initialize database
    if not create_database():
        print("❌ Database setup failed")
        sys.exit(1)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()