function apiBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is not set. Use http://localhost:3000 on simulator, or your computer LAN IP on a physical phone.",
    );
  }
  return base;
}

export async function apiGet<T>(
  path: string,
  accessToken: string,
): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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
  const res = await fetch(`${apiBaseUrl()}${path}`, {
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

  const res = await fetch(`${apiBaseUrl()}/api/mobile/employee/jobs/${bookingId}/photos`, {
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
