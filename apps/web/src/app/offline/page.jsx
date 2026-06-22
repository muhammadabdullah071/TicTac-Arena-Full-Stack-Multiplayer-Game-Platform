export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          You're Offline
        </h1>
        <p className="text-gray-400 mb-6">
          Don't worry! Your game data is stored locally and will sync when
          you're back online.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
