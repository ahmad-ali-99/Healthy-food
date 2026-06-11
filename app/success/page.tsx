import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-10 text-center max-w-md space-y-6 fade-in">
        <div className="text-6xl">🎉</div>
        <h1 className="text-3xl font-bold text-white">Payment successful!</h1>
        <p className="text-slate-400">
          Your slot has been reserved. Check your email for confirmation and
          upload link.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/gallery"
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
          >
            Go to Gallery
          </Link>
          <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
