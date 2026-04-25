interface QuestionCardProps {
  questionText: string;
  currentIndex: number;
  totalQuestions: number;
  topic?: string;
}

export default function QuestionCard({
  questionText,
  currentIndex,
  totalQuestions,
  topic,
}: QuestionCardProps) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
          {topic ?? "Question"}
        </span>
        <span className="text-xs text-gray-500">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-1 mb-4">
        <div
          className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      <p className="text-gray-100 text-base leading-relaxed font-medium">
        {questionText}
      </p>
    </div>
  );
}
