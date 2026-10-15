import { ModelId } from "./plans";

/* هر ۱ کرِدیت = چند تومان هزینهی واقعی برای ما */
/* بر اساس: هزینهی GPT-5-Nano حدود ۷۶ ریال = ۷.۶ تومان برای یک پیام معمولی */
export const TOMAN_PER_CREDIT = 10;

/* قیمت فروش هر کرِدیت (تومان) */
export const CREDIT_SELL_PRICE = 99;

export interface ModelCreditCost {
  id: ModelId;
  label: string;
  creditsPerMessage: number;
  costToUs: number; // تومان
  example: string;
}

/* مصرف تقریبی هر پیام با هر مدل (بر اساس پیام ۵۰۰ توکن ورودی + ۵۰۰ توکن خروجی) */
export const MODEL_CREDIT_TABLE: ModelCreditCost[] = [
  {
    id: "gpt-5-nano",
    label: "GPT-5 Nano",
    creditsPerMessage: 1,
    costToUs: 8,
    example: "پاسخ کوتاه، خلاصهسازی، ترجمه",
  },
  {
    id: "gemma",
    label: "Gemma 4 31B",
    creditsPerMessage: 2,
    costToUs: 15,
    example: "گفتگوی روزمره، پرسش و پاسخ",
  },
  {
    id: "glm-flash",
    label: "GLM 5.3 Flash",
    creditsPerMessage: 2,
    costToUs: 18,
    example: "پاسخ سریع، کارهای سبک",
  },
  {
    id: "gpt-5.4-nano",
    label: "GPT-5.4 Nano",
    creditsPerMessage: 3,
    costToUs: 25,
    example: "پاسخ دقیقتر، تحلیل ساده",
  },
  {
    id: "deepseek-v3",
    label: "DeepSeek V3.1",
    creditsPerMessage: 5,
    costToUs: 45,
    example: "کدنویسی، استدلال، تحلیل عمیق",
  },
  {
    id: "llama-70b",
    label: "Llama 3.3 70B",
    creditsPerMessage: 4,
    costToUs: 38,
    example: "محتوای طولانی، مقاله",
  },
  {
    id: "minimax",
    label: "MiniMax M2.7",
    creditsPerMessage: 4,
    costToUs: 35,
    example: "گفتگوی متعادل، خلاقیت",
  },
  {
    id: "o4-mini",
    label: "O4 Mini",
    creditsPerMessage: 6,
    costToUs: 55,
    example: "ریاضی، منطق، استدلال",
  },
  {
    id: "kimi-code",
    label: "Kimi K2.7 Code",
    creditsPerMessage: 8,
    costToUs: 75,
    example: "کدنویسی تخصصی، دیباگ",
  },
  {
    id: "gpt-5.2-codex",
    label: "GPT-5.2 Codex",
    creditsPerMessage: 10,
    costToUs: 95,
    example: "پروژههای کد بزرگ",
  },
  {
    id: "gpt-oss-120b",
    label: "GPT-OSS 120B",
    creditsPerMessage: 9,
    costToUs: 85,
    example: "تحلیل سنگین، محتوای تخصصی",
  },
];

export function getModelCredit(modelId: ModelId): ModelCreditCost {
  return (
    MODEL_CREDIT_TABLE.find((m) => m.id === modelId) ??
    MODEL_CREDIT_TABLE[0]
  );
}

/* تعداد پیام تقریبی در هر پلن بر اساس مدل پیشفرض */
export function estimateMessagesPerPlan(
  credits: number,
  modelId: ModelId
): number {
  const cost = getModelCredit(modelId).creditsPerMessage;
  return Math.floor(credits / cost);
}