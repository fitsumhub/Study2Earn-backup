// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: { port: 3001, strictPort: true },
    build: {
      rollupOptions: {
        output: {
          // Keep the heaviest, least-often-loaded libraries out of the main
          // entry chunk (recharts is admin-only; pdfjs is only needed while
          // actually reading a book).
          manualChunks(id: string) {
            if (id.includes("node_modules/recharts")) return "vendor-recharts";
            if (id.includes("node_modules/pdfjs-dist") || id.includes("node_modules/react-pdf")) {
              return "vendor-pdf";
            }
          },
        },
      },
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Vite 7's SSR environment exposes dispatchFetch, so TanStack Start skips its
    // dev middleware by default (expecting Nitro). Force it on for local dev.
    vite: { installDevServerMiddleware: true },
  },
});
