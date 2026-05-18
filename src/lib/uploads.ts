import type { UploadedFilePayload } from "@/lib/api/types";

/** Serialize a browser File for transport through createServerFn. */
export async function fileToPayload(file: File): Promise<UploadedFilePayload> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
  const comma = dataUrl.indexOf(",");
  const data = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  return {
    name: file.name || "upload.bin",
    mimeType: file.type || "application/octet-stream",
    data,
  };
}
