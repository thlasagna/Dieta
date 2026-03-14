"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FoodAnalysisResult, MealEntry, Macros, Vitamins } from "@/app/types";
import { saveMeal, getTodayMeals, addXP } from "@/app/lib/storage";
import { checkAchievementsAfterLog } from "@/app/lib/achievements";
import MealResultCard from "./MealResultCard";
import MealDetailPopup from "./MealDetailPopup";
import Toast from "./Toast";

type InputMode = "photo" | "text";

export default function LogTab() {
  const [mode, setMode] = useState<InputMode>("photo");
  const [textInput, setTextInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FoodAnalysisResult | null>(null);
  const [toast, setToast] = useState<{ message: string } | null>(null);
  const [achievementOverlay, setAchievementOverlay] = useState<{
    name: string;
    icon: string;
    xpReward: number;
  } | null>(null);
  const [todayMeals, setTodayMeals] = useState<MealEntry[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshTodayMeals = useCallback(() => {
    setTodayMeals(getTodayMeals());
  }, []);

  useEffect(() => {
    refreshTodayMeals();
  }, [refreshTodayMeals]);

  const analyzeFood = async () => {
    setError(null);
    setResult(null);

    if (mode === "photo") {
      if (!imageBase64) {
        setError("Please take a photo first");
        return;
      }
    } else {
      if (!textInput.trim()) {
        setError("Please describe what you ate");
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "photo"
            ? { imageBase64 }
            : { textDescription: textInput.trim() }
        ),
      });

      const text = await res.text();
      let data: Record<string, unknown>;
      try {
        data = text.startsWith("{") ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          text.includes("GEMINI_API_KEY") || text.includes("missing")
            ? "API key not configured. Add GEMINI_API_KEY to .env.local"
            : "Analysis failed — server returned an invalid response"
        );
      }
      if (!res.ok) throw new Error((data.error as string) || "Analysis failed");
      if (!data.foods) throw new Error("Invalid response from server. Check that GEMINI_API_KEY is set in .env.local");

      setResult(data as FoodAnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed, try again");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setImageBase64(data);
      setImagePreview(data);
      setError(null);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetInput = () => {
    setImagePreview(null);
    setImageBase64(null);
    setTextInput("");
    setResult(null);
    setError(null);
  };

  const logMeal = () => {
    if (!result) return;

    const meal: MealEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      foods: result.foods,
      calories: result.estimatedCalories,
      macros: result.macros,
      vitamins: result.vitamins,
      healthScore: result.healthScore,
      portionNote: result.portionNote,
      analysis: result.analysis,
      imageBase64: imageBase64 || undefined,
    };

    saveMeal(meal);
    addXP(30);
    setToast({ message: "+30 XP" });

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

    refreshTodayMeals();
    resetInput();
  };

  return (
    <div className="pb-24 px-4 pt-4">
      <h1 className="text-xl font-semibold mb-4">Log a meal</h1>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => { setMode("photo"); resetInput(); }}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            mode === "photo"
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          📷 Photo
        </button>
        <button
          type="button"
          onClick={() => { setMode("text"); resetInput(); }}
          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-colors ${
            mode === "text"
              ? "bg-primary text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          ✏️ Text
        </button>
      </div>

      {/* Mode A: Photo */}
      {mode === "photo" && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {imagePreview ? (
            <div className="relative rounded-2xl overflow-hidden border border-black/8 dark:border-white/8 bg-white">
              <img
                src={imagePreview}
                alt="Meal preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/30">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-xl text-sm font-medium"
                >
                  Retake
                </button>
                <button
                  type="button"
                  onClick={() => { setImagePreview(null); setImageBase64(null); }}
                  className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-xl text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-48 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium">Tap to take a photo</span>
            </button>
          )}
        </div>
      )}

      {/* Mode B: Text */}
      {mode === "text" && (
        <div className="mb-6">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="e.g. 2 scrambled eggs and toast with butter"
            className="w-full px-4 py-3 rounded-2xl border border-black/8 dark:border-white/8 bg-white dark:bg-[#141414] placeholder-gray-400 text-base"
          />
        </div>
      )}

      {/* Analyze button */}
      {!result && (
        <button
          type="button"
          onClick={analyzeFood}
          disabled={loading || (mode === "photo" && !imageBase64) || (mode === "text" && !textInput.trim())}
          className="w-full py-3 rounded-2xl bg-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing…
            </>
          ) : (
            "Analyze food"
          )}
        </button>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-2xl bg-danger/10 text-danger text-sm flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={analyzeFood} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      {result && (
        <MealResultCard
          result={result}
          onLog={logMeal}
          onReset={resetInput}
        />
      )}

      {/* Today's meals */}
      <div className="mt-8">
        <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Today&apos;s meals — tap to view details</h2>
        {todayMeals.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500">No meals logged today</p>
        ) : (
          <ul className="space-y-2">
            {todayMeals.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedMeal(m)}
                  className="w-full flex justify-between items-center py-2 px-3 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-left active:scale-[0.99] hover:border-primary/30 transition-colors"
                >
                  <span className="text-sm truncate flex-1">{m.foods.join(", ")}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ~{m.calories} kcal
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedMeal && (
        <MealDetailPopup meal={selectedMeal} onClose={() => setSelectedMeal(null)} />
      )}

      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}

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
