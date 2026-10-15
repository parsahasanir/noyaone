"use client";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Step = "phone" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => refs.current[0]?.focus(), 100);
    }
  }, [step]);

  const code = digits.join("");

  async function sendOtp() {
    setError("");
    if (!/^09\d{9}$/.test(mobile)) {
      setError("شماره موبایل را درست وارد کن.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setStep("otp");
      setDigits(["", "", "", "", "", ""]);
      setCountdown(60);
    } catch (e: any) {
      setError(e.message ?? "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    if (code.length !== 6) {
      setError("کد ۶ رقمی را کامل وارد کن.");
      return;
    }
    setLoading(true);
    try {
      const res = await signIn("phone-otp", {
        mobile,
        code,
        redirect: false,
      });
      if (res?.error) {
        setError("کد وارد شده درست نیست.");
        setDigits(["", "", "", "", "", ""]);
        refs.current[0]?.focus();
      } else {
        window.location.href = "/";
      }
    } catch (e: any) {
      setError(e.message ?? "خطای نامشخص");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(
    i: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowRight" && i < 5) {
      refs.current[i + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs.current[Math.min(pasted.length, 6) - 1]?.focus();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#12121a] p-6 sm:p-8"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg shadow-indigo-500/20">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white/95">
            {step === "phone" ? "ورود به نویا وان" : "تایید شماره"}
          </h1>
          <p className="mt-1 text-xs text-white/50">
            {step === "phone"
              ? "با شماره موبایل یا حساب گوگل وارد شو."
              : `کد ۶ رقمی ارسال‌شده به ${mobile} را وارد کن.`}
          </p>
        </div>

        {step === "phone" ? (
          <>
            <label className="mb-2 block text-xs text-white/60">
              شماره موبایل
            </label>
            <input
              dir="ltr"
              inputMode="numeric"
              value={mobile}
              onChange={(e) =>
                setMobile(e.target.value.replace(/\D/g, "").slice(0, 11))
              }
              placeholder="09123456789"
              className="mb-4 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm outline-none transition focus:border-indigo-500/50"
            />

            <button
              onClick={sendOtp}
              disabled={loading || mobile.length !== 11}
              className="mb-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "در حال ارسال..." : "ارسال کد"}
            </button>

            <div className="my-5 flex items-center gap-3 text-xs text-white/30">
              <div className="h-px flex-1 bg-white/10" />
              یا
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm text-white/90 transition hover:bg-white/[0.06]"
            >
              <GoogleIcon />
              ورود با گوگل
            </button>
          </>
        ) : (
          <>
            <div
              dir="ltr"
              className="mb-4 flex items-center justify-center gap-2 sm:gap-3"
            >
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={d}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  maxLength={1}
                  className={`h-12 w-10 rounded-xl border bg-white/[0.03] text-center text-lg font-semibold outline-none transition sm:h-14 sm:w-12 ${
                    d
                      ? "border-indigo-500/60 shadow-[0_0_0_3px_rgba(99,102,241,0.15)]"
                      : "border-white/10 focus:border-indigo-500/60"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={verifyOtp}
              disabled={loading || code.length !== 6}
              className="mb-3 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
            >
              {loading ? "در حال بررسی..." : "ورود"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => {
                  setStep("phone");
                  setDigits(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="flex items-center gap-1 text-white/50 hover:text-white/80"
              >
                <ArrowLeft size={12} />
                تغییر شماره
              </button>

              {countdown > 0 ? (
                <span className="text-white/40">
                  ارسال مجدد در {countdown} ثانیه
                </span>
              ) : (
                <button
                  onClick={sendOtp}
                  disabled={loading}
                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
                >
                  ارسال مجدد کد
                </button>
              )}
            </div>
          </>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 text-center text-xs text-red-400"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l6.2 5.2C40.9 35.6 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}