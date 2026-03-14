"use client";

import { useState, useCallback, useEffect } from "react";
import { getMeals, saveMeal, addXP } from "@/app/lib/storage";
import { checkAchievementsAfterLog } from "@/app/lib/achievements";
import {
  getFoodCategory,
  CATEGORY_LABELS,
  CATEGORY_TARGETS,
  type FoodCategory,
} from "@/app/lib/foodCategories";
import type { MealEntry } from "@/app/types";

const SYMPTOMS = [
  "Low energy",
  "Acne",
  "Poor sleep",
  "Bloating",
  "Brain fog",
  "Stress",
];

interface Suggestion {
  food: string;
  reason: string;
  vitaminsItProvides: string[];
  xpReward: number;
  category: "vegetable" | "protein" | "fruit" | "grain" | "dairy";
}

export default function SuggestTab() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [freeformNotes, setFreeformNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [celebratedFood, setCelebratedFood] = useState<string | null>(null);
  const [achievementOverlay, setAchievementOverlay] = useState<{
    name: string;
    icon: string;
    xpReward: number;
  } | null>(null);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const getSuggestions = async () => {
    setError(null);
    setSuggestions([]);
    setLoading(true);

    const meals = getMeals();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentMeals = meals
      .filter((m) => m.timestamp >= sevenDaysAgo)
      .map((m) => ({
        foods: m.foods,
        timestamp: m.timestamp,
      }));

    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recentMeals,
          symptoms: selectedSymptoms,
          freeformNotes: freeformNotes.trim() || undefined,
        }),
      });

      const text = await res.text();
      let data: { error?: string; suggestions?: Suggestion[] };
      try {
        data = text.startsWith("{") ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          text.includes("GEMINI_API_KEY") || text.includes("missing")
            ? "API key not configured. Add GEMINI_API_KEY to .env.local"
            : "Suggestion failed — server returned an invalid response"
        );
      }
      if (!res.ok) throw new Error(data.error || "Failed to get suggestions");
      if (!data.suggestions && res.ok) throw new Error("Invalid response. Check that GEMINI_API_KEY is set in .env.local");

      setSuggestions(data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suggestion failed, try again");
    } finally {
      setLoading(false);
    }
  };

  const logSuggestedFood = (s: Suggestion) => {
    const meal: MealEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      foods: [s.food],
      calories: 0,
      macros: { protein: 0, carbs: 0, fat: 0, fiber: 0 },
      vitamins: {
        a: "low", c: "low", d: "low", b12: "low",
        iron: "low", calcium: "low", omega3: "low", zinc: "low",
      },
      healthScore: 5,
      fromSuggestion: true,
      symptomContext: selectedSymptoms,
    };
    saveMeal(meal);
    addXP(s.xpReward);
    setCelebratedFood(s.food);
    setTimeout(() => setCelebratedFood(null), 800);

    const newAchievements = checkAchievementsAfterLog();
    if (newAchievements.length > 0) {
      const first = newAchievements[0];
      setAchievementOverlay({
        name: first.achievement.name,
        icon: first.achievement.icon,
        xpReward: first.achievement.xpReward,
      });
      setTimeout(() => setAchievementOverlay(null), 3000);
    }

    setSuggestions((prev) => prev.filter((x) => x.food !== s.food));
  };

  const getWeeklyFrequency = useCallback(() => {
    const meals = getMeals();
    const now = new Date();
    const dayStart = (d: Date) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x.getTime();
    };
    const weekStart = dayStart(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000));

    const categories: FoodCategory[] = ["leafy_greens", "fatty_fish", "legumes", "red_meat"];
    const byCategory: Record<FoodCategory, boolean[]> = {
      leafy_greens: [],
      fatty_fish: [],
      legumes: [],
      red_meat: [],
    };

    for (let i = 0; i < 7; i++) {
      const dStart = weekStart + i * 24 * 60 * 60 * 1000;
      const dEnd = dStart + 24 * 60 * 60 * 1000;
      const dayMeals = meals.filter((m) => m.timestamp >= dStart && m.timestamp < dEnd);

      for (const cat of categories) {
        const hadCategory = dayMeals.some((m) =>
          m.foods.some((f) => getFoodCategory(f) === cat)
        );
        byCategory[cat].push(hadCategory);
      }
    }

    const counts: Record<FoodCategory, number> = {
      leafy_greens: byCategory.leafy_greens.filter(Boolean).length,
      fatty_fish: byCategory.fatty_fish.filter(Boolean).length,
      legumes: byCategory.legumes.filter(Boolean).length,
      red_meat: byCategory.red_meat.filter(Boolean).length,
    };

    return { byCategory, counts };
  }, []);

  const [freq, setFreq] = useState<{
    byCategory: Record<FoodCategory, boolean[]>;
    counts: Record<FoodCategory, number>;
  }>({
    byCategory: {
      leafy_greens: [],
      fatty_fish: [],
      legumes: [],
      red_meat: [],
    },
    counts: { leafy_greens: 0, fatty_fish: 0, legumes: 0, red_meat: 0 },
  });

  useEffect(() => {
    setFreq(getWeeklyFrequency());
  }, [getWeeklyFrequency, suggestions]);

  return (
    <div className="pb-24 px-4 pt-4">
      <h1 className="text-xl font-semibold mb-4">Suggest</h1>

      {/* Symptom chips */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">How are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {SYMPTOMS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSymptom(s)}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedSymptoms.includes(s)
                  ? "bg-[#7F77DD]/20 text-xp border border-xp/50"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={freeformNotes}
        onChange={(e) => setFreeformNotes(e.target.value)}
        placeholder="Anything else?"
        className="w-full px-4 py-3 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#141414] placeholder-gray-400 text-sm mb-4"
      />

      <button
        type="button"
        onClick={getSuggestions}
        disabled={loading}
        className="w-full py-3 rounded-2xl bg-primary text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
      >
        {loading ? (
          <>
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Getting suggestions…
          </>
        ) : (
          "Get suggestions"
        )}
      </button>

      {error && (
        <div className="mb-4 p-4 rounded-2xl bg-danger/10 text-danger text-sm">
          {error}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-4 mb-8">
          {suggestions.map((s) => (
            <div
              key={s.food}
              className={`p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 transition-transform ${
                celebratedFood === s.food ? "animate-scale-celebration" : ""
              }`}
            >
              <h3 className="text-lg font-bold mb-1">{s.food}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                {s.reason}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {s.vitaminsItProvides?.map((v) => (
                  <span
                    key={v}
                    className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs"
                  >
                    {v}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-xp">+{s.xpReward} XP</span>
                <button
                  type="button"
                  onClick={() => logSuggestedFood(s)}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium"
                >
                  I ate this today
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weekly frequency tracker */}
      <div>
        <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Weekly frequency
        </h2>
        <div className="space-y-3">
          {(["leafy_greens", "fatty_fish", "legumes", "red_meat"] as FoodCategory[]).map(
            (cat) => {
              const target = CATEGORY_TARGETS[cat];
              const dots = freq.byCategory[cat] || [];
              return (
                <div key={cat} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-28">
                    {CATEGORY_LABELS[cat]}
                  </span>
                  <div className="flex gap-1">
                    {dots.length > 0
                      ? dots.map((filled, i) => (
                          <span
                            key={i}
                            className={`w-2 h-2 rounded-full ${
                              filled ? "bg-primary" : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          />
                        ))
                      : Array.from({ length: 7 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700"
                          />
                        ))}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 w-16 text-right">
                    {freq.counts[cat]}/{cat === "red_meat" ? `max ${target.max}` : `${target.min}-${target.max}x`}
                  </span>
                </div>
              );
            }
          )}
        </div>
      </div>

      {achievementOverlay && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-fade-in p-4 pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
          <div className="mx-4 p-6 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-white/10 text-center animate-slide-up">
            <span className="text-5xl block mb-2">{achievementOverlay.icon}</span>
            <h3 className="text-lg font-semibold">{achievementOverlay.name}</h3>
            <p className="text-primary text-sm font-medium mt-1">Achievement unlocked!</p>
            <p className="text-xp text-sm mt-1">+{achievementOverlay.xpReward} XP</p>
          </div>
        </div>
      )}
    </div>
  );
}
