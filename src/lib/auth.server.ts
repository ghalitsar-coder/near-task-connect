import { createServerFn } from "@tanstack/react-start";
import { getSession } from "start-authjs";
import { authMiddleware } from "@/lib/auth/middleware";
import { authConfig } from "@/lib/auth/config";
import { serviceBase } from "@/lib/api/config";
import type { ApiResult, ApiUser, TokenPair } from "@/lib/api/types";

const apiBase = serviceBase();

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 204) {
      return { ok: true, data: null as T };
    }
    if (!res.ok) {
      let errBody: { error?: string } | undefined;
      try {
        errBody = (await res.json()) as { error?: string };
      } catch {}
      return { ok: false, data: null as T, error: errBody?.error ?? `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      data: null as T,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function getJsonAuth<T>(path: string, accessToken: string): Promise<ApiResult<T>> {
  try {
    if (!accessToken) {
      return { ok: false, data: null as T, error: "Missing access token" };
    }
    const res = await fetch(`${apiBase}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, data: null as T, error: `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      data: null as T,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const requestOtpFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const phone = (data as { phone_number?: string } | undefined)?.phone_number ?? "";
  return postJson<null>("/auth/otp/request", { phone_number: phone });
});

export const verifyOtpFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const input = data as { phone_number?: string; code?: string; role?: string } | undefined;
  return postJson<TokenPair>("/auth/otp/verify", {
    phone_number: input?.phone_number ?? "",
    code: input?.code ?? "",
    role: input?.role ?? "consumer",
  });
});

export const refreshTokensFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const refresh_token = (data as { refresh_token?: string } | undefined)?.refresh_token ?? "";
  return postJson<TokenPair>("/auth/refresh", { refresh_token });
});

export const completeOAuthFn = createServerFn({ method: "POST" }).handler(async ({ request, data }) => {
  const session = await getSession(request, authConfig);
  const user = session?.user;
  if (!user?.email) {
    return { ok: false, data: null as TokenPair, error: "OAuth session tidak ditemukan" };
  }
  const role = (data as { role?: string } | undefined)?.role ?? "consumer";
  const provider =
    (session as { provider?: string }).provider ?? "google";
  const subject =
    (session as { subject?: string }).subject ?? user.id ?? user.email ?? "";
  return postJson<TokenPair>("/auth/social", {
    provider,
    subject,
    email: user.email,
    name: user.name ?? "Pengguna",
    role,
  });
});

export const getMeFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const accessToken =
      (data as { accessToken?: string } | undefined)?.accessToken ?? context?.accessToken ?? "";
    return getJsonAuth<ApiUser>("/me", accessToken);
  });

export const loginEmailFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const input = data as { email?: string; password?: string } | undefined;
  return postJson<{ phone_number: string; role: string }>("/auth/login", {
    email: input?.email ?? "",
    password: input?.password ?? "",
  });
});

export const loginPhoneFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const phone = (data as { phone_number?: string } | undefined)?.phone_number ?? "";
  return postJson<{ phone_number: string; role: string }>("/auth/phone-login", {
    phone_number: phone,
  });
});

export const registerEmailFn = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const input = data as { email?: string; password?: string; name?: string; phone_number?: string; role?: string } | undefined;
  return postJson<null>("/auth/register", {
    email: input?.email ?? "",
    password: input?.password ?? "",
    name: input?.name ?? "",
    phone_number: input?.phone_number ?? "",
    role: input?.role ?? "consumer",
  });
});
