"use client";

import { useState } from "react";

type SlotData = {
  id: number;
  row: number;
  col: number;
  status: string;
  title?: string | null;
  linkUrl?: string | null;
  thumbUrl?: string | null;
  imageUrl?: string | null;
};

interface Props {
  slot: SlotData;
  onClose: () => void;
}

function SlotPositionMap({ row, col }: { row: number; col: number }) {
  const pctX = (col / 1000) * 100;
  const pctY = (row / 1000) * 100;
  return (
    <div className="mb-5">
      <div className="text-xs text-slate-500 mb-2 text-center">Position in gallery</div>
      <div className="relative w-24 h-24 rounded-lg mx-auto overflow-hidden border border-slate-700/50"
        style={{ background: "#090910" }}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.8) 1px, transparent 1px)",
          backgroundSize: "20% 20%",
        }} />
        {/* Slot dot */}
        <div
          className="absolute w-3 h-3 rounded-sm bg-indigo-500 shadow-lg"
          style={{
            left: `${pctX}%`,
            top: `${pctY}%`,
            transform: "translate(-50%, -50%)",
            boxShadow: "0 0 10px rgba(99,102,241,0.9), 0 0 20px rgba(99,102,241,0.4)",
          }}
        />
      </div>
      <p className="text-xs text-slate-500 text-center mt-2">
        Row {row + 1} · Col {col + 1}
      </p>
    </div>
  );
}

export default function PurchaseModal({ slot, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSold = slot.status === "sold";

  const handleBuy = async () => {
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId: slot.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in border border-indigo-500/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
        >
          ×
        </button>

        {isSold ? (
          /* ── Sold slot ── */
          <>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0 text-lg">
                ✓
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{slot.title ?? `Slot #${slot.id}`}</h2>
                <p className="text-slate-500 text-sm">Row {slot.row + 1} · Col {slot.col + 1}</p>
              </div>
            </div>

            {slot.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slot.imageUrl}
                alt={slot.title ?? "Slot image"}
                className="w-full rounded-xl object-contain max-h-64 bg-slate-900"
              />
            ) : (
              <div className="w-full h-48 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-500 text-sm">
                Image not uploaded yet
              </div>
            )}

            {slot.linkUrl && (
              <a
                href={slot.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
              >
                <span>Visit link</span>
                <span className="text-xs">↗</span>
              </a>
            )}
          </>
        ) : (
          /* ── Available slot: buy form ── */
          <>
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                🖼️
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Claim this slot</h2>
                <p className="text-slate-400 text-sm">Slot #{slot.id}</p>
              </div>
            </div>

            {/* Position in grid */}
            <SlotPositionMap row={slot.row} col={slot.col} />

            {/* Price */}
            <div className="glass rounded-xl p-4 mb-5 border border-indigo-500/20">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Price</span>
                <span className="text-2xl font-bold text-indigo-400">$0.50</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                One-time · Upload up to 8MB · Permanent
              </p>
            </div>

            {/* Email */}
            <div className="space-y-3 mb-5">
              <label className="block text-sm font-medium text-slate-300">
                Your email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuy()}
                placeholder="you@example.com"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-100 hover:shadow-lg hover:shadow-indigo-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to Stripe...
                </span>
              ) : (
                "Buy Now — $0.50"
              )}
            </button>

            <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1.5">
              <span>🔒</span>
              <span>Secure payment powered by Stripe</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
