import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ title: "" }, { status: 401 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ title: "گفتگوی جدید" });
  }

  const fallback = text.slice(0, 40);
  const base = process.env.AI_BASE_URL?.replace(/\/$/, "");
  const key = process.env.AI_API_KEY;
  if (!base || !key) return NextResponse.json({ title: fallback });

  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `apikey ${key}`,
      },
      body: JSON.stringify({
        model: process.env.AI_TITLE_MODEL || "GLM-5.3-Flash",
        messages: [
          {
            role: "system",
            content:
              "یک عنوان کوتاه حداکثر ۴ کلمه‌ای فارسی برای این گفتگو بساز. فقط عنوان، بدون گیومه، بدون توضیح، بدون نقطه.",
          },
          { role: "user", content: text },
        ],
        max_tokens: 30,
        temperature: 0.4,
      }),
    });

    if (!res.ok) return NextResponse.json({ title: fallback });
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const title = raw.replace(/^["'«»]+|["'«»]+$/g, "").slice(0, 50) || fallback;
    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: fallback });
  }
}