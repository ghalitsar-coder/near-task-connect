import { createServerFn } from "@tanstack/react-start";
import { serviceBase } from "@/lib/api/config";

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
