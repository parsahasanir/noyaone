"use client";
import { useEffect, useRef, useState } from "react";
import { MODELS, ModelId } from "@/lib/plans";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ModelPicker({
  value,
  onChange,
  size = "sm",
  disabled = false,
}: {
  value: ModelId;
  onChange: (m: ModelId) => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = MODELS.find((m) => m.id === value);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const triggerCls =
    size === "md"
      ? "flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/85 hover:bg-white/[0.08] disabled:opacity-50"
      : "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-white/70 hover:bg-white/[0.06] disabled:opacity-50";

  return (
    <div ref={ref} className="relative z-[100]">
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={triggerCls}
      >
        <span className="text-white/40">مدل:</span>
        <span className="font-medium">{current?.label ?? "انتخاب"}</span>
        {!disabled && (
          <ChevronDown
            size={size === "md" ? 16 : 14}
            className={`transition ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-1/2 top-full z-[110] mt-2 w-72 translate-x-1/2 overflow-hidden rounded-xl border border-white/10 bg-[#1a1a20] shadow-2xl"
          >
            <div className="max-h-80 overflow-y-auto">
              {MODELS.map((m) => {
                const selected = m.id === value;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                    }}
                    className={`flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-right transition hover:bg-white/[0.06] ${
                      selected ? "bg-white/[0.06]" : ""
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm text-white/90">{m.label}</span>
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-white/50">
                        {m.creditMultiplier}×
                      </span>
                    </div>
                    <span className="text-[11px] text-white/50">
                      {m.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}