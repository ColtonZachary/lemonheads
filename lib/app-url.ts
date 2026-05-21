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

/** Managers hub sign-in (absolute when app URL is set, else Vercel default). */
export function getHubLoginUrl(): string {
  const base = getAppBaseUrl();
  if (base) return `${base}/login`;
  if (process.env.NODE_ENV === "development") return "/login";
  return "https://lemonheads.vercel.app/login";
}
