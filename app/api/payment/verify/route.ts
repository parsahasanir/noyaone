import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setPlan, getOrCreateUser } from "@/lib/users";
import { getPlanDef, Plan } from "@/lib/plans";
import { redirect } from "next/navigation";

const DISCOUNTS: Record<string, number> = {
  NOYA20: 20,
  NOYA10: 10,
  WELCOME: 15,
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = req.nextUrl.searchParams;
  const authority = params.get("Authority") ?? params.get("authority");
  const status = params.get("Status") ?? params.get("status");
  const planId = params.get("plan") as Plan;
  const gateway = params.get("gateway") ?? "zarinpal";

  if (status !== "OK" || !authority) {
    redirect("/checkout?status=failed");
  }

  const plan = getPlanDef(planId);
  if (!plan || plan.monthlyPrice <= 0) {
    redirect("/checkout?status=failed");
  }

  /* محاسبه‌ی مبلغ */
  const discountPercent = 0;
  const discounted =
    plan.monthlyPrice - Math.round((plan.monthlyPrice * discountPercent) / 100);
  const withTax = Math.round(discounted * 1.09);
  const amountRial = withTax * 10;

  try {
    if (gateway === "zarinpal") {
      const res = await fetch(
        "https://payment.zarinpal.com/pg/v4/payment/verify.json",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            merchant_id: process.env.ZARINPAL_MERCHANT_ID!,
            amount: amountRial,
            authority,
          }),
        }
      );
      const data = await res.json();
      if (data?.data?.code !== 100 && data?.data?.code !== 101) {
        redirect("/checkout?status=failed");
      }
    } else {
      /* درگاه‌های دیگه: verify مربوطه */
      redirect("/checkout?status=failed");
    }

    const userId = (session.user as any).id ?? session.user.email ?? "anon";
    getOrCreateUser(userId);
    setPlan(userId, planId);

    redirect(`/checkout?status=success&plan=${planId}`);
  } catch {
    redirect("/checkout?status=failed");
  }
}