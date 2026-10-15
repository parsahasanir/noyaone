"use client";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { chats } = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return chats;
    return chats.filter((c) => {
      if (c.title.toLowerCase().includes(s)) return true;
      return c.messages.some((m) => m.content.toLowerCase().includes(s));
    });
  }, [q, chats]);

  function handleSelect(id: string) {
    router.push(`/chat/${id}`);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 top-[12%] z-[61] mx-auto max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#12121a] shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-white/10 px-3">
              <Search size={16} className="text-white/40" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="جستجو در گفتگوها..."
                className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-white/30"
              />
              <button
                onClick={onClose}
                className="grid h-7 w-7 place-items-center rounded-lg hover:bg-white/[0.06]"
              >
                <X size={16} className="text-white/50" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto py-1">
              {results.length === 0 && (
                <p className="px-4 py-8 text-center text-xs text-white/40">
                  نتیجه‌ای پیدا نشد
                </p>
              )}
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelect(c.id)}
                  className="flex w-full items-center justify-between px-4 py-2.5 text-right transition hover:bg-white/[0.04]"
                >
                  <span className="truncate text-sm text-white/85">
                    {c.title}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {c.messages.length} پیام
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}