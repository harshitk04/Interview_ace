from gevent import monkey
monkey.patch_all()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import io
import base64
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision
from pydub import AudioSegment
from faster_whisper import WhisperModel
import tempfile
import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

app = Flask(__name__)
CORS(app, resources={
    r"/analyze_interview": {"origins": "*"},
    r"/*": {"origins": "*"}
})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent')

model_path = 'face_landmarker.task'

try:
    base_options = mp_tasks.BaseOptions(model_asset_path=model_path)
    options = vision.FaceLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_faces=1,
        output_face_blendshapes=True
    )
    face_landmarker = vision.FaceLandmarker.create_from_options(options)
    print("MediaPipe Face Landmarker model loaded successfully.")
except Exception as e:
    print(f"ERROR: Failed to load MediaPipe Face Landmarker model from {model_path}. Make sure the file exists and is correct. Error: {e}")
    face_landmarker = None

load_dotenv()

google_api_key = os.getenv("GOOGLE_API_KEY")
if not google_api_key:
    print("ERROR: GOOGLE_API_KEY not found. Please set it in your .env file.")
    llm_model = None
else:
    llm_model = ChatGoogleGenerativeAI(model='gemini-2.0-flash-lite-preview-02-05', 
                                       temperature=0.7, 
                                       google_api_key=google_api_key
                                       )
    output_parser = StrOutputParser()

whisper_model_size = "small"
whisper_model = None

try:
    print(f"Loading Whisper model '{whisper_model_size}' for MPS (Apple Silicon GPU)...")
    whisper_model = WhisperModel(whisper_model_size, device="mps", compute_type="float16")
    print(f"Whisper model '{whisper_model_size}' loaded successfully for MPS.")
except Exception as e:
    print(f"ERROR: Failed to load Whisper model on MPS. Make sure you have installed faster-whisper and torch with MPS support. Error: {e}")
    print("Attempting to load on CPU as fallback (will be slower)...")
    try:
        whisper_model = WhisperModel(whisper_model_size, device="cpu")
        print(f"Whisper model '{whisper_model_size}' loaded successfully on CPU.")
    except Exception as cpu_e:
        print(f"ERROR: Failed to load Whisper model on CPU either. Transcription will not work. Error: {cpu_e}")
        whisper_model = None


def get_langchain_gemini_response(system_prompt_content, user_prompt_content, model_instance, temperature=0.7):
    if model_instance is None:
        return "LLM service not available: Gemini model not initialized."
    try:
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", system_prompt_content),
            ("human", user_prompt_content)
        ])
        chain = prompt_template | model_instance | StrOutputParser()
        response = chain.invoke({"text": ""})
        return response
    except Exception as e:
        print(f"An error occurred with LangChain Gemini LLM call: {e}")
        return f"LLM processing error: {e}"

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
    question = request.form.get('question', 'No question provided.')
    job_description = request.form.get('job_description', 'No job description provided.')

    if not duration_str:
        return jsonify({"error": "No duration provided"}), 400

    try:
        duration = float(duration_str)
    except ValueError:
        return jsonify({"error": "Invalid duration format"}), 400

    webm_audio = io.BytesIO(audio_file.read())
    audio_filepath = None

    try:
        audio = AudioSegment.from_file(webm_audio, format="webm")
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_wav_file:
            audio.export(tmp_wav_file.name, format="wav")
            audio_filepath = tmp_wav_file.name
    except Exception as e:
        print(f"Error converting audio with pydub or saving temp file: {e}")
        return jsonify({"error": f"Failed to convert audio or save for Whisper. Ensure FFmpeg is installed. Error: {e}"}), 500

    transcript = ""
    if whisper_model is None:
        print("Whisper model not loaded. Skipping transcription.")
        transcript = "Error: Transcription model not available."
    else:
        try:
            print(f"Starting Whisper transcription for file: {audio_filepath}")
            segments, info = whisper_model.transcribe(audio_filepath, beam_size=5)
            
            transcript_parts = []
            for segment in segments:
                transcript_parts.append(segment.text)
            transcript = " ".join(transcript_parts)
            
            print(f"Whisper Transcript: {transcript}")

        except Exception as e:
            print(f"Error during Whisper transcription: {e}")
            transcript = f"Transcription error: {e}"
        finally:
            if audio_filepath and os.path.exists(audio_filepath):
                try:
                    os.remove(audio_filepath)
                    print(f"Cleaned up temporary file: {audio_filepath}")
                except Exception as cleanup_e:
                    print(f"Warning: Could not remove temporary file {audio_filepath}: {cleanup_e}")

    filler_words = ["um", "uh", "like", "you know", "so", "basically", "actually"]
    filler_words_count = sum(transcript.lower().count(word) for word in filler_words)

    words = transcript.split()
    wpm = (len(words) / duration) * 60 if duration > 0 else 0

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

    qa_alignment_feedback = "N/A"
    domain_keyword_feedback = "N/A"
    abstractive_summary = "N/A"

    if llm_model:
        print("Starting LLM-powered analysis using LangChain and Gemini...")
        
        qa_system_prompt = "You are a helpful interview coach. Provide feedback on how well an interview answer addresses the given question."
        qa_user_prompt = f"""Evaluate the following interview answer for its directness, relevance, and comprehensiveness to the given question.
        Identify if the answer goes off-topic, is too brief, or misses key elements.
        Provide concise feedback in bullet points, starting with positive aspects and then areas for improvement.

        Question: {question}
        Answer: {transcript}
        """
        qa_alignment_feedback = get_langchain_gemini_response(qa_system_prompt, qa_user_prompt, llm_model)
        print(f"QA Alignment Feedback:\n{qa_alignment_feedback}\n---")

        summary_system_prompt = "You are a concise summarization assistant."
        summary_user_prompt = f"""Summarize the following interview answer concisely in 2-4 sentences, capturing the main points and key takeaways.

        Interview Answer: {transcript}
        """
        abstractive_summary = get_langchain_gemini_response(summary_system_prompt, summary_user_prompt, llm_model, temperature=0.5)
        print(f"Abstractive Summary:\n{abstractive_summary}\n---")
    else:
        print("Google Gemini API key missing or model not initialized, skipping LLM analysis.")


    return jsonify({
        "transcript": transcript,
        "filler_words_count": filler_words_count,
        "wpm": wpm,
        "content_relevance_score": content_relevance_score,
        "suggestions": suggestions,
        "qa_alignment_feedback": qa_alignment_feedback,
        "domain_keyword_feedback": domain_keyword_feedback,
        "abstractive_summary": abstractive_summary
    })

@socketio.on('video_frame')
def handle_video_frame(data):
    if face_landmarker is None:
        print("MediaPipe Face Landmarker model not initialized. Skipping frame processing.")
        emit('eye_contact_status', {'status': 'Model Error'})
        return

    try:
        image_data = base64.b64decode(data['image'].split(',')[1])
        nparr = np.frombuffer(image_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        detection_result = face_landmarker.detect(mp_image)

        eye_contact_status = 'No Face Detected'

        if detection_result.face_landmarks:
            landmarks = detection_result.face_landmarks[0]
            
            left_eye_center_x = landmarks[33].x
            left_eye_center_y = landmarks[33].y
            right_eye_center_x = landmarks[263].x
            right_eye_center_y = landmarks[263].y

            is_looking_central = (
                abs(left_eye_center_x - 0.5) < 0.15 and
                abs(right_eye_center_x - 0.5) < 0.15 and
                left_eye_center_y > 0.3 and left_eye_center_y < 0.7 and
                right_eye_center_y > 0.3 and right_eye_center_y < 0.7
            )

            if is_looking_central:
                eye_contact_status = 'Good'
            else:
                eye_contact_status = 'Adjust Position'
        
        emit('eye_contact_status', {'status': eye_contact_status})

    except Exception as e:
        print(f"Error processing video frame on backend: {e}")
        emit('eye_contact_status', {'status': 'Error (Backend)'})

if __name__ == '__main__':
    print("Starting Flask-SocketIO server on http://localhost:8000...")
    socketio.run(app, debug=True, port=8000)