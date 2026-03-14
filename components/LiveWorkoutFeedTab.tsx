"use client";

import { useState, useRef, useEffect } from "react";
import { getUserProfile } from "@/app/lib/userProfile";

interface ExerciseFeedback {
  status: string;
  severity: "low" | "medium" | "high";
  issues: string[];
  angles?: Record<string, number>;
  reps?: number;
  annotated_frame?: string;
}

export default function LiveWorkoutFeedTab() {
  const [exerciseType, setExerciseType] = useState<"LUNGE" | "PUSHUP" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [hasVideoAccess, setHasVideoAccess] = useState(false);
  const [feedback, setFeedback] = useState<ExerciseFeedback | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout>();
  const isAnalyzingRef = useRef(false);
  
  const userProfile = getUserProfile();

  // Enable camera access
  const handleEnableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 360 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasVideoAccess(true);
      setConnectionError(null);
    } catch (error) {
      console.error("Camera access denied:", error);
      alert("Camera access is required for exercise tracking");
    }
  };

  const drawKeypoints = (kpts: number[][], ctx: CanvasRenderingContext2D) => {
    if (!kpts || kpts.length === 0) return;

    const connections = [
      [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
      [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
      [5, 11], [6, 12]
    ];

    const baseWidth = 640;
    const baseHeight = 360;
    const scaleX = ctx.canvas.width / baseWidth;
    const scaleY = ctx.canvas.height / baseHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.lineWidth = 6;

    connections.forEach(([a, b]) => {
      const Pa = kpts[a];
      const Pb = kpts[b];
      if (!Pa || !Pb) return;
      const confThreshold = 0.2;
      if (Pa[2] < confThreshold || Pb[2] < confThreshold) return;

      ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.moveTo(Pa[0] * scaleX, Pa[1] * scaleY);
      ctx.lineTo(Pb[0] * scaleX, Pb[1] * scaleY);
      ctx.stroke();
    });

    kpts.forEach((kp) => {
      if (!kp) return;
      const [x, y, c] = kp;
      if (c < 0.2) return;
      ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      ctx.beginPath();
      ctx.arc(x * scaleX, y * scaleY, 6, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  useEffect(() => {
    if (!overlayRef.current) return;
    const ctx = overlayRef.current.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, overlayRef.current.width, overlayRef.current.height);
    if (feedback?.kpts && Array.isArray(feedback.kpts) && feedback.kpts.length > 0) {
      drawKeypoints(feedback.kpts as number[][], ctx);
    }
  }, [feedback]);

  // Start recording and analyzing exercises
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
        body: JSON.stringify({ exercise: exerciseType }),
      });

      if (!startResponse.ok) {
        throw new Error("Failed to connect to exercise tracking server. Make sure the Python backend is running.");
      }

      setIsRecording(true);
      setFeedback(null);

      // Give video time to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // Process frames every 250ms for better responsiveness; skip while previous request is processing
      frameIntervalRef.current = setInterval(async () => {
        if (isAnalyzingRef.current) {
          return;
        }

        if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext("2d");
          if (context && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            isAnalyzingRef.current = true;
            try {
              context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
              const frameData = canvasRef.current.toDataURL("image/jpeg", 0.7);

              const response = await fetch("http://localhost:5000/api/exercise/analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ frame: frameData, annotate: false }),
              });

              if (response.ok) {
                const data = await response.json();
                setFeedback(data);
              } else {
                console.error("Backend error:", response.status, response.statusText);
              }
            } catch (error) {
              console.error("Frame analysis error:", error);
            } finally {
              isAnalyzingRef.current = false;
            }
          }
        }
      }, 250);
    } catch (error) {
      console.error("Error starting recording:", error);
      setConnectionError(error instanceof Error ? error.message : "Failed to start exercise tracking");
      setIsRecording(false);
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    setIsRecording(false);
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }

    try {
      await fetch("http://localhost:5000/api/exercise/reset", { method: "POST" });
    } catch (error) {
      console.error("Reset error:", error);
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
            Start the Python backend with: <code className="bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded">python app.py</code> in the exercise_feed folder
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
          {/* Video Element - always play in background */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover ${
              hasVideoAccess ? "opacity-100" : "opacity-0"
            } transition-opacity`}
          />

          {/* Live overlay of keypoints & skeleton */}
          <canvas
            ref={overlayRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />

          {isRecording && (
            <div className="absolute top-4 left-4 bg-black/40 text-white text-xs px-2 py-1 rounded">
              {feedback?.status ? `${feedback.status}` : "Analyzing pose..."}
            </div>
          )}
          {isRecording && feedback?.issues && feedback.issues.length > 0 && (
            <div className="absolute bottom-4 left-4 bg-black/40 text-white text-xs px-2 py-1 rounded max-w-[80%]">
              <p>{feedback.issues[0]}</p>
            </div>
          )}

          {/* Canvas for frame capture (hidden) */}
          <canvas 
            ref={canvasRef} 
            width={640} 
            height={360} 
            className="hidden" 
          />

          {/* Overlay when no video access */}
          {!hasVideoAccess && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
              <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-400 text-sm">Camera access needed</p>
              <button
                onClick={handleEnableCamera}
                className="mt-3 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Enable Camera
              </button>
            </div>
          )}

          {/* Live indicator */}
          {hasVideoAccess && isRecording && (
            <div className="absolute top-4 left-4 flex gap-2 bg-black/40 px-3 py-2 rounded-full">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white text-sm font-medium">LIVE</span>
            </div>
          )}

          {/* Recording Button */}
          {hasVideoAccess && (
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`absolute bottom-4 right-4 w-14 h-14 rounded-full flex items-center justify-center transition-colors z-10 ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/50"
                  : "bg-white/20 hover:bg-white/30"
              }`}
            >
              <div className={`w-6 h-6 rounded-full ${isRecording ? "bg-red-600" : "bg-white"}`} />
            </button>
          )}
        </div>
      </div>

      {/* Rep Counter (for Push-ups) */}
      {exerciseType === "PUSHUP" && feedback && feedback.reps !== undefined && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Reps Completed</p>
          <p className="text-4xl font-bold text-primary">{feedback.reps}</p>
        </div>
      )}

      {/* Form Feedback Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold">Form Feedback</h2>
          {isRecording && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
              Real-time
            </span>
          )}
        </div>

        <div className="space-y-2">
          {feedback && feedback.issues && feedback.issues.length > 0 ? (
            <>
              {/* Main Status */}
              <div
                className={`p-3 rounded-xl border-2 transition-colors ${
                  feedback.severity === "high"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                    : feedback.severity === "medium"
                    ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                    : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                }`}
              >
                <p className="font-semibold text-sm">{feedback.status}</p>
              </div>

              {/* Issues List */}
              {feedback.issues.map((issue, idx) => (
                <button
                  key={idx}
                  onClick={() => setExpandedFeedback(expandedFeedback === idx ? null : idx)}
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
                    <p className="font-medium text-sm">{issue}</p>
                  </div>
                </button>
              ))}
            </>
          ) : !isRecording ? (
            <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exerciseType ? "Start recording to get form feedback" : "Select an exercise to begin"}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Waiting for pose detection...</p>
            </div>
          )}
        </div>
      </div>

      {/* Angle Details (if available) */}
      {feedback && feedback.angles && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-2">Joint Angles</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(feedback.angles).map(([key, value]) => (
              <div key={key} className="p-2 rounded-lg bg-white dark:bg-[#141414] border border-black/8 dark:border-white/8">
                <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">{key.replace(/_/g, " ")}</p>
                <p className="text-sm font-semibold">{Math.round(value as number)}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

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
          </li>
          {userProfile?.injuries && userProfile.injuries.length > 0 && (
            <li className="flex gap-2 mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
              <span className="text-yellow-600">⚠️</span>
              <span className="text-yellow-700 dark:text-yellow-200 text-xs">
                Remember to protect your {userProfile.injuries.join(", ")}. The AI will flag movements that could aggravate these areas.
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
