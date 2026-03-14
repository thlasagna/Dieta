export interface UserProfile {
  // Basic Info
  name?: string;
  age?: number;
  
  // Physical Metrics
  height?: number; // in cm
  weight?: number; // in kg
  gender?: "male" | "female" | "other";
  
  // Fitness Level
  fitnessLevel?: "beginner" | "intermediate" | "advanced";
  
  // Experience
  yearsOfTraining?: number;
  
  // Health Information
  injuries?: string[];
  medicalConditions?: string[];
  currentMedications?: string[];
  allergies?: string[];
  
  // Lifestyle
  availableHoursPerWeek?: number;
  preferredExerciseTypes?: string[];
  
  // Goals
  primaryGoal?: string;
  secondaryGoals?: string[];
  
  // Preferences
  equipment?: string[]; // gym, home, bodyweight, etc.
  restrictions?: string[]; // exercises to avoid
  
  // Metadata
  lastUpdated?: string;
}

const PROFILE_KEY = "user_profile";

export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  const profileWithTimestamp = {
    ...profile,
    lastUpdated: new Date().toISOString(),
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profileWithTimestamp));
}

export function updateUserProfile(updates: Partial<UserProfile>): void {
  const currentProfile = getUserProfile();
  const updatedProfile = { ...currentProfile, ...updates };
  saveUserProfile(updatedProfile);
}

export function clearUserProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}

/**
 * Generate a descriptive context string from the user profile for use with AI
 */
export function generateProfileContext(profile: UserProfile): string {
  const parts: string[] = [];

  if (profile.name) parts.push(`User name: ${profile.name}`);
  if (profile.age) parts.push(`Age: ${profile.age}`);
  if (profile.gender) parts.push(`Gender: ${profile.gender}`);

  if (profile.height || profile.weight) {
    const heightStr = profile.height ? `${profile.height}cm` : "";
    const weightStr = profile.weight ? `${profile.weight}kg` : "";
    parts.push(`Physical: ${heightStr} ${weightStr}`.trim());
  }

  if (profile.fitnessLevel) parts.push(`Fitness level: ${profile.fitnessLevel}`);
  if (profile.yearsOfTraining) parts.push(`Years of training experience: ${profile.yearsOfTraining}`);

  if (profile.injuries && profile.injuries.length > 0) {
    parts.push(`Previous injuries: ${profile.injuries.join(", ")}`);
  }

  if (profile.medicalConditions && profile.medicalConditions.length > 0) {
    parts.push(`Medical conditions: ${profile.medicalConditions.join(", ")}`);
  }

  if (profile.currentMedications && profile.currentMedications.length > 0) {
    parts.push(`Current medications: ${profile.currentMedications.join(", ")}`);
  }

  if (profile.allergies && profile.allergies.length > 0) {
    parts.push(`Allergies: ${profile.allergies.join(", ")}`);
  }

  if (profile.availableHoursPerWeek) {
    parts.push(`Available training time: ${profile.availableHoursPerWeek} hours/week`);
  }

  if (profile.preferredExerciseTypes && profile.preferredExerciseTypes.length > 0) {
    parts.push(`Preferred exercise types: ${profile.preferredExerciseTypes.join(", ")}`);
  }

  if (profile.primaryGoal) parts.push(`Primary goal: ${profile.primaryGoal}`);

  if (profile.secondaryGoals && profile.secondaryGoals.length > 0) {
    parts.push(`Secondary goals: ${profile.secondaryGoals.join(", ")}`);
  }

  if (profile.equipment && profile.equipment.length > 0) {
    parts.push(`Available equipment: ${profile.equipment.join(", ")}`);
  }

  if (profile.restrictions && profile.restrictions.length > 0) {
    parts.push(`Exercise restrictions: ${profile.restrictions.join(", ")}`);
  }

  return parts.join("\n");
}
