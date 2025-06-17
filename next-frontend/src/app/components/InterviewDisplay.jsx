// src/app/components/InterviewDisplay.jsx
"use client";

import React from 'react';

export default function InterviewDisplay({
    transcript,
    fillerWordsCount,
    wpm,
    contentRelevance,
    suggestions,
    qaAlignmentFeedback, 
    abstractiveSummary,  
    isLoading,
    error,
    hasResults 
}) {
    if (isLoading) {
        return (
            <div className="text-gray-100 space-y-3">
                <p className="text-center text-xl animate-pulse text-cyan-400">Analyzing audio and generating AI insights...</p>
                <p className="text-center text-gray-400 text-sm mt-2">This may take a moment for AI feedback.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-gray-100 space-y-3">
                <p className="text-center text-xl text-red-500">Error: {error}</p>
                <p className="text-center text-gray-400 text-sm mt-2">Please check your backend connection and ensure API keys are set correctly.</p>
            </div>
        );
    }

    if (!hasResults) {
        return (
            <div className="text-gray-100 space-y-3">
                <p className="text-center text-gray-400">
                    Record an interview to see the analysis!
                </p>
            </div>
        );
    }

    return (
        <div className="text-gray-100 space-y-5">
            
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold mb-3 text-emerald-400">Core Metrics</h3>
                <p className="mb-2">
                    <strong>Transcript:</strong>{" "}
                    <span className="text-white bg-gray-700 px-2 py-1 rounded">{transcript}</span>
                </p>
                <p className="mb-2">
                    <strong>Filler Words:</strong>{" "}
                    <span className="text-yellow-300 font-bold">{fillerWordsCount}</span>
                </p>
                <p className="mb-2">
                    <strong>WPM:</strong>{" "}
                    <span className="text-blue-400 font-bold">{wpm.toFixed(2)}</span>
                </p>
                <p className="mb-2">
                    <strong>Content Relevance:</strong>{" "}
                    <span className="text-purple-400 font-bold">{contentRelevance.toFixed(2)}%</span>
                </p>
                {suggestions.length > 0 && (
                    <div>
                        <strong className="block mt-3 mb-1">Suggestions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1 text-gray-300">
                            {suggestions.map((s, i) => (
                                <li key={i}>{s}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* AI-Powered Insights */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-inner">
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">AI-Powered Insights</h3>

                <div className="mb-4">
                    <h4 className="text-lg font-medium mb-2 text-blue-300">Question-Answer Alignment:</h4>
                    <pre className="whitespace-pre-wrap font-sans text-gray-200 bg-gray-700 p-3 rounded-md text-sm leading-relaxed">
                        {qaAlignmentFeedback}
                    </pre>
                </div>

                <div>
                    <h4 className="text-lg font-medium mb-2 text-blue-300">Abstractive Summary:</h4>
                    <pre className="whitespace-pre-wrap font-sans text-gray-200 bg-gray-700 p-3 rounded-md text-sm leading-relaxed">
                        {abstractiveSummary}
                    </pre>
                </div>
            </div>
        </div>
    );
}