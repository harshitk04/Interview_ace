import VideoRecorder from '../components/VideoRecorder'; 

export default function RecorderPage() {
  const interviewQuestion = "Tell me about yourself, and what makes you a good fit for this role?";

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white flex flex-col items-center p-4 sm:p-8 font-sans relative overflow-x-hidden">

      <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500 opacity-30 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-700 opacity-20 rounded-full blur-3xl -z-10 animate-pulse" />

      <header className="w-full flex flex-col items-center mb-10">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-5xl sm:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent tracking-widest drop-shadow-lg">
            InterviewAce
          </h1>
        </div>
        <p className="text-lg sm:text-xl text-gray-300 font-medium tracking-wide mt-2 max-w-2xl text-center">
          Practice. Analyze. Ace your interviews with real-time feedback and AI-powered insights.
        </p>
      </header>

      <section className="flex flex-col md:flex-row w-full max-w-6xl gap-10 justify-center items-start">
        <div className="w-full">
          <div className="backdrop-blur-lg bg-black/60 border border-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 transition-shadow hover:shadow-blue-800/30">
            <VideoRecorder question={interviewQuestion} />
          </div>
        </div>
      </section>

      <footer className="mt-16 text-gray-500 text-sm text-center opacity-80 tracking-wide">
        <span className="inline-block px-3 py-1 bg-gray-800/60 rounded-lg shadow-md">
          A Nebula Project by <span className="text-cyan-400 font-semibold">Harshit kumar</span>
        </span>
      </footer>
    </main>
  );
}