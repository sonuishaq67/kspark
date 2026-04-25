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
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900/70 px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
          Editor
        </p>
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="rounded-md border border-gray-700 bg-gray-950 px-2.5 py-1 text-xs text-gray-200 focus:border-indigo-600 focus:outline-none"
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
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            e.preventDefault();
            const target = e.currentTarget;
            const { selectionStart, selectionEnd, value } = target;
            const indent = "  ";

            if (e.shiftKey) {
              // Shift+Tab: outdent the current line / selected lines.
              const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
              const before = value.slice(0, lineStart);
              const region = value.slice(lineStart, selectionEnd);
              const outdented = region.replace(/^( {1,2}|\t)/gm, "");
              const removed = region.length - outdented.length;
              const next = before + outdented + value.slice(selectionEnd);
              onCodeChange(next);
              requestAnimationFrame(() => {
                target.selectionStart = Math.max(lineStart, selectionStart - Math.min(indent.length, removed));
                target.selectionEnd = Math.max(lineStart, selectionEnd - removed);
              });
              return;
            }

            if (selectionStart !== selectionEnd) {
              // Multi-line indent for selections that span newlines.
              const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
              const before = value.slice(0, lineStart);
              const region = value.slice(lineStart, selectionEnd);
              if (region.includes("\n")) {
                const indented = region.replace(/^/gm, indent);
                const added = indented.length - region.length;
                const next = before + indented + value.slice(selectionEnd);
                onCodeChange(next);
                requestAnimationFrame(() => {
                  target.selectionStart = selectionStart + indent.length;
                  target.selectionEnd = selectionEnd + added;
                });
                return;
              }
            }

            const next = value.slice(0, selectionStart) + indent + value.slice(selectionEnd);
            onCodeChange(next);
            requestAnimationFrame(() => {
              target.selectionStart = target.selectionEnd = selectionStart + indent.length;
            });
          }
        }}
        spellCheck={false}
        className="min-h-[18rem] flex-1 resize-none rounded-xl border border-gray-800 bg-gray-950 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition-colors focus:border-indigo-700"
      />
    </>
  );
}
