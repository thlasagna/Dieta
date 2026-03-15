/**
 * Type definitions for Railtracks Fitness Agent
 * Use these types in your Next.js app for type-safe integration
 * 
 * File: app/types/railtracks.ts
 */

/**
 * User Fitness Profile
 */
export interface UserProfile {
  // Basic Info
  name?: string;
  age?: number;
  
  // Physical Metrics
  height?: number;  // cm
  weight?: number;  // kg
  gender?: "male" | "female" | "other";
  
  // Fitness Level
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  yearsOfTraining?: number;
  
  // Health Information
  injuries?: string[];
  medicalConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  
  // Lifestyle
  availableHoursPerWeek?: number;
  preferredExerciseTypes?: string[];
  
  // Goals
  primaryGoal?: string;
  secondaryGoals?: string[];
  
  // Preferences
  equipment?: string[];
  restrictions?: string[];
  
  // Metadata
  lastUpdated?: string;
}

/**
 * Exercise Metrics from Pose Detection
 */
export interface ExerciseMetrics {
  exercise: string;
  rep_count: number;
  depth_score?: number;  // 0-1
  stability_score?: number;  // 0-1
  symmetry_score?: number;  // 0-1
  knee_alignment?: number;  // 0-1
  back_angle?: number;  // degrees
  additional_metrics?: Record<string, number>;
}

/**
 * Form Analysis Feedback
 */
export interface FormFeedback {
  formScore: number;  // 0-1
  issuesDetected: string[];
  injuryRisk: "low" | "medium" | "high";
  feedback: string[];  // Actionable coaching tips
  focusAreas?: string[];
  nextRepFocus?: string;
}

/**
 * Single Exercise in Workout Plan
 */
export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  duration?: string;
  modifications?: string;
}

/**
 * Single Day in Workout Plan
 */
export interface WorkoutDay {
  day: string;  // "Monday", "Tuesday", etc.
  focus: string;  // "Upper Body", "Cardio", etc.
  exercises: WorkoutExercise[];
  notes?: string;
}

/**
 * Complete Workout Plan
 */
export interface WorkoutPlan {
  title: string;
  duration: string;  // e.g., "8 weeks"
  goal: string;
  schedule: WorkoutDay[];
  tips: string[];
  safetyNotes?: string[];
}

/**
 * Injury Risk Assessment
 */
export interface InjuryRiskAssessment {
  riskLevel: "low" | "medium" | "high";
  detectedIssues: string[];
  recommendations: string[];
  details?: {
    biomechanicalIssues: string[];
    riskFactors: string[];
    metricsSummary: {
      depth_score: number;
      stability_score: number;
      symmetry_score: number;
      knee_alignment: number;
    };
  };
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Workout Plan Request
 */
export interface GenerateWorkoutRequest {
  userProfile: UserProfile;
  goal: string;
  workoutType?: string;
  daysPerWeek?: number;
}

/**
 * Workout Plan Response
 */
export interface GenerateWorkoutResponse {
  success: boolean;
  plan?: WorkoutPlan;
  error?: string;
  metadata?: {
    goal: string;
    fitness_level?: string;
    duration?: string;
    days_per_week?: number;
    safety_notes?: string[];
  };
}

/**
 * Exercise Analysis Request
 */
export interface AnalyzeExerciseRequest {
  userProfile: UserProfile;
  exerciseMetrics: ExerciseMetrics;
}

/**
 * Exercise Analysis Response
 */
export interface AnalyzeExerciseResponse {
  success: boolean;
  feedback?: FormFeedback;
  error?: string;
  metadata?: {
    exercise: string;
    rep_count: number;
    analysis_timestamp: string;
  };
}

/**
 * Risk Assessment Request
 */
export interface RiskAssessmentRequest {
  userProfile: UserProfile;
  exercise: string;
  metrics: Partial<ExerciseMetrics>;
}

/**
 * Risk Assessment Response
 */
export interface RiskAssessmentResponse {
  success: boolean;
  risk_level?: "low" | "medium" | "high";
  detected_issues?: string[];
  recommendations?: string[];
  details?: any;
  error?: string;
}

/**
 * Health Check Response
 */
export interface HealthCheckResponse {
  status: "healthy" | "unhealthy";
  service: string;
  version?: string;
  timestamp?: string;
}

/**
 * Agent Capabilities Response
 */
export interface CapabilitiesResponse {
  capabilities: string[];
  supported_exercises: string[];
  supported_goals: string[];
}

/**
 * Form Score Interpretation
 */
export type FormScoreLevel = "Excellent" | "Very Good" | "Good" | "Fair" | "Poor" | "Very Poor";

export interface FormScoreAssessment {
  level: FormScoreLevel;
  description: string;
  feedback: string;
  recommendation: string;
}

/**
 * Workout Template Type
 */
export interface WorkoutTemplate {
  name: string;
  duration: string;
  frequency: number;
  description: string;
  suitable_for: ("beginner" | "intermediate" | "advanced")[];
}

/**
 * Exercise Category
 */
export type ExerciseCategory =
  | "upper_body"
  | "lower_body"
  | "core"
  | "full_body"
  | "cardio"
  | "mobility"
  | "plyometrics";

/**
 * Fitness Goal
 */
export enum FitnessGoal {
  BUILD_STRENGTH = "build_strength",
  BUILD_MUSCLE = "build_muscle",
  LOSE_WEIGHT = "lose_weight",
  IMPROVE_ENDURANCE = "improve_endurance",
  INCREASE_MOBILITY = "increase_mobility",
  GENERAL_FITNESS = "general_fitness",
  ATHLETIC_PERFORMANCE = "athletic_performance",
}

/**
 * Fitness Level
 */
export enum FitnessLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

/**
 * Risk Level
 */
export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

/**
 * API Endpoints Constants
 */
export const RAILTRACKS_ENDPOINTS = {
  HEALTH: "/api/railtracks/health",
  CAPABILITIES: "/api/railtracks/capabilities",
  GENERATE_WORKOUT: "/api/railtracks/workout-plan",
  ANALYZE_EXERCISE: "/api/railtracks/analyze-exercise",
  RISK_ASSESSMENT: "/api/railtracks/risk-assessment",
} as const;

/**
 * Predefined Exercise Lists
 */
export const SUPPORTED_EXERCISES = {
  STRENGTH: [
    "squat",
    "deadlift",
    "bench_press",
    "overhead_press",
    "barbell_row",
    "pull_up",
    "dumbbell_bench",
    "dumbbell_row",
    "barbell_curl",
    "tricep_dip",
  ],
  CARDIO: [
    "running",
    "cycling",
    "rowing",
    "jump_rope",
    "elliptical",
    "burpees",
  ],
  MOBILITY: [
    "stretching",
    "yoga",
    "foam_rolling",
    "dynamic_stretches",
  ],
} as const;

/**
 * Hook-ready types
 */
export type UseWorkoutPlanState = {
  plan: WorkoutPlan | null;
  loading: boolean;
  error: string | null;
};

export type UseExerciseAnalysisState = {
  feedback: FormFeedback | null;
  loading: boolean;
  error: string | null;
};

export type UseRiskAssessmentState = {
  assessment: InjuryRiskAssessment | null;
  loading: boolean;
  error: string | null;
};

/**
 * Hook return types for React
 */
export interface UseWorkoutPlanResult extends UseWorkoutPlanState {
  generatePlan: (request: GenerateWorkoutRequest) => Promise<void>;
  reset: () => void;
}

export interface UseExerciseAnalysisResult extends UseExerciseAnalysisState {
  analyze: (request: AnalyzeExerciseRequest) => Promise<void>;
  reset: () => void;
}

export interface UseRiskAssessmentResult extends UseRiskAssessmentState {
  assess: (request: RiskAssessmentRequest) => Promise<void>;
  reset: () => void;
}

/**
 * Coaching Feedback Type
 */
export interface CoachingTip {
  text: string;
  priority: "high" | "medium" | "low";
  category: "form" | "safety" | "progression" | "motivation";
}

/**
 * Workout Statistics
 */
export interface WorkoutStats {
  totalDays: number;
  trainingDays: number;
  restDays: number;
  totalExercises: number;
  estimatedDurationWeeks: number;
}

/**
 * Exercise Form State
 */
export interface ExerciseFormState {
  exercise: string;
  currentRep: number;
  totalReps: number;
  formScore: number;
  lastFeedback: FormFeedback | null;
  isAnalyzing: boolean;
}

/**
 * Utility type for response handling
 */
export type ApiResult<T> = 
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Coaching feedback categories
 */
export const COACHING_CATEGORIES = {
  FORM: "form",
  SAFETY: "safety",
  PROGRESSION: "progression",
  MOTIVATION: "motivation",
} as const;

/**
 * Risk level colors for UI
 */
export const RISK_COLORS = {
  low: "#10b981",    // green
  medium: "#f59e0b",  // yellow
  high: "#ef4444",    // red
} as const;

/**
 * Form score color mapping
 */
export const FORM_SCORE_COLORS = {
  excellent: "#10b981",
  veryGood: "#84cc16",
  good: "#eab308",
  fair: "#f59e0b",
  poor: "#ef4444",
  veryPoor: "#dc2626",
} as const;
