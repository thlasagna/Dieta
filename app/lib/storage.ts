import type { MealEntry } from "../types";

const MEALS_KEY = "meals";
const XP_KEY = "xp";
const ACHIEVEMENTS_KEY = "achievements";

export function getMeals(): MealEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MEALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMeal(meal: MealEntry): void {
  const meals = getMeals();
  meals.push(meal);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
}

export function getTodayMeals(): MealEntry[] {
  const meals = getMeals();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  return meals.filter((m) => m.timestamp >= todayStart && m.timestamp < tomorrowStart);
}

export interface XPState {
  total: number;
  level: number;
}

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000];

export function getXP(): XPState {
  if (typeof window === "undefined") return { total: 0, level: 1 };
  try {
    const raw = localStorage.getItem(XP_KEY);
    const total = raw ? parseInt(raw, 10) || 0 : 0;
    let level = 1;
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (total >= LEVEL_THRESHOLDS[i]) {
        level = i + 1;
        break;
      }
    }
    return { total, level };
  } catch {
    return { total: 0, level: 1 };
  }
}

export function addXP(amount: number): void {
  const { total } = getXP();
  localStorage.setItem(XP_KEY, String(total + amount));
}

export function getUnlockedAchievements(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function unlockAchievement(id: string): void {
  const unlocked = getUnlockedAchievements();
  if (!unlocked.includes(id)) {
    unlocked.push(id);
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  }
}
