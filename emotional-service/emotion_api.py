from flask import Flask, request, jsonify
from fer import FER
import cv2
import numpy as np
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

detector = FER(mtcnn=True)

@app.route("/detect-emotion", methods=["POST"])
def detect_emotion():
    try:
        file = request.files["image"]

        # convert to numpy
        npimg = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        result = detector.detect_emotions(img)
        print("FER result:", result)

        if len(result) > 0:
            emotions = result[0]["emotions"]
        else:
            emotions = {}

        return jsonify({
            "emotions": emotions
        })

    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(port=5001)