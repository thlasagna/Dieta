"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import LogTab from "@/components/LogTab";
import SuggestTab from "@/components/SuggestTab";
import ProgressTab from "@/components/ProgressTab";
import AchievementsTab from "@/components/AchievementsTab";
import WorkoutPlanTab from "@/components/WorkoutPlanTab";
import LiveWorkoutFeedTab from "@/components/LiveWorkoutFeedTab";
import FitnessFitnessAchievementsTab from "@/components/FitnessFitnessAchievementsTab";
import CurrentPlanTab from "@/components/CurrentPlanTab";
import ProfileTab from "@/components/ProfileTab";

type Section = "profile" | "nutrition" | "fitness";
type NutritionTabId = "log" | "suggest" | "progress" | "achievements";
type FitnessTabId = "workout-plan" | "current-plan" | "live-workout" | "fitness-achievements";
type TabId = NutritionTabId | FitnessTabId | "profile";

export default function Home() {
  const [section, setSection] = useState<Section>("nutrition");
  const [activeNutritionTab, setActiveNutritionTab] = useState<NutritionTabId>("log");
  const [activeFitnessTab, setActiveFitnessTab] = useState<FitnessTabId>("current-plan");

  const activeTab: TabId = section === "nutrition" ? activeNutritionTab : section === "fitness" ? activeFitnessTab : "profile";

  const handleTabChange = (tab: TabId) => {
    if (tab === "profile") {
      setSection("profile");
    } else if (tab === "log" || tab === "suggest" || tab === "progress" || tab === "achievements") {
      setSection("nutrition");
      setActiveNutritionTab(tab);
    } else {
      setSection("fitness");
      if (tab === "workout-plan" || tab === "current-plan" || tab === "live-workout" || tab === "fitness-achievements") {
        setActiveFitnessTab(tab);
      }
    }
  };

  const handlePlanSelected = (plan: any) => {
    // Save current plan to localStorage
    localStorage.setItem("current_workout_plan", JSON.stringify(plan));
    // Navigate to current plan tab
    setSection("fitness");
    setActiveFitnessTab("current-plan");
  };

  return (
    <>
      <div className="min-h-screen">
        {/* Profile Section */}
        {section === "profile" && <ProfileTab />}

        {/* Nutrition Tabs */}
        {section === "nutrition" && (
          <>
            {activeNutritionTab === "log" && <LogTab />}
            {activeNutritionTab === "suggest" && <SuggestTab />}
            {activeNutritionTab === "progress" && <ProgressTab />}
            {activeNutritionTab === "achievements" && <AchievementsTab />}
          </>
        )}

        {/* Fitness Tabs */}
        {section === "fitness" && (
          <>
            {activeFitnessTab === "current-plan" && <CurrentPlanTab />}
            {activeFitnessTab === "workout-plan" && <WorkoutPlanTab onPlanSelected={handlePlanSelected} />}
            {activeFitnessTab === "live-workout" && <LiveWorkoutFeedTab />}
            {activeFitnessTab === "fitness-achievements" && <FitnessFitnessAchievementsTab />}
          </>
        )}
      </div>
      <BottomNav 
        activeTab={activeTab} 
        section={section}
        onTabChange={handleTabChange}
        onSectionChange={setSection}
      />
    </>
  );
}
