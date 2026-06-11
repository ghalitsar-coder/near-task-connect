import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { serviceBase } from "@/lib/api/config";
import type { ApiOrder, ApiResult } from "@/lib/api/types";

const apiBase = serviceBase();

function mapHttpError(status: number, body?: { error?: string }): string {
  if (status === 401) return "Sesi habis. Silakan masuk ulang.";
  if (status === 403) return "Akses ditolak.";
  if (body?.error) return body.error;
  return `HTTP ${status}`;
}

async function authFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    if (!accessToken) {
      return { ok: false, data: null as T, error: "Missing access token" };
    }
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      let errBody: { error?: string } | undefined;
      try {
        errBody = (await res.json()) as { error?: string };
      } catch {
        /* ignore */
      }
      return { ok: false, data: null as T, error: mapHttpError(res.status, errBody), status: res.status };
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

type AuthInput = { accessToken?: string };

export const getWorkerOrdersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    return authFetch<{ items: ApiOrder[] }>("/orders", accessToken);
  });

export const getWorkerOrderFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as ApiOrder, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}`, accessToken);
  });

export const acceptWorkerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as ApiOrder, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}/accept`, accessToken, { method: "POST" });
  });

export const startWorkerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as ApiOrder, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}/start`, accessToken, { method: "POST" });
  });

export const completeWorkerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as ApiOrder, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}/complete`, accessToken, { method: "POST" });
  });

export const cancelWorkerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string; reason?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as ApiOrder, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}/cancel`, accessToken, {
      method: "POST",
      body: JSON.stringify({ reason: input?.reason || "Dibatalkan pekerja" }),
    });
  });

export const rejectWorkerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null as unknown as undefined, error: "Missing order id" };
    return authFetch<undefined>(`/orders/${orderId}/reject`, accessToken, { method: "POST" });
  });
