type OtpEntry = { code: string; expiresAt: number };

const store = new Map<string, OtpEntry>();

export function saveOtp(mobile: string, code: string, ttlMs = 2 * 60 * 1000) {
  store.set(mobile, { code, expiresAt: Date.now() + ttlMs });
}

export function verifyOtp(mobile: string, code: string): boolean {
  const entry = store.get(mobile);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    store.delete(mobile);
    return false;
  }
  const ok = entry.code === code;
  if (ok) store.delete(mobile);
  return ok;
}