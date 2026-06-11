"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PurchaseModal from "./PurchaseModal";
import SlotTooltip from "./SlotTooltip";

const GRID = 1000;
const SLOT_PX = 10;
const WORLD_SIZE = GRID * SLOT_PX; // 10,000 world units
const MINIMAP_SIZE = 150;

type SlotData = {
  id: number;
  row: number;
  col: number;
  status: string;
  title?: string | null;
  linkUrl?: string | null;
  thumbUrl?: string | null;
  imageUrl?: string | null;
  dominantColor?: string | null;
};

type TooltipState = { x: number; y: number; slot: SlotData } | null;
type ModalState = { slot: SlotData } | null;

interface Props {
  onSoldCountChange?: (count: number) => void;
}

export default function GalleryCanvas({ onSoldCountChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const textureCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const slotCache = useRef<Map<number, SlotData>>(new Map());
  const loadingTiles = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);
  const hoveredSlotIdRef = useRef<number | null>(null);

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [zoom, setZoom] = useState(0.06);

  const panRef = useRef({ isDragging: false, startX: 0, startY: 0, vpX: 0, vpY: 0 });
  // vp.x/y = world coordinate at viewport CENTER
  const vpRef = useRef({ x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, scale: 0.06 });

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const vp = vpRef.current;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    return {
      sx: (wx - vp.x) * vp.scale + cw / 2,
      sy: (wy - vp.y) * vp.scale + ch / 2,
    };
  }, []);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const vp = vpRef.current;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    return {
      wx: (sx - cw / 2) / vp.scale + vp.x,
      wy: (sy - ch / 2) / vp.scale + vp.y,
    };
  }, []);

  const getVisibleGridBounds = useCallback(() => {
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const tl = screenToWorld(0, 0);
    const br = screenToWorld(cw, ch);
    return {
      c1: Math.max(0, Math.floor(tl.wx / SLOT_PX)),
      r1: Math.max(0, Math.floor(tl.wy / SLOT_PX)),
      c2: Math.min(GRID - 1, Math.ceil(br.wx / SLOT_PX)),
      r2: Math.min(GRID - 1, Math.ceil(br.wy / SLOT_PX)),
    };
  }, [screenToWorld]);

  const loadSlotsInView = useCallback(async () => {
    const bounds = getVisibleGridBounds();
    const width = bounds.c2 - bounds.c1;
    const height = bounds.r2 - bounds.r1;
    if (width <= 0 || height <= 0 || width > 300 || height > 300) return;

    const key = `${bounds.c1},${bounds.r1},${bounds.c2},${bounds.r2}`;
    if (loadingTiles.current.has(key)) return;
    loadingTiles.current.add(key);

    try {
      const res = await fetch(
        `/api/slots?x1=${bounds.c1}&y1=${bounds.r1}&x2=${bounds.c2}&y2=${bounds.r2}`
      );
      if (!res.ok) return;
      const slots: SlotData[] = await res.json();
      let soldCount = 0;
      for (const s of slots) {
        slotCache.current.set(s.id, s);
        if (s.status === "sold") soldCount++;
      }
      onSoldCountChange?.(soldCount);
    } finally {
      loadingTiles.current.delete(key);
    }
  }, [getVisibleGridBounds, onSoldCountChange]);

  // Minimap: draws the full grid overview + viewport rectangle
  const drawMinimap = useCallback(() => {
    const mc = minimapRef.current;
    if (!mc) return;
    const mctx = mc.getContext("2d");
    if (!mctx) return;

    const MW = MINIMAP_SIZE;
    const MH = MINIMAP_SIZE;
    const scaleX = MW / GRID;
    const scaleY = MH / GRID;

    mctx.fillStyle = "#090910";
    mctx.fillRect(0, 0, MW, MH);

    // Subtle grid overlay
    mctx.strokeStyle = "rgba(99,102,241,0.05)";
    mctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      mctx.beginPath();
      mctx.moveTo(i * MW / 10, 0);
      mctx.lineTo(i * MW / 10, MH);
      mctx.stroke();
      mctx.beginPath();
      mctx.moveTo(0, i * MH / 10);
      mctx.lineTo(MW, i * MH / 10);
      mctx.stroke();
    }

    // Draw sold slots as colored pixels
    slotCache.current.forEach((slot) => {
      if (slot.status === "sold") {
        const mx = slot.col * scaleX;
        const my = slot.row * scaleY;
        mctx.fillStyle = slot.dominantColor ?? "#6366f1";
        mctx.fillRect(mx, my, Math.max(1.5, scaleX + 0.5), Math.max(1.5, scaleY + 0.5));
      }
    });

    // Viewport rectangle
    const vp = vpRef.current;
    const cw = window.innerWidth;
    const ch = window.innerHeight;
    const tlWx = (-cw / 2) / vp.scale + vp.x;
    const tlWy = (-ch / 2) / vp.scale + vp.y;
    const brWx = (cw / 2) / vp.scale + vp.x;
    const brWy = (ch / 2) / vp.scale + vp.y;

    const vx1 = Math.max(0, Math.min(MW, (tlWx / SLOT_PX) * scaleX));
    const vy1 = Math.max(0, Math.min(MH, (tlWy / SLOT_PX) * scaleY));
    const vx2 = Math.max(0, Math.min(MW, (brWx / SLOT_PX) * scaleX));
    const vy2 = Math.max(0, Math.min(MH, (brWy / SLOT_PX) * scaleY));
    const vrW = Math.max(2, vx2 - vx1);
    const vrH = Math.max(2, vy2 - vy1);

    mctx.fillStyle = "rgba(99,102,241,0.12)";
    mctx.fillRect(vx1, vy1, vrW, vrH);
    mctx.strokeStyle = "rgba(99,102,241,0.9)";
    mctx.lineWidth = 1.5;
    mctx.strokeRect(vx1, vy1, vrW, vrH);
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const vp = vpRef.current;
    const scale = vp.scale;
    const slotScreenSize = SLOT_PX * scale;
    const hoveredId = hoveredSlotIdRef.current;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, cw, ch);

    const bounds = getVisibleGridBounds();

    for (let r = bounds.r1; r <= bounds.r2; r++) {
      for (let c = bounds.c1; c <= bounds.c2; c++) {
        const id = r * GRID + c;
        const slot = slotCache.current.get(id);
        const wx = c * SLOT_PX;
        const wy = r * SLOT_PX;
        const { sx, sy } = worldToScreen(wx, wy);
        const isHovered = hoveredId === id;

        if (slot?.status === "sold") {
          // Try thumbnail at medium zoom
          if (scale > 0.3 && slot.thumbUrl) {
            const imgKey = `thumb_${id}`;
            let img = textureCache.current.get(imgKey);
            if (!img) {
              img = new Image();
              img.crossOrigin = "anonymous";
              img.src = slot.thumbUrl;
              img.onload = () => { textureCache.current.set(imgKey, img!); };
              textureCache.current.set(imgKey, img);
            }
            if (img.complete && img.naturalWidth > 0) {
              ctx.drawImage(img, sx, sy, slotScreenSize, slotScreenSize);
            } else {
              ctx.fillStyle = slot.dominantColor ?? "#1e1b4b";
              ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);
            }
          } else {
            ctx.fillStyle = slot.dominantColor ?? "#1e1b4b";
            ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);
          }

          // Hover: white glow
          if (isHovered && slotScreenSize > 3) {
            ctx.save();
            ctx.shadowBlur = 14;
            ctx.shadowColor = "rgba(255,255,255,0.7)";
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(sx + 0.75, sy + 0.75, slotScreenSize - 1.5, slotScreenSize - 1.5);
            ctx.restore();
          }
        } else {
          // Empty slot
          if (slotScreenSize > 2) {
            const isEven = (r + c) % 2 === 0;
            ctx.fillStyle = isEven ? "#0f1729" : "#111b35";
            ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);

            if (slotScreenSize > 5) {
              ctx.strokeStyle = "#1e2a4a";
              ctx.lineWidth = 0.5;
              ctx.strokeRect(sx + 0.5, sy + 0.5, slotScreenSize - 1, slotScreenSize - 1);
            }

            // Hover: indigo glow
            if (isHovered && slotScreenSize > 5) {
              ctx.save();
              ctx.shadowBlur = 18;
              ctx.shadowColor = "rgba(99,102,241,0.8)";
              ctx.strokeStyle = "rgba(99,102,241,0.9)";
              ctx.lineWidth = 2;
              ctx.strokeRect(sx + 1, sy + 1, slotScreenSize - 2, slotScreenSize - 2);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = "#0c1220";
            ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);
          }
        }
      }
    }

    // Selected slot ring
    if (selectedSlot) {
      const wx = selectedSlot.col * SLOT_PX;
      const wy = selectedSlot.row * SLOT_PX;
      const { sx, sy } = worldToScreen(wx, wy);
      ctx.save();
      ctx.shadowBlur = 20;
      ctx.shadowColor = "rgba(34,197,94,0.8)";
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, slotScreenSize, slotScreenSize);
      ctx.restore();
    }

    drawMinimap();
  }, [getVisibleGridBounds, worldToScreen, selectedSlot, drawMinimap]);

  // Animation loop
  useEffect(() => {
    const loop = () => {
      drawCanvas();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [drawCanvas]);

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Scroll to zoom
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vp = vpRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.005, Math.min(50, vp.scale * factor));

      const { wx, wy } = screenToWorld(e.clientX, e.clientY);
      vp.x = wx - (e.clientX - window.innerWidth / 2) / newScale;
      vp.y = wy - (e.clientY - window.innerHeight / 2) / newScale;
      vp.scale = newScale;

      setZoom(newScale);
      loadSlotsInView();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [screenToWorld, loadSlotsInView]);

  // Mouse: pan + hover + click
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      canvas.style.cursor = "grabbing";
      panRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        vpX: vpRef.current.x,
        vpY: vpRef.current.y,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      const pan = panRef.current;
      if (pan.isDragging) {
        const dx = (e.clientX - pan.startX) / vpRef.current.scale;
        const dy = (e.clientY - pan.startY) / vpRef.current.scale;
        vpRef.current.x = pan.vpX - dx;
        vpRef.current.y = pan.vpY - dy;
        setTooltip(null);
        hoveredSlotIdRef.current = null;
      } else {
        const { wx, wy } = screenToWorld(e.clientX, e.clientY);
        const col = Math.floor(wx / SLOT_PX);
        const row = Math.floor(wy / SLOT_PX);
        if (col >= 0 && col < GRID && row >= 0 && row < GRID) {
          const id = row * GRID + col;
          hoveredSlotIdRef.current = id;
          const slot = slotCache.current.get(id);
          if (slot?.status === "sold") {
            setTooltip({ x: e.clientX, y: e.clientY, slot });
          } else {
            setTooltip(null);
          }
        } else {
          hoveredSlotIdRef.current = null;
          setTooltip(null);
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const pan = panRef.current;
      const moved = Math.abs(e.clientX - pan.startX) > 3 || Math.abs(e.clientY - pan.startY) > 3;
      pan.isDragging = false;
      canvas.style.cursor = tooltip ? "pointer" : "crosshair";

      if (!moved) {
        const { wx, wy } = screenToWorld(e.clientX, e.clientY);
        const col = Math.floor(wx / SLOT_PX);
        const row = Math.floor(wy / SLOT_PX);
        if (col >= 0 && col < GRID && row >= 0 && row < GRID) {
          const id = row * GRID + col;
          const slot = slotCache.current.get(id) ?? { id, row, col, status: "available" };
          if (slot.status === "sold") {
            setModal({ slot });
          } else {
            setSelectedSlot(slot);
            setModal({ slot });
          }
        }
      }
    };

    const onMouseLeave = () => {
      hoveredSlotIdRef.current = null;
      setTooltip(null);
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [screenToWorld, tooltip]);

  // Touch: pinch zoom + single-finger pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTouchDist = 0;
    let touchPanStart = { vpX: 0, vpY: 0, tx: 0, ty: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      } else if (e.touches.length === 1) {
        touchPanStart = {
          vpX: vpRef.current.x,
          vpY: vpRef.current.y,
          tx: e.touches[0].clientX,
          ty: e.touches[0].clientY,
        };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = dist / lastTouchDist;
        const vp = vpRef.current;
        const newScale = Math.max(0.005, Math.min(50, vp.scale * factor));
        const mid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
        const { wx, wy } = screenToWorld(mid.x, mid.y);
        vp.x = wx - (mid.x - window.innerWidth / 2) / newScale;
        vp.y = wy - (mid.y - window.innerHeight / 2) / newScale;
        vp.scale = newScale;
        lastTouchDist = dist;
        setZoom(newScale);
      } else if (e.touches.length === 1) {
        const dx = (e.touches[0].clientX - touchPanStart.tx) / vpRef.current.scale;
        const dy = (e.touches[0].clientY - touchPanStart.ty) / vpRef.current.scale;
        vpRef.current.x = touchPanStart.vpX - dx;
        vpRef.current.y = touchPanStart.vpY - dy;
      }
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
    };
  }, [screenToWorld]);

  // Initial load
  useEffect(() => {
    loadSlotsInView();
  }, [loadSlotsInView]);

  // Reload on zoom change
  useEffect(() => {
    const timer = setTimeout(() => loadSlotsInView(), 200);
    return () => clearTimeout(timer);
  }, [zoom, loadSlotsInView]);

  const zoomLabel =
    zoom < 0.02 ? "Overview" : zoom < 0.5 ? "Region" : zoom < 5 ? "Area" : "Detail";
  const zoomPct = (zoom * 100).toFixed(0);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="gallery-canvas"
        className="absolute inset-0"
        style={{ cursor: tooltip ? "pointer" : "crosshair" }}
      />

      {/* Minimap — bottom left */}
      <div className="absolute bottom-28 left-4 z-20">
        <div className="glass rounded-xl overflow-hidden border border-indigo-500/20 shadow-xl">
          <div className="px-2 py-1.5 text-xs text-slate-500 border-b border-slate-800 flex items-center justify-between">
            <span>Overview</span>
            <span className="text-indigo-400/60 font-mono text-[10px]">1000×1000</span>
          </div>
          <canvas
            ref={minimapRef}
            width={MINIMAP_SIZE}
            height={MINIMAP_SIZE}
            className="block"
          />
        </div>
      </div>

      {/* Zoom indicator — bottom right, above buttons */}
      <div className="absolute bottom-[76px] right-4 z-20 glass rounded-lg px-3 py-2 text-xs font-mono text-slate-400">
        {zoomLabel} · {zoomPct}%
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={() => {
            vpRef.current.scale = Math.min(50, vpRef.current.scale * 1.5);
            setZoom(vpRef.current.scale);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors text-lg font-bold"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => {
            vpRef.current.scale = Math.max(0.005, vpRef.current.scale / 1.5);
            setZoom(vpRef.current.scale);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors text-lg font-bold"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={() => {
            vpRef.current = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, scale: 0.06 };
            setZoom(0.06);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors text-xs"
          title="Reset view"
        >
          ⊞
        </button>
      </div>

      {tooltip && (
        <SlotTooltip
          x={tooltip.x}
          y={tooltip.y}
          slot={tooltip.slot}
          onClose={() => setTooltip(null)}
        />
      )}

      {modal && (
        <PurchaseModal
          slot={modal.slot}
          onClose={() => {
            setModal(null);
            setSelectedSlot(null);
          }}
        />
      )}
    </>
  );
}
