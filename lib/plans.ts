export type Plan = "free" | "silver" | "diamond" | "diamond_plus";

export type ModelId =
  | "gemma" | "glm-flash" | "gpt-5-nano" | "gpt-5.4-nano"
  | "deepseek-v3" | "llama-70b" | "minimax" | "o4-mini"
  | "kimi-code" | "gpt-5.2-codex" | "gpt-oss-120b";

export interface ModelDef {
  id: ModelId;
  label: string;
  arvanModel: string;
  description: string;
  creditMultiplier: number;
  avgTokensPerMessage: number;
}

export const MODELS: ModelDef[] = [
  { id: "gpt-5-nano", label: "GPT-5 Nano", arvanModel: "GPT-5-Nano",
    description: "سریع‌ترین و ارزان‌ترین", creditMultiplier: 1, avgTokensPerMessage: 1500 },
  { id: "glm-flash", label: "GLM 5.3 Flash", arvanModel: "GLM-5.3-Flash",
    description: "سبک و سریع", creditMultiplier: 1, avgTokensPerMessage: 1500 },
  { id: "gemma", label: "Gemma 4 31B", arvanModel: "Gemma-4-31B-IT",
    description: "سبک گوگل، مناسب روزمره", creditMultiplier: 1.5, avgTokensPerMessage: 1500 },
  { id: "gpt-5.4-nano", label: "GPT-5.4 Nano", arvanModel: "GPT-5.4-Nano",
    description: "نسخه جدید و دقیق‌تر", creditMultiplier: 3, avgTokensPerMessage: 1500 },
  { id: "llama-70b", label: "Llama 3.3 70B", arvanModel: "Llama-3.3-70B-Instruct",
    description: "متن‌باز قدرتمند متا", creditMultiplier: 3, avgTokensPerMessage: 1500 },
  { id: "deepseek-v3", label: "DeepSeek V3.1", arvanModel: "DeepSeek-V3.1",
    description: "قوی در کد و استدلال", creditMultiplier: 3, avgTokensPerMessage: 1500 },
  { id: "minimax", label: "MiniMax M2.7", arvanModel: "MiniMax-M2.7",
    description: "سریع و متعادل", creditMultiplier: 4, avgTokensPerMessage: 1500 },
  { id: "o4-mini", label: "O4 Mini", arvanModel: "O4-Mini",
    description: "استدلالی، ریاضی و منطق", creditMultiplier: 5, avgTokensPerMessage: 1500 },
  { id: "gpt-oss-120b", label: "GPT-OSS 120B", arvanModel: "GPT-OSS-120B",
    description: "متن‌باز حجیم و قوی", creditMultiplier: 8, avgTokensPerMessage: 1500 },
  { id: "kimi-code", label: "Kimi K2.7 Code", arvanModel: "Kimi-K2.7-Code",
    description: "تخصصی کدنویسی", creditMultiplier: 8, avgTokensPerMessage: 1500 },
  { id: "gpt-5.2-codex", label: "GPT-5.2 Codex", arvanModel: "GPT-5.2-Codex",
    description: "دقیق‌ترین برای کد", creditMultiplier: 10, avgTokensPerMessage: 1500 },
];

export interface PlanDef {
  id: Plan;
  label: string;
  monthlyPrice: number;
  monthlyCredits: number;
  maxTokensPerRequest: number;
  features: string[];
  highlight?: boolean;
  badge?: string;
  approxMessages: number;
}

export const PLAN_DEFS: PlanDef[] = [
  {
    id: "free",
    label: "رایگان",
    monthlyPrice: 0,
    monthlyCredits: 100,
    maxTokensPerRequest: 2_000,
    approxMessages: 65,
    features: [
      "دسترسی به همه‌ی مدل‌ها",
      "۱۰۰ کردیت هدیه",
      "گفتگوی متنی",
      "تاریخچه‌ی چت",
    ],
  },
  {
    id: "silver",
    label: "نقره‌ای",
    monthlyPrice: 149_000,
    monthlyCredits: 500,
    maxTokensPerRequest: 8_000,
    approxMessages: 330,
    features: [
      "دسترسی به همه‌ی مدل‌ها",
      "۵۰۰ کردیت در ماه",
      "آپلود فایل و عکس",
      "حالت گفتار به متن",
      "پاسخ‌های طولانی‌تر",
    ],
    highlight: true,
    badge: "پیشنهاد ما",
  },
  {
    id: "diamond",
    label: "الماس",
    monthlyPrice: 499_000,
    monthlyCredits: 2_000,
    maxTokensPerRequest: 16_000,
    approxMessages: 1_300,
    features: [
      "دسترسی به همه‌ی مدل‌ها",
      "۲٬۰۰۰ کردیت در ماه",
      "مدل‌های استدلالی",
      "پاسخ‌های طولانی",
      "پشتیبانی اولویت‌دار",
    ],
  },
  {
    id: "diamond_plus",
    label: "الماس آبی",
    monthlyPrice: 999_000,
    monthlyCredits: 5_000,
    maxTokensPerRequest: 32_000,
    approxMessages: 3_300,
    features: [
      "دسترسی به همه‌ی مدل‌ها",
      "۵٬۰۰۰ کردیت در ماه",
      "API اختصاصی",
      "بدون محدودیت نرخ",
      "پشتیبانی VIP",
    ],
  },
];

export function getPlanDef(id: Plan): PlanDef {
  return PLAN_DEFS.find((p) => p.id === id) ?? PLAN_DEFS[0];
}
export function isModelAllowed(_plan: Plan, _modelId: ModelId) {
  return true;
}
export function getModelDef(modelId: ModelId) {
  return MODELS.find((m) => m.id === modelId);
}

export function calculateCredits(modelId: ModelId, totalTokens: number) {
  const m = getModelDef(modelId);
  if (!m) return 0;
  return Math.ceil((totalTokens / 1000) * m.creditMultiplier);
}

export function estimateMessages(credits: number, modelId: ModelId) {
  const m = getModelDef(modelId);
  if (!m) return 0;
  const creditsPerMsg = Math.ceil(
    (m.avgTokensPerMessage / 1000) * m.creditMultiplier
  );
  return Math.floor(credits / creditsPerMsg);
}

/* قیمت هر کردیت برای نمایش در UI (تومان) */
export const CREDIT_SELL_PRICE = 250;
/* قیمت هر کردیت برای خرید تکی (بسته‌ای) */
export const CREDIT_PACKAGES = [
  { credits: 500,  price: 120_000, bonus: 0,    label: "برنزی" },
  { credits: 2000, price: 440_000, bonus: 100,  label: "نقره‌ای" },
  { credits: 5000, price: 1_000_000, bonus: 500, label: "الماس" },
];