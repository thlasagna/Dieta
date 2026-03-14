"use client";

import { useMemo, useEffect, useState } from "react";
import { getMeals } from "@/app/lib/storage";
import type { Vitamins } from "@/app/types";

const VITAMIN_KEYS = ["a", "c", "d", "b12", "iron", "calcium", "omega3", "zinc"] as const;
const VITAMIN_LABELS: Record<string, string> = {
  a: "Vitamin A",
  c: "Vitamin C",
  d: "Vitamin D",
  b12: "B12",
  iron: "Iron",
  calcium: "Calcium",
  omega3: "Omega-3",
  zinc: "Zinc",
};

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ProgressTab() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    if (!mounted) {
      return {
        streakDots: Array(7).fill(false),
        dailyCalories: Array(7).fill(0),
        maxCal: 1,
        avgCalories: 0,
        vitaminLevels: Object.fromEntries(
          VITAMIN_KEYS.map((k) => [k, "Very low" as const])
        ),
        topFoods: [] as string[],
      };
    }
    const meals = getMeals();
    const now = new Date();
    const dayStart = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };
    const getMonday = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    };
    const weekStart = getMonday(now);
    const weekEnd = weekStart + 7 * 24 * 60 * 60 * 1000;

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
        ? Math.round(
            weekMeals.reduce((s, m) => s + m.calories, 0) / 7
          )
        : 0;
    const maxCal = Math.max(...dailyCalories, 1);

    const vitaminLevels: Record<string, "On track" | "Low this week" | "Very low"> = {};
    for (const key of VITAMIN_KEYS) {
      const levels = weekMeals
        .flatMap((m) => (m.vitamins?.[key as keyof Vitamins] ? [m.vitamins[key as keyof Vitamins]] : []))
        .filter(Boolean);
      const highCount = levels.filter((l) => l === "high").length;
      const mediumCount = levels.filter((l) => l === "medium").length;
      const lowCount = levels.filter((l) => l === "low").length;

      if (levels.length === 0) {
        vitaminLevels[key] = "Very low";
      } else if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) {
        vitaminLevels[key] = "On track";
      } else if (lowCount >= 3 || (levels.length >= 3 && highCount === 0)) {
        vitaminLevels[key] = "Very low";
      } else {
        vitaminLevels[key] = "Low this week";
      }
    }

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

    return {
      streakDots,
      dailyCalories,
      maxCal,
      avgCalories,
      vitaminLevels,
      topFoods,
    };
  }, [mounted]);

  return (
    <div className="pb-24 px-4 pt-4">
      <h1 className="text-xl font-semibold mb-4">Progress</h1>

      {/* 7-day streak */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          This week
        </h2>
        <div className="flex justify-between mb-4">
          {DAY_NAMES.map((name, i) => (
            <div key={name} className="flex flex-col items-center">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
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
        <p className="text-2xl font-bold">
          Avg: {data.avgCalories} <span className="text-sm font-normal text-gray-500">kcal/day</span>
        </p>
      </div>

      {/* Bar chart */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Daily calories
        </h2>
        <div className="flex items-end justify-between gap-1 h-32">
          {data.dailyCalories.map((cal, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-primary rounded-t min-h-[4px] transition-all"
                style={{
                  height: `${Math.max(4, (cal / data.maxCal) * 100)}%`,
                }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">
                {DAY_NAMES[i]}
              </span>
              <span className="text-xs font-medium">{cal || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Nutrient gap */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Nutrient gap
        </h2>
        <div className="space-y-2">
          {VITAMIN_KEYS.map((key) => {
            const status = data.vitaminLevels[key];
            const pillColor =
              status === "On track"
                ? "bg-green-500/20 text-green-600 dark:text-green-400"
                : status === "Low this week"
                ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-danger/20 text-danger";
            return (
              <div
                key={key}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {VITAMIN_LABELS[key]}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${pillColor}`}
                >
                  {status}
                </span>
              </div>
            );
          })}
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
