"use client";
import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check, X, Loader2, Tag, ShieldCheck, Coins, Sparkles,
  Zap, Gem, Building2, CreditCard, Receipt, ArrowRight, Lock,
} from "lucide-react";
import { PLAN_DEFS, Plan } from "@/lib/plans";

const PLAN_ICONS: Record<Plan, any> = {
  free: Sparkles,
  silver: Zap,
  diamond: Gem,
  diamond_plus: Building2,
};

/* ---------- درگاه‌ها ---------- */
interface Gateway {
  id: "zarinpal" | "snapppay" | "digipay";
  label: string;
  logo: string;
  description: string;
  /* اگه تعریف شده باشه، فقط برای پلن‌های مجاز قابل استفاده‌ست */
  installment?: {
    allowedPlans: Plan[];
    badge: string;
  };
}

const GATEWAYS: Gateway[] = [
  {
    id: "zarinpal",
    label: "زرین‌پال",
    logo: "/gateways/zarinpal.svg",
    description: "پرداخت امن با کارت بانکی",
  },
  {
    id: "snapppay",
    label: "اسنپ‌پی",
    logo: "/gateways/snapppay.svg",
    description: "پرداخت اعتباری و اقساطی",
    installment: {
      allowedPlans: ["diamond", "diamond_plus"],
      badge: "اقساطی",
    },
  },
  {
    id: "digipay",
    label: "دیجی‌پی",
    logo: "/gateways/digipay.svg",
    description: "پرداخت اعتباری و اقساطی",
    installment: {
      allowedPlans: ["diamond", "diamond_plus"],
      badge: "اقساطی",
    },
  },
];

const VAT_RATE = 0.10; // ۱۰٪

export default function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan") as Plan | null;
  const status = searchParams.get("status");

  const plan = PLAN_DEFS.find((p) => p.id === planId);

  const [selectedGateway, setSelectedGateway] =
    useState<Gateway["id"]>("zarinpal");
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent: number;
  } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [checkingDiscount, setCheckingDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const basePrice = plan?.monthlyPrice ?? 0;
  const discountAmount = appliedDiscount
    ? Math.round((basePrice * appliedDiscount.percent) / 100)
    : 0;
  const finalPrice = basePrice - discountAmount;
  const taxAmount = Math.round(finalPrice * VAT_RATE);
  const totalPrice = finalPrice + taxAmount;

  /* ---------- بررسی دسترسی به درگاه ---------- */
  function isGatewayAvailable(gw: Gateway): boolean {
    if (!gw.installment) return true;
    if (!plan) return false;
    return gw.installment.allowedPlans.includes(plan.id);
  }

  /* اگه کاربر درگاهی رو انتخاب کرده که بعداً غیرمجاز شده، ریست کن */
  function getEffectiveGateway(): Gateway["id"] {
    const gw = GATEWAYS.find((g) => g.id === selectedGateway);
    if (gw && !isGatewayAvailable(gw)) return "zarinpal";
    return selectedGateway;
  }

  /* ---------- اعمال کد تخفیف ---------- */
  async function applyDiscount() {
    setDiscountError("");
    if (!discountCode.trim()) return;
    setCheckingDiscount(true);
    try {
      const res = await fetch("/api/payment/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setDiscountError(data.error ?? "کد تخفیف نامعتبر است.");
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount({ code: data.code, percent: data.percent });
      }
    } catch {
      setDiscountError("خطا در بررسی کد تخفیف.");
    } finally {
      setCheckingDiscount(false);
    }
  }

  function removeDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }

  /* ---------- پرداخت ---------- */
  async function handlePay() {
    if (!plan) return;
    const gwId = getEffectiveGateway();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          gateway: gwId,
          discountCode: appliedDiscount?.code ?? null,
        }),
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError(data.error ?? "خطا در ایجاد تراکنش");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ---------- پرداخت موفق ---------- */
  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-emerald-500/30 bg-[#12121a] p-8 text-center"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-500/20">
            <Check size={28} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">پرداخت موفق</h2>
          <p className="mt-2 text-sm text-white/50">
            پلن {plan?.label} با موفقیت فعال شد.
          </p>
          <button
            onClick={() => router.push("/chat")}
            className="mt-6 w-full rounded-xl bg-emerald-500 py-3 text-sm font-medium text-white hover:bg-emerald-600"
          >
            بازگشت به چت
          </button>
        </motion.div>
      </div>
    );
  }

  /* ---------- پرداخت ناموفق ---------- */
  if (status === "failed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md rounded-2xl border border-red-500/30 bg-[#12121a] p-8 text-center"
        >
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-red-500/20">
            <X size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">پرداخت ناموفق</h2>
          <p className="mt-2 text-sm text-white/50">
            تراکنش انجام نشد. لطفاً دوباره تلاش کن.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-6 w-full rounded-xl bg-white/[0.08] py-3 text-sm font-medium text-white hover:bg-white/[0.12]"
          >
            بازگشت به صفحه قیمت‌ها
          </button>
        </motion.div>
      </div>
    );
  }

  /* ---------- پلن پیدا نشد ---------- */
  if (!plan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#0a0a0c]">
        <p className="text-white/60">پلن پیدا نشد.</p>
        <button
          onClick={() => router.push("/pricing")}
          className="rounded-lg bg-white/[0.08] px-4 py-2 text-sm text-white hover:bg-white/[0.12]"
        >
          مشاهده‌ی پلن‌ها
        </button>
      </div>
    );
  }

  const PlanIcon = PLAN_ICONS[plan.id];
  const effectiveGateway = getEffectiveGateway();
  const showInstallmentHint =
    plan.id === "silver" || plan.id === "free";

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {/* هدر */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <ArrowRight size={16} />
            بازگشت
          </button>
          <h1 className="text-lg font-semibold text-white sm:text-xl">
            تکمیل خرید
          </h1>
          <div className="w-16" />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          {/* ============ ستون چپ ============ */}
          <div className="flex flex-col gap-5">
            {/* پلن */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <PlanIcon size={18} className="text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white/95">
                    پلن انتخابی
                  </h2>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white">
                      پلن {plan.label}
                    </h3>
                    <div className="mt-2 flex items-center gap-2">
                      <Coins size={16} className="text-amber-400" />
                      <span className="text-sm text-white/80">
                        {plan.monthlyCredits.toLocaleString("fa-IR")} کردیت ماهانه
                      </span>
                    </div>
                    <p className="mt-3 text-[12px] leading-6 text-white/50">
                      دسترسی به همه‌ی مدل‌های هوش مصنوعی. هر پیام به اندازه‌ی
                      مصرف واقعی‌اش از اعتبارت کم می‌شود.
                    </p>
                  </div>

                  <div className="shrink-0 rounded-xl bg-white/[0.04] px-4 py-3 text-center">
                    <div className="text-[10px] text-white/40">اعتبار ماهانه</div>
                    <div className="mt-1 text-lg font-bold text-white">
                      {plan.monthlyCredits.toLocaleString("fa-IR")}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span className="text-[12px] text-white/70">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* درگاه پرداخت */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]"
            >
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white/95">
                    درگاه پرداخت
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
                {GATEWAYS.map((gw) => {
                  const active = effectiveGateway === gw.id;
                  const available = isGatewayAvailable(gw);
                  const installmentBadge = gw.installment?.badge;

                  return (
                    <button
                      key={gw.id}
                      type="button"
                      onClick={() => {
                        if (!available) return;
                        setSelectedGateway(gw.id);
                      }}
                      disabled={!available}
                      className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all ${
                        !available
                          ? "cursor-not-allowed border-white/[0.04] bg-white/[0.01] opacity-50"
                          : active
                          ? "border-indigo-500 bg-indigo-500/[0.08] shadow-[0_0_0_3px_rgba(99,102,241,0.1)]"
                          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.16] hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* رادیو */}
                      <div
                        className={`absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full border-2 transition ${
                          active && available
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-white/20"
                        }`}
                      >
                        {active && available && (
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        )}
                        {!available && (
                          <Lock size={9} className="text-white/40" />
                        )}
                      </div>

                      {/* بج اقساطی */}
                      {installmentBadge && available && (
                        <div className="absolute left-2 top-2 rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                          {installmentBadge}
                        </div>
                      )}

                      <div className="grid h-12 w-20 place-items-center overflow-hidden rounded-lg bg-white/[0.04]">
                        <img
                          src={gw.logo}
                          alt={gw.label}
                          className="max-h-8 max-w-16 object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>

                      <div className="text-center">
                        <div className="text-[13px] font-semibold text-white/95">
                          {gw.label}
                        </div>
                        <div className="mt-0.5 text-[10.5px] leading-4 text-white/45">
                          {gw.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* توضیح درگاه‌های قفل */}
              {showInstallmentHint && (
                <div className="mx-5 mb-3 rounded-lg border border-amber-500/20 bg-amber-500/[0.05] px-3 py-2.5">
                  <p className="text-[11px] leading-5 text-amber-200/90">
                    💎 پرداخت اقساطی با اسنپ‌پی و دیجی‌پی فقط برای پلن‌های{" "}
                    <span className="font-semibold">الماس</span> و{" "}
                    <span className="font-semibold">الماس آبی</span> در دسترسه.
                    برای استفاده از این امکان، پلنت رو ارتقا بده.
                  </p>
                </div>
              )}

              {/* امنیت */}
              <div className="flex items-center justify-center gap-2 border-t border-white/[0.06] px-5 py-3">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span className="text-[11px] text-white/50">
                  پرداخت امن و رمزنگاری‌شده — اطلاعات کارت شما نزد ما ذخیره نمی‌شود
                </span>
              </div>
            </motion.div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-center text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* ============ ستون راست: فاکتور ============ */}
          <motion.aside
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:sticky lg:top-8 lg:self-start"
          >
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]">
              <div className="border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-indigo-400" />
                  <h2 className="text-sm font-semibold text-white/95">
                    فاکتور نهایی
                  </h2>
                </div>
              </div>

              <div className="space-y-3 p-5">
                {/* پلن */}
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-white/60">
                    پلن {plan.label}
                  </span>
                  <span className="text-[12.5px] font-medium text-white/90">
                    {basePrice.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                {/* تخفیف */}
                {appliedDiscount && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[12.5px] text-emerald-400">
                      <Tag size={12} />
                      تخفیف ({appliedDiscount.percent}٪)
                    </span>
                    <span className="text-[12.5px] font-medium text-emerald-400">
                      −{discountAmount.toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                )}

                {/* مالیات */}
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-white/60">
                    مالیات بر ارزش افزوده (۱۰٪)
                  </span>
                  <span className="text-[12.5px] font-medium text-white/90">
                    {taxAmount.toLocaleString("fa-IR")} تومان
                  </span>
                </div>

                <div className="my-2 h-px bg-white/[0.06]" />

                {/* کد تخفیف */}
                <div>
                  <label className="mb-1.5 block text-[11px] text-white/50">
                    کد تخفیف
                  </label>

                  {appliedDiscount ? (
                    <div className="flex items-center justify-between rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-emerald-400" />
                        <span className="text-[12px] font-medium text-emerald-300">
                          {appliedDiscount.code}
                        </span>
                      </div>
                      <button
                        onClick={removeDiscount}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        حذف
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyDiscount();
                        }}
                        placeholder="مثلا NOYA20"
                        className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] outline-none placeholder:text-white/25 focus:border-indigo-500/40"
                        dir="ltr"
                      />
                      <button
                        onClick={applyDiscount}
                        disabled={checkingDiscount || !discountCode.trim()}
                        className="shrink-0 rounded-lg bg-white/[0.06] px-3 py-2 text-[11.5px] font-medium text-white/80 transition hover:bg-white/[0.1] disabled:opacity-40"
                      >
                        {checkingDiscount ? "..." : "اعمال"}
                      </button>
                    </div>
                  )}

                  {discountError && (
                    <p className="mt-1.5 text-[11px] text-red-400">
                      {discountError}
                    </p>
                  )}
                </div>

                <div className="my-2 h-px bg-white/[0.06]" />

                {/* مبلغ کل */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-white">
                    مبلغ قابل پرداخت
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">
                      {totalPrice.toLocaleString("fa-IR")}
                    </div>
                    <div className="text-[10px] text-white/40">تومان</div>
                  </div>
                </div>

                {/* دکمه پرداخت */}
                <button
                  onClick={handlePay}
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      در حال انتقال…
                    </>
                  ) : (
                    <>
                      <CreditCard size={16} />
                      پرداخت {totalPrice.toLocaleString("fa-IR")} تومان
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10.5px] leading-5 text-white/30">
                  با کلیک روی دکمه‌ی پرداخت، به درگاه{" "}
                  {GATEWAYS.find((g) => g.id === effectiveGateway)?.label} منتقل
                  می‌شوی.
                </p>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}