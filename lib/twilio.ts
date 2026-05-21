export type TwilioConfig = {
  accountSid: string;
  authToken: string;
  from: string;
};

let warned = false;

export function getTwilioConfig(): TwilioConfig | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from =
    process.env.TWILIO_FROM_NUMBER?.trim() ??
    process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();

  if (!accountSid || !authToken || !from) {
    if (!warned) {
      console.warn(
        "[twilio] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER (or TWILIO_MESSAGING_SERVICE_SID) required — SMS logged only.",
      );
      warned = true;
    }
    return null;
  }

  return { accountSid, authToken, from };
}

/** US-focused E.164 for Twilio (10-digit or leading 1). */
export function normalizeSmsRecipient(phone: string): string | null {
  const trimmed = phone.trim();
  if (trimmed.startsWith("+")) {
    const digits = trimmed.replace(/\D/g, "");
    if (digits.length >= 10) return `+${digits}`;
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendTwilioSms(
  to: string,
  body: string,
): Promise<{ sid: string }> {
  const config = getTwilioConfig();
  if (!config) {
    throw new Error("Twilio is not configured.");
  }

  const params = new URLSearchParams({ To: to, Body: body });
  if (config.from.startsWith("MG")) {
    params.set("MessagingServiceSid", config.from);
  } else {
    params.set("From", config.from);
  }

  const auth = Buffer.from(
    `${config.accountSid}:${config.authToken}`,
  ).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  const data = (await res.json()) as { sid?: string; message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? `Twilio HTTP ${res.status}`);
  }

  if (!data.sid) {
    throw new Error("Twilio did not return a message SID.");
  }

  return { sid: data.sid };
}
