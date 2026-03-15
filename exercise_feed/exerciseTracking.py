import cv2
from ultralytics import YOLO
import numpy as np
from collections import deque
import threading
import queue
import time

# ============================================================================
# MULTI-THREADED REAL-TIME CAMERA PIPELINE
# ============================================================================
# Architecture:
#   CameraCaptureThread -> Frame Queue -> InferenceThread -> Results Queue
#                                                             ↓
#                                        Rendering Loop (displays frames)
# ============================================================================

# Load YOLO model once (shared across threads)
model = YOLO('yolov8n-pose.pt')

# Global state
current_mode = "LUNGE"
running = True

# Thread-safe queues
frame_queue = queue.Queue(maxsize=3)      # Limit to 2-3 frames to avoid memory buildup
results_queue = queue.Queue(maxsize=1)    # Only keep latest inference result

# Smoothing config
pose_history = deque(maxlen=5)

# Performance tracking
frame_count = 0
inference_count = 0


def calculate_angle(a, b, c):
    """Calculate angle between three points"""
    a, b, c = np.array(a[:2]), np.array(b[:2]), np.array(c[:2])
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians * 180.0 / np.pi)
    return 360 - angle if angle > 180 else angle


def analyze_pushup(kpts, frame):
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

    # Return analysis data (not drawing on frame here)
    return {
        "status": status,
        "color": color,
        "angles": {"arm": arm_angle, "body": body_angle, "leg": leg_angle},
        "keypoints": kpts
    }


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
    
    torso_color = (0, 255, 0) if abs(lean_diff) <= 40 else (0, 0, 255)

    # Leg analysis
    l_angle = calculate_angle(l_hip, l_knee, l_ankle)
    r_angle = calculate_angle(r_hip, r_knee, r_ankle)
    min_angle = min(l_angle, r_angle)
    leg_color = (0, 255, 0) if min_angle > 75 else (0, 0, 255)

    # Return analysis data (not drawing on frame here)
    return {
        "status": "Lunge Active",
        "color": leg_color,
        "angles": {"left": l_angle, "right": r_angle, "lean": lean_diff},
        "keypoints": kpts,
        "torso_ok": abs(lean_diff) <= 40
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


def draw_angle_panel(frame, analysis, mode):
    """Draw a compact panel with relevant joint angle calculations"""
    if analysis is None:
        return frame
    
    angles = analysis.get("angles", {})
    panel_width = 200
    panel_height = 90
    x, y = 8, 8
    
    # Draw semi-transparent background panel
    overlay = frame.copy()
    cv2.rectangle(overlay, (x, y), (x + panel_width, y + panel_height), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.7, frame, 0.3, 0, frame)
    
    # Draw border
    cv2.rectangle(frame, (x, y), (x + panel_width, y + panel_height), (200, 200, 200), 1)
    
    # Draw title (smaller font)
    cv2.putText(frame, f"{mode}", (x + 8, y + 20), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    
    # Draw angles based on exercise type (smaller fonts)
    if mode == "PUSHUP" and angles:
        cv2.putText(frame, f"Arm: {int(angles.get('arm', 0))}°", 
                    (x + 8, y + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 255, 100), 1)
        cv2.putText(frame, f"Body: {int(angles.get('body', 0))}°", 
                    (x + 8, y + 54), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 255, 100), 1)
        cv2.putText(frame, f"Leg: {int(angles.get('leg', 0))}°", 
                    (x + 8, y + 70), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 255, 100), 1)
    
    elif mode == "LUNGE" and angles:
        cv2.putText(frame, f"L: {int(angles.get('left', 0))}° R: {int(angles.get('right', 0))}°", 
                    (x + 8, y + 38), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 255, 100), 1)
        cv2.putText(frame, f"Lean: {int(angles.get('lean', 0))}px", 
                    (x + 8, y + 54), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (100, 255, 100), 1)
    
    return frame


class CameraCaptureThread(threading.Thread):
    """Continuously captures frames from camera and pushes to frame_queue"""
    
    def __init__(self, camera_id=0):
        super().__init__(daemon=True)
        self.cap = cv2.VideoCapture(camera_id)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize camera buffer
        
    def run(self):
        global running
        while running:
            ret, frame = self.cap.read()
            if not ret:
                break
            
            # Drop frame if queue is full (don't wait, just skip)
            try:
                frame_queue.put_nowait(frame)
            except queue.Full:
                pass  # Frame is dropped, camera continues capturing
        
        self.cap.release()


class InferenceThread(threading.Thread):
    """Processes frames from frame_queue with YOLO inference"""
    
    def __init__(self):
        super().__init__(daemon=True)
        self.frame_skip = 3  # Run inference every 3rd frame (~10 FPS if camera is 30 FPS)
        self.frame_count = 0
        
    def run(self):
        global running, pose_history
        
        while running:
            try:
                frame = frame_queue.get(timeout=1)
            except queue.Empty:
                continue
            
            self.frame_count += 1
            
            # Frame skipping: only run inference every N frames
            if self.frame_count % self.frame_skip == 0:
                try:
                    # Run YOLO inference
                    results = model(frame, imgsz=640, conf=0.25, verbose=False)
                    
                    analysis = None
                    for r in results:
                        if r.keypoints is not None and len(r.keypoints.data) > 0:
                            raw_kpts = r.keypoints.data[0].cpu().numpy()
                            pose_history.append(raw_kpts)
                            kpts = np.mean(pose_history, axis=0)
                            
                            # Run exercise analysis
                            if current_mode == "LUNGE":
                                analysis = analyze_lunge(kpts, frame)
                            elif current_mode == "PUSHUP":
                                analysis = analyze_pushup(kpts, frame)
                            break
                    
                    # Put latest analysis in results queue (overwrite old results)
                    try:
                        results_queue.put_nowait(analysis)
                    except queue.Full:
                        results_queue.get_nowait()  # Remove old result
                        results_queue.put_nowait(analysis)
                        
                except Exception as e:
                    print(f"Inference error: {e}")


def render_loop():
    """Main rendering loop - displays frames with latest skeleton overlays"""
    global running, current_mode
    
    latest_frame = None
    latest_analysis = None
    
    while running:
        # Get latest frame from camera
        try:
            latest_frame = frame_queue.get_nowait()
        except queue.Empty:
            # No new frame, use previous
            pass
        
        # Get latest inference results (non-blocking)
        try:
            while True:
                latest_analysis = results_queue.get_nowait()
        except queue.Empty:
            # No new results, use previous
            pass
        
        # If we have a frame, display it
        if latest_frame is not None:
            display_frame = latest_frame.copy()
            
            # Draw skeleton overlay if we have analysis
            if latest_analysis is not None:
                display_frame = draw_skeleton(display_frame, latest_analysis)
            
            # Draw angle panel
            display_frame = draw_angle_panel(display_frame, latest_analysis, current_mode)
            
            # Draw instructions
            cv2.putText(display_frame, "Press '1'=Lunge '2'=Pushup 'q'=Quit", 
                       (10, display_frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
            
            cv2.imshow('Full Body Bio-Analyzer', display_frame)
        
        # Check for keyboard input
        key = cv2.waitKey(1) & 0xFF
        if key == ord('1'):
            current_mode = "LUNGE"
            pose_history.clear()
        elif key == ord('2'):
            current_mode = "PUSHUP"
            pose_history.clear()
        elif key == ord('q'):
            running = False


def main():
    """Start all threads and run rendering loop"""
    # Start camera capture thread
    camera_thread = CameraCaptureThread(camera_id=0)
    camera_thread.start()
    
    # Start inference thread
    inference_thread = InferenceThread()
    inference_thread.start()
    
    # Run rendering loop in main thread
    try:
        render_loop()
    finally:
        cv2.destroyAllWindows()
        print("Pipeline shut down cleanly")


if __name__ == '__main__':
    main()