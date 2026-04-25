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
    <div className="rounded-lg border border-[#17211b]/10 bg-[#fcfbf7] p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667169]">
          {topic ?? "Question"}
        </span>
        <span className="text-xs font-medium text-[#667169]">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 w-full rounded-full bg-[#17211b]/10">
        <div
          className="h-1 rounded-full bg-emerald-600 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      <p className="text-base font-medium leading-7 text-[#17211b]">
        {questionText}
      </p>
    </div>
  );
}
