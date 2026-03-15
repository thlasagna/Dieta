"use client";

import { useState, useRef, useEffect } from "react";
import { getUserProfile } from "@/app/lib/userProfile";

interface ExerciseFeedback {
  mode: string;
  stage: string;
  aiScore?: number;
  coaches?: string[];
  depth?: number;
}

export default function LiveWorkoutFeedTab() {
  const [exerciseType, setExerciseType] = useState<"LUNGE" | "PUSHUP" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const videoStreamRef = useRef<HTMLImageElement>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const userProfile = getUserProfile();

  // Start recording and stream
  const handleStartRecording = async () => {
    if (!exerciseType) {
      alert("Please select an exercise first");
      return;
    }

    try {
      setConnectionError(null);
      
      // Start exercise session on backend
      const startResponse = await fetch("http://localhost:5000/api/exercise/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          exercise: exerciseType,
          userProfile: userProfile  // Send user profile for AI analysis
        }),
      });

      if (!startResponse.ok) {
        const errorMsg = `Failed to connect to exercise tracking server (${startResponse.status}). Make sure the Python backend is running on port 5000.`;
        console.error(errorMsg);
        setConnectionError(errorMsg);
        return;
      }

      console.log("Exercise session started successfully");
      setIsRecording(true);
      setFeedback(null);

      // Start streaming video (img src will auto-reconnect on 204 responses)
      if (videoStreamRef.current) {
        // Use a timestamp to force refresh of the stream
        videoStreamRef.current.src = `http://localhost:5000/api/exercise/stream?t=${Date.now()}`;
      }

      // Poll for stats every 500ms
      statsIntervalRef.current = setInterval(async () => {
        try {
          const statsResponse = await fetch("http://localhost:5000/api/exercise/stats");
          if (statsResponse.ok) {
            const data = await statsResponse.json();
            setFeedback(data);
            setConnectionError(null);
          }
        } catch (error) {
          console.error("Stats fetch error:", error);
        }
      }, 500);

    } catch (error) {
      console.error("Error starting recording:", error);
      setConnectionError(error instanceof Error ? error.message : "Failed to start exercise tracking");
      setIsRecording(false);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    console.log("Stopping exercise session...");
    setIsRecording(false);
    
    if (statsIntervalRef.current) {
      clearInterval(statsIntervalRef.current);
      statsIntervalRef.current = null;
    }

    if (videoStreamRef.current) {
      videoStreamRef.current.src = "";
    }

    try {
      await fetch("http://localhost:5000/api/exercise/reset", { method: "POST" });
      console.log("Exercise session reset successfully");
    } catch (error) {
      console.error("Reset error:", error);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      if (videoStreamRef.current) {
        videoStreamRef.current.src = "";
      }
    };
  }, []);

  return (
    <div className="pb-28 px-4 pt-4">
      <h1 className="text-2xl font-bold mb-6">Live Workout</h1>

      {/* Connection Error Alert */}
      {connectionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-200">{connectionError}</p>
          <p className="text-xs text-red-600 dark:text-red-300 mt-2">
            Start the Python backend with: <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">cd exercise_feed && python app.py</code>
          </p>
        </div>
      )}

      {/* Exercise Selection */}
      {!isRecording && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Choose Exercise</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setExerciseType("LUNGE")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                exerciseType === "LUNGE"
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-black/8 dark:border-white/8 hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">🦵</div>
              <p className="font-semibold text-sm">Lunge</p>
            </button>
            <button
              onClick={() => setExerciseType("PUSHUP")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                exerciseType === "PUSHUP"
                  ? "border-primary bg-primary/10 dark:bg-primary/20"
                  : "border-black/8 dark:border-white/8 hover:border-primary/50"
              }`}
            >
              <div className="text-2xl mb-2">💪</div>
              <p className="font-semibold text-sm">Push-Up</p>
            </button>
          </div>
        </div>
      )}

      {/* Video Stream Section */}
      <div className="mb-6 rounded-2xl overflow-hidden bg-black/10 dark:bg-black/40 border border-black/8 dark:border-white/8">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative">
          {/* MJPEG Stream from Flask Backend */}
          <img
            ref={videoStreamRef}
            alt="Live pose tracking stream"
            className={`absolute inset-0 w-full h-full object-cover ${
              isRecording ? "opacity-100" : "opacity-0"
            } transition-opacity`}
          />

          {isRecording && (
            <>
              {/* Recording Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 px-3 py-2 rounded-full z-10 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-sm font-semibold text-white">LIVE</span>
              </div>


            </>
          )}

          {!isRecording && (
            <div className="text-center text-gray-400">
              <p className="text-lg">Select an exercise and press Start to begin</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Feedback Panel - Separate from video */}
      {isRecording && feedback && (
        <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">AI Feedback</h3>
          <div className="space-y-3">
            {feedback.mode && (
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Form Analysis</p>
                <p className="text-base text-blue-900 dark:text-blue-100">{feedback.mode}</p>
              </div>
            )}
            {feedback.stage && (
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Stage</p>
                <p className="text-base text-blue-900 dark:text-blue-100">{feedback.stage}</p>
              </div>
            )}
            {feedback.aiScore !== undefined && feedback.aiScore > 0 && (
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-1">Form Score</p>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round(feedback.aiScore * 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-base font-bold text-blue-900 dark:text-blue-100">
                    {Math.round(feedback.aiScore * 100)}%
                  </span>
                </div>
              </div>
            )}
            {feedback.coaches && Array.isArray(feedback.coaches) && feedback.coaches.length > 0 && (
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold mb-2">Coaching Tips</p>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  {feedback.coaches.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex gap-3 mb-6">
        {!isRecording ? (
          <button
            onClick={handleStartRecording}
            disabled={!exerciseType}
            className={`flex-1 p-4 rounded-xl font-semibold transition-all ${
              exerciseType
                ? "bg-primary text-white hover:bg-primary/90"
                : "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
            }`}
          >
            Start Exercise
          </button>
        ) : (
          <button
            onClick={handleStopRecording}
            className="flex-1 p-4 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
          >
            Stop Exercise
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How It Works</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>✓ Select your exercise type (Lunge or Push-up)</li>
            <li>✓ Press Start to begin live pose detection</li>
            <li>✓ The camera feed will show skeleton overlays</li>
            <li>✓ Form feedback updates in real-time</li>
            <li>✓ Rep count increases automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
