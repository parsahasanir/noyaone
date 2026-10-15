"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import {
  PERSONALITIES,
  Personality,
  PersonalityId,
} from "@/lib/personalities";
import PersonalityLogo from "./PersonalityLogo";

/* ---------- Avatar: SVG متحرک برای default، PNG برای بقیه ---------- */
export function PersonalityAvatar({
  p,
  size = 32,
  rounded = "rounded-3xl",
}: {
  p: Personality;
  size?: number;
  rounded?: string;
}) {
  const isDefault = p.id === "default";

  return (
    <div
      className={`relative shrink-0 overflow-hidden ${rounded} ring-1 ring-white/10`}
      style={{ width: size, height: size }}
    >
      {isDefault ? (
        /* لوگوی اصلی — SVG متحرک */
        <PersonalityLogo
          src={`/personalities/${p.id}.svg`}
          bgColor={p.color}
          size={size}
          className="pointer-events-none h-full w-full"
        />
      ) : (
        /* بقیه — PNG ساده */
        <img
          src={`/personalities/${p.id}.png`}
          alt={p.label}
          draggable={false}
          className="pointer-events-none h-full w-full object-cover"
          onError={(e) => {
            /* اگه PNG نبود، محو شو تا دایره‌ی گرادینت زیرش دیده بشه */
            (e.currentTarget as HTMLImageElement).style.opacity = "0";
          }}
          style={{
            background: `linear-gradient(135deg, ${p.color}, ${p.accent})`,
          }}
        />
      )}
    </div>
  );
}

export default function PersonalityPicker({
  value,
  onChange,
  disabled = false,
  hideLabel = false,
  avatarSize = 30,
  open,
  onOpenChange,
}: {
  value: PersonalityId;
  onChange: (p: PersonalityId) => void;
  disabled?: boolean;
  hideLabel?: boolean;
  avatarSize?: number;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? (open as boolean) : internalOpen;

  const setOpen = (o: boolean) => {
    if (isControlled) onOpenChange?.(o);
    else setInternalOpen(o);
  };

  const current =
    PERSONALITIES.find((p) => p.id === value) ?? PERSONALITIES[0];

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        className={`group flex items-center rounded-full transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60 ${
          hideLabel ? "p-1.5" : "gap-2 px-2 py-1"
        }`}
        title={current.label}
      >
        <PersonalityAvatar p={current} size={avatarSize} />
        {!hideLabel && (
          <span className="text-[11px] font-medium text-white/60 group-hover:text-white/85">
            {current.label}
          </span>
        )}
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-3 sm:p-6"
              onClick={() => setOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
                className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] shadow-2xl"
              >
                {/* header */}
                <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
                  <h2 className="text-sm font-semibold text-white/95">
                    انتخاب شخصیت
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* list */}
                <div className="flex-1 overflow-y-auto p-2">
                  {PERSONALITIES.map((p) => {
                    const selected = p.id === value;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onChange(p.id);
                          setOpen(false);
                        }}
                        className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-right transition ${
                          selected
                            ? "bg-white/[0.08] ring-1 ring-indigo-500/40"
                            : "hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          <PersonalityAvatar
                            p={p}
                            size={42}
                            rounded="rounded-2xl"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-white/95">
                              {p.label}
                            </span>
                            {selected && (
                              <Check size={16} className="text-emerald-400" />
                            )}
                          </div>
                          <p className="mt-1 text-[11.5px] leading-5 text-white/50">
                            {p.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}