import { NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  getPlanDef,
  getModelDef,
  calculateCredits,
  ModelId,
} from "@/lib/plans";
import { getOrCreateUser, consumeCredits, remainingCredits } from "@/lib/users";
import { estimateMessagesTokens, estimateTokens } from "@/lib/tokens";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "ابتدا وارد شوید." }, { status: 401 });
  }

  const userId =
    (session.user as any).id ?? session.user.email ?? "anon";
  const user = getOrCreateUser(userId);
  const plan = getPlanDef(user.plan);

  const remaining = remainingCredits(userId, plan.monthlyCredits);
  if (remaining <= 0) {
    return Response.json(
      { error: "اعتبارت تموم شده. لطفاً شارژ کن." },
      { status: 402 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "بدنه نامعتبر" }, { status: 400 });
  }

  const messages = body.messages as { role: string; content: string }[];
  const modelId = body.modelId as ModelId;

  const model = getModelDef(modelId);
  if (!model) {
    return Response.json({ error: "مدل نامعتبر است." }, { status: 400 });
  }

  const inputTokens = estimateMessagesTokens(messages);
  const maxOutput = Math.min(plan.maxTokensPerRequest, 4000);

  const endpoint = `${process.env.AI_BASE_URL!.replace(/\/$/, "")}/chat/completions`;

  console.log("[chat] →", {
    model: model.arvanModel,
    inputTokens,
    remaining,
  });

  let upstream: Response;
  try {
    upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `apikey ${process.env.AI_API_KEY}`,
        Connection: "close",
      },
      body: JSON.stringify({
        model: model.arvanModel,
        stream: true,
        messages,
        max_tokens: maxOutput,
        temperature: 0.7,
      }),
      cache: "no-store",
      signal: req.signal,
    });
  } catch (e: any) {
    console.error("[chat] fetch failed:", e?.message);
    return Response.json(
      { error: `اتصال به آروان برقرار نشد: ${e?.message}` },
      { status: 502 }
    );
  }

  console.log("[chat] ← upstream status:", upstream.status);

  if (!upstream.ok || !upstream.body) {
    const txt = await upstream.text().catch(() => "");
    console.error("[chat] upstream error:", upstream.status, txt);
    return Response.json(
      {
        error: "خطا از سمت سرویس هوش مصنوعی",
        status: upstream.status,
        detail: txt.slice(0, 500),
      },
      { status: upstream.status >= 500 ? 502 : upstream.status }
    );
  }

  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let outputTokens = 0;
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data:")) continue;
            const data = t.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const delta = json.choices?.[0]?.delta?.content ?? "";
              if (delta) outputTokens += estimateTokens(delta);
            } catch {}
          }

          controller.enqueue(value);
        }
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error("[chat] stream error:", e?.message);
        }
      } finally {
        try {
          reader.releaseLock();
        } catch {}

        const totalTokens = inputTokens + outputTokens;
        const creditsUsed = calculateCredits(modelId, totalTokens);
        consumeCredits(userId, creditsUsed);

        console.log("[chat] ✅ done", {
          inputTokens,
          outputTokens,
          totalTokens,
          creditsUsed,
        });

        try {
          controller.close();
        } catch {}
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}