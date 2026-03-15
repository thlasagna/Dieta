import cv2
import numpy as np
import torch
from ultralytics import YOLO
from collections import deque
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import threading
import queue
import time
import requests
import logging

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Detect GPU availability
device = 0 if torch.cuda.is_available() else 'cpu'
print(f"Using device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")

# Load the YOLO model on GPU if available
model = YOLO('yolov8n-pose.pt')
if device != 'cpu':
    model.to(device)
print("YOLO model loaded successfully")

# Thread-safe queues for multi-threaded pipeline
frame_queue = queue.Queue(maxsize=3)
results_queue = queue.Queue(maxsize=1)
stream_queue = queue.Queue(maxsize=1)

# Global state
current_mode = "LUNGE"
running = False
pose_history = deque(maxlen=5)
latest_analysis_data = None  # Store latest analysis for stats endpoint
user_profile = {}  # Store user profile for AI analysis
latest_ai_feedback = None  # Store latest AI feedback from fitness_agent

def call_ai_analysis(analysis):
    """Call fitness_agent API to get AI coaching feedback"""
    global latest_ai_feedback
    
    if not analysis:
        return
    
    try:
        # Format metrics for fitness_agent
        exercise_metrics = {
            "exercise": current_mode,
            "status": analysis.get("status", ""),
            "angles": {k: float(v) for k, v in analysis.get("angles", {}).items()}
        }
        
        # Use default user profile if not set
        profile = user_profile if user_profile else {"age": 30, "fitness_level": "intermediate"}
        
        payload = {
            "userProfile": profile,
            "exerciseMetrics": exercise_metrics
        }
        
        logger.info(f"📤 Calling fitness_agent API with metrics: {exercise_metrics}")
        
        # Call fitness_agent API (non-blocking, short timeout)
        response = requests.post(
            "http://localhost:5001/api/railtracks/analyze-exercise",
            json=payload,
            timeout=2
        )
        
        if response.status_code == 200:
            data = response.json()
            latest_ai_feedback = {
                "formScore": float(data.get("formScore", 0)),
                "feedback": data.get("feedback", []),
                "issuesDetected": data.get("issuesDetected", []),
                "focusAreas": data.get("focusAreas", [])
            }
            logger.info(f"✅ AI feedback received: score={latest_ai_feedback['formScore']}, tips={len(latest_ai_feedback['feedback'])}")
        else:
            logger.warning(f"⚠️ Fitness agent returned {response.status_code}: {response.text}")
    except requests.exceptions.Timeout:
        logger.debug("⏱️ Fitness agent timeout (took >2s)")
    except requests.exceptions.ConnectionError:
        logger.debug("🔌 Could not connect to fitness_agent on http://localhost:5001")
    except Exception as e:
        logger.debug(f"❌ Error calling fitness agent: {type(e).__name__}: {str(e)}")

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a[:2]), np.array(b[:2]), np.array(c[:2])
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle


def analyze_pushup(kpts):
    """Analyze pushup form and return feedback"""
    
    # 5: Shoulder, 7: Elbow, 9: Wrist, 11: Hip, 13: Knee, 15: Ankle
    sh, el, wr = kpts[5], kpts[7], kpts[9]
    hip, knee, ankle = kpts[11], kpts[13], kpts[15]

    arm_angle = calculate_angle(sh, el, wr)
    body_angle = calculate_angle(sh, hip, ankle)
    leg_angle = calculate_angle(hip, knee, ankle)

    # Relaxed thresholds
    is_plank_ok = 145 < body_angle < 215
    is_leg_ok = leg_angle > 140

    status = "Form: OK"
    color = (0, 255, 0)

    if not is_plank_ok:
        status = "Adjust Hips"
        color = (0, 0, 255)
    elif not is_leg_ok:
        status = "Straighten Legs"
        color = (0, 0, 255)

    return {
        "status": status,
        "color": color,
        "angles": {"arm": arm_angle, "body": body_angle, "leg": leg_angle},
        "keypoints": kpts
    }


def analyze_lunge(kpts):
    """Analyze lunge form and return feedback"""
    l_hip, l_knee, l_ankle = kpts[11], kpts[13], kpts[15]
    r_hip, r_knee, r_ankle = kpts[12], kpts[14], kpts[16]
    l_sh, r_sh = kpts[5], kpts[6]

    # Knee correction
    for knee, ankle in [(l_knee, l_ankle), (r_knee, r_ankle)]:
        if knee[1] > (ankle[1] - 15):
            knee[1] = ankle[1] - 65

    # Torso analysis
    sh_mid_x, sh_mid_y = (l_sh[0] + r_sh[0]) / 2, (l_sh[1] + r_sh[1]) / 2
    hip_mid_x, hip_mid_y = (l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2
    lean_diff = sh_mid_x - hip_mid_x
    
    torso_ok = abs(lean_diff) <= 40

    # Leg analysis
    l_angle = calculate_angle(l_hip, l_knee, l_ankle)
    r_angle = calculate_angle(r_hip, r_knee, r_ankle)
    min_angle = min(l_angle, r_angle)
    leg_ok = min_angle > 75

    color = (0, 255, 0) if leg_ok else (0, 0, 255)

    return {
        "status": "Lunge Active",
        "color": color,
        "angles": {"left": l_angle, "right": r_angle, "lean": lean_diff},
        "keypoints": kpts,
        "torso_ok": torso_ok,
        "min_angle": min_angle
    }


def draw_skeleton(frame, analysis):
    """Draw skeleton overlays on frame based on current exercise mode"""
    if analysis is None:
        return frame
    
    kpts = analysis["keypoints"]
    
    if current_mode == "PUSHUP":
        sh, el, wr = kpts[5], kpts[7], kpts[9]
        hip, knee, ankle = kpts[11], kpts[13], kpts[15]
        color = analysis["color"]

        # Draw skeleton
        cv2.line(frame, tuple(sh[:2].astype(int)), tuple(hip[:2].astype(int)), color, 8)
        cv2.line(frame, tuple(hip[:2].astype(int)), tuple(ankle[:2].astype(int)), color, 8)
        cv2.line(frame, tuple(sh[:2].astype(int)), tuple(el[:2].astype(int)), color, 6)
        cv2.line(frame, tuple(el[:2].astype(int)), tuple(wr[:2].astype(int)), color, 6)
        cv2.line(frame, tuple(hip[:2].astype(int)), tuple(knee[:2].astype(int)), color, 6)
        cv2.line(frame, tuple(knee[:2].astype(int)), tuple(ankle[:2].astype(int)), color, 6)
        
        # Draw joints
        for joint in [sh, el, wr, hip, knee, ankle]:
            cv2.circle(frame, tuple(joint[:2].astype(int)), 5, color, -1)

    elif current_mode == "LUNGE":
        l_hip, l_knee, l_ankle = kpts[11], kpts[13], kpts[15]
        r_hip, r_knee, r_ankle = kpts[12], kpts[14], kpts[16]
        l_sh, r_sh = kpts[5], kpts[6]
        
        sh_mid_x, sh_mid_y = (l_sh[0] + r_sh[0]) / 2, (l_sh[1] + r_sh[1]) / 2
        hip_mid_x, hip_mid_y = (l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2
        
        torso_color = (0, 255, 0) if analysis["torso_ok"] else (0, 0, 255)
        leg_color = analysis["color"]

        # Draw skeleton
        cv2.line(frame, (int(sh_mid_x), int(sh_mid_y)), (int(hip_mid_x), int(hip_mid_y)), torso_color, 10)
        cv2.line(frame, tuple(l_hip[:2].astype(int)), tuple(l_knee[:2].astype(int)), leg_color, 8)
        cv2.line(frame, tuple(l_knee[:2].astype(int)), tuple(l_ankle[:2].astype(int)), leg_color, 8)
        cv2.line(frame, tuple(r_hip[:2].astype(int)), tuple(r_knee[:2].astype(int)), leg_color, 8)
        cv2.line(frame, tuple(r_knee[:2].astype(int)), tuple(r_ankle[:2].astype(int)), leg_color, 8)

        # Draw joints
        for joint in [l_hip, r_hip, l_knee, r_knee, l_ankle, r_ankle, l_sh, r_sh]:
            cv2.circle(frame, tuple(joint[:2].astype(int)), 5, leg_color, -1)

    return frame


class CameraCaptureThread(threading.Thread):
    """Continuously captures frames from camera"""
    
    def __init__(self, camera_id=0):
        super().__init__(daemon=True)
        self.cap = cv2.VideoCapture(camera_id)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        
    def run(self):
        while running:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                pass
        
        self.cap.release()


class InferenceThread(threading.Thread):
    """Processes frames with YOLO inference"""
    
    def __init__(self):
        super().__init__(daemon=True)
        self.frame_skip = 3
        self.frame_count = 0
        
    def run(self):
        global pose_history, latest_analysis_data
        
        while running:
            try:
                frame = frame_queue.get(timeout=1)
            except queue.Empty:
                continue
            
            self.frame_count += 1
            
            # Frame skipping: run inference every 3rd frame
            if self.frame_count % self.frame_skip == 0:
                try:
                    results = model(frame, imgsz=640, conf=0.25, verbose=False)
                    
                    analysis = None
                    for r in results:
                        if r.keypoints is not None and len(r.keypoints.data) > 0:
                            raw_kpts = r.keypoints.data[0].cpu().numpy()
                            pose_history.append(raw_kpts)
                            kpts = np.mean(pose_history, axis=0)
                            
                            if current_mode == "LUNGE":
                                analysis = analyze_lunge(kpts)
                            elif current_mode == "PUSHUP":
                                analysis = analyze_pushup(kpts)
                            break
                    
                    # Store analysis for stats endpoint
                    latest_analysis_data = analysis
                    
                    # Call AI analysis in background (non-blocking)
                    if analysis:
                        threading.Thread(target=call_ai_analysis, args=(analysis,), daemon=True).start()
                    
                    try:
                        results_queue.put_nowait(analysis)
                    except queue.Full:
                        results_queue.get_nowait()
                        results_queue.put_nowait(analysis)
                        
                except Exception as e:
                    print(f"Inference error: {e}")


def generate_frames():
    """Generator for MJPEG stream"""
    latest_frame = None
    latest_analysis = None
    
    while running:
        # Get latest frame
        try:
            latest_frame = frame_queue.get_nowait()
        except queue.Empty:
            pass
        
        # Get latest analysis
        try:
            while True:
                latest_analysis = results_queue.get_nowait()
        except queue.Empty:
            pass
        
        # If we have a frame, display and stream it
        if latest_frame is not None:
            display_frame = latest_frame.copy()
            
            # Draw skeleton overlay
            if latest_analysis is not None:
                display_frame = draw_skeleton(display_frame, latest_analysis)
            
            # Encode frame for streaming
            ret, buffer = cv2.imencode('.jpg', display_frame)
            frame_bytes = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n'
                   b'Content-length: ' + str(len(frame_bytes)).encode() + b'\r\n\r\n'
                   + frame_bytes + b'\r\n')
        else:
            time.sleep(0.01)


@app.route('/api/exercise/start', methods=['POST'])
def start_exercise():
    """Start exercise tracking session"""
    global current_mode, pose_history, running, user_profile, latest_ai_feedback
    
    data = request.json
    exercise_type = data.get('exercise', 'LUNGE').upper()
    
    if exercise_type not in ['LUNGE', 'PUSHUP']:
        return jsonify({"error": "Invalid exercise type"}), 400
    
    current_mode = exercise_type
    user_profile = data.get('userProfile', {})  # Store user profile for AI analysis
    latest_ai_feedback = None  # Reset feedback
    pose_history.clear()
    
    # Start pipeline if not already running
    if not running:
        running = True
        camera_thread = CameraCaptureThread(camera_id=0)
        camera_thread.start()
        
        inference_thread = InferenceThread()
        inference_thread.start()
    
    logger.info(f"Exercise session started: {current_mode}")
    return jsonify({
        "status": "started",
        "exercise": current_mode,
        "message": f"Starting {current_mode} tracking"
    })


@app.route('/api/exercise/stream')
def stream_video():
    """MJPEG stream endpoint"""
    return Response(
        generate_frames(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )


@app.route('/api/exercise/stats', methods=['GET'])
def get_stats():
    """Get current exercise stats - feedback for React panel"""
    global latest_analysis_data, latest_ai_feedback
    
    feedback = {
        "mode": current_mode,
        "stage": "Analyzing form...",
        "aiScore": 0,
        "coaches": []
    }
    
    # Add local analysis
    if latest_analysis_data:
        status = latest_analysis_data.get("status", "Analyzing form...")
        feedback["stage"] = status
        
        if "angles" in latest_analysis_data:
            angles = latest_analysis_data["angles"]
            if current_mode == "LUNGE":
                left_angle = float(angles.get("left", 0))
                right_angle = float(angles.get("right", 0))
                min_angle = min(left_angle, right_angle)
                feedback["depth"] = float(round(min_angle, 1))
                feedback["stage"] = f"{status} (Depth: {feedback['depth']}°)"
    
    # Add AI feedback if available
    if latest_ai_feedback:
        feedback["aiScore"] = latest_ai_feedback.get("formScore", 0)
        feedback["coaches"] = latest_ai_feedback.get("feedback", [])
    
    return jsonify(feedback)


@app.route('/api/exercise/reset', methods=['POST'])
def reset():
    """Reset tracking state"""
    global pose_history, current_mode, running, latest_analysis_data, latest_ai_feedback, user_profile
    
    pose_history.clear()
    current_mode = "LUNGE"
    running = False
    latest_analysis_data = None
    latest_ai_feedback = None
    user_profile = {}
    
    logger.info("Exercise session reset")
    return jsonify({"status": "reset"})


if __name__ == '__main__':
    app.run(debug=False, port=5000, host='127.0.0.1', threaded=True)
