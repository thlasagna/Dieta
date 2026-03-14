/**
 * Client-side food category detection for frequency tracker.
 * Uses keyword matching; could be extended with Claude API for accuracy.
 */

export type FoodCategory = "leafy_greens" | "fatty_fish" | "legumes" | "red_meat";

const KEYWORDS: Record<FoodCategory, string[]> = {
  leafy_greens: [
    "spinach", "kale", "lettuce", "arugula", "chard", "collard", "mustard greens",
    "bok choy", "cabbage", "watercress", "dandelion", "endive", "romaine",
  ],
  fatty_fish: [
    "salmon", "sardines", "mackerel", "herring", "trout", "tuna", "anchovies",
  ],
  legumes: [
    "beans", "lentils", "chickpeas", "peas", "black beans", "kidney beans",
    "pinto beans", "navy beans", "lima beans", "edamame", "hummus",
  ],
  red_meat: [
    "beef", "lamb", "pork", "veal", "steak", "burger", "bacon",
  ],
};

export function getFoodCategory(foodName: string): FoodCategory | null {
  const lower = foodName.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      return category as FoodCategory;
    }
  }
  return null;
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  leafy_greens: "Leafy greens",
  fatty_fish: "Fatty fish",
  legumes: "Legumes",
  red_meat: "Red meat",
};

export const CATEGORY_TARGETS: Record<FoodCategory, { min: number; max: number }> = {
  leafy_greens: { min: 4, max: 5 },
  fatty_fish: { min: 2, max: 3 },
  legumes: { min: 3, max: 4 },
  red_meat: { min: 0, max: 2 },
};
