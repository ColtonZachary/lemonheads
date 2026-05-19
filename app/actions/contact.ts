"use server";

import { z } from "zod";

import { renderContactEmail } from "@/lib/email-templates";
import { FROM_EMAIL, TO_EMAIL, getResend } from "@/lib/resend";

const ContactSchema = z.object({
  name: z.string().min(2, "Please tell us your name."),
  email: z.string().email("Please enter a valid email."),
  phone: z.string().optional().default(""),
  topic: z.string().min(1, "Please pick a topic."),
  message: z.string().min(10, "Tell us a little more (10+ characters)."),
  /** Honeypot — must be empty */
  website: z.string().max(0).optional().default(""),
});

export type ContactState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Record<string, string[]>;
    }
  | { status: "success" };

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    topic: formData.get("topic"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please check the form and try again.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const data = parsed.data;
  const resend = getResend();

  try {
    if (!resend) {
      console.log("[contact] would send →", data);
      return { status: "success" };
    }

    await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: data.email,
      subject: `Contact · ${data.topic} · ${data.name}`,
      html: renderContactEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        topic: data.topic,
        message: data.message,
      }),
    });

    return { status: "success" };
  } catch (err) {
    console.error("[contact] resend error", err);
    return {
      status: "error",
      message:
        "We couldn't send your message. Please email info@lemonheadsdetail.com directly.",
    };
  }
}
