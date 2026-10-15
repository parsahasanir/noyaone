// تخمین سرانگشتی: هر ۴ کاراکتر ≈ ۱ توکن (برای فارسی کمی بیشتر)
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.5);
}

export function estimateMessagesTokens(
  messages: { role: string; content: string }[]
): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
}