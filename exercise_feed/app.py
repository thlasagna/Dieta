import cv2
import numpy as np
import torch
from ultralytics import YOLO
from collections import deque
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import json
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)

# Detect GPU availability
device = 0 if torch.cuda.is_available() else 'cpu'
print(f"Using device: {'CUDA (GPU)' if torch.cuda.is_available() else 'CPU'}")

# Load the YOLO model on GPU if available
model = YOLO('exercise_feed/yolov8n-pose.pt')
model.to(device)

# Smoothing config
buffer_size = 5
pose_history = deque(maxlen=buffer_size)

# Global state
current_mode = "LUNGE"
rep_count = 0
stage = "UP"

def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a[:2]), np.array(b[:2]), np.array(c[:2])
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle

def analyze_pushup(kpts, frame):
    """Analyze pushup form and return feedback"""
    global rep_count, stage
    
    # 5: Shoulder, 7: Elbow, 9: Wrist, 11: Hip, 13: Knee, 15: Ankle
    sh, el, wr = kpts[5], kpts[7], kpts[9]
    hip, knee, ankle = kpts[11], kpts[13], kpts[15]

    arm_angle = calculate_angle(sh, el, wr)
    body_angle = calculate_angle(sh, hip, ankle)
    leg_angle = calculate_angle(hip, knee, ankle)

    # Relaxed thresholds
    is_plank_ok = 145 < body_angle < 215
    is_leg_ok = leg_angle > 140

    # Determine color based on form quality
    if not is_plank_ok or not is_leg_ok:
        color = (0, 0, 255)  # Red for bad form
    else:
        color = (0, 255, 0)  # Green for good form

    # Draw skeleton on frame
    # Draw body line (shoulder to hip to ankle)
    cv2.line(frame, tuple(sh[:2].astype(int)), tuple(hip[:2].astype(int)), color, 8)
    cv2.line(frame, tuple(hip[:2].astype(int)), tuple(ankle[:2].astype(int)), color, 8)
    
    # Draw arm (shoulder to elbow to wrist)
    cv2.line(frame, tuple(sh[:2].astype(int)), tuple(el[:2].astype(int)), color, 6)
    cv2.line(frame, tuple(el[:2].astype(int)), tuple(wr[:2].astype(int)), color, 6)
    
    # Draw legs
    cv2.line(frame, tuple(hip[:2].astype(int)), tuple(knee[:2].astype(int)), color, 6)
    cv2.line(frame, tuple(knee[:2].astype(int)), tuple(ankle[:2].astype(int)), color, 6)
    
    # Draw joints as circles
    for joint in [sh, el, wr, hip, knee, ankle]:
        cv2.circle(frame, tuple(joint[:2].astype(int)), 5, color, -1)

    feedback = {
        "status": "Form: OK",
        "severity": "low",
        "issues": [],
        "angles": {
            "arm": float(arm_angle),
            "body": float(body_angle),
            "leg": float(leg_angle)
        },
        "reps": rep_count
    }

    if not is_plank_ok:
        feedback["status"] = "Adjust Hips"
        feedback["severity"] = "medium"
        feedback["issues"].append(f"Body angle is {int(body_angle)}°, aim for 145-215°")
    elif not is_leg_ok:
        feedback["status"] = "Straighten Legs"
        feedback["severity"] = "medium"
        feedback["issues"].append(f"Leg angle is {int(leg_angle)}°, keep them straight")

    # Rep counter logic
    if arm_angle < 110 and stage == "UP":
        stage = "DOWN"
    if arm_angle > 150 and stage == "DOWN":
        stage = "UP"
        rep_count += 1

    feedback["reps"] = rep_count
    return feedback

def analyze_lunge(kpts, frame):
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

    # Draw skeleton on frame
    # Draw torso
    torso_color = (0, 255, 0) if torso_ok else (0, 0, 255)
    cv2.line(frame, (int(sh_mid_x), int(sh_mid_y)), (int(hip_mid_x), int(hip_mid_y)), torso_color, 10)
    
    # Draw left leg
    left_leg_color = (0, 255, 0) if leg_ok else (0, 0, 255)
    cv2.line(frame, tuple(l_hip[:2].astype(int)), tuple(l_knee[:2].astype(int)), left_leg_color, 8)
    cv2.line(frame, tuple(l_knee[:2].astype(int)), tuple(l_ankle[:2].astype(int)), left_leg_color, 8)
    
    # Draw right leg
    right_leg_color = (0, 255, 0) if leg_ok else (0, 0, 255)
    cv2.line(frame, tuple(r_hip[:2].astype(int)), tuple(r_knee[:2].astype(int)), right_leg_color, 8)
    cv2.line(frame, tuple(r_knee[:2].astype(int)), tuple(r_ankle[:2].astype(int)), right_leg_color, 8)
    
    # Draw joints as circles
    for joint in [l_hip, r_hip, l_knee, r_knee, l_ankle, r_ankle, l_sh, r_sh]:
        color = (0, 255, 0) if leg_ok else (0, 0, 255)
        cv2.circle(frame, tuple(joint[:2].astype(int)), 5, color, -1)

    # Draw text info on frame
    cv2.rectangle(frame, (10, 10), (450, 100), (0, 0, 0), -1)
    cv2.putText(frame, f"LUNGE DEPTH: {int(min_angle)}°", (20, 45), cv2.FONT_HERSHEY_SIMPLEX, 1.2, left_leg_color, 2)
    cv2.putText(frame, f"TORSO: {'FIX' if torso_color == (0,0,255) else 'OK'}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, torso_color, 2)

    feedback = {
        "status": "Lunge Form",
        "severity": "low",
        "issues": [],
        "angles": {
            "left_leg": float(l_angle),
            "right_leg": float(r_angle),
            "lean_diff": float(lean_diff)
        }
    }

    if not torso_ok:
        feedback["status"] = "Fix Torso Lean"
        feedback["severity"] = "medium"
        feedback["issues"].append(f"Torso lean is {int(abs(lean_diff))}px, keep it upright")

    if not leg_ok:
        feedback["status"] = "Deepen the Lunge"
        feedback["severity"] = "medium"
        feedback["issues"].append(f"Knee angle is {int(min_angle)}°, aim for deeper bend (below 75°)")

    return feedback

@app.route('/api/exercise/start', methods=['POST'])
def start_exercise():
    """Start exercise tracking session"""
    global current_mode, rep_count, stage, pose_history
    
    data = request.json
    exercise_type = data.get('exercise', 'LUNGE').upper()
    
    if exercise_type not in ['LUNGE', 'PUSHUP']:
        return jsonify({"error": "Invalid exercise type"}), 400
    
    current_mode = exercise_type
    rep_count = 0
    stage = "UP"
    pose_history.clear()
    
    return jsonify({
        "status": "started",
        "exercise": current_mode,
        "message": f"Starting {current_mode} tracking"
    })

@app.route('/api/exercise/analyze', methods=['POST'])
def analyze_frame():
    global current_mode, pose_history, rep_count
    
    try:
        data = request.json
        image_data = data.get('frame')
        if not image_data:
            return jsonify({"error": "No frame provided"}), 400
        
        # Decode and Resize
        image_bytes = base64.b64decode(image_data.split(',')[1])
        image = Image.open(BytesIO(image_bytes))
        frame = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        h, w = frame.shape[:2]
        scale_factor = 0.5
        frame_resized = cv2.resize(frame, (int(w * scale_factor), int(h * scale_factor)))
        
        # Inference
        results = model(frame_resized, device=device, imgsz=320, conf=0.35, verbose=False, half=True)
        
        feedback = None
        current_kpts = None # Initialize to avoid UnboundLocalError

        for r in results:
            if r.keypoints is not None and len(r.keypoints.data) > 0:
                raw_kpts = r.keypoints.data[0].cpu().numpy()
                raw_kpts[:, :2] = raw_kpts[:, :2] / scale_factor
                
                pose_history.append(raw_kpts)
                current_kpts = np.mean(pose_history, axis=0)
                
                if current_mode == "LUNGE":
                    feedback = analyze_lunge(current_kpts, frame)
                elif current_mode == "PUSHUP":
                    feedback = analyze_pushup(current_kpts, frame)
                break
        
        # Safety Check: If no one was detected
        if feedback is None or current_kpts is None:
            return jsonify({
                "kpts": [], 
                "status": "No person detected",
                "reps": rep_count
            })

        # Successful Return (no annotated image from backend to reduce latency)
        return jsonify({
            "kpts": current_kpts.tolist(),
            "status": feedback.get("status", "Active"),
            "severity": feedback.get("severity", "low"),
            "issues": feedback.get("issues", []),
            "angles": feedback.get("angles", {}),
            "reps": rep_count
        })
    
    except Exception as e:
        print(f"Error in analyze_frame: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/exercise/reset', methods=['POST'])
def reset():
    """Reset tracking state"""
    global rep_count, stage, pose_history, current_mode
    
    rep_count = 0
    stage = "UP"
    pose_history.clear()
    current_mode = "LUNGE"
    
    return jsonify({"status": "reset"})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='127.0.0.1')
