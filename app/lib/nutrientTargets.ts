/**
 * Weekly nutrient targets for gamified tracking.
 * Based on typical daily recommendations × 7 days.
 */

export const VITAMIN_KEYS = ["a", "c", "d", "b12", "iron", "calcium", "omega3", "zinc"] as const;

export const VITAMIN_LABELS: Record<string, string> = {
  a: "Vitamin A",
  c: "Vitamin C",
  d: "Vitamin D",
  b12: "B12",
  iron: "Iron",
  calcium: "Calcium",
  omega3: "Omega-3",
  zinc: "Zinc",
};

export const VITAMIN_ICONS: Record<string, string> = {
  a: "🥕",
  c: "🍊",
  d: "☀️",
  b12: "🥩",
  iron: "🩸",
  calcium: "🥛",
  omega3: "🐟",
  zinc: "🌰",
};

/** Why each vitamin matters */
export const VITAMIN_DESCRIPTIONS: Record<string, string> = {
  a: "Supports vision, immune function, and skin health. Keeps your eyes sharp and helps your body fight off infections.",
  c: "Boosts immunity and acts as an antioxidant. Helps heal wounds and keeps your skin, bones, and blood vessels strong.",
  d: "Strengthens bones by helping you absorb calcium. Also supports mood, immunity, and muscle function.",
  b12: "Essential for energy, red blood cell production, and nerve health. Keeps you from feeling tired and foggy.",
  iron: "Carries oxygen through your blood. Prevents fatigue and supports focus, energy, and healthy hair.",
  calcium: "Builds and maintains strong bones and teeth. Also helps muscles contract and nerves send signals.",
  omega3: "Supports brain health, reduces inflammation, and benefits heart health. Good for mood and focus.",
  zinc: "Boosts immunity and wound healing. Important for taste, smell, and healthy skin.",
};

/** Foods high in each vitamin — for suggestion popup */
export const VITAMIN_RICH_FOODS: Record<string, string[]> = {
  a: ["Carrots", "Sweet potato", "Spinach", "Kale", "Pumpkin", "Bell peppers", "Cantaloupe", "Mango", "Eggs", "Liver"],
  c: ["Oranges", "Strawberries", "Kiwi", "Bell peppers", "Broccoli", "Brussels sprouts", "Tomatoes", "Papaya", "Lemons", "Kale"],
  d: ["Salmon", "Mackerel", "Sardines", "Egg yolks", "Mushrooms (UV-exposed)", "Fortified milk", "Cod liver oil", "Tuna", "Fortified cereals"],
  b12: ["Beef", "Chicken", "Fish", "Eggs", "Milk", "Yogurt", "Cheese", "Clams", "Sardines", "Fortified cereals", "Nutritional yeast"],
  iron: ["Spinach", "Red meat", "Lentils", "Chickpeas", "Tofu", "Quinoa", "Beans", "Pumpkin seeds", "Dark chocolate", "Turkey"],
  calcium: ["Milk", "Yogurt", "Cheese", "Sardines", "Tofu", "Almonds", "Kale", "Broccoli", "Fortified plant milk", "Cottage cheese"],
  omega3: ["Salmon", "Mackerel", "Sardines", "Walnuts", "Chia seeds", "Flaxseeds", "Herring", "Anchovies", "Fish oil", "Brussels sprouts"],
  zinc: ["Beef", "Pumpkin seeds", "Lentils", "Chickpeas", "Oysters", "Cashews", "Yogurt", "Chicken", "Quinoa", "Mushrooms"],
};

/** Meals with high/medium level needed per week for each vitamin */
export const VITAMIN_WEEKLY_TARGET = 4;

/** Weekly macro targets (grams) - 7 × daily recommendation */
export const MACRO_WEEKLY_TARGETS = {
  protein: 350,  // ~50g/day
  fiber: 140,    // ~20g/day
  carbs: 875,    // ~125g/day
  fat: 350,      // ~50g/day
};

/** Why each macro matters */
export const MACRO_DESCRIPTIONS: Record<string, string> = {
  protein: "Builds and repairs muscles, organs, and tissues. Keeps you full longer and supports a strong immune system.",
  fiber: "Aids digestion, keeps you regular, and feeds gut bacteria. Helps control blood sugar and cholesterol.",
  carbs: "Your body's main energy source. Fuels your brain and muscles — especially important for activity and focus.",
  fat: "Provides energy, helps absorb vitamins A/D/E/K, and supports cell growth. Keeps skin and hormones healthy.",
};

/** Foods high in each macro */
export const MACRO_RICH_FOODS: Record<string, string[]> = {
  protein: ["Chicken", "Beef", "Fish", "Eggs", "Greek yogurt", "Tofu", "Lentils", "Chickpeas", "Cottage cheese", "Quinoa"],
  fiber: ["Oats", "Lentils", "Black beans", "Broccoli", "Apples", "Avocado", "Chia seeds", "Almonds", "Sweet potato", "Berries"],
  carbs: ["Rice", "Pasta", "Bread", "Oats", "Quinoa", "Potatoes", "Bananas", "Sweet potato", "Fruits", "Legumes"],
  fat: ["Avocado", "Olive oil", "Nuts", "Salmon", "Eggs", "Cheese", "Dark chocolate", "Chia seeds", "Olives", "Coconut"],
};
