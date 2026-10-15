import { NextRequest, NextResponse } from "next/server";
import { saveOtp } from "@/lib/otp-store";

export async function POST(req: NextRequest) {
  const { mobile } = await req.json();

  // اعتبارسنجی شماره موبایل
  if (!mobile || !/^09\d{9}$/.test(mobile)) {
    return NextResponse.json(
      { ok: false, error: "شماره موبایل نامعتبر است." },
      { status: 400 }
    );
  }

  // تولید کد ۶ رقمی
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // ذخیره کد در حافظه (برای بررسی در مرحله بعد)
  saveOtp(mobile, code);

  // ارسال پیامک از طریق SMS.ir
  try {
    const res = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/plain",
        "x-api-key": process.env.SMSIR_API_KEY!,
      },
      body: JSON.stringify({
        mobile,
        templateId: Number(process.env.SMSIR_TEMPLATE_ID),
        parameters: [{ name: "CODE", value: code }],
      }),
    });

    const data = await res.json();

    if (!res.ok || data.status !== 1) {
      console.error("[SMS.ir] Error:", data);
      return NextResponse.json(
        { ok: false, error: data.message || "خطا در ارسال پیامک." },
        { status: 500 }
      );
    }

    console.log("[SMS.ir] ✅ OTP sent to", mobile);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[SMS.ir] Fetch error:", e.message);
    return NextResponse.json(
      { ok: false, error: "خطا در ارتباط با سرویس پیامک." },
      { status: 502 }
    );
  }
}