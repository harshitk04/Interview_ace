"use client"; 

import React from 'react'; 

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white antialiased">

      <header className="w-full py-6 px-4 md:px-8 bg-gray-900 border-b border-gray-800 shadow-lg">
        <nav className="container mx-auto flex justify-between items-center">
          <a href="#" className="text-3xl font-bold text-cyan-400 tracking-wide rounded-md px-2 py-1 hover:bg-gray-800 transition duration-300">InterviewAce</a>
          <ul className="flex space-x-4 sm:space-x-6"> 
            <li><a href="#features" className="text-gray-300 hover:text-cyan-400 transition duration-300">Features</a></li>
            <li><a href="#about" className="text-gray-300 hover:text-cyan-400 transition duration-300">About</a></li>
            <li><a href="#contact" className="text-gray-300 hover:text-cyan-400 transition duration-300">Contact</a></li>
          </ul>
        </nav>
      </header>

      <main className="flex-grow flex items-center justify-center py-16 px-4 md:px-8 text-center bg-gradient-to-br from-gray-900 to-black">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Master Your Next Interview with AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Get instant, intelligent feedback on your communication and confidence to ace every question.
          </p>
          <a href="/mainpage" className="inline-block bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-gray-900 text-2xl font-bold py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
            Start Free Practice
          </a>
        </div>
      </main>

      <section id="features" className="py-20 px-4 md:px-8 bg-gray-950">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-cyan-400">Unlock Your Full Potential</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">

            <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 flex flex-col items-center text-center transform hover:scale-105 transition duration-300 group">
              <h3 className="text-2xl font-semibold mb-4 text-white">Real-time Eye Contact Tracking</h3>
              <p className="text-gray-300">Maintain engaging eye contact with live feedback, ensuring you connect with your interviewer.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 flex flex-col items-center text-center transform hover:scale-105 transition duration-300 group">
              <h3 className="text-2xl font-semibold mb-4 text-white">Comprehensive Audio Analysis</h3>
              <p className="text-gray-300">Get detailed insights on your speaking pace, filler word usage, and content clarity.</p>
            </div>

            <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 flex flex-col items-center text-center transform hover:scale-105 transition duration-300 group">
              <h3 className="text-2xl font-semibold mb-4 text-white">Intelligent AI Feedback</h3>
              <p className="text-gray-300">Receive LLM-powered feedback on QA alignment and concise summaries of your answers.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="py-20 px-4 md:px-8 bg-black">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-8 text-cyan-400">Why InterviewAce?</h2>
          <p className="text-xl text-gray-300 mb-8">
            "InterviewAce transformed my confidence. The precise feedback on my pacing and how I structured my answers was invaluable. I landed my dream job!"
          </p>
          <p className="text-lg font-semibold text-gray-400 mb-12">- A Satisfied User</p>
          <a href="#" className="inline-block bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-2xl font-bold py-4 px-10 rounded-full shadow-lg transform hover:scale-105 transition duration-300 ease-in-out">
            Practice Now
          </a>
        </div>
      </section>

      <footer id="contact" className="bg-gray-900 py-8 px-4 md:px-8 text-center text-gray-400 border-t border-gray-800">
        <div className="container mx-auto">
          <p>&copy; 2025 InterviewAce. All rights reserved.</p>
          <div className="flex justify-center space-x-6 mt-4">
            <a href="#" className="hover:text-cyan-400 transition duration-300">Privacy Policy</a>
            <a href="#" className="hover:text-cyan-400 transition duration-300">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
