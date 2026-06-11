"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Application, Container, Graphics, Sprite, Texture } from "pixi.js";
import PurchaseModal from "./PurchaseModal";
import SlotTooltip from "./SlotTooltip";

const GRID = 1000;
const SLOT_PX = 10; // world units per slot
const WORLD_SIZE = GRID * SLOT_PX; // 10,000 world px

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

type TooltipState = {
  x: number;
  y: number;
  slot: SlotData;
} | null;

type ModalState = {
  slot: SlotData;
} | null;

interface Props {
  onSoldCountChange?: (count: number) => void;
}

export default function GalleryCanvas({ onSoldCountChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef = useRef<Application | null>(null);
  const viewportRef = useRef<Container | null>(null);
  const spriteLayerRef = useRef<Container | null>(null);
  const highlightRef = useRef<Graphics | null>(null);
  const textureCache = useRef<Map<string, Texture>>(new Map());
  const slotCache = useRef<Map<number, SlotData>>(new Map());
  const loadingTiles = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);

  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [zoom, setZoom] = useState(1);

  // Pan state
  const panRef = useRef({ isDragging: false, startX: 0, startY: 0, vpX: 0, vpY: 0 });
  const vpRef = useRef({ x: -WORLD_SIZE / 2, y: -WORLD_SIZE / 2, scale: 0.06 });

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
      onSoldCountChange?.(slotCache.current.size > 0 ? soldCount : 0);
    } finally {
      loadingTiles.current.delete(key);
    }
  }, [getVisibleGridBounds, onSoldCountChange]);

  // Draw the grid using Canvas2D (fallback when Pixi.js is not available)
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const vp = vpRef.current;
    const scale = vp.scale;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, cw, ch);

    const bounds = getVisibleGridBounds();
    const slotScreenSize = SLOT_PX * scale;

    // Draw slots
    for (let r = bounds.r1; r <= bounds.r2; r++) {
      for (let c = bounds.c1; c <= bounds.c2; c++) {
        const id = r * GRID + c;
        const slot = slotCache.current.get(id);
        const wx = c * SLOT_PX;
        const wy = r * SLOT_PX;
        const { sx, sy } = worldToScreen(wx, wy);

        if (slot?.status === "sold") {
          // Draw image thumbnail if zoom is enough
          if (scale > 0.3 && slot.thumbUrl) {
            const imgKey = `thumb_${id}`;
            let img = (textureCache.current as any).get(imgKey) as HTMLImageElement | undefined;
            if (!img) {
              img = new Image();
              img.crossOrigin = "anonymous";
              img.src = slot.thumbUrl;
              img.onload = () => {
                (textureCache.current as any).set(imgKey, img);
              };
              (textureCache.current as any).set(imgKey, img);
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
        } else {
          // Empty slot
          if (slotScreenSize > 2) {
            ctx.fillStyle = "#0f1729";
            ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);
            if (slotScreenSize > 4) {
              ctx.strokeStyle = "#1a1a3a";
              ctx.lineWidth = 0.5;
              ctx.strokeRect(sx + 0.5, sy + 0.5, slotScreenSize - 1, slotScreenSize - 1);
            }
          } else {
            ctx.fillStyle = "#0d0d22";
            ctx.fillRect(sx, sy, slotScreenSize, slotScreenSize);
          }
        }
      }
    }

    // Draw selected slot highlight
    if (selectedSlot) {
      const wx = selectedSlot.col * SLOT_PX;
      const wy = selectedSlot.row * SLOT_PX;
      const { sx, sy } = worldToScreen(wx, wy);
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx, sy, slotScreenSize, slotScreenSize);
    }
  }, [getVisibleGridBounds, worldToScreen, selectedSlot]);

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

  // Zoom on scroll
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const vp = vpRef.current;
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.005, Math.min(50, vp.scale * factor));

      // Zoom towards cursor
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

  // Pan (mouse drag)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
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
      } else {
        // Hover: find slot under cursor
        const { wx, wy } = screenToWorld(e.clientX, e.clientY);
        const col = Math.floor(wx / SLOT_PX);
        const row = Math.floor(wy / SLOT_PX);
        if (col >= 0 && col < GRID && row >= 0 && row < GRID) {
          const id = row * GRID + col;
          const slot = slotCache.current.get(id);
          if (slot?.status === "sold") {
            setTooltip({ x: e.clientX, y: e.clientY, slot });
          } else {
            setTooltip(null);
          }
        }
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      const pan = panRef.current;
      const moved =
        Math.abs(e.clientX - pan.startX) > 3 || Math.abs(e.clientY - pan.startY) > 3;
      pan.isDragging = false;

      if (!moved) {
        // Click: identify slot
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

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [screenToWorld]);

  // Touch support (pinch to zoom + pan)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTouchDist = 0;
    let lastTouchMid = { x: 0, y: 0 };
    let touchPanStart = { vpX: 0, vpY: 0, tx: 0, ty: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
        lastTouchMid = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
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

  // Reload when zoom changes significantly
  useEffect(() => {
    const timer = setTimeout(() => loadSlotsInView(), 200);
    return () => clearTimeout(timer);
  }, [zoom, loadSlotsInView]);

  return (
    <>
      <canvas
        ref={canvasRef}
        id="gallery-canvas"
        className="absolute inset-0"
        style={{ cursor: tooltip ? "pointer" : "crosshair" }}
      />

      {/* Zoom level indicator */}
      <div className="absolute bottom-14 right-4 z-20 glass rounded-lg px-3 py-2 text-xs font-mono text-slate-400">
        {vpRef.current.scale < 0.02
          ? "Overview"
          : vpRef.current.scale < 0.5
          ? "Region"
          : vpRef.current.scale < 5
          ? "Area"
          : "Detail"}{" "}
        · {(vpRef.current.scale * 100).toFixed(0)}%
      </div>

      {/* Zoom buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1">
        <button
          onClick={() => {
            vpRef.current.scale = Math.min(50, vpRef.current.scale * 1.5);
            setZoom(vpRef.current.scale);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors text-lg font-bold"
        >
          +
        </button>
        <button
          onClick={() => {
            vpRef.current.scale = Math.max(0.005, vpRef.current.scale / 1.5);
            setZoom(vpRef.current.scale);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-white hover:bg-white/10 transition-colors text-lg font-bold"
        >
          −
        </button>
        <button
          onClick={() => {
            vpRef.current = { x: -WORLD_SIZE / 2, y: -WORLD_SIZE / 2, scale: 0.06 };
            setZoom(0.06);
          }}
          className="w-10 h-10 glass rounded-lg flex items-center justify-center text-slate-400 hover:bg-white/10 transition-colors text-xs"
          title="Reset view"
        >
          ⊞
        </button>
      </div>

      {/* Hover tooltip */}
      {tooltip && (
        <SlotTooltip
          x={tooltip.x}
          y={tooltip.y}
          slot={tooltip.slot}
          onClose={() => setTooltip(null)}
        />
      )}

      {/* Purchase / detail modal */}
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
