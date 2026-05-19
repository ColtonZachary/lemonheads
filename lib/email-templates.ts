/**
 * Lightweight HTML email templates. Kept as plain strings so we don't
 * need react-email as a dependency. They render fine in Gmail / iOS Mail.
 */

const SHELL = (title: string, body: string) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#080808;color:#edeae0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#080808;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#111318;border:1px solid rgba(255,255,255,0.07);border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#080808;padding:20px 28px;border-bottom:1px solid rgba(240,201,58,0.15);">
                <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:22px;letter-spacing:0.1em;color:#F0C93A;">LEMONHEADS</div>
                <div style="font-family:Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.18em;color:rgba(237,234,224,0.5);text-transform:uppercase;margin-top:2px;">Mobile Detail · Notification</div>
              </td>
            </tr>
            <tr><td style="padding:32px 28px;">${body}</td></tr>
            <tr>
              <td style="padding:18px 28px;background:#040404;border-top:1px solid rgba(255,255,255,0.06);font-family:Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.08em;color:rgba(102,102,102,0.7);">
                © ${new Date().getFullYear()} Lemonhead&rsquo;s Mobile Detail
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

function row(label: string, value: string) {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-family:Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.12em;color:#999;text-transform:uppercase;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:14px;color:#edeae0;font-weight:600;">${escapeHtml(value || "—")}</td>
    </tr>
  `;
}

function escapeHtml(input: unknown): string {
  return String(input ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export interface BookingEmailData {
  customerName: string;
  email: string;
  phone: string;
  service: string;
  vehicle: string;
  vehicleInfo: string;
  date: string;
  time: string;
  location: string;
  address: string;
  city: string;
  zip: string;
  requestedDetailer: string;
  addons: string[];
  estimatedTotal: string;
  plasticCondition: string;
  earlyContact: string;
  notes: string;
  cardOnFile: boolean;
}

export function renderBookingEmail(d: BookingEmailData) {
  const body = `
    <h1 style="font-family:'Bebas Neue','Impact',sans-serif;font-size:28px;letter-spacing:0.06em;color:#F0C93A;margin:0 0 6px;">NEW BOOKING REQUEST</h1>
    <p style="margin:0 0 18px;color:rgba(237,234,224,0.6);font-size:13px;">${escapeHtml(d.customerName)} just requested a detail through the website.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Service", d.service)}
      ${row("Vehicle", `${d.vehicle}${d.vehicleInfo ? " — " + d.vehicleInfo : ""}`)}
      ${row("Date / Time", `${d.date} at ${d.time}`)}
      ${row("Location Type", d.location)}
      ${row("Address", [d.address, d.city, d.zip].filter(Boolean).join(", "))}
      ${row("Name", d.customerName)}
      ${row("Phone", d.phone)}
      ${row("Email", d.email)}
      ${row("Requested Detailer", d.requestedDetailer || "No preference")}
      ${row("Add-Ons", d.addons.length ? d.addons.join(", ") : "None")}
      ${row("Plastic Conditioning", d.plasticCondition)}
      ${row("OK for Early Contact", d.earlyContact)}
      ${row(
        "Card on File",
        d.cardOnFile ? "Yes — saved securely via Stripe" : "No",
      )}
      ${row("Special Requests", d.notes || "None")}
    </table>
    <div style="margin-top:24px;padding:16px;background:rgba(240,201,58,0.06);border:1px solid rgba(240,201,58,0.2);border-radius:6px;">
      <div style="font-family:Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.12em;color:rgba(255,255,255,0.6);text-transform:uppercase;">Estimated Total</div>
      <div style="font-family:'Bebas Neue','Impact',sans-serif;font-size:32px;color:#F0C93A;letter-spacing:0.03em;line-height:1;margin-top:4px;">${escapeHtml(d.estimatedTotal)}</div>
    </div>
  `;
  return SHELL("New booking request", body);
}

export function renderBookingConfirmationToCustomer(d: BookingEmailData) {
  const body = `
    <h1 style="font-family:'Bebas Neue','Impact',sans-serif;font-size:30px;letter-spacing:0.06em;color:#F0C93A;margin:0 0 6px;">YOU&rsquo;RE BOOKED!</h1>
    <p style="margin:0 0 18px;color:rgba(237,234,224,0.7);font-size:14px;">Thanks, ${escapeHtml(d.customerName.split(" ")[0])}. We received your booking request and a Lemonhead&rsquo;s team member will reach out shortly to confirm.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Service", d.service)}
      ${row("Vehicle", `${d.vehicle}${d.vehicleInfo ? " — " + d.vehicleInfo : ""}`)}
      ${row("Date / Time", `${d.date} at ${d.time}`)}
      ${row("Location", [d.location, d.address, d.city].filter(Boolean).join(" · "))}
      ${row("Add-Ons", d.addons.length ? d.addons.join(", ") : "None")}
      ${row("Estimated Total", d.estimatedTotal)}
      ${row(
        "Card on File",
        d.cardOnFile ? "Yes — saved securely via Stripe" : "No",
      )}
    </table>
    <p style="margin-top:24px;font-size:13px;color:rgba(237,234,224,0.55);line-height:1.7;">Questions? Reply to this email or call us at <a href="tel:+18335366648" style="color:#F0C93A;text-decoration:none;">833-536-6648</a>.</p>
  `;
  return SHELL("Your Lemonhead's booking", body);
}

export interface ContactEmailData {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  message: string;
}

export function renderContactEmail(d: ContactEmailData) {
  const body = `
    <h1 style="font-family:'Bebas Neue','Impact',sans-serif;font-size:26px;letter-spacing:0.06em;color:#F0C93A;margin:0 0 6px;">NEW MESSAGE</h1>
    <p style="margin:0 0 18px;color:rgba(237,234,224,0.6);font-size:13px;">A new contact form submission came in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${row("Name", d.name)}
      ${row("Email", d.email)}
      ${row("Phone", d.phone || "—")}
      ${row("Topic", d.topic)}
    </table>
    <div style="margin-top:22px;padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:6px;">
      <div style="font-family:Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.12em;color:rgba(255,255,255,0.6);text-transform:uppercase;margin-bottom:8px;">Message</div>
      <div style="font-size:14px;color:#edeae0;white-space:pre-wrap;line-height:1.7;">${escapeHtml(d.message)}</div>
    </div>
  `;
  return SHELL("New contact form submission", body);
}
