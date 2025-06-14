# InterviewAce: Your AI-Powered Interview Coach 🚀

**Master your next interview with instant, intelligent feedback on your communication and confidence.**

---

## 🌟 Project Overview

InterviewAce is an innovative web application designed to help you ace your job interviews. It provides a realistic practice environment with real-time visual feedback and in-depth AI-powered analysis of your spoken responses. This tool acts as your personal interview coach, helping you identify areas for improvement in your communication style and content.

---

## ✨ Key Features

* **Real-time Eye Contact Tracking:** Utilizes your webcam to provide live feedback on your eye contact, helping you maintain engagement and confidence throughout your mock interview.
* **Automatic Recording & Transcription:** Records your audio responses and generates a precise text transcript using advanced speech-to-text technology.
* **Comprehensive Audio Metrics:** Analyzes your spoken answer for key communication metrics, including:
    * **Speaking Pace (WPM):** Words Per Minute to ensure optimal delivery.
    * **Filler Word Detection:** Identifies and counts common filler words (`um`, `uh`, `like`, etc.) to help you reduce them.
    * **Content Relevance:** Evaluates how well your answer aligns with general interview expectations and the given question.
* **Intelligent AI Feedback (Powered by Google Gemini):**
    * **Question-Answer Alignment:** Provides specific feedback on how well your answer directly addresses the interview question, its comprehensiveness, and areas for improvement.
    * **Abstractive Summary:** Generates a concise, high-level summary of your answer, highlighting the main points.
* **Timed Responses:** Features a 2-minute countdown timer for answers, automatically stopping the recording when the time is up to simulate real interview pressure.

---

## 🛠️ Technologies Used

**Frontend (Next.js - React)**
* **Next.js:** React framework for building the user interface.
* **React:** For declarative UI development.
* **Tailwind CSS:** For rapid and responsive styling.
* **Socket.IO Client:** For real-time communication with the backend (eye tracking data).

**Backend (Flask - Python)**
* **Flask:** Lightweight Python web framework.
* **Flask-SocketIO:** Enables WebSocket communication.
* **MediaPipe:** For real-time facial landmark detection (eye tracking).
* **Pydub:** For audio manipulation and format conversion.
* **Faster Whisper:** For efficient and accurate speech-to-text transcription.
* **LangChain:** Framework for developing applications with large language models.
* **Google Gemini API (via LangChain):** The core LLM for generating intelligent feedback and summaries.
* **Python-dotenv:** For managing environment variables (like API keys).
* **OpenCV-Python:** For video frame processing.
