import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { requireAuth } from "@/lib/require-auth";
import { leaderboard } from "@/lib/mock-data";

export const Route = createFileRoute("/leaderboard")({
  beforeLoad: () => requireAuth("/leaderboard"),
  head: () => ({
    meta: [
      { title: "Leaderboard — Study2Earn" },
      {
        name: "description",
        content:
          "Live national ranking of Ethiopian freshman students by verified reading time and XP.",
      },
    ],
  }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [first, second, third, ...rest] = leaderboard;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <header className="mb-10 text-center">
            <p className="text-sm font-medium text-brand-gold uppercase tracking-wider">
              National Ranking
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-navy mt-1">
              Weekly Leaderboard
            </h1>
            <p className="mt-3 text-slate-600">
              Ranked by verified reading time. Updated every 5 minutes.
            </p>
          </header>

          {/* Podium */}
          <div className="grid grid-cols-3 gap-4 mb-12 items-end">
            {[second, first, third].map((s, i) => {
              const heights = ["h-32", "h-44", "h-24"];
              const colors = ["bg-slate-200", "bg-brand-gold", "bg-amber-200"];
              return (
                <div key={s.rank} className="flex flex-col items-center">
                  <div className="size-16 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20 mb-3" />
                  <p className="font-bold text-sm text-center">{s.name}</p>
                  <p className="text-xs text-slate-500 text-center mb-3">{s.uni}</p>
                  <div
                    className={`${colors[i]} ${heights[i]} w-full rounded-t-lg flex flex-col items-center justify-start pt-4 text-brand-navy`}
                  >
                    <span className="font-serif text-3xl font-bold">{s.rank}</span>
                    <span className="text-xs font-bold mt-1">{s.xp.toLocaleString()} XP</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full list */}
          <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-brand-navy">Top 10 Scholars</h2>
              <span className="text-xs text-slate-500 flex items-center gap-2">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                Updated 2 minutes ago
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {rest.map((s) => (
                <div key={s.rank} className="flex items-center gap-4 px-6 py-4">
                  <span className="w-8 font-bold text-slate-400 text-lg">
                    {String(s.rank).padStart(2, "0")}
                  </span>
                  <div className="size-10 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{s.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {s.uni} • {s.hours}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-navy">{s.xp.toLocaleString()} XP</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{s.trend}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
