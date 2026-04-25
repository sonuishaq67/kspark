"use client";

import { useEffect, useRef, useState } from "react";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

const STATE_COLORS: Record<OrbState, [string, string, string]> = {
  // [inner, mid, outer] gradient stops
  idle: ["#a5b4fc", "#6366f1", "#312e81"],
  listening: ["#f0abfc", "#a855f7", "#581c87"],
  thinking: ["#fde68a", "#f59e0b", "#7c2d12"],
  speaking: ["#67e8f9", "#14b8a6", "#134e4a"],
};

const STATE_LABEL: Record<OrbState, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
};

const CYCLE: OrbState[] = ["idle", "listening", "thinking", "speaking"];
const STATE_DURATION_MS = 3500;

export default function LandingOrb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<OrbState>("idle");
  const stateRef = useRef<OrbState>("idle");
  const animRef = useRef<number>(0);

  // Auto-cycle through orb states for the demo hero
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % CYCLE.length;
      const next = CYCLE[i];
      stateRef.current = next;
      setState(next);
    }, STATE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (ts: number) => {
      const t = ts * 0.001;
      const W = canvas.width;
      const H = canvas.height;
      const cx = W / 2;
      const cy = H / 2;
      const baseR = Math.min(W, H) * 0.32;
      const s = stateRef.current;
      const [c1, c2, c3] = STATE_COLORS[s];

      ctx.clearRect(0, 0, W, H);

      // Outer glow (radial gradient)
      const glow = ctx.createRadialGradient(cx, cy, baseR * 0.3, cx, cy, baseR * 2.4);
      glow.addColorStop(0, hexA(c2, 0.45));
      glow.addColorStop(0.5, hexA(c3, 0.18));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // Blob shape
      const points = 96;
      const path = new Path2D();
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2;
        const noise = blobNoise(s, a, t);
        const r = baseR * (1 + noise);
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      path.closePath();

      const grad = ctx.createRadialGradient(
        cx - baseR * 0.3,
        cy - baseR * 0.4,
        baseR * 0.1,
        cx,
        cy,
        baseR * 1.4
      );
      grad.addColorStop(0, c1);
      grad.addColorStop(0.55, c2);
      grad.addColorStop(1, c3);
      ctx.fillStyle = grad;
      ctx.fill(path);

      // Subtle highlight
      ctx.save();
      ctx.clip(path);
      const hi = ctx.createRadialGradient(
        cx - baseR * 0.5,
        cy - baseR * 0.6,
        baseR * 0.05,
        cx - baseR * 0.5,
        cy - baseR * 0.6,
        baseR * 1.1
      );
      hi.addColorStop(0, "rgba(255,255,255,0.55)");
      hi.addColorStop(0.4, "rgba(255,255,255,0.06)");
      hi.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hi;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Outline
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 1.2 * dpr;
      ctx.stroke(path);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: "block" }}
      />
      {/* State label overlay */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex items-center justify-center">
        <div className="rounded-full glass px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-white/90">
          {STATE_LABEL[state]}
        </div>
      </div>
    </div>
  );
}

/* ---- helpers ---- */

function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function blobNoise(state: OrbState, angle: number, t: number) {
  // Each state shapes the blob differently
  switch (state) {
    case "idle":
      return (
        0.04 * Math.sin(angle * 2 + t * 0.6) +
        0.02 * Math.sin(angle * 5 + t * 0.4)
      );
    case "listening":
      return (
        0.09 * Math.sin(angle * 6 + t * 2.2) +
        0.05 * Math.sin(angle * 11 + t * 3.1) +
        0.03 * Math.sin(angle * 3 + t * 1.4)
      );
    case "thinking":
      return (
        0.08 * Math.sin(angle * 3 + t * 0.8) +
        0.05 * Math.sin(angle * 4 + t * 1.1 + 1.2) +
        0.02 * Math.cos(angle * 7 + t * 0.6)
      );
    case "speaking":
      return (
        0.07 * Math.sin(angle * 4 + t * 2.4) +
        0.04 * Math.sin(angle * 8 + t * 3.0) +
        0.02 * Math.sin(angle * 2 + t * 1.8)
      );
  }
}
