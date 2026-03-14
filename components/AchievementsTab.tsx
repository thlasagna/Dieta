"use client";

import { useState, useEffect } from "react";
import { getXP, getUnlockedAchievements } from "@/app/lib/storage";
import { ACHIEVEMENTS } from "@/app/lib/achievements";

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000];

export default function AchievementsTab() {
  const [xpState, setXpState] = useState({ total: 0, level: 1 });
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setXpState(getXP());
    setUnlocked(getUnlockedAchievements());
  }, []);

  const currentThreshold = LEVEL_THRESHOLDS[xpState.level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[xpState.level] ?? currentThreshold + 500;
  const progressInLevel = xpState.total - currentThreshold;
  const levelRange = nextThreshold - currentThreshold;
  const progressPercent = levelRange > 0 ? (progressInLevel / levelRange) * 100 : 100;

  return (
    <div className="pb-24 px-4 pt-4">
      <h1 className="text-xl font-semibold mb-4">Achievements</h1>

      {/* XP + Level */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-xp">Level {xpState.level}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {xpState.total} total XP
          </span>
        </div>
        <div className="h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-xp transition-all duration-500"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {progressInLevel} / {levelRange} XP to Level {xpState.level + 1}
        </p>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-3 gap-3">
        {ACHIEVEMENTS.map((a) => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => setExpandedId(a.id)}
              className={`p-3 rounded-2xl border flex flex-col items-center text-center min-h-[100px] active:scale-[0.98] ${
                isUnlocked
                  ? "bg-white dark:bg-[#141414] border-black/8 dark:border-white/8"
                  : "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75"
              }`}
            >
              <span className="text-2xl mb-1">{a.icon}</span>
              <h3 className="text-xs font-semibold line-clamp-1">{a.name}</h3>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                {a.description}
              </p>
              {isUnlocked ? (
                <span className="text-[10px] text-primary font-medium mt-1">Unlocked</span>
              ) : (
                <span className="text-[10px] text-xp font-medium mt-1">
                  +{a.xpReward} XP
                </span>
              )}
              <span className="text-[9px] text-gray-400 mt-1">tap for details</span>
            </button>
          );
        })}
      </div>

      {/* Achievement detail popup */}
      {expandedId && (() => {
        const a = ACHIEVEMENTS.find((x) => x.id === expandedId);
        if (!a) return null;
        const isUnlocked = unlocked.includes(a.id);
        return (
          <div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 animate-fade-in pb-[calc(60px+env(safe-area-inset-bottom,0px))] sm:pb-0"
            onClick={() => setExpandedId(null)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Escape" && setExpandedId(null)}
            aria-label="Close"
          >
            <div
              className="w-full max-w-[390px] rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1a1a1a] border-t sm:border border-white/10 p-6 pb-8 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-5xl">{a.icon}</span>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <h3 className="text-lg font-semibold mb-2">{a.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                {a.description}
              </p>
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <span className="px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-medium">
                    ✓ Unlocked
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-full bg-xp/20 text-xp text-sm font-medium">
                    +{a.xpReward} XP to unlock
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
