import { z } from "zod";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" };

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional().default(""),
  topic: z.string().min(1),
  message: z.string().min(10),
  website: z.string().max(0).optional().default(""),
});

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
    return { status: "error", message: "Please check the form and try again." };
  }

  const d = parsed.data;
  const mailto = `mailto:info@lemonheadsdetail.com?subject=${encodeURIComponent(
    `Contact: ${d.topic}`,
  )}&body=${encodeURIComponent(
    `Name: ${d.name}\nEmail: ${d.email}\nPhone: ${d.phone || "—"}\n\n${d.message}`,
  )}`;

  if (typeof window !== "undefined") {
    window.open(mailto, "_blank", "noopener,noreferrer");
  }

  return { status: "success" };
}
