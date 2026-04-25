interface TLDRCardProps {
  tldr: string;
}

export default function TLDRCard({ tldr }: TLDRCardProps) {
  return (
    <div className="bg-indigo-950/60 border border-indigo-700/50 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-indigo-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
          </svg>
        </span>
        <h2 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">
          Session Summary
        </h2>
      </div>
      <p className="text-gray-100 leading-relaxed text-base">{tldr}</p>
    </div>
  );
}
