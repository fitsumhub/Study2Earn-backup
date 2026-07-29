import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const BASE_URL = new URL(request.url).origin;
        // Only genuinely public, crawlable pages — auth-gated routes
        // (dashboard, leaderboard, rewards, profile) redirect anonymous
        // visitors to /login, so listing them just wastes crawl budget.
        const paths = [
          "/",
          "/library",
          "/exams",
          "/login",
          "/register",
          "/help",
          "/terms",
          "/privacy",
        ];
        const urls = paths
          .map((p) => `  <url><loc>${BASE_URL}${p}</loc><changefreq>weekly</changefreq></url>`)
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
