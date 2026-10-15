"use client";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";

export default function CreditBadge() {
  const { credits } = useStore();
  const max = 1000;
  const pct = Math.min(100, (credits / max) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
    >
      <div className="flex items-center justify-between text-xs text-white/50">
        <span>اعتبار باقی‌مانده</span>
        <span className="font-semibold text-white/90">
          {credits.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        />
      </div>
    </motion.div>
  );
}