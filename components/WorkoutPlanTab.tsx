"use client";

import { useState } from "react";
import { getUserProfile, generateProfileContext } from "@/app/lib/userProfile";
import Toast from "./Toast";

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
  notes?: string;
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  duration?: string;
}

interface WorkoutPlan {
  title: string;
  duration: string;
  goal: string;
  schedule: WorkoutDay[];
  tips: string[];
}

interface WorkoutPlanTabProps {
  onPlanSelected?: (plan: WorkoutPlan) => void;
}

export default function WorkoutPlanTab({ onPlanSelected }: WorkoutPlanTabProps) {
  const [goalInput, setGoalInput] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const handleGeneratePlan = async () => {
    if (!goalInput.trim()) {
      setError("Please describe your workout goals");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Get user profile context
      const userProfile = getUserProfile();
      const profileContext = generateProfileContext(userProfile);

      const response = await fetch("/api/generate-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          goal: goalInput,
          userProfile: profileContext || undefined
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate workout plan");
      }

      const data = await response.json();
      setWorkoutPlan(data.plan);
      setToast({ message: "Workout plan generated!", type: "success" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate plan";
      setError(errorMessage);
      setToast({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-6">Workout Plan</h1>

      {/* Input Section */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <label className="block text-sm font-semibold mb-3">Describe Your Fitness Goal</label>
        <textarea
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="E.g., I want to build muscle and improve strength. I have 5 days per week to train..."
          className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] 
                     dark:text-white text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
        />
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className={`w-full py-2 rounded-lg font-semibold transition-colors ${
            loading
              ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90"
          }`}
        >
          {loading ? "Generating..." : "Generate Workout Plan"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Workout Plan Display */}
      {workoutPlan && (
        <div className="space-y-4">
          {/* Plan Header */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
            <h2 className="text-lg font-bold mb-1">{workoutPlan.title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Goal: <span className="font-semibold text-primary">{workoutPlan.goal}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Duration: <span className="font-semibold">{workoutPlan.duration}</span>
            </p>
          </div>

          {/* Tips Section */}
          {workoutPlan.tips && workoutPlan.tips.length > 0 && (
            <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span> Training Tips
              </h3>
              <ul className="space-y-2">
                {workoutPlan.tips.map((tip, idx) => (
                  <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Choose Plan Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                if (onPlanSelected) {
                  onPlanSelected(workoutPlan);
                  setToast({ message: "Plan selected! Start tracking your workouts.", type: "success" });
                }
              }}
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Choose This Plan
            </button>
          </div>

          {/* Schedule Section */}
          <div>
            <h3 className="font-semibold mb-3">Weekly Schedule</h3>
            <div className="space-y-2">
              {workoutPlan.schedule.map((day, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                  className="w-full p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 
                           text-left hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{day.day}</h4>
                      {day.exercises && day.exercises.length > 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {day.exercises.length} exercises
                        </p>
                      )}
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedDay === day.day ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>

                  {/* Expanded Details */}
                  {expandedDay === day.day && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {day.exercises && day.exercises.length > 0 ? (
                        day.exercises.map((exercise, exIdx) => (
                          <div key={exIdx} className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                            <h5 className="font-medium text-sm">{exercise.name}</h5>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                              {exercise.sets && exercise.reps && (
                                <p>
                                  Sets × Reps: <span className="font-semibold">{exercise.sets} × {exercise.reps}</span>
                                </p>
                              )}
                              {exercise.weight && (
                                <p>
                                  Weight: <span className="font-semibold">{exercise.weight}</span>
                                </p>
                              )}
                              {exercise.duration && (
                                <p>
                                  Duration: <span className="font-semibold">{exercise.duration}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {day.notes || "Rest day"}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!workoutPlan && !loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">
            Describe your fitness goals to generate a personalized workout plan
          </p>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
