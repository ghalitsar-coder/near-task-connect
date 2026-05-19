import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { serviceBase } from "@/lib/api/config";
import type { ApiOrder, ApiResult, NearbyWorker, SkillCategory } from "@/lib/api/types";

const apiBase = serviceBase();

function mapHttpError(status: number, body?: { error?: string }): string {
  if (status === 401) return "Sesi habis. Silakan masuk ulang.";
  if (status === 403) return "Akses ditolak untuk akun ini.";
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
    if (res.status === 204) {
      return { ok: true, data: null as T, status: 204 };
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

export type CreateOrderInput = {
  skill_id: number;
  description?: string;
  latitude: number;
  longitude: number;
  consumer_address?: string;
  payment_method_fee?: string;
};

type AuthInput = { accessToken?: string };

export const getNearbyWorkersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { accessToken?: string };
      data?: AuthInput & { lat?: number; lng?: number; skill?: number; radius?: number };
    }) => {
      const input = data;
      const accessToken = input?.accessToken ?? context?.accessToken ?? "";
      const lat = input?.lat;
      const lng = input?.lng;
      if (lat == null || lng == null) {
        return { ok: false, data: { items: [] as NearbyWorker[] }, error: "Missing coordinates" };
      }
      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
      });
      if (input?.skill != null) params.set("skill", String(input.skill));
      if (input?.radius != null) params.set("radius", String(input.radius));
      const res = await authFetch<{ items: NearbyWorker[] }>(
        `/workers/nearby?${params}`,
        accessToken,
      );
      if (!res.ok) return { ok: false, data: { items: [] }, error: res.error, status: res.status };
      return { ok: true, data: { items: res.data?.items ?? [] } };
    },
  );

export const getConsumerSkillCategoriesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput }) => {
    const accessToken =
      (data as { accessToken?: string } | undefined)?.accessToken ?? context?.accessToken ?? "";
    const res = await authFetch<{ items: SkillCategory[] }>("/skill-categories", accessToken);
    if (!res.ok) return { ok: false, data: { items: [] }, error: res.error, status: res.status };
    return { ok: true, data: { items: res.data?.items ?? [] } };
  });

export const listConsumerOrdersFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { limit?: number; offset?: number } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;
    const res = await authFetch<{ items: ApiOrder[] }>(
      `/orders?limit=${limit}&offset=${offset}`,
      accessToken,
    );
    if (!res.ok) return { ok: false, data: { items: [] }, error: res.error, status: res.status };
    return { ok: true, data: { items: res.data?.items ?? [] } };
  });

export const getConsumerOrderFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}`, accessToken);
  });

export const createConsumerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { payload?: CreateOrderInput } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const payload = input?.payload;
    if (!payload) return { ok: false, data: null, error: "Missing order payload" };
    return authFetch<ApiOrder>("/orders", accessToken, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

export const cancelConsumerOrderFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { orderId?: string; reason?: string } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const orderId = input?.orderId ?? "";
    if (!orderId) return { ok: false, data: null, error: "Missing order id" };
    return authFetch<ApiOrder>(`/orders/${orderId}/cancel`, accessToken, {
      method: "POST",
      body: JSON.stringify({ reason: input?.reason }),
    });
  });
