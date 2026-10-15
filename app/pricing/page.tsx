"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check, Sparkles, Crown, Gem, Building2, Coins,
  MessageSquare, Gift, Shield, Smartphone, Star,
} from "lucide-react";
import { PLAN_DEFS, Plan, MODELS } from "@/lib/plans";

const PLAN_ICONS: Record<Plan, any> = {
  free: Sparkles,
  silver: Crown,
  diamond: Gem,
  diamond_plus: Building2,
};

const PLAN_STYLES: Record<Plan, { grad: string; ring: string }> = {
  free:         { grad: "from-zinc-700 to-zinc-800",        ring: "border-white/10" },
  silver:       { grad: "from-slate-400 to-slate-500",      ring: "border-slate-400/50" },
  diamond:      { grad: "from-violet-500 to-fuchsia-500",   ring: "border-violet-500/50" },
  diamond_plus: { grad: "from-cyan-500 to-sky-500",         ring: "border-cyan-500/50" },
};

export default function PricingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-[#0a0a0c]">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] text-amber-300">
            <Gift size={12} />
            یک ماه رایگان با خرید سالانه
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            خرید کردیت
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-[12.5px] leading-6 text-white/50">
            کردیت واحد مصرفی برای استفاده از همه‌ی ابزارهای هوش مصنوعی. هر پیام
            به اندازه‌ی مصرف واقعی‌اش، از اعتبارت کم می‌کنه.{" "}
            <span className="text-white/70">
              همه‌ی پلن‌ها به همه‌ی مدل‌ها دسترسی دارن.
            </span>
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_DEFS.map((plan, i) => {
            const Icon = PLAN_ICONS[plan.id];
            const style = PLAN_STYLES[plan.id];
            const isHighlight = plan.highlight;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-[#12121a] p-5 transition-all ${
                  isHighlight
                    ? `${style.ring} shadow-[0_0_50px_-12px_rgba(99,102,241,0.6)]`
                    : `${style.ring} hover:border-white/[0.16]`
                }`}
              >
                {plan.badge && (
                  <div className="absolute left-0 top-0 rounded-br-2xl bg-gradient-to-r from-indigo-500 to-blue-500 px-3 py-1 text-[10px] font-medium text-white">
                    {plan.badge}
                  </div>
                )}

                <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${style.grad}`}>
                  <Icon size={20} className="text-white" />
                </div>

                <h3 className="text-base font-semibold text-white/95">{plan.label}</h3>

                <div className="mt-3 flex items-center gap-2">
                  <Coins size={22} className="text-amber-400" />
                  <span className="text-2xl font-bold text-white">
                    {plan.monthlyCredits.toLocaleString("fa-IR")}
                  </span>
                  <span className="text-xs text-white/40">کردیت</span>
                </div>

                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">
                    {plan.monthlyPrice === 0 ? "رایگان" : plan.monthlyPrice.toLocaleString("fa-IR")}
                  </span>
                  {plan.monthlyPrice > 0 && (
                    <span className="text-[11px] text-white/40">تومان / ماه</span>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/50">
                  <MessageSquare size={11} />
                  <span>~{plan.approxMessages.toLocaleString("fa-IR")} پیام با مدل سریع</span>
                </div>

                <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-[12px] leading-5 text-white/70">
                      <Check size={13} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    if (plan.id === "free") router.push("/chat");
                    else router.push(`/checkout?plan=${plan.id}`);
                  }}
                  className={`mt-6 w-full rounded-xl py-2.5 text-sm font-medium transition ${
                    isHighlight
                      ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-90"
                      : "bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
                  }`}
                >
                  {plan.id === "free" ? "شروع رایگان" : "خرید این بسته"}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* پیام‌های رایگان روزانه */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#12121a] p-5 sm:flex-row"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <Gift size={20} />
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white/95">پیام‌های رایگان روزانه‌ی شما</div>
              <div className="text-[11px] text-white/40">جدا از اعتبار — ریست روزانه</div>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <div className="text-lg font-bold text-emerald-400">۱۰ پیام رایگان در روز</div>
          </div>
        </motion.div>

        {/* ویژگی‌ها */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {[
            { icon: Star, label: "امتیاز ۴.۶ از کاربران", sub: "کیفیت تضمین‌شده" },
            { icon: Smartphone, label: "بدون محدودیت دستگاه", sub: "روی هر دستگاهی" },
            { icon: Shield, label: "تضمین کیفیت", sub: "بازگشت وجه در صورت نارضایتی" },
          ].map(({ icon: Icon, label, sub }, i) => (
            <div key={i} className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-400">
                <Icon size={22} />
              </div>
              <div className="text-sm font-medium text-white/90">{label}</div>
              <div className="text-[11px] text-white/40">{sub}</div>
            </div>
          ))}
        </motion.div>

        {/* جدول مصرف مدل‌ها */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-14"
        >
          <div className="mb-5 text-center">
            <h2 className="text-lg font-semibold text-white/90">هر مدل چقدر اعتبار مصرف می‌کنه؟</h2>
            <p className="mt-2 text-xs text-white/40">هر ۱٬۰۰۰ توکن = ۱ کردیت × ضریب مدل</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#12121a]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-white/[0.02] text-[11.5px] text-white/50">
                    <th className="px-4 py-3 text-right font-medium">مدل</th>
                    <th className="px-4 py-3 text-right font-medium">ضریب</th>
                    <th className="px-4 py-3 text-right font-medium">کردیت هر پیام*</th>
                    <th className="px-4 py-3 text-right font-medium">مناسب برای</th>
                  </tr>
                </thead>
                <tbody>
                  {MODELS.map((m, i) => {
                    const creditsPerMsg = Math.ceil((m.avgTokensPerMessage / 1000) * m.creditMultiplier);
                    return (
                      <tr key={m.id} className={`text-[12.5px] transition hover:bg-white/[0.02] ${i === MODELS.length - 1 ? "" : "border-b border-white/[0.04]"}`}>
                        <td className="px-4 py-3 font-medium text-white/90">{m.label}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-white/70">{m.creditMultiplier}×</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-[11px] font-medium text-indigo-300">{creditsPerMsg} کردیت</span>
                        </td>
                        <td className="px-4 py-3 text-white/50">{m.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-center text-[11px] leading-6 text-white/30">
            * تخمین بر اساس پیام ۱٬۵۰۰ توکنی (ورودی + خروجی). پیام‌های طولانی‌تر یا تاریخچه‌ی بزرگ، کردیت بیشتری مصرف می‌کنن.
          </p>
        </motion.div>
      </div>
    </div>
  );
}