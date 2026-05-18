import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { serviceBase } from "@/lib/api/config";
import type {
  ApiResult,
  Kelurahan,
  RegisterWorkerPayload,
  RegisterWorkerResult,
  SkillCategory,
  UploadedFilePayload,
} from "@/lib/api/types";

const apiBase = serviceBase();

function mapHttpError(status: number, body?: { error?: string }): string {
  if (status === 403) {
    return "Kelurahan di luar wilayah binaan Anda. Pilih kelurahan dari daftar wilayah agen.";
  }
  if (body?.error) return body.error;
  return `HTTP ${status}`;
}

function appendPayloadFile(form: FormData, field: string, file: UploadedFilePayload) {
  const bytes = Buffer.from(file.data, "base64");
  const blob = new Blob([bytes], { type: file.mimeType });
  form.append(field, blob, file.name);
}

async function fetchSkillCategories(accessToken: string): Promise<ApiResult<{ items: SkillCategory[] }>> {
  try {
    if (!accessToken) {
      return { ok: false, data: { items: [] }, error: "Missing access token" };
    }
    const res = await fetch(`${apiBase}/skill-categories`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { ok: false, data: { items: [] }, error: `HTTP ${res.status}` };
    }
    const body = (await res.json()) as { items?: SkillCategory[] };
    return { ok: true, data: { items: Array.isArray(body?.items) ? body.items : [] } };
  } catch (error) {
    return {
      ok: false,
      data: { items: [] },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function postRegisterWorker(
  payload: RegisterWorkerPayload,
  accessToken: string,
): Promise<ApiResult<RegisterWorkerResult | null>> {
  try {
    if (!accessToken) {
      return { ok: false, data: null, error: "Missing access token" };
    }

    const form = new FormData();
    form.append("phone_number", payload.phone_number);
    form.append("full_name", payload.full_name);
    if (payload.rt_rw) {
      form.append("rt_rw", payload.rt_rw);
    }
    form.append("kelurahan_id", String(payload.kelurahan_id));
    payload.skill_ids.forEach((id) => form.append("skill_ids", String(id)));
    appendPayloadFile(form, "ktp_photo", payload.ktp_photo);
    appendPayloadFile(form, "profile_photo", payload.profile_photo);

    const res = await fetch(`${apiBase}/agent/workers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
      },
      body: form,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      let errBody: { error?: string } | undefined;
      try {
        errBody = (await res.json()) as { error?: string };
      } catch {
        /* ignore parse errors */
      }
      return { ok: false, data: null, error: mapHttpError(res.status, errBody) };
    }
    const body = (await res.json()) as RegisterWorkerResult;
    return { ok: true, data: body };
  } catch (error) {
    return {
      ok: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function fetchAgentTerritories(accessToken: string): Promise<ApiResult<{ items: Kelurahan[] }>> {
  try {
    if (!accessToken) {
      return { ok: false, data: { items: [] }, error: "Missing access token" };
    }
    const res = await fetch(`${apiBase}/agent/territories`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
        "X-Request-ID": crypto.randomUUID(),
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
      return { ok: false, data: { items: [] }, error: mapHttpError(res.status, errBody) };
    }
    const body = (await res.json()) as { items?: Kelurahan[] };
    return { ok: true, data: { items: Array.isArray(body?.items) ? body.items : [] } };
  } catch (error) {
    return {
      ok: false,
      data: { items: [] },
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export const getAgentTerritoriesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const accessToken =
      (data as { accessToken?: string } | undefined)?.accessToken ?? context?.accessToken ?? "";
    return fetchAgentTerritories(accessToken);
  });

export const getSkillCategoriesFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const accessToken =
      (data as { accessToken?: string } | undefined)?.accessToken ?? context?.accessToken ?? "";
    return fetchSkillCategories(accessToken);
  });

export const registerWorkerFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const input = data as { payload?: RegisterWorkerPayload; accessToken?: string } | undefined;
    const accessToken = input?.accessToken ?? context?.accessToken ?? "";
    const payload = input?.payload;
    if (!payload) {
      return { ok: false, data: null, error: "Missing registration payload" };
    }
    return postRegisterWorker(payload, accessToken);
  });
