import { NextRequest } from "next/server";

/* کدهای تخفیف موجود (در آینده از دیتابیس بخون) */
const DISCOUNTS: Record<string, { percent: number; active: boolean }> = {
  NOYA20: { percent: 20, active: true },
  NOYA10: { percent: 10, active: true },
  WELCOME: { percent: 15, active: true },
};

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return Response.json(
      { ok: false, error: "کد را وارد کن." },
      { status: 400 }
    );
  }

  const normalized = code.trim().toUpperCase();
  const discount = DISCOUNTS[normalized];

  if (!discount || !discount.active) {
    return Response.json(
      { ok: false, error: "کد تخفیف نامعتبر یا منقضی شده است." },
      { status: 400 }
    );
  }

  return Response.json({
    ok: true,
    code: normalized,
    percent: discount.percent,
  });
}