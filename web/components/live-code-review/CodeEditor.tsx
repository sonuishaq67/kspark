"use client";

interface CodeEditorProps {
  code: string;
  language: string;
  languages: string[];
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

export default function CodeEditor({
  code,
  language,
  languages,
  onCodeChange,
  onLanguageChange,
}: CodeEditorProps) {
  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Code Workspace
          </p>
          <p className="mt-1 text-sm text-gray-300">
            Live review updates after you pause typing.
          </p>
        </div>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-200 focus:border-indigo-600 focus:outline-none"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={code}
        onChange={(e) => onCodeChange(e.target.value)}
        spellCheck={false}
        className="min-h-[18rem] flex-1 resize-none rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition-colors focus:border-indigo-700"
      />
    </>
  );
}
