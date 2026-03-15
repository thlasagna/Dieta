"""
Railtracks-based Fitness Coaching Agent
Provides intelligent exercise form analysis and coaching feedback using Railtracks framework
"""

import railtracks as rt
from pydantic import BaseModel, Field
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
import json
import requests

# Try to import the newer google.genai, fall back to google.generativeai if needed
try:
    import google.genai as genai
    logger_msg = "Using google.genai (new API)"
except ImportError:
    try:
        import google.generativeai as genai
        logger_msg = "Using google.generativeai (legacy API)"
    except ImportError:
        genai = None
        logger_msg = "Google AI SDK not found"

# Load environment
load_dotenv('.env.local', override=True)
load_dotenv('.env', override=True)

logger = logging.getLogger(__name__)

# Get API keys from environment (OpenRouter is primary)
OPENROUTER_API_KEY_PRIMARY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY_PRIMARY:
    logger.warning("⚠️  OPENROUTER_API_KEY not found in environment")
else:
    logger.info(f"✓ OPENROUTER_API_KEY loaded (length: {len(OPENROUTER_API_KEY_PRIMARY)})")

# Keep GEMINI_API_KEY for backward compatibility
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    logger.info(f"✓ GEMINI_API_KEY also available as fallback")

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    logger.info("ℹ️  OPENROUTER_API_KEY not configured (optional fallback)")
else:
    logger.info(f"✓ OPENROUTER_API_KEY loaded (length: {len(OPENROUTER_API_KEY)})")


# ============================================================================
# STRUCTURED OUTPUT SCHEMAS
# ============================================================================

class ExerciseMetricsInput(BaseModel):
    """Real-time exercise metrics from pose detection"""
    exercise: str = Field(..., description="Type of exercise (e.g., lunge, pushup)")
    rep_count: int = Field(default=0, description="Number of reps completed")
    depth_score: float = Field(default=0.0, description="Depth of movement 0-1")
    stability_score: float = Field(default=0.0, description="Stability of movement 0-1")
    symmetry_score: float = Field(default=0.0, description="Left-right symmetry 0-1")
    knee_alignment: float = Field(default=0.0, description="Knee alignment quality 0-1")
    back_angle: Optional[float] = Field(default=None, description="Back angle in degrees")


class UserProfileInput(BaseModel):
    """User fitness profile"""
    age: Optional[int] = None
    fitnessLevel: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    gender: Optional[str] = None
    injuries: Optional[List[str]] = Field(default_factory=list)
    medicalConditions: Optional[List[str]] = Field(default_factory=list)
    restrictions: Optional[List[str]] = Field(default_factory=list)


class FormFeedbackOutput(BaseModel):
    """Form analysis and feedback"""
    formScore: float = Field(..., description="Overall form score 0-1")
    feedback: List[str] = Field(..., description="Coaching tips and feedback")
    issuesDetected: List[str] = Field(default_factory=list, description="Form issues")
    injuryRisk: str = Field(..., description="Injury risk level: low, medium, high")
    focusAreas: Optional[List[str]] = Field(default=None)
    nextRepFocus: Optional[str] = None


class WorkoutExercise(BaseModel):
    """Single exercise in workout"""
    name: str
    sets: int
    reps: int
    weight: Optional[str] = None
    duration: Optional[str] = None
    modifications: Optional[str] = None


class WorkoutDay(BaseModel):
    """Single day in workout plan"""
    day: str
    focus: str
    exercises: List[WorkoutExercise]
    notes: Optional[str] = None


class WorkoutPlanOutput(BaseModel):
    """Complete workout plan"""
    title: str
    duration: str
    goal: str
    schedule: List[WorkoutDay]
    tips: List[str]
    safetyNotes: Optional[List[str]] = None


# ============================================================================
# TOOL FUNCTIONS
# ============================================================================

@rt.function_node
def analyze_form_metrics(metrics: ExerciseMetricsInput) -> dict:
    """
    Analyze exercise metrics to identify form issues
    
    Args:
        metrics: Exercise metrics from pose detection
        
    Returns:
        Dictionary with identified form issues
    """
    issues = []
    form_score = 0.75  # Base score
    
    # Analyze based on exercise type
    exercise = metrics.exercise.lower()
    
    if exercise == "lunge":
        if metrics.depth_score < 0.6:
            issues.append("Insufficient lunge depth")
            form_score -= 0.15
        if metrics.knee_alignment < 0.65:
            issues.append("Knee not tracking properly over ankle")
            form_score -= 0.15
        if metrics.symmetry_score < 0.65:
            issues.append("Imbalance between left and right sides")
            form_score -= 0.1
        
        # Good form indicators
        if metrics.stability_score > 0.8:
            form_score += 0.1
        if metrics.symmetry_score > 0.85:
            form_score += 0.05
    
    elif exercise == "pushup":
        if metrics.stability_score < 0.7:
            issues.append("Hips sagging - maintain plank position")
            form_score -= 0.15
        if metrics.symmetry_score < 0.75:
            issues.append("Uneven weight distribution between sides")
            form_score -= 0.1
        if metrics.back_angle and metrics.back_angle > 30:
            issues.append("Back angle too steep - maintain plank")
            form_score -= 0.15
    
    # Generic checks
    if metrics.stability_score < 0.6:
        issues.append("Movement is unstable")
        form_score -= 0.1
    
    return {
        "form_score": max(0.0, min(1.0, form_score)),
        "issues": issues
    }


# ============================================================================
# GEMINI DIRECT API FALLBACK (if Railtracks fails)
# ============================================================================

async def call_gemini_directly(analysis_prompt: str) -> dict:
    """
    Direct Gemini API call as fallback when Railtracks fails
    Generates structured feedback without JSON mode
    """
    try:
        if not GEMINI_API_KEY:
            logger.error("❌ Gemini API key not available")
            return None
        
        logger.info("📞 Using direct Gemini API call (fallback)...")
        
        # Add structured output instruction to prompt
        structured_prompt = analysis_prompt + "\n\n" + """
IMPORTANT: Format your response EXACTLY like this:
FORM_SCORE: [number between 0 and 1]
INJURY_RISK: [low/medium/high]
TIP_1: [first coaching tip]
TIP_2: [second coaching tip]
TIP_3: [third coaching tip]
TIP_4: [fourth coaching tip - optional]
TIP_5: [fifth coaching tip - optional]
ISSUES: [comma-separated list of issues, or "None"]
FOCUS_AREAS: [comma-separated focus areas, or "None"]
NEXT_REP: [focus for next rep in one sentence]
"""
        
        logger.info("📤 Calling Gemini directly...")
        
        # Use google.generativeai (the one that works)
        import google.generativeai as genai_api
        genai_api.configure(api_key=GEMINI_API_KEY)
        
        model = genai_api.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(structured_prompt)
        
        if not response or not response.text:
            logger.error("❌ Empty response from Gemini")
            return None
        
        logger.info("✓ Gemini response received")
        
        # Parse the response
        text = response.text
        logger.info(f"📋 Raw response:\n{text[:300]}...")
        
        result = {
            "form_score": 0.75,
            "feedback": [],
            "issues_detected": [],
            "injury_risk": "low",
            "focus_areas": [],
            "next_rep_focus": ""
        }
        
        # Parse each line
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith('FORM_SCORE:'):
                try:
                    score_str = line.replace('FORM_SCORE:', '').strip()
                    result["form_score"] = max(0.0, min(1.0, float(score_str)))
                except:
                    pass
            
            elif line.startswith('INJURY_RISK:'):
                risk = line.replace('INJURY_RISK:', '').strip().lower()
                if risk in ['low', 'medium', 'high']:
                    result["injury_risk"] = risk
            
            elif line.startswith('TIP_'):
                tip = line.split(':', 1)[1].strip() if ':' in line else ""
                if tip and tip.lower() != "optional":
                    result["feedback"].append(tip)
            
            elif line.startswith('ISSUES:'):
                issues_str = line.replace('ISSUES:', '').strip()
                if issues_str.lower() != "none":
                    result["issues_detected"] = [i.strip() for i in issues_str.split(',')]
            
            elif line.startswith('FOCUS_AREAS:'):
                focus_str = line.replace('FOCUS_AREAS:', '').strip()
                if focus_str.lower() != "none":
                    result["focus_areas"] = [f.strip() for f in focus_str.split(',')]
            
            elif line.startswith('NEXT_REP:'):
                result["next_rep_focus"] = line.replace('NEXT_REP:', '').strip()
        
        # Ensure we have at least some feedback
        if not result["feedback"]:
            result["feedback"] = ["Consider your form carefully", "Focus on stability", "Maintain consistent depth"]
        
        logger.info(f"✓ Parsed response: score={result['form_score']}, tips={len(result['feedback'])}")
        
        return result
    
    except Exception as e:
        logger.error(f"❌ Direct Gemini API failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================================================
# OPENROUTER DIRECT API FALLBACK (if Gemini fails)
# ============================================================================

async def call_openrouter_directly(analysis_prompt: str) -> dict:
    """
    Direct OpenRouter API call as fallback when Gemini fails
    OpenRouter provides access to Claude, Gemini, Llama, and other models
    """
    try:
        if not OPENROUTER_API_KEY:
            logger.error("❌ OpenRouter API key not available")
            return None
        
        logger.info(f"📞 Using OpenRouter API (API key length: {len(OPENROUTER_API_KEY)})...")
        
        # Add structured output instruction to prompt
        structured_prompt = analysis_prompt + "\n\n" + """
IMPORTANT: Format your response EXACTLY like this:
FORM_SCORE: [number between 0 and 1]
INJURY_RISK: [low/medium/high]
TIP_1: [first coaching tip]
TIP_2: [second coaching tip]
TIP_3: [third coaching tip]
TIP_4: [fourth coaching tip - optional]
TIP_5: [fifth coaching tip - optional]
ISSUES: [comma-separated list of issues, or "None"]
FOCUS_AREAS: [comma-separated focus areas, or "None"]
NEXT_REP: [focus for next rep in one sentence]
"""
        
        logger.info("📤 Calling OpenRouter API...")
        
        # OpenRouter API call
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Dieta Fitness",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": "claude-3.5-sonnet",  # Claude is excellent for structured reasoning
            "messages": [
                {
                    "role": "system",
                    "content": "You are an expert fitness coach and movement analyst. Provide specific, actionable feedback."
                },
                {
                    "role": "user",
                    "content": structured_prompt
                }
            ],
            "temperature": 0.7,
            "max_tokens": 800
        }
        
        logger.debug(f"📊 Payload size: {len(str(payload))} chars")
        
        response = requests.post(url, json=payload, headers=headers, timeout=15)
        
        logger.info(f"✓ Got response from OpenRouter: status={response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"❌ OpenRouter API error: {response.status_code}")
            logger.error(f"Response: {response.text[:500]}")
            return None
        
        response_data = response.json()
        
        if "choices" not in response_data or len(response_data["choices"]) == 0:
            logger.error("❌ Invalid response structure from OpenRouter")
            return None
        
        text = response_data["choices"][0]["message"]["content"]
        
        if not text:
            logger.error("❌ Empty response from OpenRouter")
            return None
        
        logger.info("✓ OpenRouter response received")
        logger.info(f"📋 Raw response:\n{text[:300]}...")
        
        result = {
            "form_score": 0.75,
            "feedback": [],
            "issues_detected": [],
            "injury_risk": "low",
            "focus_areas": [],
            "next_rep_focus": ""
        }
        
        # Parse each line
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if line.startswith('FORM_SCORE:'):
                try:
                    score_str = line.replace('FORM_SCORE:', '').strip()
                    result["form_score"] = max(0.0, min(1.0, float(score_str)))
                except:
                    pass
            
            elif line.startswith('INJURY_RISK:'):
                risk = line.replace('INJURY_RISK:', '').strip().lower()
                if risk in ['low', 'medium', 'high']:
                    result["injury_risk"] = risk
            
            elif line.startswith('TIP_'):
                tip = line.split(':', 1)[1].strip() if ':' in line else ""
                if tip and tip.lower() != "optional":
                    result["feedback"].append(tip)
            
            elif line.startswith('ISSUES:'):
                issues_str = line.replace('ISSUES:', '').strip()
                if issues_str.lower() != "none":
                    result["issues_detected"] = [i.strip() for i in issues_str.split(',')]
            
            elif line.startswith('FOCUS_AREAS:'):
                focus_str = line.replace('FOCUS_AREAS:', '').strip()
                if focus_str.lower() != "none":
                    result["focus_areas"] = [f.strip() for f in focus_str.split(',')]
            
            elif line.startswith('NEXT_REP:'):
                result["next_rep_focus"] = line.replace('NEXT_REP:', '').strip()
        
        # Ensure we have at least some feedback
        if not result["feedback"]:
            result["feedback"] = ["Consider your form carefully", "Focus on stability", "Maintain consistent depth"]
        
        logger.info(f"✓ Parsed response: score={result['form_score']}, tips={len(result['feedback'])}")
        
        return result
    
    except requests.exceptions.Timeout:
        logger.error("❌ OpenRouter API timeout")
        return None
    except requests.exceptions.ConnectionError:
        logger.error("❌ OpenRouter connection failed")
        return None
    except Exception as e:
        logger.error(f"❌ Direct OpenRouter API failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return None

# ============================================================================
# AGENT DEFINITIONS
# ============================================================================

# Form Analysis Agent with structured output
FormAnalysisAgent = rt.agent_node(
    name="Form Analysis Agent",
    llm=rt.llm.GeminiLLM("gemini-2.0-flash"),
    system_message="""You are an expert fitness coach and movement analyst. 
    
Your job is to analyze exercise form and provide specific, actionable coaching feedback.
Be concise but clear. Focus on the most important form cues for the exercise.
Provide 3-5 high-impact tips that will immediately improve form.
Rate injury risk as 'low', 'medium', or 'high' based on the form quality and user history.""",
    output_schema=FormFeedbackOutput,
)



# Workout Planning Agent with structured output  
WorkoutPlanAgent = rt.agent_node(
    name="Workout Plan Agent",
    llm=rt.llm.GeminiLLM("gemini-2.0-flash"),
    system_message="""You are an expert fitness coach and workout program designer.
    
Create personalized, effective workout plans that:
- Match the user's fitness level and goals
- Account for any injuries or restrictions  
- Progress appropriately over time
- Include proper exercise selection and programming

Be specific with exercises, sets, reps, and rest periods.
Include safety notes and important coaching cues.""",
    output_schema=WorkoutPlanOutput,
)


# ============================================================================
# MAIN FLOWS
# ============================================================================

@rt.function_node
async def analyze_exercise_form(
    user_profile: UserProfileInput,
    exercise_metrics: ExerciseMetricsInput
) -> dict:
    """
    Analyze live exercise form and provide coaching feedback
    
    Args:
        user_profile: User profile data
        exercise_metrics: Exercise metrics from pose detection
        
    Returns:
        Form analysis feedback
    """
    try:
        
        # Create analysis prompt with metrics and user context
        analysis_prompt = f"""
Analyze the following exercise form and provide coaching feedback:

EXERCISE: {exercise_metrics.exercise.upper()}

FORM METRICS:
- Depth Score: {exercise_metrics.depth_score:.2f}/1.0 (how deep the movement is)
- Stability Score: {exercise_metrics.stability_score:.2f}/1.0 (how stable the movement is)
- Symmetry Score: {exercise_metrics.symmetry_score:.2f}/1.0 (balance between sides)
- Knee Alignment: {exercise_metrics.knee_alignment:.2f}/1.0 (knee positioning quality)
- Back Angle: {exercise_metrics.back_angle}° if provided

USER PROFILE:
- Age: {user_profile.age or 'Not provided'}
- Fitness Level: {user_profile.fitnessLevel or 'Not provided'}
- Known Injuries: {', '.join(user_profile.injuries) if user_profile.injuries else 'None reported'}
- Medical Conditions: {', '.join(user_profile.medicalConditions) if user_profile.medicalConditions else 'None'}

Provide:
1. Overall form score (0-1)
2. Specific coaching feedback (3-5 actionable tips)
3. Any form issues detected
4. Injury risk assessment (low/medium/high) - higher if weak form + existing injuries
5. Focus areas for improvement
6. What to focus on for the next rep

Be specific and actionable. Use coaching language, not overly technical.
"""
        
        logger.info(f"📤 Analyzing form for {exercise_metrics.exercise}")
        
        # Try Railtracks first (primary method)
        try:
            logger.info("🧠 Attempting Railtracks structured output...")
            feedback = await rt.call(FormAnalysisAgent, analysis_prompt)
            
            logger.info(f"✓ Railtracks analysis complete: score={feedback.formScore:.2f}")
            
            return {
                "success": True,
                "formScore": feedback.formScore,
                "feedback": feedback.feedback,
                "issuesDetected": feedback.issuesDetected,
                "injuryRisk": feedback.injuryRisk,
                "focusAreas": feedback.focusAreas,
                "nextRepFocus": feedback.nextRepFocus
            }
        except Exception as railtracks_error:
            logger.warning(f"⚠️  Railtracks failed: {type(railtracks_error).__name__}")
            logger.warning("📞 Falling back to direct Gemini API...")
            
            # Fallback 1: Use direct Gemini API
            fallback_result = await call_gemini_directly(analysis_prompt)
            
            if fallback_result:
                logger.info(f"✓ Direct Gemini API succeeded: score={fallback_result['form_score']:.2f}")
                return {
                    "success": True,
                    "formScore": fallback_result.get("form_score", 0.75),
                    "feedback": fallback_result.get("feedback", []),
                    "issuesDetected": fallback_result.get("issues_detected", []),
                    "injuryRisk": fallback_result.get("injury_risk", "low"),
                    "focusAreas": fallback_result.get("focus_areas", []),
                    "nextRepFocus": fallback_result.get("next_rep_focus", "")
                }
            
            # Fallback 2: Try OpenRouter if Gemini failed
            logger.warning("📞 Attempting OpenRouter API as second fallback...")
            openrouter_result = await call_openrouter_directly(analysis_prompt)
            
            if openrouter_result:
                logger.info(f"✓ OpenRouter API succeeded: score={openrouter_result['form_score']:.2f}")
                return {
                    "success": True,
                    "formScore": openrouter_result.get("form_score", 0.75),
                    "feedback": openrouter_result.get("feedback", []),
                    "issuesDetected": openrouter_result.get("issues_detected", []),
                    "injuryRisk": openrouter_result.get("injury_risk", "low"),
                    "focusAreas": openrouter_result.get("focus_areas", []),
                    "nextRepFocus": openrouter_result.get("next_rep_focus", "")
                }
            
            # Fallback 3: All APIs failed
            raise Exception("Railtracks, Gemini API, and OpenRouter all failed")
    
    except Exception as e:
        logger.error(f"✗ Error in form analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return fallback basic analysis based on metrics
        logger.info("📊 Using basic form analysis fallback")
        basic_score = (
            exercise_metrics.depth_score * 0.3 +
            exercise_metrics.stability_score * 0.3 +
            exercise_metrics.symmetry_score * 0.2 +
            exercise_metrics.knee_alignment * 0.2
        )
        
        feedback_tips = []
        
        if exercise_metrics.depth_score < 0.7:
            feedback_tips.append("Increase your range of motion - go deeper into the movement")
        if exercise_metrics.stability_score < 0.7:
            feedback_tips.append("Focus on stability - engage your core and maintain balance")
        if exercise_metrics.symmetry_score < 0.7:
            feedback_tips.append("Work on symmetry - make sure both sides are aligned equally")
        if exercise_metrics.knee_alignment < 0.7:
            feedback_tips.append("Improve knee tracking - keep knees aligned over your feet")
        
        if not feedback_tips:
            feedback_tips = ["Great form! Keep it up", "Focus on consistency", "Maintain your current pace"]
        
        return {
            "success": False,
            "formScore": basic_score,
            "feedback": feedback_tips,
            "issuesDetected": ["API unavailable - using local analysis"],
            "injuryRisk": "low" if basic_score > 0.7 else "medium",
            "focusAreas": ["Overall form improvement"],
            "nextRepFocus": "Maintain current form quality"
        }


@rt.function_node
async def generate_workout_plan(
    user_profile: UserProfileInput,
    goal: str,
    days_per_week: int = 4
) -> dict:
    """
    Generate a personalized workout plan
    
    Args:
        user_profile: User profile data
        goal: Fitness goal  
        days_per_week: Number of training days per week
        
    Returns:
        Workout plan
    """
    try:
        
        # Ensure valid days per week
        days_per_week = max(1, min(7, days_per_week))
        
        plan_prompt = f"""
Create a personalized {days_per_week}-day per week workout plan based on:

USER PROFILE:
- Fitness Level: {user_profile.fitnessLevel or 'intermediate'}
- Age: {user_profile.age or 'not specified'}
- Height: {user_profile.height}cm
- Weight: {user_profile.weight}kg
- Known Injuries: {', '.join(user_profile.injuries) if user_profile.injuries else 'None'}
- Medical Conditions: {', '.join(user_profile.medicalConditions) if user_profile.medicalConditions else 'None'}
- Restrictions: {', '.join(user_profile.restrictions) if user_profile.restrictions else 'None'}

FITNESS GOAL: {goal}
TRAINING DAYS PER WEEK: {days_per_week}

Include:
- Clear day-by-day breakdown with focus areas
- Specific exercises with sets, reps, and weight guidance
- Progressive overload strategy
- Warm-up and cooldown recommendations
- Safety considerations and important coaching cues
- Rest recommendations
- Important tips for success

Format with:
- Each day having a clear focus (e.g., "Upper Body Strength")
- List exercises with Exercise Name, Sets x Reps (e.g., "Bench Press 4x6")
- Include modifications or progressions where relevant
- Add brief daily notes about intensity or technique

Make it practical, detailed, and immediately actionable.
"""
        
        logger.info(f"📤 Calling Workout Plan Agent for goal: {goal}")
        
        plan = await rt.call(WorkoutPlanAgent, plan_prompt)
        
        logger.info(f"✓ Workout plan generated: {plan.title} ({len(plan.schedule)} days)")
        
        return {
            "success": True,
            "plan": {
                "title": plan.title,
                "duration": plan.duration,
                "goal": plan.goal,
                "schedule": [
                    {
                        "day": d.day,
                        "focus": d.focus,
                        "exercises": [
                            {
                                "name": e.name,
                                "sets": e.sets,
                                "reps": e.reps,
                                "weight": e.weight,
                                "modifications": e.modifications
                            } for e in d.exercises
                        ],
                        "notes": d.notes
                    } for d in plan.schedule
                ],
                "tips": plan.tips,
                "safetyNotes": plan.safetyNotes
            }
        }
    
    except Exception as e:
        logger.error(f"✗ Error generating workout plan: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "plan": None
        }


# ============================================================================
# PUBLIC API CLASS (for API server compatibility)
# ============================================================================

class RailtracksFitnessAgent:
    """Public synchronous API for the Railtracks Fitness Agent"""
    
    def analyze_live_exercise(self, user_profile: dict, exercise_metrics: dict) -> dict:
        """
        Analyze live exercise form (synchronous)
        
        Args:
            user_profile: User profile dictionary
            exercise_metrics: Exercise metrics dictionary
            
        Returns:
            Form analysis dictionary
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            # Convert dicts to Pydantic models
            user_profile_model = UserProfileInput(**user_profile)
            exercise_metrics_model = ExerciseMetricsInput(**exercise_metrics)
            
            return loop.run_until_complete(
                analyze_exercise_form(user_profile_model, exercise_metrics_model)
            )
        except Exception as e:
            logger.error(f"Error in analyze_live_exercise: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "formScore": 0.0,
                "feedback": ["Error analyzing form"],
                "issuesDetected": [],
                "injuryRisk": "unknown"
            }
    
    def generate_workout_plan(
        self,
        user_profile: dict,
        goal: str,
        workout_type: Optional[str] = None,
        days_per_week: int = 4
    ) -> dict:
        """
        Generate workout plan (synchronous)
        
        Args:
            user_profile: User profile dictionary
            goal: Fitness goal
            workout_type: Optional workout type
            days_per_week: Days per week (default: 4)
            
        Returns:
            Workout plan dictionary
        """
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                raise RuntimeError("Event loop is closed")
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        try:
            # Convert dict to Pydantic model
            user_profile_model = UserProfileInput(**user_profile)
            
            return loop.run_until_complete(
                generate_workout_plan(user_profile_model, goal, days_per_week)
            )
        except Exception as e:
            logger.error(f"Error in generate_workout_plan: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "plan": None
            }


# Create singleton instance
agent = RailtracksFitnessAgent()
