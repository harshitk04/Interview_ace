// src/app/components/VideoRecorder.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import InterviewDisplay from './InterviewDisplay'; 
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function VideoRecorder({ question }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const [audioChunks, setAudioChunks] = useState([]);
    const [recordingStartTime, setRecordingStartTime] = useState(0);
    const [transcript, setTranscript] = useState('');
    const [fillerWordsCount, setFillerWordsCount] = useState(0);
    const [wpm, setWPM] = useState(0);
    const [contentRelevance, setContentRelevance] = useState(0);
    const [suggestions, setSuggestions] = useState([]);
    const [qaAlignmentFeedback, setQaAlignmentFeedback] = useState('Awaiting analysis...');
    const [abstractiveSummary, setAbstractiveSummary] = useState('Awaiting analysis...');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [eyeContactStatus, setEyeContactStatus] = useState('...');
    const socketRef = useRef(null);
    const videoStreamIntervalRef = useRef(null);
    useEffect(() => {
        socketRef.current = io(BACKEND_URL, {
            transports: ['websocket'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current.on('connect', () => {
            setEyeContactStatus('...');
            setError(null); 
        });

        socketRef.current.on('eye_contact_status', (data) => {
            setEyeContactStatus(data.status);
        });

        socketRef.current.on('disconnect', () => {
            setEyeContactStatus('Disconnected');
            clearInterval(videoStreamIntervalRef.current);
        });

        socketRef.current.on('connect_error', (err) => {
            setError('Failed to connect to backend eye tracking. Please ensure the backend is running and accessible.');
            setEyeContactStatus('Error');
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            clearInterval(videoStreamIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        let currentStream;

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                currentStream = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                    setMediaRecorder(new MediaRecorder(stream));
                    videoRef.current.onloadeddata = () => {
                        startVideoStream();
                    };
                }
            })
            .catch(err => {
                setError("Please allow camera and microphone access to use InterviewAce.");
            });

        return () => {
            if (currentStream) {
                currentStream.getTracks().forEach(track => track.stop());
            }
            clearInterval(videoStreamIntervalRef.current);
        };
    }, []);

    const startVideoStream = () => {
        if (!videoRef.current || !canvasRef.current || !socketRef.current || !socketRef.current.connected) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        clearInterval(videoStreamIntervalRef.current);

        videoStreamIntervalRef.current = setInterval(() => {
            if (video.paused || video.ended || !socketRef.current || !socketRef.current.connected) {
                return;
            }
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            socketRef.current.emit('video_frame', { image: imageData });
        }, 66);
    };

    const stopVideoStream = () => {
        clearInterval(videoStreamIntervalRef.current);
        videoStreamIntervalRef.current = null;
    };

    const startRecording = () => {
        if (mediaRecorder) {
            setAudioChunks([]);
            mediaRecorder.start(1000);
            setRecordingStartTime(performance.now());
            setIsRecording(true);
            // Reset results for a new recording
            setTranscript('');
            setFillerWordsCount(0);
            setWPM(0);
            setContentRelevance(0);
            setSuggestions([]);
            setQaAlignmentFeedback('Awaiting analysis...');
            setAbstractiveSummary('Awaiting analysis...');
            setError(null);
            setIsLoading(false); // Reset loading state
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            setIsRecording(false);
        }
    };

    useEffect(() => {
        if (mediaRecorder) {
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks((prev) => [...prev, event.data]);
                }
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                const duration = (performance.now() - recordingStartTime) / 1000;
                sendAudioToBackend(audioBlob, duration);
            };
        }
    }, [mediaRecorder, audioChunks, recordingStartTime]);

    const sendAudioToBackend = async (audioBlob, duration) => {
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('audio', audioBlob, 'interview_audio.webm');
        formData.append('duration', duration.toFixed(2));
        formData.append('question', question); // Pass the question prop

        try {
            const response = await fetch(`${BACKEND_URL}/analyze_interview`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! Status: ${response.status}. Message: ${errorText}`);
            }

            const data = await response.json();

            setTranscript(data.transcript);
            setFillerWordsCount(data.filler_words_count);
            setWPM(data.wpm);
            setContentRelevance(data.content_relevance_score);
            setSuggestions(data.suggestions);
            setQaAlignmentFeedback(data.qa_alignment_feedback);
            setAbstractiveSummary(data.abstractive_summary); 

        } catch (err) {
            setError(`Failed to analyze audio: ${err.message || 'Network error'}. Make sure backend is running.`);
            setTranscript("Analysis failed.");
            setQaAlignmentFeedback('Analysis failed.');
            setAbstractiveSummary('Analysis failed.');
        } finally {
            setIsLoading(false);
        }
    };

    const hasResults = transcript !== '' && !isLoading && !error;

    return (
        <div className="min-h-screen bg-black flex flex-col gap-6 p-6">
            <div className="w-full max-w-4xl mx-auto bg-black rounded-lg shadow-xl p-6 flex flex-col items-center">
                <p className="text-xl font-medium mb-4 text-center text-gray-100">
                    Question: <span className="text-blue-400">{question}</span>
                </p>
                {error && (
                    <div className="bg-red-500 text-white p-3 rounded-md mb-4 w-full text-center">
                        {error}
                    </div>
                )}
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full rounded-md mb-4 aspect-video bg-black border border-gray-700"
                ></video>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={startRecording}
                        disabled={isRecording || !mediaRecorder}
                        className="bg-green-500 hover:bg-green-400 text-black font-bold py-3 px-6 rounded-lg text-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRecording ? 'Recording...' : 'Start Recording'}
                    </button>
                    <button
                        onClick={stopRecording}
                        disabled={!isRecording}
                        className="bg-red-500 hover:bg-red-400 text-black font-bold py-3 px-6 rounded-lg text-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Stop Recording
                    </button>
                </div>
                <p className="text-lg font-semibold text-gray-100">
                    Eye Contact:{" "}
                    <span
                        className={`font-bold ${
                            eyeContactStatus === "Good"
                                ? "text-green-400"
                                : eyeContactStatus === "Disconnected" || eyeContactStatus === "Error"
                                ? "text-red-400"
                                : "text-yellow-300"
                        }`}
                    >
                        {eyeContactStatus}
                    </span>
                </p>
            </div>
            <div className="w-full max-w-4xl mx-auto bg-black rounded-lg shadow-xl p-6 mt-6">
                <h2 className="text-2xl font-semibold mb-4 text-center text-cyan-400">Analysis Results</h2>
                <InterviewDisplay
                    transcript={transcript}
                    fillerWordsCount={fillerWordsCount}
                    wpm={wpm}
                    contentRelevance={contentRelevance}
                    suggestions={suggestions}
                    qaAlignmentFeedback={qaAlignmentFeedback}
                    abstractiveSummary={abstractiveSummary}
                    isLoading={isLoading}
                    error={error}
                    hasResults={hasResults}
                />
            </div>
        </div>
    );
}