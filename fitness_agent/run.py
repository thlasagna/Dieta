#!/usr/bin/env python3
"""
Simple startup script for Railtracks Agent
Handles setup and starts the API server
"""

import sys
import os
import subprocess
from pathlib import Path
from dotenv import load_dotenv

def main():
    print("🚀 Starting Railtracks Fitness Agent...")
    print("=" * 70)
    
    # Load environment variables
    load_dotenv('.env.local', override=True)
    load_dotenv('.env', override=True)
    
    # Check API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "your_openrouter_api_key_here":
        print("❌ OPENROUTER_API_KEY not configured!")
        print("\nTo fix:")
        print("1. Edit .env.local in this directory")
        print("2. Add: OPENROUTER_API_KEY=your_actual_key")
        print("3. Get your key from: https://openrouter.ai/")
        print("\nOr export it as an environment variable:")
        print("  export OPENROUTER_API_KEY=your_key")
        return 1
    
    print(f"✓ OpenRouter API Key loaded")
    
    # Check if required packages are installed
    try:
        import google.genai
        import flask
        from dotenv import load_dotenv
        print(f"✓ Dependencies installed")
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Install with: pip install -r requirements.txt")
        return 1
    
    # Try to start the agent
    print(f"\n🤖 Initializing agent...")
    try:
        from railtracks_agent import RailtracksFitnessAgent
        agent = RailtracksFitnessAgent()
        print(f"✓ Agent loaded successfully")
    except Exception as e:
        print(f"❌ Failed to initialize agent: {e}")
        return 1
    
    # Start the API server
    print(f"\n🌐 Starting API server on http://0.0.0.0:5001")
    print("=" * 70)
    print("\nAPI Endpoints:")
    print("  GET  /api/railtracks/health")
    print("  GET  /api/railtracks/capabilities")
    print("  POST /api/railtracks/workout-plan")
    print("  POST /api/railtracks/analyze-exercise")
    print("  POST /api/railtracks/risk-assessment")
    print("\nPress Ctrl+C to stop")
    print("=" * 70 + "\n")
    
    try:
        import api_server
        # Run the Flask app
        api_server.app.run(
            host='0.0.0.0',
            port=5001,
            debug=True,
            threaded=True,
            use_reloader=False
        )
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down...")
        return 0
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
