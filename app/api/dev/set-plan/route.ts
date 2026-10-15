// src/app/api/dev/set-plan/route.ts
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { setPlan } from "@/lib/users";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const { plan } = await req.json();
  const userId = session.user.id ?? session.user.email ?? "anon";
  setPlan(userId, plan);
  return Response.json({ ok: true });
}