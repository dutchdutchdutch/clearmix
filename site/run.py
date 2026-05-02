#!/usr/bin/env python3
"""
Clearmix Application Entry Point

Run with: python run.py
Access at: http://127.0.0.1:5000
"""
from app import create_app

app = create_app()

if __name__ == "__main__":
    print("\n🧪 Clearmix - Peptide Reconstitution Calculator")
    print("=" * 50)
    print("Starting development server...")
    print("Access at: http://127.0.0.1:5000")
    print("=" * 50 + "\n")
    
    app.run(debug=True, port=5000)
