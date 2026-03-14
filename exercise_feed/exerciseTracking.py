import cv2
from ultralytics import YOLO
import numpy as np
from collections import deque

model = YOLO('yolov8n-pose.pt')
cap = cv2.VideoCapture(0)

# --- SMOOTHING CONFIG ---
buffer_size = 5
pose_history = deque(maxlen=buffer_size)

current_mode = "LUNGE" # Default

def calculate_angle(a, b, c):
    a, b, c = np.array(a[:2]), np.array(b[:2]), np.array(c[:2])
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle

rep_count = 0
stage = "UP"  # "UP" or "DOWN"

def analyze_pushup(kpts, frame):
    global rep_count, stage
    # 5: Shoulder, 7: Elbow, 9: Wrist, 11: Hip, 13: Knee, 15: Ankle
    sh, el, wr = kpts[5], kpts[7], kpts[9]
    hip, knee, ankle = kpts[11], kpts[13], kpts[15]

    arm_angle = calculate_angle(sh, el, wr)
    body_angle = calculate_angle(sh, hip, ankle)
    leg_angle = calculate_angle(hip, knee, ankle)

    # --- RELAXED THRESHOLDS ---
    # Was 160-200, now 145-215 (Much more forgiving on the 'plank')
    is_plank_ok = 145 < body_angle < 215
    # Was 160, now 140 (Forgiving on knee bend)
    is_leg_ok = leg_angle > 140 

    status = "Form: OK"
    color = (0, 255, 0)

    if not is_plank_ok:
        status = "Adjust Hips"
        color = (0, 0, 255)
    elif not is_leg_ok:
        status = "Straighten Legs"
        color = (0, 0, 255)

    # --- REP COUNTER LOGIC ---
    # Less strict depth: was 90, now 110
    if arm_angle < 110 and stage == "UP":
        stage = "DOWN"
    if arm_angle > 150 and stage == "DOWN":
        stage = "UP"
        rep_count += 1

    # Drawing
    cv2.line(frame, tuple(sh[:2].astype(int)), tuple(hip[:2].astype(int)), color, 2)
    cv2.line(frame, tuple(hip[:2].astype(int)), tuple(ankle[:2].astype(int)), color, 2)
    
    return status, color, rep_count
    

def analyze_lunge(kpts, frame):
    l_hip, l_knee, l_ankle = kpts[11], kpts[13], kpts[15]
    r_hip, r_knee, r_ankle = kpts[12], kpts[14], kpts[16]
    l_sh, r_sh = kpts[5], kpts[6]

    # Knee correction
    for knee, ankle in [(l_knee, l_ankle), (r_knee, r_ankle)]:
        if knee[1] > (ankle[1] - 15): knee[1] = ankle[1] - 65

    # Torso
    sh_mid_x, sh_mid_y = (l_sh[0] + r_sh[0]) / 2, (l_sh[1] + r_sh[1]) / 2
    hip_mid_x, hip_mid_y = (l_hip[0] + r_hip[0]) / 2, (l_hip[1] + r_hip[1]) / 2
    lean_diff = sh_mid_x - hip_mid_x
    
    torso_color = (0, 255, 0)
    if abs(lean_diff) > 40: torso_color = (0, 0, 255)

    # Leg Status
    l_angle = calculate_angle(l_hip, l_knee, l_ankle)
    r_angle = calculate_angle(r_hip, r_knee, r_ankle)
    leg_color = (0, 255, 0) if min(l_angle, r_angle) > 75 else (0, 0, 255)

    # Drawing Lunge Specifics
    cv2.line(frame, (int(sh_mid_x), int(sh_mid_y)), (int(hip_mid_x), int(hip_mid_y)), torso_color, 4)
    cv2.line(frame, tuple(l_hip[:2].astype(int)), tuple(l_knee[:2].astype(int)), (255, 0, 0), 2)
    cv2.line(frame, tuple(r_hip[:2].astype(int)), tuple(r_knee[:2].astype(int)), (0, 0, 255), 2)

    cv2.rectangle(frame, (10, 10), (450, 100), (0, 0, 0), -1)
    cv2.putText(frame, f"LUNGE DEPTH: {int(min(l_angle, r_angle))}", (20, 45), 1, 1.2, leg_color, 2)
    cv2.putText(frame, f"TORSO: {'FIX' if torso_color == (0,0,255) else 'OK'}", (20, 80), 1, 1.2, torso_color, 2)
    return "Lunge Active", leg_color

while cap.isOpened():
    ret, frame = cap.read()
    if not ret: break

    # 1. Check for Keypress
    key = cv2.waitKey(1) & 0xFF
    if key == ord('1'): current_mode = "LUNGE"
    if key == ord('2'): current_mode = "PUSHUP"
    if key == ord('q'): break

    # 2. Run Inference
    results = model(frame, stream=True, imgsz=640, conf=0.25, verbose=False)

    for r in results:
        if r.keypoints is not None and len(r.keypoints.data) > 0:
            # 3. Define and Smooth kpts
            raw_kpts = r.keypoints.data[0].cpu().numpy()
            pose_history.append(raw_kpts)
            kpts = np.mean(pose_history, axis=0)

            # 4. Run the correct analysis AFTER kpts is defined
            if current_mode == "LUNGE":
                analyze_lunge(kpts, frame)
            elif current_mode == "PUSHUP":
                analyze_pushup(kpts, frame)

    cv2.imshow('Full Body Bio-Analyzer', frame)

cap.release()
cv2.destroyAllWindows()