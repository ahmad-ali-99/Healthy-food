"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense, useState } from "react";

const GalleryCanvas = dynamic(() => import("@/components/gallery/GalleryCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-[#0a0a0f]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading gallery...</p>
      </div>
    </div>
  ),
});

export default function GalleryPage() {
  const [soldCount, setSoldCount] = useState<number | null>(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f]">
      {/* Header overlay */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 glass border-b border-[#1e1e3a]">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold hover:text-indigo-400 transition-colors">
          <span className="text-xl">🖼️</span>
          <span className="hidden sm:inline">Million Image Gallery</span>
        </Link>

        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span className="hidden sm:inline">
            {soldCount !== null ? (
              <>{soldCount.toLocaleString()} sold · {(1_000_000 - soldCount).toLocaleString()} available</>
            ) : (
              "1,000,000 slots"
            )}
          </span>
          <Link
            href="/gallery"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors text-sm"
          >
            Buy a Slot — $0.50
          </Link>
        </div>
      </header>

      {/* Zoom hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 glass rounded-full px-4 py-2 text-xs text-slate-400 pointer-events-none fade-in">
        Scroll to zoom · Drag to pan · Click empty slot to buy
      </div>

      {/* Main canvas */}
      <Suspense>
        <GalleryCanvas onSoldCountChange={setSoldCount} />
      </Suspense>
    </div>
  );
}
