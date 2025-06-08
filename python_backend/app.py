# IMPORTANT: These two lines MUST be at the very top, before any other imports
from gevent import monkey
monkey.patch_all()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import io
import base64
import cv2
import numpy as np

# MediaPipe imports for the Tasks API
import mediapipe as mp # General MediaPipe utilities like mp.Image
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

# Imports for audio processing
from pydub import AudioSegment
import speech_recognition as sr # For Google Web Speech API (free, rate-limited)

app = Flask(__name__)
# Configure CORS for both HTTP routes and WebSocket connections
CORS(app, resources={
    r"/analyze_interview": {"origins": "*"},
    r"/*": {"origins": "*"}
})

# Initialize Flask-SocketIO with gevent for asynchronous handling
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

# --- MediaPipe Face Landmarker Setup ---
# IMPORTANT: You need to download this file and place it in your python-backend directory:
# https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
model_path = 'face_landmarker.task'

# Load the Face Landmarker model once when the application starts
try:
    base_options = mp_tasks.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE, # Use IMAGE mode for processing individual frames
        num_faces=1, # Detect up to 1 face
        output_face_blendshapes=True # Get blendshapes (useful for gaze, though not used in current eye contact logic)
    )
    face_landmarker = vision.FaceLandmarker.create_from_options(options)
    print("MediaPipe Face Landmarker model loaded successfully.")
except Exception as e:
    print(f"ERROR: Failed to load MediaPipe Face Landmarker model from {model_path}. Make sure the file exists and is correct. Error: {e}")
    face_landmarker = None # Set to None if loading fails to prevent further errors

# --- Flask Routes ---
@app.route('/')
def index():
    return "Python Backend for InterviewAce is running! Use /analyze_interview for audio analysis or WebSocket for eye tracking."

@app.route('/analyze_interview', methods=['POST'])
def analyze_interview():
    print("Received request for audio analysis.")
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files['audio']
    duration_str = request.form.get('duration')

    if not duration_str:
        return jsonify({"error": "No duration provided"}), 400

    try:
        duration = float(duration_str)
    except ValueError:
        return jsonify({"error": "Invalid duration format"}), 400

    # Read WebM audio and convert to WAV in-memory using pydub
    webm_audio = io.BytesIO(audio_file.read())
    wav_audio_io = io.BytesIO()
    try:
        # pydub requires ffmpeg or avconv to be installed on the system
        audio = AudioSegment.from_file(webm_audio, format="webm")
        audio.export(wav_audio_io, format="wav")
        wav_audio_io.seek(0) # Rewind the BytesIO object to the beginning
    except Exception as e:
        print(f"Error converting audio with pydub: {e}")
        return jsonify({"error": f"Failed to convert audio. Ensure FFmpeg is installed and accessible in your system's PATH. Error: {e}"}), 500

    # Use the Google Web Speech API for transcription
    r = sr.Recognizer()
    transcript = ""
    try:
        with sr.AudioFile(wav_audio_io) as source:
            audio_data = r.record(source) # Read the entire audio file
            transcript = r.recognize_google(audio_data) # Send to Google Web Speech API
            print(f"Transcript: {transcript}")
    except sr.UnknownValueError:
        print("Google Web Speech API could not understand audio.")
        transcript = "Could not understand audio."
    except sr.RequestError as e:
        print(f"Could not request results from Google Web Speech API service; {e}. Check internet connection or API limits.")
        transcript = f"Transcription service error: {e}"
    except Exception as e:
        print(f"General ASR error: {e}")
        transcript = f"ASR processing error: {e}"

    # --- Analysis Logic ---
    filler_words = ["um", "uh", "like", "you know", "so", "basically", "actually"]
    filler_words_count = sum(transcript.lower().count(word) for word in filler_words)

    words = transcript.split()
    # Calculate Words Per Minute (WPM)
    wpm = (len(words) / duration) * 60 if duration > 0 else 0

    # Simple content relevance check
    expected_keywords = ["experience", "skills", "background", "passionate", "motivated", "team player", "problem-solving"]
    found_keywords_count = sum(1 for keyword in expected_keywords if keyword.lower() in transcript.lower())
    content_relevance_score = (found_keywords_count / len(expected_keywords)) * 100 if len(expected_keywords) > 0 else 0

    suggestions = []
    if wpm < 120:
        suggestions.append("Consider speaking a bit faster to maintain engagement.")
    elif wpm > 160:
        suggestions.append("Try to slow down your pace for clarity.")
    else:
        suggestions.append("Your speaking pace is good!")

    if filler_words_count > 3:
        suggestions.append(f"You used {filler_words_count} filler words. Practice reducing 'um' and 'uh'.")
    else:
        suggestions.append("Good job minimizing filler words!")

    if content_relevance_score < 50:
        suggestions.append("Focus on incorporating more keywords relevant to the role and your experience.")
    else:
        suggestions.append("Good job including relevant content!")

    # --- End Analysis Logic ---

    return jsonify({
        "transcript": transcript,
        "filler_words_count": filler_words_count,
        "wpm": wpm,
        "content_relevance_score": content_relevance_score,
        "suggestions": suggestions
    })

# --- WebSocket Event Handler for Eye Contact ---
@socketio.on('video_frame')
def handle_video_frame(data):
    if face_landmarker is None:
        print("MediaPipe Face Landmarker model not initialized. Skipping frame processing.")
        emit('eye_contact_status', {'status': 'Model Error'})
        return

    try:
        # Extract base64 image data (e.g., "data:image/jpeg;base64,...")
        # Split to get just the base64 part
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR) # Decode image into OpenCV format

        # Convert the BGR image (OpenCV default) to RGB as required by MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        # Perform face landmark detection
        detection_result = face_landmarker.detect(mp_image)

        eye_contact_status = 'No Face Detected' # Default status

        if detection_result.face_landmarks:
            landmarks = detection_result.face_landmarks[0] # Get landmarks for the first detected face
            
            # MediaPipe landmark indices for approximate eye centers (can vary, these are common)
            # You might fine-tune these indices or use average of multiple points for robustness
            left_eye_center_x = landmarks[33].x # Example: left eye pupil
            left_eye_center_y = landmarks[33].y
            right_eye_center_x = landmarks[263].x # Example: right eye pupil
            right_eye_center_y = landmarks[263].y

            # Simple heuristic for eye contact: Check if eyes are generally centralized within the frame
            # Coordinates are normalized (0.0 to 1.0) relative to image width/height
            # Adjust these thresholds based on your webcam, lighting, and desired sensitivity
            is_looking_central = (
                abs(left_eye_center_x - 0.5) < 0.15 and # X-coordinate within 0.15 of center (0.5)
                abs(right_eye_center_x - 0.5) < 0.15 and
                left_eye_center_y > 0.3 and left_eye_center_y < 0.7 and # Y-coordinate within 0.3 to 0.7 range
                right_eye_center_y > 0.3 and right_eye_center_y < 0.7
            )

            if is_looking_central:
                eye_contact_status = 'Good'
            else:
                eye_contact_status = 'Adjust Position'
        
        # Emit the determined status back to the client that sent the frame
        emit('eye_contact_status', {'status': eye_contact_status})

    except Exception as e:
        print(f"Error processing video frame on backend: {e}")
        # Emit an error status back to the client if something goes wrong during processing
        emit('eye_contact_status', {'status': 'Error (Backend)'})

# --- Main entry point to run the Flask application ---
if __name__ == '__main__':
    # When using async_mode='gevent', you should run the app via socketio.run()
    # If running in a production WSGI server (like Gunicorn), the server itself
    # handles the gevent patching and app execution.
    print("Starting Flask-SocketIO server on http://localhost:8000...")
    socketio.run(app, debug=True, port=8000)