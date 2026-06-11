import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { serviceBase } from "@/lib/api/config";
import type { ApiResult } from "@/lib/api/types";

const apiBase = serviceBase();

type AuthInput = { accessToken?: string };

export interface ApiWallet {
  ID: string;
  UserID: string;
  Balance: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface ApiWalletTransaction {
  ID: string;
  WalletID: string;
  Type: "credit" | "debit";
  Amount: number;
  BalanceBefore: number;
  BalanceAfter: number;
  ReferenceType: string;
  ReferenceID?: string;
  Description?: string;
  CreatedAt: string;
}

async function authFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    if (!accessToken) return { ok: false, data: null as T, error: "Missing access token" };
    const res = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      let errBody: { error?: string } | undefined;
      try { errBody = (await res.json()) as { error?: string }; } catch { /* ignore */ }
      return { ok: false, data: null as T, error: errBody?.error ?? `HTTP ${res.status}`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (error) {
    return { ok: false, data: null as T, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export const getMyWalletFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput }) => {
    const accessToken = (data as AuthInput | undefined)?.accessToken ?? context?.accessToken ?? "";
    return authFetch<ApiWallet>("/wallets/me", accessToken);
  });

export const getMyWalletTransactionsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }: { context: { accessToken?: string }; data?: AuthInput & { limit?: number; offset?: number } }) => {
    const input = data;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const limit = input?.limit ?? 20;
    const offset = input?.offset ?? 0;
    return authFetch<{ items: ApiWalletTransaction[] }>(
      `/wallets/me/transactions?limit=${limit}&offset=${offset}`,
      accessToken,
    );
  });
