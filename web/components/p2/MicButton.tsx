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
        relative flex h-16 w-16 items-center justify-center rounded-full text-white
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
        focus:ring-offset-[#f4f1ea] disabled:cursor-not-allowed disabled:opacity-40
        ${
          isRecording
            ? "bg-rose-700 shadow-lg shadow-rose-900/20 hover:bg-rose-800 focus:ring-rose-500"
            : "bg-[#17211b] hover:bg-[#2b3a31] focus:ring-[#17211b]"
        }
      `}
    >
      {/* Pulsing ring when recording */}
      {isRecording && (
        <span className="absolute inset-0 animate-ping rounded-full bg-rose-500 opacity-25" />
      )}

      {/* Mic icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="relative z-10 h-7 w-7 text-white"
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
