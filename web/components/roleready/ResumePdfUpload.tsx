"use client";

import Link from "next/link";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { api } from "@/lib/api";

const RESUME_DRAFT_KEY = "roleready.resumeDraft";
const MAX_PDF_BYTES = 5 * 1024 * 1024;

type UploadState = "idle" | "uploading" | "ready" | "error";

function parseApiError(error: unknown): string {
  if (!(error instanceof Error)) return "Could not pull text from that PDF";

  try {
    const body = JSON.parse(error.message) as { detail?: string };
    if (body.detail) return body.detail;
  } catch {
    // Use the raw message below.
  }

  return error.message || "Could not pull text from that PDF";
}

export default function ResumePdfUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("Upload a PDF resume to prefill practice setup.");

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setState("error");
      setMessage("Upload a PDF resume.");
      return;
    }

    if (file.size > MAX_PDF_BYTES) {
      setState("error");
      setMessage("PDF resume must be 5 MB or smaller.");
      return;
    }

    setState("uploading");
    setFileName(file.name);
    setMessage("Pulling resume text from PDF...");

    try {
      const parsed = await api.resume.parsePdf(file);
      localStorage.setItem(
        RESUME_DRAFT_KEY,
        JSON.stringify({
          text: parsed.text,
          filename: parsed.filename,
          pages: parsed.pages,
          uploadedAt: new Date().toISOString(),
        })
      );
      setState("ready");
      setMessage(`Pulled ${parsed.text.length.toLocaleString()} characters from ${parsed.pages} page${parsed.pages === 1 ? "" : "s"}.`);
    } catch (error) {
      setState("error");
      setMessage(parseApiError(error));
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  return (
    <section className="mb-8 rounded-3xl glass p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-rose-400/30 bg-rose-500/10 text-sm font-bold text-rose-200">
              PDF
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-100">Pull Resume From PDF</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-400">
                Extract resume text here and it will be waiting in the practice setup form.
              </p>
            </div>
          </div>

          {fileName && (
            <p className="mt-3 text-xs text-gray-500">
              File: <span className="text-gray-300">{fileName}</span>
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-[420px]">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`flex min-h-[116px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-5 text-center transition-colors ${
              dragActive
                ? "border-indigo-400 bg-indigo-500/10"
                : "border-gray-700 bg-gray-950/40 hover:border-indigo-500/70"
            }`}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleInputChange}
            />
            <span className="text-sm font-semibold text-gray-200">
              {state === "uploading" ? "Uploading..." : "Drop PDF or browse"}
            </span>
            <span
              className={`mt-2 text-xs leading-relaxed ${
                state === "error"
                  ? "text-red-300"
                  : state === "ready"
                    ? "text-emerald-300"
                    : "text-gray-500"
              }`}
            >
              {message}
            </span>
          </div>

          <Link
            href="/practice/setup"
            className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
              state === "ready"
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "border border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-200"
            }`}
          >
            Continue to setup
          </Link>
        </div>
      </div>
    </section>
  );
}
