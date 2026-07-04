import type { SupabaseClient } from "@supabase/supabase-js";

import { formatAuthEmailError } from "@/lib/auth/email-errors";
import {
  renderAuthInviteEmail,
  renderAuthMagicLinkEmail,
} from "@/lib/email-templates";
import { FROM_EMAIL, getResend } from "@/lib/resend";
import { SITE } from "@/lib/site";

export type AuthEmailResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

async function deliverAuthEmail(params: {
  to: string;
  subject: string;
  html: string;
  devLabel: string;
  actionLink: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const resend = getResend();
  if (!resend) {
    console.log(
      `[auth-email] ${params.devLabel} (RESEND_API_KEY not set) →`,
      params.to,
      params.actionLink,
    );
    return { ok: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[auth-email] resend error", error);
      return {
        ok: false,
        message: "Could not send email. Try again in a few minutes.",
      };
    }
    return { ok: true };
  } catch (err) {
    console.error("[auth-email]", err);
    return {
      ok: false,
      message: "Could not send email. Try again in a few minutes.",
    };
  }
}

/** Hub staff invite — generates Supabase invite link, delivers via Resend. */
export async function sendHubInviteAuthEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    redirectTo: string;
    fullName: string;
    role: string;
  },
): Promise<AuthEmailResult> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: params.email,
    options: { redirectTo: params.redirectTo },
  });

  if (error || !data?.user || !data.properties?.action_link) {
    return {
      ok: false,
      message:
        formatAuthEmailError(error?.message ?? "") || "Could not create invite.",
    };
  }

  const delivered = await deliverAuthEmail({
    to: params.email,
    subject: `You're invited to ${SITE.name} hub`,
    html: renderAuthInviteEmail({
      link: data.properties.action_link,
      fullName: params.fullName,
      role: params.role,
    }),
    devLabel: "hub invite",
    actionLink: data.properties.action_link,
  });

  if (!delivered.ok) return delivered;

  return { ok: true, userId: data.user.id };
}

/** Customer magic-link sign-in — generates link, delivers via Resend. */
export async function sendMagicLinkAuthEmail(
  admin: SupabaseClient,
  params: {
    email: string;
    redirectTo: string;
    subject: string;
    intro: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: params.email,
    options: { redirectTo: params.redirectTo },
  });

  if (error || !data?.properties?.action_link) {
    return {
      ok: false,
      message:
        formatAuthEmailError(error?.message ?? "") ||
        "Could not create sign-in link.",
    };
  }

  return deliverAuthEmail({
    to: params.email,
    subject: params.subject,
    html: renderAuthMagicLinkEmail({
      link: data.properties.action_link,
      intro: params.intro,
    }),
    devLabel: "magic link",
    actionLink: data.properties.action_link,
  });
}
