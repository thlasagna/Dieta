"use client";

import { useState, useEffect } from "react";
import { getUserProfile, saveUserProfile, type UserProfile } from "@/app/lib/userProfile";
import Toast from "./Toast";

const InputField = (props: {
  label: string;
  type?: string;
  value?: any;
  placeholder?: string;
  onChange: (value: any) => void;
}) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{props.label}</label>
    <input
      type={props.type || "text"}
      value={props.value || ""}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    />
  </div>
);

const SelectField = (props: {
  label: string;
  value?: any;
  options: { label: string; value: string }[];
  onChange: (value: any) => void;
}) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{props.label}</label>
    <select
      value={props.value || ""}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <option value="">Select...</option>
      {props.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const ArrayInputField = (props: {
  label: string;
  value?: string[];
  placeholder?: string;
  onChange: (value: string) => void;
  helperText?: string;
}) => (
  <div>
    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{props.label}</label>
    <textarea
      value={(props.value || []).join(", ")}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-[#1e1e1e] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
      rows={2}
    />
    {props.helperText && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{props.helperText}</p>}
  </div>
);

interface ExpandableSectionProps {
  title: string;
  id: string;
  icon: string;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: (id: string) => void;
}

const ExpandableSection = (props: ExpandableSectionProps) => (
  <div className="rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 overflow-hidden">
    <button
      onClick={() => props.onToggle(props.id)}
      className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{props.icon}</span>
          <h3 className="font-semibold">{props.title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${props.isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </button>

    {props.isExpanded && (
      <div className="px-4 pb-4 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
        {props.children}
      </div>
    )}
  </div>
);

export default function ProfileTab() {
  const [profile, setProfile] = useState<UserProfile>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>("basic");

  useEffect(() => {
    const savedProfile = getUserProfile();
    setProfile(savedProfile);
  }, []);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleArrayChange = (field: keyof UserProfile, value: string) => {
    const currentArray = (profile[field] as string[]) || [];
    const newArray = value.split(",").map((item) => item.trimStart()).filter((item) => item.length > 0);
    handleChange(field, newArray);
  };

  const handleSaveProfile = () => {
    saveUserProfile(profile);
    setHasChanges(false);
    setToast({ message: "Profile saved successfully!", type: "success" });
  };

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Customize your profile so we can personalize your workouts and recommendations
      </p>

      <div className="space-y-3 mb-6">
        {/* Basic Information */}
        <ExpandableSection title="Basic Information" id="basic" icon="👤" isExpanded={expandedSection === "basic"} onToggle={() => setExpandedSection(expandedSection === "basic" ? "" : "basic")}>
          <InputField label="Name" value={profile.name} onChange={(v) => handleChange("name", v)} placeholder="Your name" />

          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Age"
              type="number"
              value={profile.age || ""}
              onChange={(v) => handleChange("age", v === "" ? undefined : parseInt(v, 10))}
              placeholder="Years"
            />
            <SelectField
              label="Gender"
              value={profile.gender}
              options={[
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ]}
              onChange={(v) => handleChange("gender", v)}
            />
          </div>
        </ExpandableSection>

        {/* Physical Metrics */}
        <ExpandableSection title="Physical Metrics" id="metrics" icon="📏" isExpanded={expandedSection === "metrics"} onToggle={() => setExpandedSection(expandedSection === "metrics" ? "" : "metrics")}>
          <div className="grid grid-cols-2 gap-3">
            <InputField
              label="Height (cm)"
              type="number"
              value={profile.height || ""}
              onChange={(v) => handleChange("height", v === "" ? undefined : parseInt(v, 10))}
              placeholder="e.g., 180"
            />
            <InputField
              label="Weight (kg)"
              type="number"
              value={profile.weight || ""}
              onChange={(v) => handleChange("weight", v === "" ? undefined : parseFloat(v))}
              placeholder="e.g., 75.5"
            />
          </div>
        </ExpandableSection>

        {/* Fitness Profile */}
        <ExpandableSection title="Fitness Profile" id="fitness" icon="💪" isExpanded={expandedSection === "fitness"} onToggle={() => setExpandedSection(expandedSection === "fitness" ? "" : "fitness")}>
          <SelectField
            label="Fitness Level"
            value={profile.fitnessLevel}
            options={[
              { label: "Beginner - Little to no training experience", value: "beginner" },
              { label: "Intermediate - Some training experience", value: "intermediate" },
              { label: "Advanced - Extensive training experience", value: "advanced" },
            ]}
            onChange={(v) => handleChange("fitnessLevel", v)}
          />

          <InputField
            label="Years of Training Experience"
            type="number"
            value={profile.yearsOfTraining || ""}
            onChange={(v) => handleChange("yearsOfTraining", v === "" ? undefined : parseInt(v, 10))}
            placeholder="e.g., 3"
          />

          <InputField
            label="Available Training Hours per Week"
            type="number"
            value={profile.availableHoursPerWeek || ""}
            onChange={(v) => handleChange("availableHoursPerWeek", v === "" ? undefined : parseFloat(v))}
            placeholder="e.g., 5"
          />

          <ArrayInputField
            label="Preferred Exercise Types"
            value={profile.preferredExerciseTypes}
            onChange={(v) => handleArrayChange("preferredExerciseTypes", v)}
            placeholder="e.g., weightlifting, cardio, calisthenics"
            helperText="Separate multiple items with commas"
          />

          <ArrayInputField
            label="Available Equipment"
            value={profile.equipment}
            onChange={(v) => handleArrayChange("equipment", v)}
            placeholder="e.g., dumbbells, barbells, gym, home"
            helperText="Separate multiple items with commas"
          />
        </ExpandableSection>

        {/* Goals */}
        <ExpandableSection title="Goals" id="goals" icon="🎯" isExpanded={expandedSection === "goals"} onToggle={() => setExpandedSection(expandedSection === "goals" ? "" : "goals")}>
          <InputField
            label="Primary Goal"
            value={profile.primaryGoal}
            onChange={(v) => handleChange("primaryGoal", v)}
            placeholder="e.g., Build muscle, lose fat, increase strength"
          />

          <ArrayInputField
            label="Secondary Goals"
            value={profile.secondaryGoals}
            onChange={(v) => handleArrayChange("secondaryGoals", v)}
            placeholder="e.g., improve endurance, gain flexibility"
            helperText="Separate multiple goals with commas"
          />
        </ExpandableSection>

        {/* Health Information */}
        <ExpandableSection title="Health Information" id="health" icon="🏥" isExpanded={expandedSection === "health"} onToggle={() => setExpandedSection(expandedSection === "health" ? "" : "health")}>
          <ArrayInputField
            label="Previous Injuries"
            value={profile.injuries}
            onChange={(v) => handleArrayChange("injuries", v)}
            placeholder="e.g., lower back strain, knee problems, shoulder impingement"
            helperText="This helps us avoid exercises that could aggravate past injuries"
          />

          <ArrayInputField
            label="Medical Conditions"
            value={profile.medicalConditions}
            onChange={(v) => handleArrayChange("medicalConditions", v)}
            placeholder="e.g., asthma, arthritis, diabetes"
            helperText="Any ongoing conditions we should consider"
          />

          <ArrayInputField
            label="Current Medications"
            value={profile.currentMedications}
            onChange={(v) => handleArrayChange("currentMedications", v)}
            placeholder="e.g., blood pressure medication, anti-inflammatory drugs"
            helperText="Optional - helps us provide better recommendations"
          />

          <ArrayInputField
            label="Allergies"
            value={profile.allergies}
            onChange={(v) => handleArrayChange("allergies", v)}
            placeholder="e.g., latex, certain supplements"
            helperText="Relevant for equipment and supplement recommendations"
          />
        </ExpandableSection>

        {/* Restrictions */}
        <ExpandableSection title="Restrictions & Preferences" id="restrictions" icon="⚠️" isExpanded={expandedSection === "restrictions"} onToggle={() => setExpandedSection(expandedSection === "restrictions" ? "" : "restrictions")}>
          <ArrayInputField
            label="Exercises to Avoid"
            value={profile.restrictions}
            onChange={(v) => handleArrayChange("restrictions", v)}
            placeholder="e.g., heavy deadlifts, running, jumping exercises"
            helperText="Specific exercises you want to avoid or cannot do"
          />
        </ExpandableSection>
      </div>

      {/* Profile Summary */}
      {Object.keys(profile).filter((k) => k !== "lastUpdated" && (profile as any)[k]).length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 mb-6">
          <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-100">Profile Completeness</h3>
          <p className="text-xs text-blue-800 dark:text-blue-200">
            ✓ Your profile information will be used to personalize workout plans and exercise recommendations
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-2 mb-6">
        {hasChanges && (
          <button
            onClick={() => {
              setProfile(getUserProfile());
              setHasChanges(false);
              setToast({ message: "Changes discarded", type: "success" });
            }}
            className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Discard Changes
          </button>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={!hasChanges}
          className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
            hasChanges
              ? "bg-primary text-white hover:bg-primary/90"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          }`}
        >
          {hasChanges ? "Save Profile" : "Profile Saved"}
        </button>
      </div>

      {profile.lastUpdated && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Last updated: {new Date(profile.lastUpdated).toLocaleDateString()}
        </p>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
