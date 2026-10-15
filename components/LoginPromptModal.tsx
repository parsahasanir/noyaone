"use client";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, X, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPromptModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const goLogin = () => {
    onClose();
    router.push("/login");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-0 z-[401] flex items-center justify-center p-4"
            onClick={onClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
              className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] p-6 text-center shadow-2xl"
            >
              <button
                onClick={onClose}
                className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/20">
                <ShieldCheck size={26} className="text-white" />
              </div>

              <h2 className="text-base font-semibold text-white/95">
                اول وارد حساب شو
              </h2>
              <p className="mt-2 text-xs leading-6 text-white/50">
                برای ارسال پیام و استفاده از هوش مصنوعی، لازمه اول با شماره
                موبایل یا حساب گوگل وارد بشی.
              </p>

              <button
                onClick={goLogin}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                <LogIn size={16} />
                ورود / ثبت‌نام
              </button>

              <button
                onClick={onClose}
                className="mt-2 w-full rounded-xl py-2 text-xs text-white/50 transition hover:text-white/80"
              >
                بعداً
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}