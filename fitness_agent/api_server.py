import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from railtracks_agent import RailtracksFitnessAgent

# Load environment variables (try .env.local first, then .env)
load_dotenv('.env.local', override=True)
load_dotenv('.env', override=True)

# Debug: Show that we loaded the API key
import sys
sys.path.insert(0, os.path.dirname(__file__))
openrouter_key = os.getenv("OPENROUTER_API_KEY")
if openrouter_key:
    print(f"✓ OPENROUTER_API_KEY loaded from environment (length: {len(openrouter_key)})")
else:
    print("⚠️  OPENROUTER_API_KEY not found - using local fallback analysis only")

# Create Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize the Railtracks fitness agent
try:
    agent = RailtracksFitnessAgent()
    logger.info("✅ RailtracksFitnessAgent initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize RailtracksFitnessAgent: {str(e)}")
    agent = None


@app.route('/api/railtracks/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    logger.info("📋 Health check requested")
    try:
        if agent is None:
            return jsonify({'status': 'error', 'message': 'Agent not initialized'}), 500
        return jsonify({
            'status': 'alive',
            'message': 'Railtracks fitness agent is running',
            'timestamp': str(json.dumps({}, default=str))
        }), 200
    except Exception as e:
        logger.error(f"❌ Health check error: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/railtracks/analyze-exercise', methods=['POST'])
def analyze_exercise():
    """Analyze exercise form using Railtracks agent"""
    try:
        data = request.json
        logger.info(f"🔍 Exercise analysis request received")
        logger.info(f"📊 User Profile: {data.get('userProfile', {})}")
        logger.info(f"📊 Exercise Metrics: {data.get('exerciseMetrics', {})}")
        
        if agent is None:
            logger.error("❌ Agent not initialized")
            return jsonify({
                'success': False,
                'formScore': 0,
                'feedback': ['System error: Agent not initialized'],
                'issuesDetected': [],
                'injuryRisk': 'unknown',
                'focusAreas': [],
                'nextRepFocus': ''
            }), 500
        
        # Extract user profile and exercise metrics
        user_profile = data.get('userProfile', {})
        exercise_metrics = data.get('exerciseMetrics', {})
        
        if not exercise_metrics:
            logger.warning("⚠️ No exercise metrics provided")
            return jsonify({
                'success': False,
                'formScore': 0,
                'feedback': ['Please provide exercise metrics'],
                'issuesDetected': [],
                'injuryRisk': 'unknown',
                'focusAreas': [],
                'nextRepFocus': ''
            }), 400
        
        # Call the agent
        logger.info("🤖 Calling Railtracks FormAnalysisAgent...")
        result = agent.analyze_live_exercise(user_profile, exercise_metrics)
        
        logger.info(f"✅ Form analysis complete: score={result.get('formScore', 0)}")
        logger.info(f"💬 Feedback: {result.get('feedback', [])}")
        logger.info(f"⚠️ Issues detected: {result.get('issuesDetected', [])}")
        logger.info(f"🏥 Injury risk: {result.get('injuryRisk', 'unknown')}")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error in analyze_exercise: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'formScore': 0,
            'feedback': [f'Error: {str(e)}'],
            'issuesDetected': [],
            'injuryRisk': 'unknown',
            'focusAreas': [],
            'nextRepFocus': ''
        }), 500


@app.route('/api/railtracks/workout-plan', methods=['POST'])
def generate_workout_plan():
    """Generate a workout plan using Railtracks agent"""
    try:
        data = request.json
        logger.info(f"📋 Workout plan request received")
        logger.info(f"👤 User Profile: {data.get('userProfile', {})}")
        logger.info(f"🎯 Goal: {data.get('goal', 'Not specified')}")
        logger.info(f"📅 Days per week: {data.get('daysPerWeek', 3)}")
        
        if agent is None:
            logger.error("❌ Agent not initialized")
            return jsonify({
                'success': False,
                'plan': None
            }), 500
        
        # Extract parameters
        user_profile = data.get('userProfile', {})
        goal = data.get('goal', 'Build fitness')
        days_per_week = data.get('daysPerWeek', 3)
        
        # Call the agent
        logger.info("🤖 Calling Railtracks WorkoutPlanAgent...")
        result = agent.generate_workout_plan(user_profile, goal, days_per_week)
        
        logger.info(f"✅ Workout plan generated: {result.get('plan', {}).get('title', 'Unknown')}")
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"❌ Error in generate_workout_plan: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'plan': None,
            'error': str(e)
        }), 500


if __name__ == '__main__':
    logger.info("🚀 Starting Railtracks Fitness Agent API Server on port 5001...")
    app.run(debug=True, port=5001, use_reloader=False)
