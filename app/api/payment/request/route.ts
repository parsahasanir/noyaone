import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getPlanDef, Plan } from "@/lib/plans";

const DISCOUNTS: Record<string, number> = {
  NOYA20: 20,
  NOYA10: 10,
  WELCOME: 15,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { planId, gateway = "zarinpal", discountCode } = body;

  const plan = getPlanDef(planId as Plan);
  if (!plan || plan.monthlyPrice <= 0) {
    return Response.json({ error: "پلن نامعتبر" }, { status: 400 });
  }

  const basePrice = plan.monthlyPrice;
  const discountPercent = discountCode
    ? DISCOUNTS[String(discountCode).toUpperCase()] ?? 0
    : 0;
  const discounted = basePrice - Math.round((basePrice * discountPercent) / 100);
  const withTax = Math.round(discounted * 1.10);
  const amountRial = withTax * 10;

  /* 👇 آدرس داینامیک بر اساس host درخواست */
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const callbackUrl = `${origin}/api/payment/verify?plan=${planId}&gateway=${gateway}`;

  if (gateway === "zarinpal") {
    return await requestZarinpal({
      merchantId: process.env.ZARINPAL_MERCHANT_ID!,
      amountRial,
      callbackUrl,
      description: `خرید پلن ${plan.label} نویا وان`,
      mobile: (session.user as any).phone ?? "",
      email: session.user.email ?? "",
    });
  }

  if (gateway === "snapppay") {
    return await requestSnappPay({
      amountRial,
      callbackUrl,
      description: `خرید پلن ${plan.label}`,
    });
  }

  if (gateway === "digipay") {
    return await requestDigiPay({
      amountRial,
      callbackUrl,
      description: `خرید پلن ${plan.label}`,
    });
  }

  return Response.json({ error: "درگاه نامعتبر" }, { status: 400 });
}

async function requestZarinpal(opts: {
  merchantId: string;
  amountRial: number;
  callbackUrl: string;
  description: string;
  mobile?: string;
  email?: string;
}) {
  try {
    const res = await fetch(
      "https://payment.zarinpal.com/pg/v4/payment/request.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          merchant_id: opts.merchantId,
          amount: opts.amountRial,
          currency: "IRR",
          description: opts.description,
          callback_url: opts.callbackUrl,
          metadata: {
            mobile: opts.mobile,
            email: opts.email,
          },
        }),
      }
    );
    const data = await res.json();
    if (data?.data?.code !== 100) {
      return Response.json(
        { error: data?.errors?.[0]?.message ?? "خطا از زرین‌پال" },
        { status: 502 }
      );
    }
    return Response.json({
      redirectUrl: `https://payment.zarinpal.com/pg/StartPay/${data.data.authority}`,
      authority: data.data.authority,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 502 });
  }
}

async function requestSnappPay(_: any) {
  return Response.json(
    { error: "درگاه اسنپ‌پی هنوز پیکربندی نشده است." },
    { status: 501 }
  );
}

async function requestDigiPay(_: any) {
  return Response.json(
    { error: "درگاه دیجی‌پی هنوز پیکربندی نشده است." },
    { status: 501 }
  );
}