// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
function parseCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

const proxy = (target: string) => ({
  target,
  changeOrigin: true,
  rewrite: (path: string) => path.replace(/^\/api\/[^/]+/, ""),
  configure: (proxyServer: { on: (event: string, fn: (...args: unknown[]) => void) => void }) => {
    proxyServer.on("proxyReq", (proxyReq, req) => {
      const token = parseCookie(
        (req as { headers?: { cookie?: string } }).headers?.cookie,
        "skyline_access_token",
      );
      if (token) {
        proxyReq.setHeader("Authorization", `Bearer ${token}`);
      }
    });
  },
});

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  optimizeDeps: {
    include: ['maplibre-gl'] // Tambahkan baris ini
  },
  vite: {
    server: {
      // proxy: {
      //   "/api/flight-ops": proxy("http://localhost:8003"),
      //   "/api/inventory": proxy("http://localhost:8002"),
      //   "/api/passenger": proxy("http://localhost:8001"),
      //   "/api/notification": proxy("http://localhost:8004"),
      //   "/api/booking": proxy("http://localhost:8005"),
      //   "/api/pricing": proxy("http://localhost:8006"),
      //   "/api/payment": proxy("http://localhost:8007"),
      //   "/api/loyalty": proxy("http://localhost:8008"),
      //   "/api/crew": proxy("http://localhost:8009"),
      //   "/api/maintenance": proxy("http://localhost:8010"),
      // },
      port:5173
    },
  },
});
