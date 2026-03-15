# Dieta - AI-Powered Live Workout Form Analyzer

An intelligent fitness coaching platform that provides real-time exercise form analysis and personalized coaching feedback using computer vision and AI.

## Problem Statement

Millions of people struggle with fitness goals due to:
- **Poor exercise form** leading to injuries, ineffective workouts, and discouragement
- **Lack of immediate feedback** during exercises - form issues go unnoticed until injury occurs
- **Inaccessible coaching** - professional trainers are expensive and unavailable for most people
- **Inconsistent nutrition tracking** - no integration between diet and fitness progress

**Dieta solves these problems** by delivering real-time, AI-powered coaching accessible from your home.

## Solution Overview

Dieta combines three core technologies to provide instant exercise form analysis:

1. **Computer Vision (Pose Detection)** - Detects your body joints and movement patterns in real-time using YOLOv8
2. **Biomechanical Analysis** - Calculates joint angles and movement quality locally for instant feedback
3. **AI Coaching** - OpenRouter's Claude 3.5 Sonnet provides personalized, natural language coaching tips based on your form

### Key Features

- 📹 **Live Pose Detection** - Real-time skeleton overlay showing all 17 body joints
- 🎯 **Exercise-Specific Analysis** - Supports Lunges and Push-ups with form-specific metrics
- 🤖 **AI Coaching Feedback** - Intelligent suggestions for form improvement
- 📊 **Form Score & Progress Tracking** - See your form quality as a percentage
- 🚀 **GPU Optimized** - Fast inference on CUDA-capable GPUs, falls back to CPU
- 🔄 **Multi-threaded Pipeline** - Non-blocking real-time processing

## Technology Stack

### Frontend
- **Next.js 14** - React framework for modern UI
- **TypeScript** - Type-safe React components
- **Tailwind CSS** - Responsive styling
- **Real-time polling** - Updates feedback every 500ms

### Backend
- **Flask** (Port 5000) - Lightweight Python web server
- **OpenCV** - Video processing and frame manipulation
- **YOLOv8 Nano** (Ultralytics) - Pose detection model (17 keypoints)
- **PyTorch** - GPU acceleration for inference
- **Threading & Queue** - Multi-threaded pipeline for parallel processing

### AI & Analytics
- **Railtracks Agent** (Port 5001) - Framework for AI workflows
- **OpenRouter API** - Access to Claude 3.5 Sonnet
- **Custom Biomechanical Analyzer** - Joint angle calculations

## Architecture

```
┌─────────────────────────────────────┐
│      Next.js Frontend (Browser)     │
│  - Live video stream display        │
│  - Real-time stats polling          │
│  - Form score visualization         │
└─────────────────┬───────────────────┘
                  │ HTTP REST API
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────┐         ┌───────▼──────┐
│ Exercise   │         │ Fitness      │
│ Feed Server│         │ Agent API    │
│ (Port 5000)│         │ (Port 5001)  │
└─────┬─────┘         └───────┬──────┘
      │                       │
      │ Camera Feed           │ Use OpenRouter
      │ YOLO Inference        │ Claude 3.5 Sonnet
      │ Form Analysis         │ Generate Coaching Tips
      │ Angle Calculations    │
      │                       │
      └───────────┬───────────┘
                  │
            ┌─────▼─────┐
            │ Stats JSON │
            │  Response  │
            └────────────┘
```

## Data Flow

### Real-Time Processing Pipeline

```
Camera Input (Webcam)
         ↓
    [CameraCaptureThread]
         ↓
    Frame Queue
         ↓
[InferenceThread - YOLO]
         ↓
   Pose Detection (17 keypoints)
         ↓
   Create pose_history (5 frames)
         ↓
   Calculate Angles & Form Metrics
         ↓
   ┌─────────────────────────┐
   │ Store in latest_analysis│
   │ (for skeleton drawing)  │
   └──────────┬──────────────┘
              │
              ├─→ [generate_frames()] → MJPEG Stream
              │   (Stream with skeleton overlay)
              │
              └─→ [call_ai_analysis()] → Fitness Agent
                  (Thread pool, non-blocking)
                       ↓
                  OpenRouter API
                  Claude 3.5 Sonnet
                       ↓
                  Coaching Feedback
                       ↓
                  Store in latest_ai_feedback
                       ↓
                  Return via /api/exercise/stats
                       ↓
                  React Component Updates
```

## API Endpoints

### Exercise Feed Server (Port 5000)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/exercise/start` | POST | Begin exercise tracking session |
| `/api/exercise/stream` | GET | MJPEG video stream with skeleton overlay |
| `/api/exercise/stats` | GET | Current form analysis & AI feedback |
| `/api/exercise/reset` | POST | End session and clear state |

**Example `/api/exercise/stats` Response:**
```json
{
  "mode": "LUNGE",
  "stage": "Lunge Active (Depth: 95.3°)",
  "depth": 95.3,
  "aiScore": 0.82,
  "coaches": [
    "Keep your chest upright to reduce lower back strain",
    "Drive through your front heel as you push back",
    "Maintain balanced weight distribution on both legs"
  ]
}
```

### Fitness Agent API (Port 5001)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/railtracks/health` | GET | Health check |
| `/api/railtracks/analyze-exercise` | POST | AI-powered form analysis |

**Example Request Body:**
```json
{
  "userProfile": {
    "age": 30,
    "fitness_level": "intermediate"
  },
  "exerciseMetrics": {
    "exercise": "LUNGE",
    "status": "Lunge Active",
    "angles": {
      "left": 95.3,
      "right": 98.1,
      "lean": 12.5
    }
  }
}
```

## Local Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 16+
- Webcam/Camera connected
- CUDA capable GPU (optional, falls back to CPU)
- OpenRouter API key

### Installation

1. **Clone & Navigate**
```bash
cd "Dieta"
```

2. **Set up Python Environment**
```bash
# Create virtual environment (optional but recommended)
python -m venv venv
venv\Scripts\activate
```

3. **Install Python Dependencies**
```bash
# Exercise feed server
cd exercise_feed
pip install -r requirements.txt

# Fitness agent server
cd ../fitness_agent
pip install -r requirements.txt
```

4. **Configure API Keys**

Create `.env.local` files:

**`fitness_agent/.env.local`:**
```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

5. **Install Node Dependencies**
```bash
# Return to root
cd ..
npm install
```

### Running the Application

**Terminal 1 - Start Exercise Feed Server (Port 5000):**
```bash
cd exercise_feed
python app.py
```
Expected output:
```
Using device: CUDA (GPU) or CPU
YOLO model loaded successfully
 * Running on http://127.0.0.1:5000
```

**Terminal 2 - Start Fitness Agent (Port 5001):**
```bash
cd fitness_agent
python api_server.py
```
Expected output:
```
✓ OPENROUTER_API_KEY loaded from environment
✅ RailtracksFitnessAgent initialized successfully
 * Running on http://127.0.0.1:5001
```

**Terminal 3 - Start Next.js Frontend:**
```bash
npm run dev
```
Then open **http://localhost:3000** in your browser

### Using the App

1. Navigate to **Live Workout** tab
2. Select exercise (Lunge or Push-up)
3. Click **Start Exercise**
4. Perform the exercise in front of your camera
5. Watch real-time form feedback appear below the video

## How It Works

### 1. Pose Detection (Real-Time, Local)
- YOLOv8 Nano model detects 17 body joints (keypoints)
- Processes every 3rd frame (~10 FPS) for efficiency
- Maintains 5-frame history for smoothed angle calculations
- **No API calls needed** - runs entirely locally

### 2. Form Analysis (Real-Time, Local)
- Calculates joint angles using detected keypoints
- Exercise-specific checks (e.g., lunge depth, torso alignment)
- Returns color-coded feedback (green = good, red = needs improvement)
- Provides instant stage/status messages

### 3. AI Coaching (Near Real-Time, Cloud)
- After each inference cycle, triggers background API call to fitness_agent
- Sends pose metrics + user profile to OpenRouter
- Claude 3.5 Sonnet analyzes form and generates personalized tips
- Results cached and displayed via stats endpoint
- Non-blocking - doesn't delay video streaming

### 4. Display & Feedback
- Video stream with skeleton overlay (joints + lines)
- Form score percentage with progress bar
- Live coaching tips updated every 500ms-2s
- Local angle metrics (depth, torso alignment, etc.)

## Key Features Explained

### GPU Optimization
- Detects CUDA availability on startup
- Runs YOLO inference on GPU for 10-30x faster processing
- Automatic CPU fallback if GPU unavailable
- Memory efficient with frame queue management

### Multi-threaded Processing
```
CameraCaptureThread → Frame Queue
                       ↓
                 InferenceThread → Results Queue
                                    ↓
                             generate_frames() → MJPEG Stream
                             
[Separate Thread]
call_ai_analysis() → OpenRouter → Latest AI Feedback
```
- Threads don't block each other
- Camera continues capturing while inference runs
- AI calls run in background, don't delay video
- Frame skipping prevents bottlenecks

### Form-Specific Analysis

**Lunges:**
- Depth Score: Min angle of front/back knee bend
- Torso Alignment: Measures forward lean (±40px threshold)
- Symmetry: Compares left vs right knee angles
- Color coding based on depth and alignment

**Push-ups:**
- Arm Angle: Shoulder-elbow-wrist angle
- Body Angle: Shoulder-hip-ankle alignment
- Leg Alignment: Knee angle (should stay straight)
- Status messages: "Adjust Hips", "Straighten Legs", etc.

## Performance Metrics

| Metric | Value |
|--------|-------|
| Pose Detection FPS | 10 (every 3rd frame processed) |
| Full Pipeline Latency | 100-300ms (varies with GPU) |
| AI Feedback Latency | 1-3 seconds (OpenRouter API) |
| Memory Usage | ~500MB-1.5GB (depending on GPU) |
| Video Stream Quality | 640x480 MJPEG |

## Project Structure

```
Dieta/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── types.ts                 # TypeScript interfaces
│   ├── api/                     # API routes (not used in this version)
│   └── lib/                     # Utilities
│
├── components/                   # React components
│   ├── LiveWorkoutFeedTab.tsx   # Main workout interface ⭐
│   ├── BottomNav.tsx            # Navigation bar
│   └── ...other components
│
├── exercise_feed/               # Flask backend (Port 5000)
│   ├── app.py                   # Main server ⭐
│   ├── requirements.txt         # Python dependencies
│   └── yolov8n-pose.pt         # YOLO model
│
├── fitness_agent/               # Fitness AI Agent (Port 5001)
│   ├── api_server.py           # Flask API wrapper ⭐
│   ├── railtracks_agent.py     # AI agent logic ⭐
│   ├── config.py               # Configuration & coaching cues
│   ├── requirements.txt        # Python dependencies
│   └── .env.local              # OpenRouter API key
│
├── public/                      # Static assets
├── tailwind.config.ts          # Tailwind CSS config
├── tsconfig.json               # TypeScript config
├── next.config.js              # Next.js config
├── package.json                # Node dependencies
└── README.md                   # This file
```

## Troubleshooting

### Camera Not Working
- Check camera permissions in Windows Settings
- Restart the exercise_feed server
- Verify webcam is connected and working in other apps

### No AI Feedback Appearing
- Ensure `fitness_agent` is running on port 5001
- Check `.env.local` has valid `OPENROUTER_API_KEY`
- Look for "Calling fitness_agent API" logs in exercise_feed terminal
- Check fitness_agent logs for API errors

### Video Freezing
- Lower resolution if GPU memory is constrained
- Check CPU usage - may need to increase frame skip
- Reduce polling interval if network is slow

### Out of Memory
- CPU has less memory than GPU - restart server
- Close other applications
- Consider running on a machine with 8GB+ RAM

## API Costs

This project uses **OpenRouter** for AI coaching:
- **Model**: Claude 3.5 Sonnet
- **Cost**: ~$0.003 per API call (varies by text length)
- **Frequency**: ~1 call every 1-2 seconds during exercise
- **Monthly estimate**: $5-20 depending on usage

You can reduce costs by:
- Increasing frame skip (process fewer frames)
- Decreasing polling frequency (update feedback less often)
- Using model fallback system for cheaper alternatives

## Future Enhancements

- [ ] Support more exercises (squats, deadlifts, pull-ups)
- [ ] Exercise completion counting (reps/sets tracking)
- [ ] Workout program generation via AI
- [ ] Integration with nutrition tracking
- [ ] Social features (challenges, leaderboards)
- [ ] Mobile app version
- [ ] Offline mode with local model
- [ ] Custom coaching with voice feedback

## License

MIT License

## Acknowledgments

- **YOLOv8** by Ultralytics for pose detection
- **OpenRouter** for Claude 3.5 Sonnet API
- **Railtracks** for AI agent framework
- **Next.js** and **Flask** communities

---

**Created by**: GenAI Genesis Team  
**Last Updated**: March 15, 2026
