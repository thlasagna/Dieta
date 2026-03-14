"use client";

import { useMemo, useEffect, useState } from "react";
import { getMeals } from "@/app/lib/storage";
import type { Vitamins } from "@/app/types";
import {
  VITAMIN_KEYS,
  VITAMIN_LABELS,
  VITAMIN_ICONS,
  VITAMIN_WEEKLY_TARGET,
  VITAMIN_DESCRIPTIONS,
  VITAMIN_RICH_FOODS,
  MACRO_WEEKLY_TARGETS,
  MACRO_DESCRIPTIONS,
  MACRO_RICH_FOODS,
} from "@/app/lib/nutrientTargets";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekBounds() {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  const weekStart = d.getTime();
  const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;
  return { weekStart, weekEnd };
}

export default function ProgressTab() {
  const [mounted, setMounted] = useState(false);
  const [selectedVitamin, setSelectedVitamin] = useState<string | null>(null);
  const [selectedMacro, setSelectedMacro] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    if (!mounted) {
      return {
        streakDots: Array(7).fill(false),
        dailyCalories: Array(7).fill(0),
        maxCal: 1,
        avgCalories: 0,
        vitaminCounts: Object.fromEntries(VITAMIN_KEYS.map((k) => [k, 0])),
        macroTotals: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
        topFoods: [] as string[],
        goalsMet: 0,
        totalGoals: VITAMIN_KEYS.length + 4,
      };
    }

    const meals = getMeals();
    const { weekStart, weekEnd } = getWeekBounds();
    const weekMeals = meals.filter(
      (m) => m.timestamp >= weekStart && m.timestamp < weekEnd
    );

    const dailyCalories: number[] = [];
    for (let i = 0; i < 7; i++) {
      const dStart = weekStart + i * 24 * 60 * 60 * 1000;
      const dEnd = dStart + 24 * 60 * 60 * 1000;
      const dayMeals = weekMeals.filter(
        (m) => m.timestamp >= dStart && m.timestamp < dEnd
      );
      dailyCalories.push(dayMeals.reduce((sum, m) => sum + m.calories, 0));
    }

    const streakDots = dailyCalories.map((c) => c > 0);
    const avgCalories =
      weekMeals.length > 0
        ? Math.round(weekMeals.reduce((s, m) => s + m.calories, 0) / 7)
        : 0;
    const maxCal = Math.max(...dailyCalories, 1);

    const vitaminCounts: Record<string, number> = {};
    for (const key of VITAMIN_KEYS) {
      const count = weekMeals.filter((m) => {
        const level = m.vitamins?.[key as keyof Vitamins];
        return level === "high" || level === "medium";
      }).length;
      vitaminCounts[key] = count;
    }

    const macroTotals = weekMeals.reduce(
      (acc, m) => ({
        protein: acc.protein + (m.macros?.protein || 0),
        carbs: acc.carbs + (m.macros?.carbs || 0),
        fat: acc.fat + (m.macros?.fat || 0),
        fiber: acc.fiber + (m.macros?.fiber || 0),
      }),
      { protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );

    const foodCounts: Record<string, number> = {};
    weekMeals.forEach((m) => {
      m.foods.forEach((f) => {
        const normalized = f.toLowerCase().trim();
        foodCounts[normalized] = (foodCounts[normalized] || 0) + 1;
      });
    });
    const topFoods = Object.entries(foodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    let goalsMet = 0;
    for (const key of VITAMIN_KEYS) {
      if (vitaminCounts[key] >= VITAMIN_WEEKLY_TARGET) goalsMet++;
    }
    if (macroTotals.protein >= MACRO_WEEKLY_TARGETS.protein) goalsMet++;
    if (macroTotals.fiber >= MACRO_WEEKLY_TARGETS.fiber) goalsMet++;
    if (macroTotals.carbs >= MACRO_WEEKLY_TARGETS.carbs) goalsMet++;
    if (macroTotals.fat >= MACRO_WEEKLY_TARGETS.fat) goalsMet++;

    return {
      streakDots,
      dailyCalories,
      maxCal,
      avgCalories,
      vitaminCounts,
      macroTotals,
      topFoods,
      goalsMet,
      totalGoals: VITAMIN_KEYS.length + 4,
      weekMealsCount: weekMeals.length,
    };
  }, [mounted]);

  return (
    <div className="pb-24 px-4 pt-4">
      <h1 className="text-xl font-semibold mb-4">Progress</h1>

      {/* Weekly score card - gamified header */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-xp/10 dark:from-primary/20 dark:to-xp/20 border border-primary/20 dark:border-primary/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Weekly nutrient goals
          </h2>
          <span className="text-2xl font-bold text-primary">
            {data.goalsMet}/{data.totalGoals}
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/50 dark:bg-black/20 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${Math.min(100, (data.goalsMet / data.totalGoals) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {data.goalsMet >= data.totalGoals
            ? "🎉 All weekly goals met!"
            : `Log more meals to fill your nutrient targets`}
        </p>
      </div>

      {/* Vitamins - gamified grid */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Vitamins & minerals
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {VITAMIN_KEYS.map((key) => {
            const count = data.vitaminCounts[key];
            const target = VITAMIN_WEEKLY_TARGET;
            const met = count >= target;
            const progress = Math.min(100, (count / target) * 100);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedVitamin(key)}
                className={`p-3 rounded-2xl border transition-all text-left w-full active:scale-[0.98] ${
                  met
                    ? "bg-green-500/10 border-green-500/30 dark:bg-green-500/20"
                    : "bg-white dark:bg-[#141414] border-black/8 dark:border-white/8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{VITAMIN_ICONS[key]}</span>
                  {met && (
                    <span className="text-green-600 dark:text-green-400 text-sm">
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                  {VITAMIN_LABELS[key]}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        met ? "bg-green-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      met ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {count}/{target}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
                  meals this week • tap for foods
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vitamin food suggestion popup */}
      {selectedVitamin && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 animate-fade-in pb-[calc(60px+env(safe-area-inset-bottom,0px))] sm:pb-0"
          onClick={() => setSelectedVitamin(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setSelectedVitamin(null)}
          aria-label="Close"
        >
          <div
            className="w-full max-w-[390px] max-h-[70vh] sm:max-h-[65vh] rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-t sm:border border-white/10 p-5 pb-8 animate-slide-up overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{VITAMIN_ICONS[selectedVitamin]}</span>
                <h3 className="text-lg font-semibold">
                  Foods high in {VITAMIN_LABELS[selectedVitamin]}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVitamin(null)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {VITAMIN_DESCRIPTIONS[selectedVitamin]}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Foods high in {VITAMIN_LABELS[selectedVitamin]}
            </p>
            <div className="flex flex-wrap gap-2">
              {(VITAMIN_RICH_FOODS[selectedVitamin] || []).map((food) => (
                <span
                  key={food}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-medium text-sm"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Macros - protein, fiber, carbs, fat */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Macronutrients
        </h2>
        <div className="space-y-3">
          {[
            {
              key: "protein",
              label: "Protein",
              icon: "💪",
              current: data.macroTotals.protein,
              target: MACRO_WEEKLY_TARGETS.protein,
              unit: "g",
            },
            {
              key: "fiber",
              label: "Fiber",
              icon: "🌾",
              current: data.macroTotals.fiber,
              target: MACRO_WEEKLY_TARGETS.fiber,
              unit: "g",
            },
            {
              key: "carbs",
              label: "Carbs",
              icon: "🍞",
              current: data.macroTotals.carbs,
              target: MACRO_WEEKLY_TARGETS.carbs,
              unit: "g",
            },
            {
              key: "fat",
              label: "Fat",
              icon: "🥑",
              current: data.macroTotals.fat,
              target: MACRO_WEEKLY_TARGETS.fat,
              unit: "g",
            },
          ].map(({ key, label, icon, current, target, unit }) => {
            const met = current >= target;
            const progress = Math.min(100, (current / target) * 100);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedMacro(key)}
                className={`p-3 rounded-2xl border transition-all text-left w-full active:scale-[0.98] ${
                  met
                    ? "bg-green-500/10 border-green-500/30 dark:bg-green-500/20"
                    : "bg-white dark:bg-[#141414] border-black/8 dark:border-white/8"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base">{icon}</span>
                  {met && (
                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                      ✓ Goal met!
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        met ? "bg-green-500" : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold tabular-nums min-w-[4ch] ${
                      met ? "text-green-600 dark:text-green-400" : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {Math.round(current)}/{target}{unit}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-1">
                  tap for more
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Macro popup */}
      {selectedMacro && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 animate-fade-in pb-[calc(60px+env(safe-area-inset-bottom,0px))] sm:pb-0"
          onClick={() => setSelectedMacro(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setSelectedMacro(null)}
          aria-label="Close"
        >
          <div
            className="w-full max-w-[390px] max-h-[70vh] sm:max-h-[65vh] rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-t sm:border border-white/10 p-5 pb-8 animate-slide-up overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedMacro === "protein" && "💪"}
                  {selectedMacro === "fiber" && "🌾"}
                  {selectedMacro === "carbs" && "🍞"}
                  {selectedMacro === "fat" && "🥑"}
                </span>
                <h3 className="text-lg font-semibold capitalize">
                  {selectedMacro}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMacro(null)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
              {MACRO_DESCRIPTIONS[selectedMacro]}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Foods high in {selectedMacro}
            </p>
            <div className="flex flex-wrap gap-2">
              {(MACRO_RICH_FOODS[selectedMacro] || []).map((food) => (
                <span
                  key={food}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-medium text-sm"
                >
                  {food}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7-day streak */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Logging streak
        </h2>
        <div className="flex justify-between mb-2">
          {DAY_NAMES.map((name, i) => (
            <div key={name} className="flex flex-col items-center">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  data.streakDots[i]
                    ? "bg-primary text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-500"
                }`}
              >
                {data.streakDots[i] ? "✓" : "—"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {name}
              </span>
            </div>
          ))}
        </div>
        <p className="text-lg font-bold">
          Avg: {data.avgCalories}{" "}
          <span className="text-sm font-normal text-gray-500">kcal/day</span>
        </p>
      </div>

      {/* Daily calories bar chart */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Daily calories
        </h2>
        <div className="flex items-end justify-between gap-1 h-28">
          {data.dailyCalories.map((cal, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t min-h-[4px] transition-all"
                style={{
                  height: `${Math.max(4, (cal / data.maxCal) * 100)}%`,
                }}
              />
              <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                {DAY_NAMES[i]}
              </span>
              <span className="text-[10px] font-medium">{cal || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top foods */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Top foods this week
        </h2>
        {data.topFoods.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No meals logged this week
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.topFoods.map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
              >
                {f}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
