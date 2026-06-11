import Link from "next/link";
import { db } from "@/lib/db";
import { TOTAL_SLOTS, SLOT_PRICE_USD } from "@/lib/constants";

async function getSoldCount() {
  try {
    return await db.slot.count({ where: { status: "sold" } });
  } catch {
    return 0;
  }
}

export default async function Home() {
  const soldCount = await getSoldCount();
  const remaining = TOTAL_SLOTS - soldCount;
  const percentSold = ((soldCount / TOTAL_SLOTS) * 100).toFixed(2);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-4xl w-full text-center space-y-8 fade-in">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-indigo-400 border-indigo-500/30">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          {soldCount.toLocaleString()} slots sold · {remaining.toLocaleString()} remaining
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
          <span className="text-white">One Million</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Image Slots
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Buy a slot on a canvas of{" "}
          <strong className="text-white">1,000 × 1,000</strong> images.
          Upload your photo, art, or brand — and keep it on the internet forever.
          Just{" "}
          <strong className="text-indigo-400">${SLOT_PRICE_USD.toFixed(2)}</strong> per slot.
        </p>

        {/* Progress bar */}
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex justify-between text-sm text-slate-500">
            <span>{percentSold}% sold</span>
            <span>{remaining.toLocaleString()} left</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${Math.max(parseFloat(percentSold), 0.1)}%` }}
            />
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/gallery"
            className="px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/25 glow"
          >
            Explore the Gallery
          </Link>
          <Link
            href="/gallery"
            className="px-8 py-4 rounded-xl glass hover:border-indigo-500/50 text-white font-semibold text-lg transition-all duration-200 hover:scale-105"
          >
            Buy Your Slot — $0.50
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 text-left">
          {[
            {
              icon: "🔍",
              title: "Infinite Zoom",
              desc: "Zoom from seeing all 1M images to a single full-resolution photo",
            },
            {
              icon: "🖼️",
              title: "Full Resolution",
              desc: "Upload images up to 8MB — your image stays crisp at any zoom level",
            },
            {
              icon: "♾️",
              title: "Permanent",
              desc: "Your slot is yours forever once purchased — no subscriptions",
            },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 space-y-2">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
