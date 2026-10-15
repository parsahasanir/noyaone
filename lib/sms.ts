export async function sendOtpSms(mobile: string, code: string) {
  const apiKey = process.env.SMSIR_API_KEY;
  const templateId = process.env.SMSIR_TEMPLATE_ID;

  if (!apiKey || !templateId) {
    throw new Error("SMS.ir credentials are not configured.");
  }

  const res = await fetch("https://api.sms.ir/v1/send/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      mobile,
      templateId: Number(templateId),
      parameters: [{ name: "CODE", value: code }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SMS.ir error: ${res.status} ${text}`);
  }

  return res.json();
}