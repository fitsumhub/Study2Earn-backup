import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { subjects, leaderboard } from "@/lib/mock-data";
import heroImg from "@/assets/hero-student.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study2Earn — Master your exams. Earn your future." },
      {
        name: "description",
        content:
          "Gamified Exit Exam prep platform built for Ethiopian freshman university students. Access the full MoE curriculum, take mock exams, and earn rewards.",
      },
      { property: "og:title", content: "Study2Earn — Master your exams. Earn your future." },
      {
        property: "og:description",
        content:
          "Gamified Exit Exam prep platform built for Ethiopian freshman university students.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const featuredBooks = subjects.slice(0, 6);
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Hero */}
      <header className="relative overflow-hidden bg-white pt-16 pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div>
            <span className="inline-block rounded-full bg-brand-sage px-4 py-1.5 text-xs font-bold tracking-wide text-green-700 uppercase mb-6">
              2026 Freshman Exit Prep
            </span>
            <h1 className="font-serif text-5xl font-bold leading-[1.1] text-brand-navy md:text-6xl lg:text-7xl">
              Master your exams,
              <span className="block text-brand-gold italic text-6xl md:text-7xl lg:text-8xl">
                Earn your future.
              </span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-slate-600 max-w-lg">
              The first gamified preparation platform built specifically for Ethiopian freshman
              students. Access the full MoE curriculum, practice real exam scenarios, and earn
              rewards as you learn.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/register"
                search={{ ref: undefined, redirect: undefined }}
                className="rounded-lg bg-brand-navy px-8 py-4 font-semibold text-white transition hover:bg-brand-navy/90 shadow-lg shadow-brand-navy/20"
              >
                Start Studying Now
              </Link>
              <Link
                to="/library"
                className="rounded-lg border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View Library
              </Link>
            </div>
          </div>
          <div className="mt-16 lg:mt-0">
            <img
              src={heroImg}
              alt="Ethiopian university student studying with a digital tablet in a campus library"
              width={1280}
              height={1024}
              className="aspect-[6/5] w-full rounded-2xl object-cover outline-1 -outline-offset-1 outline-black/5 shadow-2xl"
            />
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <section className="mx-auto -mt-12 max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { icon: "📚", label: "Books Available", value: "142" },
            { icon: "✍️", label: "Mock Exams Taken", value: "48,210" },
            { icon: "🏆", label: "Active Scholars", value: "12,470" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/50 border border-slate-100"
            >
              <div className="size-14 rounded-full bg-brand-sage grid place-items-center text-2xl">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-brand-navy">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl font-bold text-brand-navy">How Study2Earn works</h2>
          <p className="mt-2 text-slate-500">Three steps from open book to earned reward.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              n: "01",
              t: "Study verified PDFs",
              d: "Access the official Ministry of Education curriculum, organized by subject and year.",
            },
            {
              n: "02",
              t: "Take timed mock exams",
              d: "Practice under real Exit Exam conditions and get instant feedback on every answer.",
            },
            {
              n: "03",
              t: "Earn XP & rewards",
              d: "Convert verified reading time and exam performance into airtime, vouchers, and badges.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-2xl bg-white border border-slate-100 p-8">
              <span className="font-serif text-5xl text-brand-gold">{step.n}</span>
              <h3 className="mt-6 font-serif text-xl font-bold text-brand-navy">{step.t}</h3>
              <p className="mt-2 text-slate-600">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="font-serif text-3xl font-bold text-brand-navy">Subject Library</h2>
            <p className="mt-2 text-slate-500">Core courses and elective materials.</p>
          </div>
          <Link
            to="/library"
            className="text-sm font-bold text-brand-navy underline decoration-brand-gold underline-offset-4"
          >
            View All Books
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
          {featuredBooks.map((b) => (
            <div key={b.name} className="group cursor-pointer">
              <div className="mb-4">
                <BookCover short={b.short} name={b.name} />
              </div>
              <h3 className="text-sm font-bold leading-tight group-hover:text-brand-navy">
                {b.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {b.chapters} chapters • {b.students} Students
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mock Exam CTA */}
      <section className="bg-brand-navy py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center text-center">
          <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8">
            <div className="size-8 bg-brand-gold rounded rotate-45" />
          </div>
          <h2 className="font-serif text-4xl font-bold mb-6 max-w-2xl">
            Ready for the real thing? Take a full-length mock exit exam.
          </h2>
          <p className="text-slate-300 text-lg mb-10 max-w-xl">
            Simulate the actual Ministry of Education environment. Timed questions, instant result
            analysis, and a national ranking.
          </p>
          <Link
            to="/exams"
            className="bg-brand-gold px-10 py-4 rounded-lg font-bold text-white transition hover:scale-105 shadow-xl shadow-brand-gold/20"
          >
            Start Mock Exam
          </Link>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <span>✓</span> Real Past Questions
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span> Official Time Limits
            </div>
            <div className="flex items-center gap-2">
              <span>✓</span> National Ranking
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard teaser */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-brand-navy">Top Scholars This Week</h2>
          <p className="text-slate-500">Compete with students from Addis Ababa to Mekelle.</p>
        </div>
        <div className="space-y-4">
          {top3.map((s) => (
            <div
              key={s.rank}
              className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200"
            >
              <span
                className={`w-8 font-bold text-xl ${s.rank === 1 ? "text-brand-gold" : "text-slate-400"}`}
              >
                {String(s.rank).padStart(2, "0")}
              </span>
              <div className="size-10 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20" />
              <div className="flex-1">
                <p className="font-bold">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.uni} • {s.hours} Study Time
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-brand-navy">{s.xp.toLocaleString()} XP</p>
                <p className="text-[10px] text-green-600 font-bold uppercase">{s.trend}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/leaderboard" className="text-sm font-bold text-brand-navy hover:underline">
            View Full Leaderboard →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
