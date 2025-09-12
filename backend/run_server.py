"""
NAMASTE-ICD11 Backend Server Runner
Simple script to start the FastAPI server
"""
import subprocess
import sys
import os

def install_dependencies():
    """Install required Python packages"""
    packages = [
        "fastapi==0.104.1",
        "uvicorn==0.24.0", 
        "pydantic==2.5.0",
        "python-multipart==0.0.6"
    ]
    
    for package in packages:
        print(f"Installing {package}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

def run_server():
    """Start the FastAPI server"""
    try:
        import uvicorn
        print("Starting NAMASTE-ICD11 Terminology Service...")
        print("API will be available at: http://localhost:8000")
        print("Documentation: http://localhost:8000/docs")
        print("Press Ctrl+C to stop the server")
        
        # Change to backend directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(backend_dir)
        
        # Start server
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
        
    except ImportError:
        print("Installing dependencies first...")
        install_dependencies()
        run_server()
    except KeyboardInterrupt:
        print("\nServer stopped by user")

if __name__ == "__main__":
    run_server()