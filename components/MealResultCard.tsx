"use client";

import type { FoodAnalysisResult, Vitamins } from "@/app/types";

interface MealResultCardProps {
  result: FoodAnalysisResult;
  onLog: () => void;
  onReset: () => void;
}

const VITAMIN_LABELS: Record<keyof Vitamins, string> = {
  a: "Vitamin A",
  c: "Vitamin C",
  d: "Vitamin D",
  b12: "B12",
  iron: "Iron",
  calcium: "Calcium",
  omega3: "Omega-3",
  zinc: "Zinc",
};

function VitaminDot({ level }: { level: string }) {
  const color =
    level === "high" ? "bg-green-500" : level === "medium" ? "bg-amber-500" : "bg-danger";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function MealResultCard({ result, onLog, onReset }: MealResultCardProps) {
  const calLow = Math.max(0, result.estimatedCalories - 30);
  const calHigh = result.estimatedCalories + 30;
  const totalMacro = result.macros.protein + result.macros.carbs + result.macros.fat || 1;

  return (
    <div className="mt-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
      {/* Foods as pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        {result.foods.map((f) => (
          <span
            key={f}
            className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
          >
            {f}
          </span>
        ))}
      </div>

      {/* Calorie range */}
      <p className="text-lg font-semibold mb-4">
        ~{calLow}–{calHigh} kcal
      </p>

      {/* AI analysis paragraph */}
      {result.analysis && result.analysis.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-black/5 dark:border-white/5">
          <p className="text-sm leading-relaxed">
            {result.analysis.map((seg, i) => (
              <span
                key={i}
                className={
                  seg.type === "good"
                    ? "text-green-600 dark:text-green-400 font-medium"
                    : seg.type === "bad"
                    ? "text-danger font-medium"
                    : "text-gray-800 dark:text-white"
                }
              >
                {seg.text}
              </span>
            ))}
          </p>
        </div>
      )}

      {/* Macro bars */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Protein</span>
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${(result.macros.protein / totalMacro) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">{result.macros.protein}g</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Carbs</span>
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${(result.macros.carbs / totalMacro) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">{result.macros.carbs}g</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Fat</span>
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${(result.macros.fat / totalMacro) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-300">{result.macros.fat}g</span>
        </div>
      </div>

      {/* Vitamin grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(Object.entries(result.vitamins) as [keyof Vitamins, string][]).map(([key, level]) => (
          <div key={key} className="flex items-center gap-1.5">
            <VitaminDot level={level} />
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
              {VITAMIN_LABELS[key]}
            </span>
          </div>
        ))}
      </div>

      {/* Health score ring */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray={`${(result.healthScore / 10) * 100} 100`}
              strokeLinecap="round"
              className="text-primary"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
            {result.healthScore}/10
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">Health score</span>
      </div>

      {result.portionNote && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{result.portionNote}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLog}
          className="flex-1 py-3 rounded-2xl bg-primary text-white font-medium"
        >
          Log this meal
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-3 rounded-2xl border border-black/8 dark:border-white/8 text-gray-600 dark:text-gray-400 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
