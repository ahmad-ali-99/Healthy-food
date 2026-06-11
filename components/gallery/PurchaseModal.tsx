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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl fade-in border-indigo-500/20">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors text-xl leading-none"
        >
          ×
        </button>

        {isSold ? (
          /* Sold slot: show image */
          <>
            <h2 className="text-xl font-bold text-white mb-1">
              {slot.title ?? `Slot #${slot.id}`}
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              Row {slot.row}, Col {slot.col}
            </p>
            {slot.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slot.imageUrl}
                alt={slot.title ?? "Slot image"}
                className="w-full rounded-xl object-contain max-h-64"
              />
            ) : (
              <div className="w-full h-48 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500">
                No image uploaded yet
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
          /* Available slot: buy form */
          <>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl flex-shrink-0">
                🖼️
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Buy this slot</h2>
                <p className="text-slate-400 text-sm">
                  Slot #{slot.id} · Row {slot.row}, Col {slot.col}
                </p>
              </div>
            </div>

            {/* Price highlight */}
            <div className="glass rounded-xl p-4 mb-6 border-indigo-500/20">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Price</span>
                <span className="text-2xl font-bold text-indigo-400">$0.50</span>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                One-time payment · Upload up to 8MB image · Yours forever
              </p>
            </div>

            {/* Email input */}
            <div className="space-y-3 mb-6">
              <label className="block text-sm font-medium text-slate-300">
                Your email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleBuy()}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>

            <button
              onClick={handleBuy}
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-100"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Redirecting to checkout...
                </span>
              ) : (
                "Buy Now — $0.50"
              )}
            </button>

            <p className="text-center text-xs text-slate-500 mt-3">
              Secure payment powered by Stripe
            </p>
          </>
        )}
      </div>
    </div>
  );
}
