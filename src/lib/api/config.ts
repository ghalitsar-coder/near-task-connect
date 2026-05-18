const FALLBACK_BASE = "http://localhost:8080/api/v1";

export type ServiceKey = "kerjadekat";

export function serviceBase(_key: ServiceKey = "kerjadekat") {
  return process.env.KERJADEKAT_API_BASE ?? FALLBACK_BASE;
}
