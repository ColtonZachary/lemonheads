/** Canonical app origin for auth redirects (hub + /book on Vercel). */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const vercel = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (vercel) return `https://${vercel}`;

  return "";
}

export function authRedirectPath(path: string): string {
  const base = getAppBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
