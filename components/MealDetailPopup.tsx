"use client";

import type { MealEntry, Vitamins } from "@/app/types";

interface MealDetailPopupProps {
  meal: MealEntry;
  onClose: () => void;
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

export default function MealDetailPopup({ meal, onClose }: MealDetailPopupProps) {
  const calLow = Math.max(0, meal.calories - 30);
  const calHigh = meal.calories + 30;
  const totalMacro = meal.macros.protein + meal.macros.carbs + meal.macros.fat || 1;
  const hasFullData = meal.macros.protein + meal.macros.carbs + meal.macros.fat > 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 animate-fade-in pb-[calc(60px+env(safe-area-inset-bottom,0px))] sm:pb-0"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      aria-label="Close"
    >
      <div
        className="w-full max-w-[390px] max-h-[85vh] sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-t sm:border border-white/10 p-5 pb-8 animate-slide-up overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(meal.timestamp).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {meal.imageBase64 && (
          <img
            src={meal.imageBase64}
            alt="Meal"
            className="w-full h-40 object-cover rounded-xl mb-4"
          />
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {meal.foods.map((f) => (
            <span
              key={f}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
            >
              {f}
            </span>
          ))}
        </div>

        <p className="text-lg font-semibold mb-4">~{calLow}–{calHigh} kcal</p>

        {meal.analysis && meal.analysis.length > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-black/5 dark:border-white/5">
            <p className="text-sm leading-relaxed">
              {meal.analysis.map((seg, i) => (
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

        {meal.fromSuggestion && !meal.analysis && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 italic">
            Logged from AI suggestion
          </p>
        )}

        {hasFullData && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Protein</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(meal.macros.protein / totalMacro) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{meal.macros.protein}g</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Carbs</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500"
                    style={{ width: `${(meal.macros.carbs / totalMacro) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{meal.macros.carbs}g</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 text-xs text-gray-500 dark:text-gray-400">Fat</span>
                <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500"
                    style={{ width: `${(meal.macros.fat / totalMacro) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-300">{meal.macros.fat}g</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {(Object.entries(meal.vitamins) as [keyof Vitamins, string][]).map(([key, level]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <VitaminDot level={level} />
                  <span className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {VITAMIN_LABELS[key]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray={`${(meal.healthScore / 10) * 100} 100`}
                strokeLinecap="round"
                className="text-primary"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
              {meal.healthScore}/10
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Health score</span>
        </div>

        {meal.portionNote && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">{meal.portionNote}</p>
        )}
      </div>
    </div>
  );
}
