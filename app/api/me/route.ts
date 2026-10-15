import { auth } from "@/auth";
import { getOrCreateUser, remainingCredits } from "@/lib/users";
import { getPlanDef } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const userId =
    (session.user as any).id ?? session.user.email ?? "anon";
  const user = getOrCreateUser(userId);
  const plan = getPlanDef(user.plan);
  const remaining = remainingCredits(userId, plan.monthlyCredits);

  return Response.json({
    plan: user.plan,
    planLabel: plan.label,
    usedCredits: user.usedCredits,
    monthlyCredits: plan.monthlyCredits,
    remaining,
    maxTokensPerRequest: plan.maxTokensPerRequest,
  });
}