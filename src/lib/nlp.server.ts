import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { serviceBase } from "@/lib/api/config";
import type { NearbyWorker } from "@/lib/api/types";

const apiBase = serviceBase();

type NlpMappingResult = {
  skill_id: number | null;
  reasoning: string;
};

type MapDescriptionInput = {
  description: string;
  categories: { id: number; name: string }[];
};

export const mapDescriptionToSkillFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: MapDescriptionInput }) => {
    const { description, categories } = data;

    if (!description || description.trim().length < 3) {
      return { ok: false, error: "Deskripsi terlalu pendek", data: null };
    }

    try {
      const response = await fetch(`${apiBase}/ai/describe-skill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, categories }),
        signal: AbortSignal.timeout(25_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[NLP] Backend Error ${response.status}:`, errText);
        return {
          ok: false,
          error: `Gagal memproses: ${response.status}`,
          data: null,
        };
      }

      const result = (await response.json()) as NlpMappingResult;
      return { ok: true, data: result, error: undefined };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[NLP] Gagal hubungi backend: ${message}`);
      return {
        ok: false,
        error: `Gagal menghubungkan ke server: ${message}`,
        data: null,
      };
    }
  });

type FindWorkersInput = {
  description: string;
  categories: { id: number; name: string }[];
  latitude?: number;
  longitude?: number;
};

type FindWorkersResponse = {
  items: NearbyWorker[];
  reasoning: string;
  skill_ids: number[];
};

export const findWorkersFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }: {
      context: { accessToken?: string };
      data?: { accessToken?: string; payload?: FindWorkersInput };
    }) => {
      const input = data;
      const accessToken = input?.accessToken ?? context?.accessToken ?? "";
      const payload = input?.payload;
      if (!payload) return { ok: false, data: null as FindWorkersResponse | null, error: "Missing payload" };

      try {
        const body: Record<string, unknown> = {
          description: payload.description,
          categories: payload.categories,
        };
        if (payload.latitude != null && payload.longitude != null) {
          body.latitude = payload.latitude;
          body.longitude = payload.longitude;
        }

        const response = await fetch(`${apiBase}/ai/find-workers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30_000),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[NLP] FindWorkers Error ${response.status}:`, errText);
          return { ok: false, data: null, error: `Gagal memproses: ${response.status}` };
        }

        const result = (await response.json()) as FindWorkersResponse;
        return { ok: true, data: result, error: undefined };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[NLP] FindWorkers failed: ${message}`);
        return { ok: false, data: null, error: `Gagal menghubungkan ke server: ${message}` };
      }
    },
  );
