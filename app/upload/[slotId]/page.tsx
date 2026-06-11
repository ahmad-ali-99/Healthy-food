"use client";

import { useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const MAX_MB = 8;

export default function UploadPage() {
  const params = useParams()!;
  const searchParams = useSearchParams()!;
  const router = useRouter();
  const slotId = (params?.slotId as string) ?? "";
  const sessionId = searchParams?.get("session_id") ?? "";

  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_MB}MB`);
      return;
    }
    setError("");
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreview(url);
  };

  const handleSubmit = async () => {
    if (!file) { setError("Please select an image"); return; }
    if (!email.includes("@")) { setError("Enter a valid email"); return; }
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("slotId", slotId);
    fd.append("email", email);
    fd.append("title", title);
    fd.append("linkUrl", linkUrl);
    fd.append("image", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setSuccess(true);
      setTimeout(() => router.push(`/gallery`), 2000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="glass rounded-2xl p-8 text-center max-w-md fade-in">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-white mb-2">Image uploaded!</h1>
          <p className="text-slate-400 mb-4">
            Your image is now live on the gallery. Redirecting...
          </p>
          <Link href="/gallery" className="text-indigo-400 hover:text-indigo-300">
            View gallery →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto">
            🖼️
          </div>
          <h1 className="text-3xl font-bold text-white">Upload Your Image</h1>
          <p className="text-slate-400">
            Slot #{slotId} is yours! Upload an image to make it visible on the gallery.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your email (same as checkout)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Image (max {MAX_MB}MB)
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
              className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
              ) : (
                <div className="space-y-2 text-slate-500">
                  <div className="text-4xl">📷</div>
                  <p className="text-sm">Click or drag & drop your image</p>
                  <p className="text-xs">JPG, PNG, WebP, GIF · max {MAX_MB}MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Title <span className="text-slate-500">(optional)</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My amazing image"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Link URL <span className="text-slate-500">(optional)</span>
            </label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || !file}
            className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </span>
            ) : (
              "Upload Image"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-600">
          Session: {sessionId?.slice(0, 16)}...
        </p>
      </div>
    </main>
  );
}
