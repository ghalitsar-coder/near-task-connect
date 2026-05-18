import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { 
      entry: "server" 
    },
  },
  // Tambahkan blok vite di sini
  vite: {
    server: {
      port: 5173,
      strictPort: true, // Opsional: Memaksa Vite jalan di 5173. Jika port terpakai, akan error (tidak otomatis ganti ke port lain)
    },
  },
});