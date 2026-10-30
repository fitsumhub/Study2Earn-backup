// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    server: { port: 3002, strictPort: false },
    build: {
      // Target modern browsers — smaller, faster output
      target: "es2020",
      // Inline small assets directly in CSS/JS to save requests
      assetsInlineLimit: 4096,
      rollupOptions: {
        output: {
          // Split large vendor bundles so the browser can cache them
          // independently and download them in parallel.
          manualChunks(id: string) {
            // Admin-only heavy chart library
            if (id.includes("node_modules/recharts")) return "vendor-recharts";
            // PDF reader — only needed in library reading view
            if (id.includes("node_modules/pdfjs-dist") || id.includes("node_modules/react-pdf")) {
              return "vendor-pdf";
            }
            // Core React runtime — tiny, cached forever once loaded
            if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
              return "vendor-react";
            }
            // TanStack Router + Query — shared navigation infrastructure
            if (
              id.includes("node_modules/@tanstack/react-router") ||
              id.includes("node_modules/@tanstack/router-core") ||
              id.includes("node_modules/@tanstack/react-query")
            ) {
              return "vendor-tanstack";
            }
            // Radix UI primitives — design system, loaded on all pages
            if (id.includes("node_modules/@radix-ui/")) return "vendor-radix";
            // Lucide icons — tree-shaken but still sizeable
            if (id.includes("node_modules/lucide-react")) return "vendor-icons";
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
