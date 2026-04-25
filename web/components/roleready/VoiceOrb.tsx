"use client";

import { useEffect, useRef } from "react";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  volume: number; // 0–1, used when listening
}

export default function VoiceOrb({ state, volume }: VoiceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const SIZE = canvas.width;
    const CX = SIZE / 2;
    const CY = SIZE / 2;

    const draw = (ts: number) => {
      timeRef.current = ts * 0.001; // seconds
      const t = timeRef.current;

      ctx.clearRect(0, 0, SIZE, SIZE);

      // ── Colour palette per state ──────────────────────────────────────────
      let innerColor: string;
      let outerColor: string;
      let glowColor: string;

      if (state === "listening") {
        // Candidate speaking — warm indigo → violet
        innerColor = `hsla(${240 + volume * 40}, 80%, 65%, 0.95)`;
        outerColor = `hsla(${260 + volume * 30}, 70%, 45%, 0.0)`;
        glowColor = `hsla(${250 + volume * 30}, 90%, 60%, ${0.3 + volume * 0.4})`;
      } else if (state === "speaking") {
        // Agent speaking — teal → cyan
        innerColor = `hsla(${180 + Math.sin(t * 3) * 20}, 75%, 60%, 0.95)`;
        outerColor = `hsla(190, 70%, 40%, 0.0)`;
        glowColor = `hsla(185, 85%, 55%, ${0.35 + Math.sin(t * 4) * 0.15})`;
      } else if (state === "thinking") {
        // Thinking — amber pulse
        innerColor = `hsla(${40 + Math.sin(t * 2) * 10}, 85%, 60%, 0.9)`;
        outerColor = `hsla(45, 70%, 40%, 0.0)`;
        glowColor = `hsla(42, 90%, 55%, ${0.2 + Math.sin(t * 3) * 0.1})`;
      } else {
        // Idle — dim indigo
        innerColor = `hsla(240, 40%, 45%, 0.7)`;
        outerColor = `hsla(240, 30%, 30%, 0.0)`;
        glowColor = `hsla(240, 50%, 40%, 0.1)`;
      }

      // ── Outer glow ────────────────────────────────────────────────────────
      const glowRadius = state === "listening"
        ? CX * (0.85 + volume * 0.35)
        : state === "speaking"
        ? CX * (0.85 + Math.sin(t * 4) * 0.12)
        : state === "thinking"
        ? CX * (0.8 + Math.sin(t * 2) * 0.06)
        : CX * 0.75;

      const glow = ctx.createRadialGradient(CX, CY, 0, CX, CY, glowRadius);
      glow.addColorStop(0, glowColor);
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(CX, CY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // ── Blob radius function ──────────────────────────────────────────────
      const baseR = SIZE * 0.22;
      const getR = (angle: number): number => {
        if (state === "listening") {
          // Spiky, reactive to volume
          const spike =
            Math.sin(angle * 6 + t * 4) * volume * 18 +
            Math.sin(angle * 4 - t * 3) * volume * 12 +
            Math.sin(angle * 9 + t * 6) * volume * 8;
          return baseR + spike + Math.sin(angle * 3 + t * 2) * 4;
        } else if (state === "speaking") {
          // Smooth, rhythmic waves
          return (
            baseR +
            Math.sin(angle * 5 + t * 5) * 10 +
            Math.sin(angle * 3 - t * 3) * 7 +
            Math.sin(angle * 7 + t * 2) * 4
          );
        } else if (state === "thinking") {
          // Slow morphing
          return (
            baseR +
            Math.sin(angle * 4 + t * 1.5) * 8 +
            Math.sin(angle * 2 - t) * 5
          );
        } else {
          // Idle — gentle breathe
          const breathe = Math.sin(t * 0.8) * 4;
          return baseR + breathe + Math.sin(angle * 3 + t * 0.5) * 2;
        }
      };

      // ── Draw blob ─────────────────────────────────────────────────────────
      const STEPS = 120;
      ctx.beginPath();
      for (let i = 0; i <= STEPS; i++) {
        const angle = (i / STEPS) * Math.PI * 2;
        const r = getR(angle);
        const x = CX + Math.cos(angle) * r;
        const y = CY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Fill with radial gradient
      const maxR = getR(0);
      const grad = ctx.createRadialGradient(
        CX - maxR * 0.2,
        CY - maxR * 0.2,
        0,
        CX,
        CY,
        maxR * 1.1
      );
      grad.addColorStop(0, innerColor);
      grad.addColorStop(1, outerColor);
      ctx.fillStyle = grad;
      ctx.fill();

      // Subtle inner highlight
      const highlight = ctx.createRadialGradient(
        CX - maxR * 0.25,
        CY - maxR * 0.3,
        0,
        CX,
        CY,
        maxR * 0.7
      );
      highlight.addColorStop(0, "rgba(255,255,255,0.12)");
      highlight.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = highlight;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, volume]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={320}
      className="drop-shadow-2xl"
      aria-label={`Voice orb — ${state}`}
    />
  );
}
