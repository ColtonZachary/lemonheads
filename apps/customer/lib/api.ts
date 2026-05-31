function apiBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Use http://localhost:3000 on simulator, or http://YOUR_MAC_IP:3000 on a physical phone.",
    );
  }
  return base;
}

function networkErrorMessage(url: string, err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (!/network request failed|failed to fetch|could not connect/i.test(msg)) {
    return msg;
  }
  const isLocalhost = /localhost|127\.0\.0\.1/.test(url);
  if (isLocalhost) {
    return (
      "Cannot reach the website API at localhost. On a real phone, set EXPO_PUBLIC_API_URL " +
      "in apps/customer/.env to your Mac's Wi‑Fi IP, then restart Expo."
    );
  }
  return `Cannot reach ${url}. Is npm run dev running? Phone and Mac must be on the same Wi‑Fi.`;
}

async function apiFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new Error(networkErrorMessage(url, err));
  }
}

export async function apiGet<T>(path: string, accessToken?: string): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await apiFetch(url, { headers });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof body === "object" && body && "error" in body && body.error
        ? String(body.error)
        : `Request failed (${res.status})`,
    );
  }
  return body as T;
}

export async function apiGetPublic<T>(path: string): Promise<T> {
  return apiGet<T>(path);
}

export async function apiPost<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const res = await apiFetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const parsed = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof parsed === "object" && parsed && "error" in parsed && parsed.error
        ? String(parsed.error)
        : `Request failed (${res.status})`,
    );
  }
  return parsed as T;
}

export async function apiPatch<T>(
  path: string,
  body: unknown,
  accessToken: string,
): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const res = await apiFetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
  const parsed = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof parsed === "object" && parsed && "error" in parsed && parsed.error
        ? String(parsed.error)
        : `Request failed (${res.status})`,
    );
  }
  return parsed as T;
}

export async function apiDelete(path: string, accessToken: string): Promise<void> {
  const url = `${apiBaseUrl()}${path}`;
  const res = await apiFetch(url, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const parsed = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(
      typeof parsed === "object" && parsed && "error" in parsed && parsed.error
        ? String(parsed.error)
        : `Request failed (${res.status})`,
    );
  }
}

export async function apiPostPublic<T>(path: string, body: unknown): Promise<T> {
  return apiPost<T>(path, body);
}
