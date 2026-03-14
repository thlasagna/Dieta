"use client";

type TabId = "log" | "suggest" | "progress" | "achievements" | "workout-plan" | "current-plan" | "live-workout" | "fitness-achievements" | "profile";
type Section = "profile" | "nutrition" | "fitness";

interface BottomNavProps {
  activeTab: TabId;
  section: Section;
  onTabChange: (tab: TabId) => void;
  onSectionChange: (section: Section) => void;
}

const nutritionTabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "log",
    label: "Log",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
      </svg>
    ),
  },
  {
    id: "suggest",
    label: "Suggest",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: "progress",
    label: "Progress",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "achievements",
    label: "Achievements",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
  },
];

const fitnessTabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "current-plan",
    label: "Plan",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: "workout-plan",
    label: "Workouts",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "live-workout",
    label: "Live",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: "fitness-achievements",
    label: "Stats",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function BottomNav({ activeTab, section, onTabChange, onSectionChange }: BottomNavProps) {
  const currentTabs = section === "nutrition" ? nutritionTabs : fitnessTabs;

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] safe-area-bottom z-50">
      {/* Section Tabs */}
      <div
        className="bg-white dark:bg-[#141414] border-b border-black/8 dark:border-white/8
                   flex items-center justify-around h-12"
      >
        <button
          onClick={() => onSectionChange("profile")}
          className={`flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors ${
            section === "profile"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Profile
        </button>
        <button
          onClick={() => onSectionChange("nutrition")}
          className={`flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors ${
            section === "nutrition"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Nutrition
        </button>
        <button
          onClick={() => onSectionChange("fitness")}
          className={`flex-1 h-full flex items-center justify-center font-medium text-sm transition-colors ${
            section === "fitness"
              ? "text-primary border-b-2 border-primary"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          Fitness
        </button>
      </div>

      {/* Content Tabs - Only show when not on Profile */}
      {section !== "profile" && (
        <nav
          className="h-[60px] flex items-center justify-around bg-white dark:bg-[#141414] border-t border-black/8 dark:border-white/8"
        >
          {currentTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-3 transition-colors ${
                  isActive ? "text-primary" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.icon}
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
