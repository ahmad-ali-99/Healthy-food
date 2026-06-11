"use client";

type SlotData = {
  id: number;
  row: number;
  col: number;
  status: string;
  title?: string | null;
  linkUrl?: string | null;
  thumbUrl?: string | null;
};

interface Props {
  x: number;
  y: number;
  slot: SlotData;
  onClose: () => void;
}

export default function SlotTooltip({ x, y, slot }: Props) {
  const left = x + 16;
  const top = y - 8;

  return (
    <div
      className="absolute z-30 pointer-events-none fade-in"
      style={{ left, top, maxWidth: 200 }}
    >
      <div className="glass rounded-xl p-3 shadow-xl border-indigo-500/20">
        {slot.thumbUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={slot.thumbUrl}
            alt={slot.title ?? "Slot image"}
            className="w-16 h-16 object-cover rounded-lg mb-2"
          />
        )}
        <p className="text-white text-sm font-medium leading-tight">
          {slot.title ?? `Slot #${slot.id}`}
        </p>
        <p className="text-slate-500 text-xs mt-1">
          Row {slot.row}, Col {slot.col}
        </p>
        {slot.linkUrl && (
          <p className="text-indigo-400 text-xs mt-1 truncate">{slot.linkUrl}</p>
        )}
      </div>
    </div>
  );
}
