import { auth } from "@/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  return NextResponse.json({
    session,
    cookies: allCookies.map((c) => ({
      name: c.name,
      value: c.value.slice(0, 20) + "...",
    })),
    env: {
      AUTH_URL: process.env.AUTH_URL ?? null,
      hasSecret: !!process.env.AUTH_SECRET,
      hasGoogleId: !!process.env.AUTH_GOOGLE_ID,
    },
  });
}