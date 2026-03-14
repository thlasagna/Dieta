"use client";

import { useState } from "react";
import { getUserProfile } from "@/app/lib/userProfile";

interface FormFeedback {
  issue: string;
  severity: "low" | "medium" | "high";
  suggestion: string;
}

interface InjuryRisk {
  area: string;
  risk_level: "low" | "medium" | "high";
  advice: string;
}

export default function LiveWorkoutFeedTab() {
  const [isRecording, setIsRecording] = useState(false);
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const userProfile = getUserProfile();
  const [formFeedback] = useState<FormFeedback[]>([
    {
      issue: "Elbow position slightly off",
      severity: "low",
      suggestion: "Keep elbows closer to your body for better muscle engagement",
    },
    {
      issue: "Back not fully straight",
      severity: "medium",
      suggestion: "Engage your core and maintain a neutral spine throughout the movement",
    },
  ]);
  const [injuryRisks] = useState<InjuryRisk[]>([
    {
      area: "Lower back",
      risk_level: "medium",
      advice: "Your knees are extending beyond your toes. Try narrowing your stance.",
    },
    {
      area: "Shoulders",
      risk_level: "low",
      advice: "Monitor for excessive internal rotation during the movement.",
    },
  ]);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-6">Live Workout</h1>

      {/* Video Stream Section */}
      <div className="mb-6 rounded-2xl overflow-hidden bg-black/10 dark:bg-black/40 border border-black/8 dark:border-white/8">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
          {/* Video Placeholder */}
          <div className="w-full h-full flex flex-col items-center justify-center">
            {!hasVideoAccess ? (
              <>
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-400 text-sm">Camera access needed</p>
                <button
                  onClick={() => setHasVideoAccess(true)}
                  className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Enable Camera
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-white text-sm font-medium">LIVE</span>
                </div>
                <p className="text-gray-400 text-xs mt-4">[Camera Feed]</p>
              </>
            )}
          </div>

          {/* Recording Button */}
          {hasVideoAccess && (
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${isRecording ? "bg-red-600" : "bg-white"}`} />
            </button>
          )}
        </div>

        {/* Video Controls */}
        {hasVideoAccess && (
          <div className="bg-white dark:bg-[#141414] border-t border-black/8 dark:border-white/8 p-3 flex gap-2">
            <button className="flex-1 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
              </svg>
              Flip Camera
            </button>
            <button className="flex-1 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Settings
            </button>
          </div>
        )}
      </div>

      {/* Form Feedback Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Form Feedback</h2>
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
            Real-time
          </span>
        </div>

        <div className="space-y-2">
          {formFeedback.length > 0 ? (
            formFeedback.map((feedback, idx) => (
              <button
                key={idx}
                onClick={() => setExpandedFeedback(expandedFeedback === feedback.issue ? null : feedback.issue)}
                className="w-full p-3 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 
                         text-left hover:border-primary/30 dark:hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      feedback.severity === "high"
                        ? "bg-red-500"
                        : feedback.severity === "medium"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{feedback.issue}</p>
                    {expandedFeedback === feedback.issue && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{feedback.suggestion}</p>
                    )}
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${
                      expandedFeedback === feedback.issue ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Start recording to get form feedback</p>
            </div>
          )}
        </div>
      </div>

      {/* Injury Risk Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-red-500">⚠️</span> Injury Risk Assessment
          </h2>
        </div>

        <div className="space-y-2">
          {injuryRisks.length > 0 ? (
            injuryRisks.map((risk, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border-2 transition-colors ${
                  risk.risk_level === "high"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    : risk.risk_level === "medium"
                    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`text-lg ${
                      risk.risk_level === "high"
                        ? "text-red-600"
                        : risk.risk_level === "medium"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}
                  >
                    {risk.risk_level === "high" ? "🔴" : risk.risk_level === "medium" ? "🟡" : "🔵"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{risk.area}</p>
                    <p
                      className={`text-xs mt-1 ${
                        risk.risk_level === "high"
                          ? "text-red-700 dark:text-red-400"
                          : risk.risk_level === "medium"
                          ? "text-yellow-700 dark:text-yellow-400"
                          : "text-blue-700 dark:text-blue-400"
                      }`}
                    >
                      {risk.advice}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">No risks detected yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <span className="text-lg">💡</span> Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Ensure good lighting for accurate form analysis</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Maintain clear view of your entire body in the frame</span>
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            <span>Focus on controlled movements for better feedback</span>
          {userProfile.injuries && userProfile.injuries.length > 0 && (
            <li className="flex gap-2 mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-700 dark:text-yellow-200">
                Remember to protect your {userProfile.injuries.join(", ")}. The AI will flag movements that could aggravate these areas.
              </span>
            </li>
          )}
          </li>
        </ul>
      </div>
    </div>
  );
}
