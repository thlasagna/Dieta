export type VitaminLevel = "low" | "medium" | "high";

export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface Vitamins {
  a: VitaminLevel;
  c: VitaminLevel;
  d: VitaminLevel;
  b12: VitaminLevel;
  iron: VitaminLevel;
  calcium: VitaminLevel;
  omega3: VitaminLevel;
  zinc: VitaminLevel;
}

export interface MealEntry {
  id: string;
  timestamp: number;
  foods: string[];
  calories: number;
  macros: Macros;
  vitamins: Vitamins;
  healthScore: number;
  imageBase64?: string;
  portionNote?: string;
  fromSuggestion?: boolean;
  symptomContext?: string[];
}

export interface FoodAnalysisResult {
  foods: string[];
  estimatedCalories: number;
  macros: Macros;
  vitamins: Vitamins;
  portionNote: string;
  healthScore: number;
}
