"""
Configuration and utility module for Railtracks Fitness Agent
"""

import os
from typing import Dict, List, Optional
from dataclasses import dataclass


# ============================================================================
# CONFIGURATION
# ============================================================================

@dataclass
class AgentConfig:
    """Agent configuration settings"""
    
    # API Settings
    API_PORT: int = 5001
    API_HOST: str = "0.0.0.0"
    DEBUG_MODE: bool = True
    
    # Gemini Model Settings
    MODEL_NAME: str = "gemini-2.0-flash"
    MAX_TOKENS: int = 2000
    TEMPERATURE: float = 0.7
    
    # Agent Settings
    ENABLE_CACHING: bool = True
    MAX_WORKERS: int = 4
    TIMEOUT_SECONDS: int = 30
    
    # Feature Flags
    ENABLE_RISK_ASSESSMENT: bool = True
    ENABLE_FORM_ANALYSIS: bool = True
    ENABLE_COACHING_FEEDBACK: bool = True
    ENABLE_WORKOUT_GENERATION: bool = True
    
    @classmethod
    def from_env(cls) -> "AgentConfig":
        """Load configuration from environment variables"""
        return cls(
            API_PORT=int(os.getenv("AGENT_API_PORT", 5001)),
            API_HOST=os.getenv("AGENT_API_HOST", "0.0.0.0"),
            DEBUG_MODE=os.getenv("AGENT_DEBUG", "true").lower() == "true",
            MODEL_NAME=os.getenv("AGENT_MODEL", "gemini-2.0-flash"),
            MAX_TOKENS=int(os.getenv("AGENT_MAX_TOKENS", 2000)),
            TEMPERATURE=float(os.getenv("AGENT_TEMPERATURE", 0.7)),
        )


# ============================================================================
# EXERCISE REFERENCE DATA
# ============================================================================

EXERCISE_LIBRARIES = {
    "strength_training": [
        "squat", "deadlift", "bench_press", "overhead_press", "barbell_row",
        "pull_up", "dumbbell_bench", "dumbbell_row", "barbell_curl",
        "tricep_dip", "leg_press", "leg_curl", "leg_extension"
    ],
    "cardio": [
        "running", "cycling", "rowing", "jump_rope", "elliptical",
        "burpees", "mountain_climbers", "jumping_jacks", "sprints"
    ],
    "mobility": [
        "stretching", "yoga", "foam_rolling", "mobility_drills",
        "dynamic_stretches", "static_stretches", "joint_mobility"
    ],
    "plyometrics": [
        "box_jump", "jump_squat", "clap_pushup", "plyometric_lunge",
        "medicine_ball_throw", "bounding", "depth_jump"
    ]
}

EXERCISE_CATEGORIES = {
    "upper_body": [
        "pushup", "bench_press", "pull_up", "row", "overhead_press",
        "barbell_curl", "tricep_dip", "shoulder_press"
    ],
    "lower_body": [
        "squat", "deadlift", "lunge", "leg_press", "leg_curl",
        "leg_extension", "hip_thrust", "calf_raise"
    ],
    "core": [
        "plank", "dead_bug", "bird_dog", "pallof_press", "ab_wheel",
        "cable_chop", "anti_rotation_exercise"
    ],
    "full_body": [
        "burpee", "kettlebell_swing", "clean_and_jerk", "snatch",
        "functional_movement_circuit"
    ]
}


# ============================================================================
# FITNESS LEVEL DEFINITIONS
# ============================================================================

FITNESS_LEVEL_SPECS = {
    "beginner": {
        "description": "Less than 1 year of consistent training experience",
        "characteristics": [
            "Learning proper form",
            "Building foundational strength",
            "Limited exercise complexity",
            "Lower volume and intensity"
        ],
        "training_variables": {
            "reps_range": (8, 12),
            "sets_range": (2, 3),
            "frequency": (2, 3),
            "intensity": "60-70% of 1RM",
            "rest_between_sets": "2-3 minutes"
        }
    },
    "intermediate": {
        "description": "1-3 years of consistent training experience",
        "characteristics": [
            "Good form understanding",
            "Building strength and muscle",
            "Progressive overload awareness",
            "Moderate volume and intensity"
        ],
        "training_variables": {
            "reps_range": (6, 12),
            "sets_range": (3, 4),
            "frequency": (3, 5),
            "intensity": "70-85% of 1RM",
            "rest_between_sets": "1.5-2.5 minutes"
        }
    },
    "advanced": {
        "description": "3+ years of consistent training experience",
        "characteristics": [
            "Excellent form and body awareness",
            "Advanced programming knowledge",
            "High volume and intensity tolerance",
            "Sport-specific or specialized goals"
        ],
        "training_variables": {
            "reps_range": (1, 12),
            "sets_range": (3, 6),
            "frequency": (4, 6),
            "intensity": "75-95% of 1RM",
            "rest_between_sets": "1-3 minutes"
        }
    }
}


# ============================================================================
# COMMON INJURIES AND MODIFICATIONS
# ============================================================================

INJURY_MODIFICATIONS = {
    "knee injury": {
        "avoid_exercises": [
            "deep squat", "full range lunge", "pistol squat",
            "jumping movements", "knee-intensive plyometrics"
        ],
        "modifications": {
            "squat": "Use partial range of motion (box squat to parallel)",
            "deadlift": "Elevate bar with plates, use trap bar deadlift",
            "lunge": "Use wall for support or walking lunges",
            "running": "Switch to cycling or rowing"
        },
        "benefits": "Avoid" + " exercises that stress the knee while strength building."
    },
    "lower back injury": {
        "avoid_exercises": [
            "heavy deadlift", "heavy barbell row", "heavy squat",
            "spinal flexion movements", "full ab crunches"
        ],
        "modifications": {
            "deadlift": "Trap bar deadlift, avoid excessive spine flexion",
            "squat": "Goblet squat, maintain neutral spine",
            "row": "Seal row or machine row with neutral spine",
            "core_work": "Planks, dead bugs, pall ofs, anti-rotation"
        },
        "benefits": "Focus on neutral spine and core stability work."
    },
    "shoulder injury": {
        "avoid_exercises": [
            "overhead pressing", "pull ups", "bench press",
            "behind-neck exercises", "overhead throws"
        ],
        "modifications": {
            "pressing": "Use incline press, neutral grip press (neutral bar)",
            "pulling": "Seal rows, resistance band rows, scapular work",
            "cardio": "Rowing machine OK, avoid swimming and throwing"
        },
        "benefits": "Focus on scapular stability and controlled movement."
    }
}


# ============================================================================
# BIOMECHANICAL CUES AND COACHING TIPS
# ============================================================================

EXERCISE_COACHING_CUES = {
    "squat": {
        "setup": [
            "Feet shoulder-width apart",
            "Toes slightly turned out (5-10 degrees)",
            "Weight distributed evenly across feet"
        ],
        "descent": [
            "Drive hips back and down",
            "Maintain neutral spine",
            "Keep chest upright",
            "Knees track over toes",
            "Controlled descent (2-3 seconds)"
        ],
        "ascent": [
            "Drive through heels",
            "Knees extend before hips (or together)",
            "Maintain neutral spine",
            "Controlled ascent (1-2 seconds)"
        ],
        "common_mistakes": [
            "Knees collapsing inward (valgus collapse)",
            "Excessive forward lean",
            "Shallow depth",
            "Heels lifting off ground",
            "Rounding of lumbar spine"
        ]
    },
    "deadlift": {
        "setup": [
            "Feet hip-width apart",
            "Barbell over midfoot (not toes, not heels)",
            "Shoulders over or slightly in front of bar",
            "Neutral spine (not hyperextended)"
        ],
        "descent": [
            "Initiate by pushing hips back",
            "Keep bar close to body",
            "Lower with control (3-4 seconds)",
            "Maintain neutral spine throughout"
        ],
        "ascent": [
            "Drive through heels",
            "Maintain neutral spine",
            "Bar should travel in straight vertical path",
            "Full hip and knee extension"
        ],
        "common_mistakes": [
            "Starting with hips too high",
            "Excessive back rounding",
            "Bar drifting away from body",
            "Incomplete hip extension (short arms)"
        ]
    },
    "lunge": {
        "setup": [
            "Feet about hip-width apart",
            "Core engaged",
            "Chest upright"
        ],
        "descent": [
            "Step forward with control",
            "Front knee bends to 90 degrees",
            "Back knee lowers toward floor",
            "Both knees at approximately 90 degrees"
        ],
        "ascent": [
            "Drive through front heel",
            "Return to standing position",
            "Maintain upright torso"
        ],
        "common_mistakes": [
            "Front knee caving inward",
            "Excessive forward lean",
            "Insufficient depth",
            "Uneven bilateral positioning"
        ]
    },
    "pushup": {
        "setup": [
            "Hands slightly wider than shoulders",
            "Body in straight line from head to heels",
            "Core engaged",
            "Eyes slightly ahead (not straight down)"
        ],
        "descent": [
            "Lower body with control (2-3 seconds)",
            "Elbows at ~45 degrees from body",
            "Chest should nearly touch floor",
            "Maintain straight body line"
        ],
        "ascent": [
            "Push straight up with control (1-2 seconds)",
            "Maintain straight body line",
            "Shoulder blades retracted"
        ],
        "common_mistakes": [
            "Hips sagging (broken body line)",
            "Excessive elbow flare (elbows too far out)",
            "Head dropping forward",
            "Insufficient depth",
            "Uneven left-right pressing"
        ]
    }
}


# ============================================================================
# FORM SCORE INTERPRETATION
# ============================================================================

FORM_SCORE_LEVELS = {
    (0.9, 1.0): {
        "level": "Excellent",
        "description": "Perfect or near-perfect form",
        "feedback": "Excellent form! You can progress weight or reps.",
        "recommendation": "Increase intensity, add weight, or increase volume"
    },
    (0.8, 0.9): {
        "level": "Very Good",
        "description": "Form is very good with minor issues",
        "feedback": "Very good form! Minor adjustments for perfection.",
        "recommendation": "Maintain current intensity, focus on consistency"
    },
    (0.7, 0.8): {
        "level": "Good",
        "description": "Form is acceptable but has some issues",
        "feedback": "Good form. Address the detected issues before progressing.",
        "recommendation": "Focus on form correction, reduce weight if needed"
    },
    (0.6, 0.7): {
        "level": "Fair",
        "description": "Form needs improvement",
        "feedback": "Form needs improvement. Review coaching cues.",
        "recommendation": "Reduce weight/intensity, practice with lighter load"
    },
    (0.5, 0.6): {
        "level": "Poor",
        "description": "Form has significant issues",
        "feedback": "Form has significant issues. Take a break and reset.",
        "recommendation": "Significantly reduce weight, focus on form drills"
    },
    (0.0, 0.5): {
        "level": "Very Poor",
        "description": "Form breakdown",
        "feedback": "Stop. Form has broken down significantly.",
        "recommendation": "Stop set, reset, and try with much lighter weight or video analysis"
    }
}


def get_form_assessment(score: float) -> Dict[str, str]:
    """Get form assessment based on score"""
    for (min_score, max_score), assessment in FORM_SCORE_LEVELS.items():
        if min_score <= score < max_score:
            return assessment
    return FORM_SCORE_LEVELS[(0.0, 0.5)]


# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def normalize_exercise_name(exercise: str) -> str:
    """Normalize exercise name for consistency"""
    return exercise.lower().strip().replace(" ", "_")


def get_exercise_category(exercise: str) -> Optional[str]:
    """Get category for an exercise"""
    normalized = normalize_exercise_name(exercise)
    
    for category, exercises in EXERCISE_CATEGORIES.items():
        if any(normalized == e.strip().replace(" ", "_") for e in exercises):
            return category
    
    return None


def validate_profile(profile: Dict) -> tuple[bool, Optional[str]]:
    """Validate user profile data"""
    
    # Check for invalid fitness level
    if "fitness_level" in profile and profile["fitness_level"]:
        valid_levels = ["beginner", "intermediate", "advanced"]
        if profile["fitness_level"] not in valid_levels:
            return False, f"Invalid fitness level. Must be one of: {', '.join(valid_levels)}"
    
    # Check for negative values
    if "age" in profile and profile["age"] and profile["age"] < 0:
        return False, "Age cannot be negative"
    
    if "weight" in profile and profile["weight"] and profile["weight"] < 0:
        return False, "Weight cannot be negative"
    
    if "height" in profile and profile["height"] and profile["height"] < 0:
        return False, "Height cannot be negative"
    
    return True, None


def validate_metrics(metrics: Dict) -> tuple[bool, Optional[str]]:
    """Validate exercise metrics"""
    
    if not metrics.get("exercise"):
        return False, "Exercise name is required"
    
    # Check score ranges
    for score_field in ["depth_score", "stability_score", "symmetry_score", "knee_alignment"]:
        if score_field in metrics and metrics[score_field] is not None:
            if not 0 <= metrics[score_field] <= 1:
                return False, f"{score_field} must be between 0 and 1"
    
    # Check rep count
    if "rep_count" in metrics and metrics["rep_count"] is not None:
        if metrics["rep_count"] < 0:
            return False, "Rep count cannot be negative"
    
    return True, None


# ============================================================================
# WORKOUT PLAN TEMPLATES
# ============================================================================

WORKOUT_TEMPLATES = {
    "upper_lower": {
        "name": "Upper/Lower Split",
        "duration": "8 weeks",
        "frequency": 4,
        "description": "Alternating upper and lower body days",
        "suitable_for": ["intermediate", "advanced"]
    },
    "push_pull_legs": {
        "name": "Push/Pull/Legs",
        "duration": "8-12 weeks",
        "frequency": 3,
        "description": "One day for pushing, one for pulling, one for legs",
        "suitable_for": ["intermediate", "advanced"]
    },
    "full_body": {
        "name": "Full Body",
        "duration": "6-8 weeks",
        "frequency": 3,
        "description": "Each session targets all main movement patterns",
        "suitable_for": ["beginner", "intermediate"]
    },
    "body_parts": {
        "name": "Body Part Split",
        "duration": "8-12 weeks",
        "frequency": 5,
        "description": "One muscle group per day",
        "suitable_for": ["intermediate", "advanced"]
    }
}
