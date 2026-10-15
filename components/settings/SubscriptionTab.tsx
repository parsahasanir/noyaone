"use client";
import { useMe } from "@/lib/use-me";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Coins, Sparkles, Zap, Gem, Building2, Crown, TrendingUp,
  Clock, ArrowUpRight, Check, History, BarChart3,
} from "lucide-react";
import { PLAN_DEFS, Plan } from "@/lib/plans";

/* ---------- آیکون و رنگ هر پلن ---------- */
const PLAN_STYLE: Record<Plan, {
  icon: any;
  grad: string;
  text: string;
  bg: string;
}> = {
  free: {
    icon: Sparkles,
    grad: "from-zinc-600 to-zinc-700",
    text: "text-zinc-300",
    bg: "bg-zinc-500/15",
  },
  silver: {
    icon: Zap,
    grad: "from-slate-400 to-slate-500",
    text: "text-slate-200",
    bg: "bg-slate-400/15",
  },
  diamond: {
    icon: Gem,
    grad: "from-violet-500 to-fuchsia-500",
    text: "text-violet-300",
    bg: "bg-violet-500/15",
  },
  diamond_plus: {
    icon: Building2,
    grad: "from-cyan-500 to-sky-500",
    text: "text-cyan-300",
    bg: "bg-cyan-500/15",
  },
};

export default function SubscriptionTab() {
  const { me, loading } = useMe();
  const { chats } = useStore();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex flex-1 items-center justify-center p-10 text-white/50">
        اطلاعات اشتراک در دسترس نیست.
      </div>
    );
  }

  const plan = PLAN_DEFS.find((p) => p.id === me.plan) ?? PLAN_DEFS[0];
  const style = PLAN_STYLE[me.plan];
  const Icon = style.icon;

  const usedPercent = Math.min(
    100,
    (me.usedCredits / me.monthlyCredits) * 100
  );
  const remainingPercent = 100 - usedPercent;

  /* پلن بعدی */
  const planIndex = PLAN_DEFS.findIndex((p) => p.id === me.plan);
  const nextPlan = PLAN_DEFS[planIndex + 1] ?? null;

  /* چند پیام دیگه می‌تونه بفرسته */
  const avgCreditsPerMsg = 3; // تخمین با مدل متوسط
  const remainingMessages = Math.floor(me.remaining / avgCreditsPerMsg);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
      {/* ═══════════ کارت پلن فعلی ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f0f14] p-5"
      >
        {/* گرادینت پس‌زمینه */}
        <div
          className={`pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br ${style.grad} opacity-[0.13] blur-3xl`}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${style.grad} shadow-lg`}
              >
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-white/45">پلن فعلی</span>
                  {me.plan !== "free" && (
                    <span className="rounded-md bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
                      فعال
                    </span>
                  )}
                </div>
                <h3 className="mt-0.5 text-lg font-bold text-white">
                  {plan.label}
                </h3>
              </div>
            </div>

            {me.plan !== "free" && (
              <button
                onClick={() => router.push("/pricing")}
                className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/[0.1] hover:text-white"
              >
                <ArrowUpRight size={12} />
                مدیریت
              </button>
            )}
          </div>

          {/* آمار */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
                <Coins size={10} />
                اعتبار کل
              </div>
              <div className="mt-1.5 text-base font-bold text-white">
                {me.monthlyCredits.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
                <TrendingUp size={10} />
                مصرف‌شده
              </div>
              <div className="mt-1.5 text-base font-bold text-amber-400">
                {me.usedCredits.toLocaleString("fa-IR")}
              </div>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-[10px] text-white/40">
                <Sparkles size={10} />
                باقی‌مانده
              </div>
              <div className="mt-1.5 text-base font-bold text-emerald-400">
                {me.remaining.toLocaleString("fa-IR")}
              </div>
            </div>
          </div>

          {/* نوار پیشرفت */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-[11px]">
              <span className="text-white/50">
                {remainingPercent.toFixed(0)}٪ از اعتبارت باقی مونده
              </span>
              <span className="text-white/40">
                ~{remainingMessages.toLocaleString("fa-IR")} پیام دیگه
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${usedPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${
                  usedPercent > 85
                    ? "from-amber-500 to-red-500"
                    : usedPercent > 60
                    ? "from-amber-400 to-orange-500"
                    : "from-emerald-500 to-emerald-400"
                }`}
              />
            </div>
          </div>

          {/* هشدار اتمام اعتبار */}
          {usedPercent > 85 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/[0.06] px-3 py-2.5">
              <Clock size={13} className="mt-0.5 shrink-0 text-amber-400" />
              <p className="text-[11px] leading-5 text-amber-200/90">
                اعتبارت داره تموم می‌شه. برای ادامه‌ی استفاده، پلنت رو ارتقا
                بده یا کردیت بیشتری خریداری کن.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══════════ مصرف این ماه ═══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.08] bg-[#0f0f14] p-4"
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-indigo-400" />
          <h3 className="text-sm font-semibold text-white/90">
            گزارش مصرف
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Stat
            label="گفتگوها"
            value={chats.length.toLocaleString("fa-IR")}
          />
          <Stat
            label="حداکثر توکن در هر درخواست"
            value={me.maxTokensPerRequest.toLocaleString("fa-IR")}
          />
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-2">
            <History size={13} className="text-white/40" />
            <span className="text-[11.5px] text-white/60">
              تاریخچه‌ی کامل تراکنش‌ها
            </span>
          </div>
          <button className="text-[11px] text-indigo-400 hover:text-indigo-300">
            مشاهده
          </button>
        </div>
      </motion.div>

      {/* ═══════════ ارتقا به پلن بعدی ═══════════ */}
      {nextPlan && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/[0.08] to-blue-500/[0.04] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500">
              <Crown size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  ارتقا به {nextPlan.label}
                </h4>
                <span className="rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                  {(
                    (nextPlan.monthlyCredits - plan.monthlyCredits)
                  ).toLocaleString("fa-IR")}{" "}
                  کردیت بیشتر
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-5 text-white/55">
                فقط{" "}
                <span className="font-medium text-white/85">
                  {(
                    nextPlan.monthlyPrice - plan.monthlyPrice
                  ).toLocaleString("fa-IR")}
                </span>{" "}
                تومان بیشتر در ماه، {nextPlan.monthlyCredits.toLocaleString("fa-IR")}{" "}
                کردیت دریافت کن.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {nextPlan.features.slice(0, 3).map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-1 text-[10px] text-white/60"
                  >
                    <Check size={10} className="text-emerald-400" />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push(`/checkout?plan=${nextPlan.id}`)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            <ArrowUpRight size={14} />
            ارتقا به {nextPlan.label}
          </button>
        </motion.div>
      )}

      {/* ═══════════ پلن رایگان: فقط دکمه‌ی خرید ═══════════ */}
      {me.plan === "free" && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.08] bg-[#0f0f14] p-4 text-center"
        >
          <Sparkles size={22} className="mx-auto text-amber-400" />
          <h4 className="mt-2 text-sm font-semibold text-white/90">
            هنوز پلن فعالی نداری
          </h4>
          <p className="mt-1.5 text-[11.5px] leading-5 text-white/50">
            با خرید یکی از پلن‌ها، به همه‌ی مدل‌ها دسترسی پیدا کن و کردیت
            ماهانه دریافت کن.
          </p>
          <button
            onClick={() => router.push("/pricing")}
            className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          >
            مشاهده‌ی پلن‌ها
          </button>
        </motion.div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
      <div className="text-[10px] text-white/40">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/90">{value}</div>
    </div>
  );
}