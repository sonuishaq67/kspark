"use client";

interface MicButtonProps {
  isRecording: boolean;
  isConnected: boolean;
  onStart: () => void;
  onStop: () => void;
}

export default function MicButton({
  isRecording,
  isConnected,
  onStart,
  onStop,
}: MicButtonProps) {
  const handleClick = () => {
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isConnected}
      aria-label={isRecording ? "Stop recording" : "Start recording"}
      className={`
        relative flex items-center justify-center w-16 h-16 rounded-full
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-offset-gray-900 disabled:opacity-40 disabled:cursor-not-allowed
        ${
          isRecording
            ? "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-lg shadow-red-900/50"
            : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
        }
      `}
    >
      {/* Pulsing ring when recording */}
      {isRecording && (
        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
      )}

      {/* Mic icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-7 h-7 text-white relative z-10"
      >
        {isRecording ? (
          // Stop square
          <rect x="6" y="6" width="12" height="12" rx="1" />
        ) : (
          // Mic
          <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 17.93V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A8.001 8.001 0 0 0 20 11a1 1 0 1 0-2 0 6 6 0 0 1-12 0 1 1 0 1 0-2 0 8.001 8.001 0 0 0 7 7.93z" />
        )}
      </svg>
    </button>
  );
}
