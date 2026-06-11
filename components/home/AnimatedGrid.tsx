"use client";

import { useEffect, useRef } from "react";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#3b82f6",
  "#10b981", "#f59e0b", "#ef4444", "#14b8a6",
];

function rand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function AnimatedGrid({ soldCount }: { soldCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const S = 50;
    const CW = canvas.width / S;
    const CH = canvas.height / S;

    const cells: Array<string | null> = Array.from({ length: S * S }, (_, i) =>
      rand(i * 3 + 7) < 0.09
        ? COLORS[Math.floor(rand(i * 11 + 3) * COLORS.length)]
        : null
    );

    // Mark actual sold ratio in top-left cluster
    if (soldCount > 0) {
      const ratio = Math.min(soldCount / 1_000_000, 1);
      const clusterCount = Math.floor(ratio * S * S);
      for (let i = 0; i < clusterCount && i < cells.length; i++) {
        if (!cells[i]) cells[i] = COLORS[i % COLORS.length];
      }
    }

    let t = 0;
    let raf: number;

    const draw = () => {
      ctx.fillStyle = "#090910";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let r = 0; r < S; r++) {
        for (let c = 0; c < S; c++) {
          const color = cells[r * S + c];
          const x = c * CW;
          const y = r * CH;
          ctx.fillStyle = color ?? ((r + c) % 2 === 0 ? "#0f1729" : "#111b35");
          ctx.fillRect(x, y, CW - 0.5, CH - 0.5);
        }
      }

      // Animated scan line sweeping downward
      const gy = ((t % 200) / 200) * canvas.height;
      const g = ctx.createLinearGradient(0, gy - 28, 0, gy + 28);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, "rgba(99,102,241,0.12)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      t++;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [soldCount]);

  return (
    <div className="relative select-none">
      {/* Ambient glow */}
      <div className="absolute -inset-8 bg-indigo-500/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative glass rounded-2xl p-2 border border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="rounded-xl block"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="absolute top-4 left-4 text-xs font-mono text-indigo-400/80 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg border border-indigo-500/20">
          LIVE
        </div>
        <div className="absolute bottom-4 right-4 text-xs font-mono text-slate-500 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
          1,000 × 1,000
        </div>
      </div>
    </div>
  );
}
