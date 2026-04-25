"use client";

import { UIEvent, useRef } from "react";

interface CodeEditorProps {
  code: string;
  language: string;
  languages: string[];
  onCodeChange: (code: string) => void;
  onLanguageChange: (language: string) => void;
}

const KEYWORDS: Record<string, Set<string>> = {
  python: new Set([
    "and", "as", "assert", "async", "await", "break", "class", "continue", "def",
    "del", "elif", "else", "except", "False", "finally", "for", "from", "if",
    "import", "in", "is", "lambda", "None", "nonlocal", "not", "or", "pass",
    "raise", "return", "True", "try", "while", "with", "yield",
  ]),
  javascript: new Set([
    "async", "await", "break", "case", "catch", "class", "const", "continue",
    "default", "delete", "do", "else", "export", "extends", "false", "finally",
    "for", "from", "function", "if", "import", "in", "instanceof", "let", "new",
    "null", "return", "switch", "this", "throw", "true", "try", "typeof", "var",
    "void", "while", "yield",
  ]),
  typescript: new Set([
    "abstract", "any", "as", "async", "await", "boolean", "break", "case",
    "catch", "class", "const", "continue", "default", "delete", "do", "else",
    "enum", "export", "extends", "false", "finally", "for", "from", "function",
    "if", "implements", "import", "in", "instanceof", "interface", "let", "new",
    "null", "number", "private", "protected", "public", "readonly", "return",
    "string", "switch", "this", "throw", "true", "try", "type", "typeof", "var",
    "void", "while", "yield",
  ]),
  java: new Set([
    "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
    "class", "const", "continue", "default", "do", "double", "else", "enum",
    "extends", "false", "final", "finally", "float", "for", "if", "implements",
    "import", "instanceof", "int", "interface", "long", "new", "null", "private",
    "protected", "public", "return", "short", "static", "super", "switch", "this",
    "throw", "throws", "true", "try", "void", "while",
  ]),
  cpp: new Set([
    "auto", "bool", "break", "case", "catch", "char", "class", "const",
    "continue", "default", "delete", "do", "double", "else", "enum", "false",
    "float", "for", "if", "include", "int", "long", "namespace", "new", "nullptr",
    "private", "protected", "public", "return", "short", "sizeof", "static",
    "struct", "switch", "template", "this", "throw", "true", "try", "typedef",
    "typename", "using", "void", "while",
  ]),
};

const BUILTINS = new Set([
  "Array", "Boolean", "Date", "Dict", "Exception", "HashMap", "List", "Map",
  "Math", "Object", "Promise", "Set", "String", "System", "console", "dict",
  "enumerate", "len", "list", "print", "range", "set", "str", "tuple",
]);

function classForToken(token: string, language: string) {
  if (/^\s+$/.test(token)) return "text-transparent";
  if (/^#.*$/.test(token) || /^\/\/.*$/.test(token)) return "text-[#7f8c98]";
  if (/^\/\*[\s\S]*\*\/$/.test(token)) return "text-[#7f8c98]";
  if (/^(['"`])[\s\S]*\1$/.test(token)) return "text-[#7dd3a8]";
  if (/^\d+(\.\d+)?$/.test(token)) return "text-[#f6c177]";
  if (KEYWORDS[language]?.has(token)) return "text-[#c4a7ff]";
  if (BUILTINS.has(token)) return "text-[#7dcfff]";
  if (/^[A-Z][A-Za-z0-9_]*$/.test(token)) return "text-[#f6c177]";
  if (/^[{}()[\].,;:+\-*/%=<>!&|^~?]+$/.test(token)) return "text-[#9aa7b2]";
  return "text-[#d8dee9]";
}

function highlightLine(line: string, language: string) {
  const tokens = line.match(
    /\/\*[\s\S]*?\*\/|#.*|\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|\s+|[{}()[\].,;:+\-*/%=<>!&|^~?]+|./g
  );

  if (!tokens) return "\n";

  return tokens.map((token, index) => (
    <span key={`${token}-${index}`} className={classForToken(token, language)}>
      {token}
    </span>
  ));
}

function HighlightedCode({ code, language }: { code: string; language: string }) {
  const lines = code.split("\n");

  return (
    <>
      {lines.map((line, index) => (
        <div key={index} className="min-h-[1.5rem]">
          {highlightLine(line || " ", language)}
        </div>
      ))}
    </>
  );
}

export default function CodeEditor({
  code,
  language,
  languages,
  onCodeChange,
  onLanguageChange,
}: CodeEditorProps) {
  const highlightRef = useRef<HTMLPreElement>(null);

  const handleScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[#17211b]/10 bg-[#0b1020] shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#111827] px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7f8c98]">
            Editor
          </p>
          <p className="mt-1 text-xs text-[#9aa7b2]">Live code review runs after you pause typing.</p>
        </div>
        <select
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          className="rounded-md border border-white/10 bg-[#050816] px-3 py-1.5 text-xs font-semibold text-[#d8dee9] outline-none transition focus:border-[#7dcfff]"
        >
          {languages.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
      </div>

      <div className="relative min-h-[24rem] flex-1 overflow-hidden bg-[#050816]">
        <pre
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden p-5 font-mono text-sm leading-6"
        >
          <code>
            <HighlightedCode code={code} language={language} />
          </code>
        </pre>
        <textarea
          value={code}
          onChange={(event) => onCodeChange(event.target.value)}
          onScroll={handleScroll}
          onKeyDown={(event) => {
            if (event.key === "Tab") {
              event.preventDefault();
              const target = event.currentTarget;
              const { selectionStart, selectionEnd, value } = target;
              const indent = "  ";

              if (event.shiftKey) {
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
          className="absolute inset-0 h-full w-full resize-none overflow-auto bg-transparent p-5 font-mono text-sm leading-6 text-transparent caret-[#f8fafc] outline-none selection:bg-[#334155] selection:text-white"
        />
      </div>
    </div>
  );
}
