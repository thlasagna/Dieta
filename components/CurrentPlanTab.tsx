"use client";

import { useState, useEffect } from "react";
import Toast from "./Toast";

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  duration?: string;
}

interface WorkoutDay {
  day: string;
  exercises: Exercise[];
  notes?: string;
}

interface WorkoutPlan {
  title: string;
  duration: string;
  goal: string;
  schedule: WorkoutDay[];
  tips: string[];
}

interface WorkoutLog {
  date: string;
  day: string;
  exercises: {
    name: string;
    completed: boolean;
    weight?: string;
    reps?: number;
    sets?: number;
    notes?: string;
  }[];
}

export default function CurrentPlanTab() {
  const [currentPlan, setCurrentPlan] = useState<WorkoutPlan | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loggedDate, setLoggedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDayForLog, setSelectedDayForLog] = useState<string | null>(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [logDetails, setLogDetails] = useState<{
    [key: string]: { completed: boolean; weight?: string; reps?: string; sets?: string; notes?: string };
  }>({});

  useEffect(() => {
    // Load current plan and logs from localStorage
    const savedPlan = localStorage.getItem("current_workout_plan");
    const savedLogs = localStorage.getItem("workout_logs");

    if (savedPlan) {
      setCurrentPlan(JSON.parse(savedPlan));
    }
    if (savedLogs) {
      setWorkoutLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Retrieve the day's workout from plan
  const getCurrentDayWorkout = () => {
    if (!currentPlan) return null;

    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = new Date(loggedDate).getDay();
    const dayName = days[dayIndex];

    return currentPlan.schedule.find((d) => d.day === dayName) || null;
  };

  // Check if a workout for a day is already logged
  const getLogForDay = (date: string, dayName: string) => {
    return workoutLogs.find((log) => log.date === date && log.day === dayName);
  };

  // Handle logging a workout
  const handleLogWorkout = () => {
    if (!selectedDayForLog) return;

    const dayWorkout = currentPlan?.schedule.find((d) => d.day === selectedDayForLog);
    if (!dayWorkout) return;

    const newLog: WorkoutLog = {
      date: loggedDate,
      day: selectedDayForLog,
      exercises: dayWorkout.exercises.map((ex) => ({
        name: ex.name,
        completed: logDetails[ex.name]?.completed || false,
        weight: logDetails[ex.name]?.weight || ex.weight,
        reps: logDetails[ex.name]?.reps ? parseInt(logDetails[ex.name]?.reps || "0", 10) : ex.reps,
        sets: logDetails[ex.name]?.sets ? parseInt(logDetails[ex.name]?.sets || "0", 10) : ex.sets,
        notes: logDetails[ex.name]?.notes,
      })),
    };

    // Remove old log for this date/day if exists
    const updatedLogs = workoutLogs.filter((log) => !(log.date === loggedDate && log.day === selectedDayForLog));
    updatedLogs.push(newLog);

    setWorkoutLogs(updatedLogs);
    localStorage.setItem("workout_logs", JSON.stringify(updatedLogs));

    setToast({ message: `Workout logged for ${selectedDayForLog}!`, type: "success" });
    setShowLogForm(false);
    setLogDetails({});
    setSelectedDayForLog(null);
  };

  // Get current day workout
  const currentDayWorkout = getCurrentDayWorkout();
  const currentDayLog = currentDayWorkout ? getLogForDay(loggedDate, currentDayWorkout.day) : null;

  if (!currentPlan) {
    return (
      <div className="pb-28 px-4 pt-4">
        <h1 className="text-2xl font-bold mb-6">Current Plan</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 mb-4">No plan selected yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Go to Workouts tab to generate and select a plan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-2">Current Plan</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{currentPlan.title}</p>

      {/* Plan Header */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Goal</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300 line-clamp-2">{currentPlan.goal}</p>
          </div>
          <div className="border-l border-r border-green-200 dark:border-green-800">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Duration</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">{currentPlan.duration}</p>
          </div>
          <div>
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Status</p>
            <p className="text-sm font-bold text-green-700 dark:text-green-300">Active</p>
          </div>
        </div>
      </div>

      {/* Today's Workout */}
      {currentDayWorkout && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Today's Workout</h2>
          <div className="p-4 rounded-2xl border-2 border-primary/30 bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="font-bold text-primary text-lg mb-3">{currentDayWorkout.day}</h3>

            {currentDayWorkout.exercises.length > 0 ? (
              <>
                <div className="space-y-2 mb-4">
                  {currentDayWorkout.exercises.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-[#141414] rounded-lg">
                      <input
                        type="checkbox"
                        checked={currentDayLog?.exercises[idx]?.completed || false}
                        disabled={!currentDayLog}
                        className="w-5 h-5 text-primary rounded focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{ex.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {ex.sets} × {ex.reps} {ex.weight && `@ ${ex.weight}`}
                        </p>
                      </div>
                      {currentDayLog && currentDayLog.exercises[idx]?.completed && <span className="text-green-500 font-bold">✓</span>}
                    </div>
                  ))}
                </div>

                {!currentDayLog ? (
                  <button
                    onClick={() => {
                      setSelectedDayForLog(currentDayWorkout.day);
                      setShowLogForm(true);
                      // Initialize log details with exercise data
                      const details: {
                        [key: string]: { completed: boolean; weight?: string; reps?: string; sets?: string; notes?: string };
                      } = {};
                      currentDayWorkout.exercises.forEach((ex) => {
                        details[ex.name] = {
                          completed: false,
                          weight: ex.weight || "",
                          reps: ex.reps.toString(),
                          sets: ex.sets.toString(),
                        };
                      });
                      setLogDetails(details);
                    }}
                    className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Log Today's Workout
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                    <span className="font-semibold">Logged</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600 dark:text-gray-300">{currentDayWorkout.notes || "Rest day"}</p>
            )}
          </div>
        </div>
      )}

      {/* Weekly Overview */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Weekly Schedule</h2>
        <div className="space-y-2">
          {currentPlan.schedule.map((day, idx) => {
            const dayLog = getLogForDay(loggedDate, day.day);
            const isToday = getUserDayName() === day.day;

            return (
              <button
                key={idx}
                onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
                className={`w-full p-4 rounded-xl text-left transition-colors ${
                  isToday
                    ? "bg-primary/10 border-2 border-primary dark:border-primary"
                    : dayLog
                    ? "bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
                    : "bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{day.day}</h4>
                      {isToday && <span className="text-xs bg-primary text-white px-2 py-1 rounded-full font-medium">Today</span>}
                      {dayLog && <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-medium">Logged</span>}
                    </div>
                    {day.exercises.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{day.exercises.length} exercises</p>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedDay === day.day ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {expandedDay === day.day && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {day.exercises.length > 0 ? (
                      day.exercises.map((exercise, exIdx) => (
                        <div key={exIdx} className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-3">
                          <h5 className="font-medium text-sm">{exercise.name}</h5>
                          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                            <p>
                              Sets × Reps: <span className="font-semibold">{exercise.sets} × {exercise.reps}</span>
                            </p>
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
                      <p className="text-sm text-gray-500 dark:text-gray-400">{day.notes || "Rest day"}</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Workout Modal */}
      {showLogForm && selectedDayForLog && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white dark:bg-[#141414] rounded-t-3xl p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Log Workout - {selectedDayForLog}</h3>
              <button
                onClick={() => {
                  setShowLogForm(false);
                  setSelectedDayForLog(null);
                  setLogDetails({});
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Date</label>
              <input
                type="date"
                value={loggedDate}
                onChange={(e) => setLoggedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-4 mb-6">
              {currentPlan?.schedule
                .find((d) => d.day === selectedDayForLog)
                ?.exercises.map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={logDetails[ex.name]?.completed || false}
                        onChange={(e) =>
                          setLogDetails({
                            ...logDetails,
                            [ex.name]: { ...logDetails[ex.name], completed: e.target.checked },
                          })
                        }
                        className="w-5 h-5 text-primary rounded"
                      />
                      <span className="font-semibold text-sm">{ex.name}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="number"
                        placeholder="Sets"
                        value={logDetails[ex.name]?.sets || ex.sets}
                        onChange={(e) =>
                          setLogDetails({
                            ...logDetails,
                            [ex.name]: { ...logDetails[ex.name], sets: e.target.value },
                          })
                        }
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-[#0a0a0a] dark:text-white text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={logDetails[ex.name]?.reps || ex.reps}
                        onChange={(e) =>
                          setLogDetails({
                            ...logDetails,
                            [ex.name]: { ...logDetails[ex.name], reps: e.target.value },
                          })
                        }
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-[#0a0a0a] dark:text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Weight"
                        value={logDetails[ex.name]?.weight || ex.weight || ""}
                        onChange={(e) =>
                          setLogDetails({
                            ...logDetails,
                            [ex.name]: { ...logDetails[ex.name], weight: e.target.value },
                          })
                        }
                        className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-[#0a0a0a] dark:text-white text-xs"
                      />
                    </div>

                    <textarea
                      placeholder="Notes (optional)"
                      value={logDetails[ex.name]?.notes || ""}
                      onChange={(e) =>
                        setLogDetails({
                          ...logDetails,
                          [ex.name]: { ...logDetails[ex.name], notes: e.target.value },
                        })
                      }
                      className="w-full mt-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 dark:bg-[#0a0a0a] dark:text-white text-xs resize-none"
                      rows={2}
                    />
                  </div>
                ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowLogForm(false);
                  setSelectedDayForLog(null);
                  setLogDetails({});
                }}
                className="flex-1 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogWorkout}
                className="flex-1 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Save Log
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

// Helper function to get current day name
function getUserDayName() {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[new Date().getDay()];
}
