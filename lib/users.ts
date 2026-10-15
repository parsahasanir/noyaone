import type { Plan } from "./plans";

interface UserRecord {
  id: string;
  plan: Plan;
  usedCredits: number;
  cycleStart: number;
  allowedModels: string[] | null;
}

const users = new Map<string, UserRecord>();

export function getOrCreateUser(id: string): UserRecord {
  let u = users.get(id);
  if (!u) {
    u = {
      id,
      plan: "free",
      usedCredits: 0,
      cycleStart: Date.now(),
      allowedModels: null,
    };
    users.set(id, u);
  }
  return u;
}

export function consumeCredits(id: string, credits: number) {
  const u = getOrCreateUser(id);
  u.usedCredits += credits;
}

export function setPlan(id: string, plan: Plan) {
  const u = getOrCreateUser(id);
  u.plan = plan;
  u.usedCredits = 0;
  u.cycleStart = Date.now();
}

export function remainingCredits(id: string, monthlyLimit: number) {
  const u = getOrCreateUser(id);
  return Math.max(0, monthlyLimit - u.usedCredits);
}