import Link from "next/link";
import { db } from "@/lib/db";
import { TOTAL_SLOTS, SLOT_PRICE_USD } from "@/lib/constants";
import AnimatedGrid from "@/components/home/AnimatedGrid";

async function getSoldCount() {
  try {
    return await db.slot.count({ where: { status: "sold" } });
  } catch {
    return 0;
  }
}

const STEPS = [
  {
    n: "01",
    title: "Pick a Slot",
    desc: "Browse the 1,000 × 1,000 grid. Zoom in, explore, and click any empty slot.",
  },
  {
    n: "02",
    title: "Pay $0.50",
    desc: "One-time payment via Stripe. No subscriptions, no hidden fees — ever.",
  },
  {
    n: "03",
    title: "Upload Your Image",
    desc: "Upload up to 8MB. Full resolution visible when zoomed in. Permanent.",
  },
];

const FAQ = [
  {
    q: "How long will my image be displayed?",
    a: "Forever. Once you purchase a slot it's yours permanently — no renewals, no subscriptions.",
  },
  {
    q: "Can I update my image later?",
    a: "Yes. Use your purchase email to replace the image or update the link at any time.",
  },
  {
    q: "What image formats are supported?",
    a: "JPEG, PNG, WebP and GIF (static). Maximum file size is 8MB. Images display at full resolution when zoomed in.",
  },
  {
    q: "Does slot location matter?",
    a: "All 1,000,000 slots are equally visible and zoomable. Pick any open slot you like before paying.",
  },
];

export default async function Home() {
  const soldCount = await getSoldCount();
  const remaining = TOTAL_SLOTS - soldCount;
  const percentSold = ((soldCount / TOTAL_SLOTS) * 100).toFixed(2);

  return (
    <main className="min-h-screen flex flex-col items-center relative overflow-hidden">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 bg-radial-gradient opacity-20 pointer-events-none" />

      {/* ── HERO ── */}
      <section className="relative z-10 max-w-6xl w-full px-4 pt-20 pb-16 flex flex-col lg:flex-row items-center gap-14">
        {/* Left: text */}
        <div className="flex-1 text-center lg:text-left space-y-6 fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-sm text-indigo-400 border border-indigo-500/30">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            {soldCount.toLocaleString()} slots sold &middot; {remaining.toLocaleString()} remaining
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-white">One Million</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Image Slots
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-xl leading-relaxed mx-auto lg:mx-0">
            A <strong className="text-white">1,000 × 1,000</strong> canvas of images. Buy a slot
            for just{" "}
            <strong className="text-indigo-400">${SLOT_PRICE_USD.toFixed(2)}</strong> and upload
            your photo, art, or brand — visible at any zoom level, forever.
          </p>

          {/* Progress bar */}
          <div className="max-w-sm space-y-2 mx-auto lg:mx-0">
            <div className="flex justify-between text-sm text-slate-500">
              <span>{percentSold}% sold</span>
              <span>{remaining.toLocaleString()} left</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${Math.max(parseFloat(percentSold), 0.3)}%` }}
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
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
              Buy a Slot — $0.50
            </Link>
          </div>
        </div>

        {/* Right: animated grid preview */}
        <div className="flex-shrink-0 fade-in">
          <AnimatedGrid soldCount={soldCount} />
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative z-10 max-w-4xl w-full px-4 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-3">How it works</h2>
        <p className="text-slate-500 text-center mb-12">Three steps from zero to permanent web presence</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="glass rounded-2xl p-6 space-y-4 hover:border-indigo-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 group"
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                {s.n}
              </div>
              <h3 className="text-lg font-semibold text-white">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 max-w-4xl w-full px-4 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "🔍",
              title: "Infinite Zoom",
              desc: "Scroll from all 1M images to a single full-resolution photo in seconds",
            },
            {
              icon: "🖼️",
              title: "Full Resolution",
              desc: "Up to 8MB per image — stays crisp at maximum zoom, no compression",
            },
            {
              icon: "♾️",
              title: "Permanent",
              desc: "Pay once, keep it forever — no subscriptions, no expiry",
            },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 space-y-2 hover:border-indigo-500/30 transition-colors">
              <div className="text-2xl">{f.icon}</div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative z-10 max-w-4xl w-full px-4 py-12">
        <div className="glass rounded-2xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Total Slots", value: "1,000,000" },
            { label: "Sold", value: soldCount.toLocaleString() },
            { label: "Price per Slot", value: "$0.50" },
            { label: "Max Image Size", value: "8 MB" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl md:text-3xl font-bold text-white">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 max-w-2xl w-full px-4 py-12">
        <h2 className="text-3xl font-bold text-white text-center mb-10">FAQ</h2>
        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="glass rounded-xl group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none text-white font-medium list-none">
                {item.q}
                <span className="text-slate-500 group-open:rotate-180 transition-transform duration-200 ml-4 flex-shrink-0 text-sm">
                  ▾
                </span>
              </summary>
              <p className="px-5 pb-5 text-slate-400 text-sm leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full px-4 py-8 text-center text-slate-600 text-sm border-t border-[#1e1e3a] mt-4">
        Million Image Gallery &middot; {soldCount.toLocaleString()} of 1,000,000 slots sold &middot; $0.50 each
      </footer>
    </main>
  );
}
