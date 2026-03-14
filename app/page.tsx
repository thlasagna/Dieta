"use client";

import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import LogTab from "@/components/LogTab";
import SuggestTab from "@/components/SuggestTab";
import ProgressTab from "@/components/ProgressTab";
import AchievementsTab from "@/components/AchievementsTab";

type TabId = "log" | "suggest" | "progress" | "achievements";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("log");

  return (
    <>
      <div className="min-h-screen">
        {activeTab === "log" && <LogTab />}
        {activeTab === "suggest" && <SuggestTab />}
        {activeTab === "progress" && <ProgressTab />}
        {activeTab === "achievements" && <AchievementsTab />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </>
  );
}
