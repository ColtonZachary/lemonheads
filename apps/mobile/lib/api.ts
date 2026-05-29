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
      "in apps/mobile/.env to your Mac's Wi‑Fi IP (e.g. http://192.168.1.42:3000), then restart Expo. " +
      "Also run npm run dev in the project root on the same Wi‑Fi."
    );
  }
  return (
    `Cannot reach ${url}. Is npm run dev running in the project root? Phone and Mac must be on the same Wi‑Fi.`
  );
}

async function apiFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (err) {
    throw new Error(networkErrorMessage(url, err));
  }
}

export async function apiGet<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const res = await apiFetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

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

export async function apiPost<T>(
  path: string,
  accessToken: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const url = `${apiBaseUrl()}${path}`;
  const res = await apiFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

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

export async function apiUploadPhoto(
  bookingId: string,
  phase: "before" | "after",
  uri: string,
  accessToken: string,
): Promise<{
  ok: boolean;
  photo: { id: string; phase: string; url: string };
  photos: { id: string; phase: "before" | "after"; url: string; createdAt: string }[];
  beforeCount: number;
  afterCount: number;
  phase: string;
}> {
  const form = new FormData();
  form.append("phase", phase);
  form.append("file", {
    uri,
    name: `${phase}-${Date.now()}.jpg`,
    type: "image/jpeg",
  } as unknown as Blob);

  const url = `${apiBaseUrl()}/api/mobile/employee/jobs/${bookingId}/photos`;
  const res = await apiFetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    body: form,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
    ok?: boolean;
    photo?: { id: string; phase: string; url: string };
    photos?: { id: string; phase: "before" | "after"; url: string; createdAt: string }[];
    beforeCount?: number;
    afterCount?: number;
    phase?: string;
  };

  if (!res.ok) {
    throw new Error(body.error ?? `Upload failed (${res.status})`);
  }

  return body as {
    ok: boolean;
    photo: { id: string; phase: string; url: string };
    photos: { id: string; phase: "before" | "after"; url: string; createdAt: string }[];
    beforeCount: number;
    afterCount: number;
    phase: string;
  };
}
