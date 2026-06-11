import { createServerFn } from "@tanstack/react-start";

const AI_API_URL = "http://localhost:20128/v1/chat/completions";
const AI_MODEL = "oc/deepseek-v4-flash-free";
const AI_API_KEY = "sk-ecded0986f34c727-w6jl93-cc848ce2";

type NlpMappingResult = {
  skill_id: number | null;
  reasoning: string;
};

type MapDescriptionInput = {
  description: string;
  categories: { id: number; name: string }[];
};

export const mapDescriptionToSkillFn = createServerFn({ method: "POST" })
  .validator((d: MapDescriptionInput) => d)
  .handler(async ({ data }) => {
    const { description, categories } = data;

    if (!description || description.trim().length < 3) {
      return { ok: false, error: "Deskripsi terlalu pendek", data: null };
    }

    const categoriesList = categories
      .map((c) => `- ID ${c.id}: ${c.name}`)
      .join("\n");

    const prompt = `Anda adalah asisten cerdas platform KerjaDekat. Tugas Anda adalah memetakan deskripsi kebutuhan pengguna ke salah satu kategori jasa yang tersedia.

Kategori jasa yang tersedia:
${categoriesList}

Deskripsi pengguna: "${description}"

Berikan respons dalam format JSON murni (langsung JSON, tanpa markdown):
{
  "skill_id": <nomor ID kategori yang paling relevan, atau null jika tidak ada>,
  "reasoning": "<penjelasan singkat dalam Bahasa Indonesia mengapa kategori ini dipilih>"
}`;

    try {
      console.log(`[NLP] Menganalisis: "${description}"`);

      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 512,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[NLP] AI API Error ${response.status}:`, errText);
        return {
          ok: false,
          error: `AI API error ${response.status}`,
          data: null,
        };
      }

      const result = await response.json();
      const aiContent: string =
        result.choices?.[0]?.message?.content ?? "{}";
      console.log(`[NLP] Respons AI: ${aiContent}`);

      let parsed: NlpMappingResult;
      try {
        parsed = JSON.parse(aiContent) as NlpMappingResult;
      } catch {
        console.error("[NLP] Gagal parse JSON:", aiContent);
        return {
          ok: false,
          error: "AI mengembalikan format yang tidak valid",
          data: null,
        };
      }

      console.log(
        `[NLP] Hasil: skill_id=${parsed.skill_id}, reasoning="${parsed.reasoning}"`,
      );
      return { ok: true, data: parsed, error: undefined };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`[NLP] Gagal koneksi ke AI: ${message}`);
      return {
        ok: false,
        error: `Gagal menghubungkan ke layanan AI: ${message}`,
        data: null,
      };
    }
  });
