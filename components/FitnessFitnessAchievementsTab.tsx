"use client";

import { useState, useEffect } from "react";

interface Exercise {
  name: string;
  maxWeight: number;
  sets: number;
  reps: number;
  date: string;
}

interface FitnessAchievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedDate?: string;
  icon: string;
}

interface FitnessStats {
  totalWorkouts: number;
  totalSessions: number;
  currentStreak: number;
  personalRecords: Exercise[];
  achievements: FitnessAchievement[];
}

export default function FitnessFitnessAchievementsTab() {
  const [stats, setStats] = useState<FitnessStats>({
    totalWorkouts: 0,
    totalSessions: 0,
    currentStreak: 0,
    personalRecords: [],
    achievements: [
      {
        id: "first-workout",
        title: "First Step",
        description: "Complete your first workout",
        unlocked: false,
        icon: "🏃",
      },
      {
        id: "week-streak",
        title: "Week Warrior",
        description: "Maintain a 7-day workout streak",
        unlocked: false,
        icon: "🔥",
      },
      {
        id: "month-streak",
        title: "Month Master",
        description: "Maintain a 30-day workout streak",
        unlocked: false,
        icon: "👑",
      },
      {
        id: "strength-milestone",
        title: "Strong Start",
        description: "Bench press 185 lbs",
        unlocked: false,
        icon: "💪",
      },
      {
        id: "cardio-master",
        title: "Cardio Champion",
        description: "Complete 50 cardio sessions",
        unlocked: false,
        icon: "🏅",
      },
      {
        id: "personal-best",
        title: "New PR",
        description: "Set a personal record on any exercise",
        unlocked: false,
        icon: "⭐",
      },
      {
        id: "hundred-sessions",
        title: "Centennial",
        description: "Complete 100 workout sessions",
        unlocked: false,
        icon: "💯",
      },
      {
        id: "consistency",
        title: "Consistent",
        description: "Work out 5 days a week for 4 weeks",
        unlocked: false,
        icon: "📈",
      },
    ],
  });

  const [expandedPR, setExpandedPR] = useState<string | null>(null);
  const [newPR, setNewPR] = useState({ exercise: "", weight: "", reps: "8", date: new Date().toISOString().split("T")[0] });
  const [showAddPR, setShowAddPR] = useState(false);

  useEffect(() => {
    // Load stats from localStorage
    const savedStats = localStorage.getItem("fitness_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  const handleAddPR = () => {
    if (!newPR.exercise || !newPR.weight) return;

    const updatedStats = {
      ...stats,
      personalRecords: [
        ...stats.personalRecords,
        {
          name: newPR.exercise,
          maxWeight: parseFloat(newPR.weight),
          sets: 1,
          reps: parseInt(newPR.reps, 10),
          date: newPR.date,
        },
      ],
    };

    // Check if personal record achievement should be unlocked
    const updatedAchievements = updatedStats.achievements.map((ach) =>
      ach.id === "personal-best" && !ach.unlocked
        ? { ...ach, unlocked: true, unlockedDate: new Date().toISOString() }
        : ach
    );

    updatedStats.achievements = updatedAchievements;
    setStats(updatedStats);
    localStorage.setItem("fitness_stats", JSON.stringify(updatedStats));

    setNewPR({ exercise: "", weight: "", reps: "8", date: new Date().toISOString().split("T")[0] });
    setShowAddPR(false);
  };

  const unlockedCount = stats.achievements.filter((a) => a.unlocked).length;

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-6">Fitness Stats</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Total Workouts</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalWorkouts}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">Current Streak</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{stats.currentStreak} days</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800">
          <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Sessions</p>
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{stats.totalSessions}</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 border border-orange-200 dark:border-orange-800">
          <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mb-1">Achievements</p>
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {unlockedCount}/{stats.achievements.length}
          </p>
        </div>
      </div>

      {/* Personal Records Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Personal Records</h2>
          <button
            onClick={() => setShowAddPR(!showAddPR)}
            className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
          >
            {showAddPR ? "Cancel" : "+ Add PR"}
          </button>
        </div>

        {/* Add PR Form */}
        {showAddPR && (
          <div className="mb-4 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Exercise name (e.g., Bench Press)"
                value={newPR.exercise}
                onChange={(e) => setNewPR({ ...newPR, exercise: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Weight (lbs)"
                  value={newPR.weight}
                  onChange={(e) => setNewPR({ ...newPR, weight: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <input
                  type="number"
                  placeholder="Reps"
                  value={newPR.reps}
                  onChange={(e) => setNewPR({ ...newPR, reps: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <input
                type="date"
                value={newPR.date}
                onChange={(e) => setNewPR({ ...newPR, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleAddPR}
                className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Save PR
              </button>
            </div>
          </div>
        )}

        {/* PRs List */}
        {stats.personalRecords.length > 0 ? (
          <div className="space-y-2">
            {stats.personalRecords.map((pr, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedPR(expandedPR === pr.name ? null : pr.name)}
                className="w-full p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 
                         text-left hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💪</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{pr.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {pr.maxWeight} lbs × {pr.reps} reps
                    </p>
                    {expandedPR === pr.name && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Date: {pr.date}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No personal records yet. Add your first one!</p>
          </div>
        )}
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Achievements</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-2xl text-center transition-all ${
                ach.unlocked
                  ? "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800"
                  : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 opacity-60"
              }`}
            >
              <div className="text-3xl mb-2">{ach.icon}</div>
              <h3 className="text-xs font-semibold line-clamp-2">{ach.title}</h3>
              {ach.unlocked && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">Unlocked</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
