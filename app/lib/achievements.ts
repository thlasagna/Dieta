import { getMeals, getUnlockedAchievements, unlockAchievement, addXP } from "./storage";
import { getFoodCategory } from "./foodCategories";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-bite", name: "First bite", description: "Log your first meal", icon: "🍴", xpReward: 50 },
  { id: "follow-ai", name: "Follow the AI", description: "Eat 3 foods suggested by the app in one day", icon: "🤖", xpReward: 100 },
  { id: "rainbow-week", name: "Rainbow week", description: "Log 5 different coloured vegetables in one week", icon: "🌈", xpReward: 150 },
  { id: "streak-starter", name: "Streak starter", description: "Log meals 3 days in a row", icon: "🔥", xpReward: 75 },
  { id: "streak-master", name: "Streak master", description: "Log meals 7 days in a row", icon: "⭐", xpReward: 200 },
  { id: "skin-defender", name: "Skin defender", description: "Log anti-acne suggested foods 5 days in a row", icon: "✨", xpReward: 150 },
  { id: "protein-builder", name: "Protein builder", description: "Hit protein-rich meals 5 days this week", icon: "💪", xpReward: 100 },
  { id: "veggie-veteran", name: "Veggie veteran", description: "Log vegetables 5x in one week", icon: "🥬", xpReward: 100 },
  { id: "iron-will", name: "Iron will", description: "Log iron-rich foods 4x this week", icon: "🩸", xpReward: 100 },
  { id: "omega-champion", name: "Omega champion", description: "Log omega-3 foods 5x this week", icon: "🐟", xpReward: 150 },
];

const VEGGIE_KEYWORDS = [
  "spinach", "kale", "lettuce", "broccoli", "carrot", "tomato", "pepper",
  "cucumber", "zucchini", "onion", "celery", "cabbage", "cauliflower",
  "asparagus", "green beans", "peas", "corn", "mushroom", "avocado",
  "sweet potato", "beet", "radish", "arugula", "chard", "brussels",
];
const IRON_FOODS = ["spinach", "beef", "lamb", "beans", "lentils", "chickpeas", "tofu", "quinoa"];
const OMEGA_FOODS = ["salmon", "sardines", "mackerel", "walnuts", "chia", "flax"];
const COLORED_VEGGIES = [
  "tomato", "carrot", "beet", "pepper", "spinach", "kale", "broccoli",
  "purple cabbage", "sweet potato", "squash", "eggplant", "radish",
];

function hasKeyword(food: string, keywords: string[]): boolean {
  const lower = food.toLowerCase();
  return keywords.some((k) => lower.includes(k));
}

function getMaxStreak(meals: { timestamp: number }[]): number {
  const days = Array.from(new Set(meals.map((m) => new Date(m.timestamp).toDateString()))).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  let maxStreak = 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]).getTime();
    const curr = new Date(days[i]).getTime();
    if (curr - prev <= 25 * 60 * 60 * 1000) streak++;
    else {
      maxStreak = Math.max(maxStreak, streak);
      streak = 1;
    }
  }
  return Math.max(maxStreak, streak);
}

function getWeekStart(): number {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export interface AchievementUnlock {
  achievement: Achievement;
  isNew: boolean;
}

export function checkAchievementsAfterLog(): AchievementUnlock[] {
  const unlocked = getUnlockedAchievements();
  const meals = getMeals();
  const newlyUnlocked: AchievementUnlock[] = [];
  const weekStart = getWeekStart();
  const weekMeals = meals.filter((m) => m.timestamp >= weekStart);

  const unlock = (id: string, idx: number) => {
    if (!unlocked.includes(id)) {
      unlockAchievement(id);
      addXP(ACHIEVEMENTS[idx].xpReward);
      newlyUnlocked.push({ achievement: ACHIEVEMENTS[idx], isNew: true });
    }
  };

  if (meals.length >= 1 && !unlocked.includes("first-bite")) {
    unlock("first-bite", 0);
  }

  const maxStreak = getMaxStreak(meals);
  if (maxStreak >= 3 && !unlocked.includes("streak-starter")) unlock("streak-starter", 3);
  if (maxStreak >= 7 && !unlocked.includes("streak-master")) unlock("streak-master", 4);

  // follow-ai: 3 suggested foods in one day
  const suggestedByDay = new Map<string, number>();
  meals.forEach((m) => {
    if (m.fromSuggestion) {
      const day = new Date(m.timestamp).toDateString();
      suggestedByDay.set(day, (suggestedByDay.get(day) || 0) + m.foods.length);
    }
  });
  if (Array.from(suggestedByDay.values()).some((c) => c >= 3) && !unlocked.includes("follow-ai")) {
    unlock("follow-ai", 1);
  }

  // rainbow-week: 5 different coloured veggies in one week
  const coloredThisWeek = new Set<string>();
  weekMeals.forEach((m) => {
    m.foods.forEach((f) => {
      if (COLORED_VEGGIES.some((c) => f.toLowerCase().includes(c))) {
        coloredThisWeek.add(f.toLowerCase());
      }
    });
  });
  if (coloredThisWeek.size >= 5 && !unlocked.includes("rainbow-week")) unlock("rainbow-week", 2);

  // skin-defender: anti-acne suggested foods 5 days in a row
  const acneSuggestedByDay = new Set<string>();
  meals.forEach((m) => {
    if (m.fromSuggestion && m.symptomContext?.includes("Acne")) {
      acneSuggestedByDay.add(new Date(m.timestamp).toDateString());
    }
  });
  const acneDays = Array.from(acneSuggestedByDay).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  let acneStreak = 0;
  for (let i = 0; i < acneDays.length; i++) {
    if (i === 0) acneStreak = 1;
    else {
      const prev = new Date(acneDays[i - 1]).getTime();
      const curr = new Date(acneDays[i]).getTime();
      if (curr - prev <= 25 * 60 * 60 * 1000) acneStreak++;
      else acneStreak = 1;
    }
    if (acneStreak >= 5) break;
  }
  if (acneStreak >= 5 && !unlocked.includes("skin-defender")) unlock("skin-defender", 5);

  // protein-builder: protein-rich (≥20g) 5 days this week
  const proteinDays = new Set<string>();
  weekMeals.forEach((m) => {
    if (m.macros?.protein >= 20) {
      proteinDays.add(new Date(m.timestamp).toDateString());
    }
  });
  if (proteinDays.size >= 5 && !unlocked.includes("protein-builder")) unlock("protein-builder", 6);

  // veggie-veteran: vegetables 5x this week
  let veggieCount = 0;
  weekMeals.forEach((m) => {
    m.foods.forEach((f) => {
      if (hasKeyword(f, VEGGIE_KEYWORDS) || getFoodCategory(f) === "leafy_greens" || getFoodCategory(f) === "legumes") {
        veggieCount++;
      }
    });
  });
  if (veggieCount >= 5 && !unlocked.includes("veggie-veteran")) unlock("veggie-veteran", 7);

  // iron-will: iron-rich 4x this week
  let ironCount = 0;
  weekMeals.forEach((m) => {
    m.foods.forEach((f) => {
      if (hasKeyword(f, IRON_FOODS) || getFoodCategory(f) === "legumes" || getFoodCategory(f) === "red_meat") {
        ironCount++;
      }
    });
  });
  if (ironCount >= 4 && !unlocked.includes("iron-will")) unlock("iron-will", 8);

  // omega-champion: omega-3 foods 5x this week
  let omegaCount = 0;
  weekMeals.forEach((m) => {
    m.foods.forEach((f) => {
      if (hasKeyword(f, OMEGA_FOODS) || getFoodCategory(f) === "fatty_fish") {
        omegaCount++;
      }
    });
  });
  if (omegaCount >= 5 && !unlocked.includes("omega-champion")) unlock("omega-champion", 9);

  return newlyUnlocked;
}
