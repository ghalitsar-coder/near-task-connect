import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
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
      return { ok: false, data: null as T, error: `HTTP ${res.status}` };
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
      return { ok: false, data: null as T, error: `HTTP ${res.status}` };
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

export const getMeFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const accessToken =
      (data as { accessToken?: string } | undefined)?.accessToken ?? context?.accessToken ?? "";
    return getJsonAuth<ApiUser>("/me", accessToken);
  });
