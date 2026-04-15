from flask import Flask, request, jsonify
from fer import FER
import cv2
import numpy as np
from flask_cors import CORS
from PIL import Image
app = Flask(__name__)
CORS(app)

# ✅ Emotion detector
detector = FER(mtcnn=False)

# ✅ OpenCV face + eye detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
eye_cascade  = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")


# ── Emotion Detection ────────────────────────────────────────────────────────
@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files["image"]

        # Read image bytes
        file_bytes = file.read()

        # Convert to numpy array
        npimg = np.frombuffer(file_bytes, dtype=np.uint8)

        # Decode image
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        # Convert BGR → RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Ensure correct dtype
        img = img.astype("uint8")

        # Detect emotion
        result = detector.detect_emotions(img)

        if result:
            emotions = result[0]["emotions"]
        else:
            emotions = {}

        return jsonify({"emotions": emotions})

    except Exception as e:
        print("Emotion detection error:", e)
        return jsonify({"error": str(e)}), 500
# ── Gaze Detection (OpenCV) ──────────────────────────────────────────────────
@app.route("/detect-gaze", methods=["POST"])
def detect_gaze():
    try:
        file  = request.files["image"]
        npimg = np.frombuffer(file.read(), np.uint8)
        img   = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"error": "Invalid image"}), 400

        gray  = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w  = gray.shape

        # ✅ Detect face
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)

        if len(faces) == 0:
            return jsonify({
                "gaze":         "no_face",
                "looking_away": False,
                "gaze_ratio":   None
            })

        # ✅ Take the largest face
        x, y, fw, fh = max(faces, key=lambda f: f[2] * f[3])
        face_gray     = gray[y:y+fh, x:x+fw]

        # ✅ Detect eyes inside face
        eyes = eye_cascade.detectMultiScale(face_gray, scaleFactor=1.1, minNeighbors=10)

        if len(eyes) == 0:
            return jsonify({
                "gaze":         "eyes_closed",
                "looking_away": False,
                "gaze_ratio":   None
            })
        if len(faces) > 1:
            return jsonify({
                "faces_detected":len(faces),
                "gaze": "multiple_faces",
                "looking_away": True,
                "gaze_ratio": None
            })

        gaze_ratios = []

        for (ex, ey, ew, eh) in eyes[:2]:  # max 2 eyes
            eye_region = face_gray[ey:ey+eh, ex:ex+ew]

            # ✅ Threshold to find pupil (dark region)
            _, threshold_eye = cv2.threshold(eye_region, 70, 255, cv2.THRESH_BINARY)
            threshold_eye    = cv2.erode(threshold_eye, None, iterations=2)
            threshold_eye    = cv2.dilate(threshold_eye, None, iterations=4)
            threshold_eye    = cv2.medianBlur(threshold_eye, 5)

            eye_h, eye_w = eye_region.shape

            # Split eye into left and right halves
            left_white  = cv2.countNonZero(threshold_eye[0:eye_h, 0:eye_w//2])
            right_white = cv2.countNonZero(threshold_eye[0:eye_h, eye_w//2:eye_w])

            if left_white + right_white == 0:
                continue

            # Gaze ratio: >1 looking right, <1 looking left, ~1 center
            ratio = left_white / (right_white + 1e-5)
            gaze_ratios.append(ratio)

        if not gaze_ratios:
            return jsonify({
                "gaze":         "unknown",
                "looking_away": False,
                "gaze_ratio":   None
            })

        avg_ratio    = float(np.mean(gaze_ratios))
        looking_away = avg_ratio < 0.6 or avg_ratio > 2.5

        if avg_ratio < 0.6:
            gaze_direction = "right"
        elif avg_ratio > 2.5:
            gaze_direction = "left"
        else:
            gaze_direction = "center"

        return jsonify({
            "gaze_ratio":   round(avg_ratio, 3),
            "looking_away": looking_away,
            "gaze":         gaze_direction if looking_away else "center"
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(port=5001, debug=False)