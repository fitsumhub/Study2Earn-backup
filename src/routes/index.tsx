import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronDown,
  ClipboardList,
  Coins,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { SponsorAd } from "@/components/sponsor-ad";
import { Badge } from "@/components/ui/badge";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useSiteContent } from "@/hooks/use-site-content";
import { getBookIdByShort } from "@/lib/book-lookup";
import { subjects, leaderboard } from "@/lib/mock-data";
import { getPlatformStats } from "@/lib/platform-stats";
import type { FaqEntry } from "@/lib/site-content-store";
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
  const stats = getPlatformStats();
  const { books } = useLibraryProgress();
  const { content } = useSiteContent();
  const { hero, trustStrip, faqs } = content;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      {/* Hero */}
      <header className="relative overflow-hidden bg-white pt-16 pb-24">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-gold/8 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 -left-20 size-72 rounded-full bg-brand-sage blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="section-enter">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-sage px-4 py-1.5 text-xs font-bold tracking-wide text-green-700 uppercase border border-green-100">
                {hero.eyebrow}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 border border-red-100">
                {hero.eyebrowFlash}
              </span>
            </div>
            <h1 className="font-serif text-[clamp(2.8rem,6vw,4.5rem)] font-bold leading-[1.08] text-brand-navy">
              {hero.headline}
              <span className="block text-brand-gold italic">{hero.headlineAccent}</span>
            </h1>
            <p className="mt-4 text-base text-slate-500">{hero.amharic}</p>
            <p className="mt-6 text-lg leading-relaxed text-slate-600 max-w-lg">
              {hero.description}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/register"
                search={{ ref: undefined, redirect: undefined }}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-8 py-4 font-semibold text-white transition hover:bg-brand-navy/90 hover:scale-105 shadow-lg shadow-brand-navy/20"
              >
                {hero.primaryCta}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
              >
                <BookOpen className="size-4" />
                {hero.secondaryCta}
              </Link>
            </div>
            {/* Social proof trust strip */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                { icon: Users, label: trustStrip[0] },
                { icon: Trophy, label: trustStrip[1] },
                { icon: BadgeCheck, label: trustStrip[2] },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm"
                >
                  <s.icon className="size-3.5 text-brand-gold" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-16 lg:mt-0 section-enter delay-150">
            <img
              src={heroImg}
              alt="Ethiopian university student studying with a digital tablet in a campus library"
              width={1280}
              height={1024}
              className="aspect-[6/5] w-full rounded-2xl object-cover ring-1 ring-black/5 shadow-2xl shadow-slate-900/15"
            />
          </div>
        </div>
      </header>

      {/* Stats strip */}
      <section className="mx-auto -mt-12 max-w-7xl px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: BookOpen,
              label: "MoE Textbooks",
              value: String(stats.bookCount),
              color: "bg-brand-navy text-white",
            },
            {
              icon: ClipboardList,
              label: "Chapter Mock Exams",
              value: String(stats.chapterExamCount),
              color: "bg-brand-gold text-white",
            },
            {
              icon: GraduationCap,
              label: "Core Courses",
              value: String(stats.courseCount),
              color: "bg-green-600 text-white",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-xl shadow-slate-200/60 border border-slate-100 card-lift"
            >
              <div
                className={`size-14 rounded-full grid place-items-center text-xl ${s.color} shrink-0 shadow-md`}
              >
                <s.icon className="size-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-brand-navy">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sponsored */}
      <div className="mx-auto max-w-5xl px-6">
        <SponsorAd placement="home" className="mt-16" />
      </div>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl font-bold text-brand-navy">How Study2Earn works</h2>
          <p className="mt-2 text-slate-500">Three steps from open book to earned reward.</p>
        </div>
        <div className="relative grid md:grid-cols-3 gap-8">
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-brand-gold/30 via-brand-gold/60 to-brand-gold/30" />
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
            <div
              key={step.n}
              className="rounded-2xl bg-white border border-slate-100 p-8 hover:border-brand-gold/30 hover:shadow-md transition-all relative"
            >
              <div className="size-16 rounded-full bg-brand-gold/10 border-2 border-brand-gold/25 grid place-items-center font-serif text-3xl font-bold text-brand-gold mb-6">
                {step.n}
              </div>
              <h3 className="font-serif text-xl font-bold text-brand-navy">{step.t}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{step.d}</p>
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
            className="text-sm font-bold text-brand-navy underline decoration-brand-gold underline-offset-4 hover:text-brand-gold transition-colors"
          >
            View All Books
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 lg:grid-cols-6">
          {featuredBooks.map((b) => {
            const bookId = getBookIdByShort(b.short);
            const coverUrl = books.find((lb) => lb.id === bookId)?.coverUrl;
            const inner = (
              <>
                <div className="mb-4 transition-transform duration-200 group-hover:-translate-y-1 group-hover:scale-[1.02]">
                  <BookCover short={b.short} id={bookId} name={b.name} coverUrl={coverUrl} />
                </div>
                <h3 className="text-sm font-bold leading-tight group-hover:text-brand-navy transition-colors">
                  {b.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {b.chapters} chapters • {b.students} Students
                </p>
              </>
            );
            return bookId ? (
              <Link
                key={b.name}
                to="/library/read/$bookId"
                params={{ bookId }}
                className="group block rounded-xl ring-1 ring-black/5 hover:shadow-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
              >
                {inner}
              </Link>
            ) : (
              <Link
                key={b.name}
                to="/library"
                className="group block rounded-xl ring-1 ring-black/5 hover:shadow-xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-navy"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mock Exam CTA */}
      <section className="bg-gradient-to-b from-brand-navy to-[#162042] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center text-center">
          <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center mb-8 ring-1 ring-white/20">
            <ClipboardList className="size-8 text-brand-gold" />
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
            className="bg-brand-gold px-10 py-4 rounded-lg font-bold text-white transition hover:scale-105 hover:brightness-110 shadow-xl shadow-brand-gold/25"
          >
            Start Mock Exam
          </Link>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-slate-400">
            {["Real Past Questions", "Official Time Limits", "National Ranking"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="text-brand-gold">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-brand-navy">
            Everything you need to succeed
          </h2>
          <p className="mt-2 text-slate-500">
            Built specifically for the Ethiopian freshman Exit Exam.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              color: "bg-blue-50 text-blue-600",
              title: "Official MoE Curriculum",
              desc: "Every textbook and past paper follows the Ministry of Education syllabus — nothing outside the real exam.",
            },
            {
              icon: ClipboardList,
              color: "bg-amber-50 text-amber-600",
              title: "Timed Mock Exams",
              desc: "Simulate the real Exit Exam: multiple-choice questions, strict time limits, instant scoring and XP.",
            },
            {
              icon: Coins,
              color: "bg-emerald-50 text-emerald-600",
              title: "Earn Real ETB",
              desc: "Convert your study XP into Ethiopian Birr. Withdraw directly to CBE, Awash, Dashen, and 12 other banks.",
            },
            {
              icon: Trophy,
              color: "bg-purple-50 text-purple-600",
              title: "National Leaderboard",
              desc: "Compete with students from all corners of Ethiopia — weekly, monthly, and university rankings.",
            },
            {
              icon: Sparkles,
              color: "bg-pink-50 text-pink-600",
              title: "AI Study Companion",
              desc: "Upload any lecture note or PDF and instantly generate practice MCQs, key concepts, and study summaries.",
            },
            {
              icon: Zap,
              color: "bg-orange-50 text-orange-600",
              title: "XP Reward System",
              desc: "Every minute of verified reading and every passed exam adds to your balance — progress is always rewarded.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`size-10 shrink-0 rounded-xl grid place-items-center ${f.color}`}>
                <f.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-brand-navy">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-6 pb-24">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl font-bold text-brand-navy">
            Frequently asked questions
          </h2>
          <p className="mt-2 text-slate-500">
            Everything a freshman needs to know before starting.
          </p>
        </div>
        <FaqList faqs={faqs} />
      </section>

      {/* Leaderboard teaser — mini podium */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="font-serif text-3xl font-bold text-brand-navy">
              Top Scholars This Week
            </h2>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
              Preview
            </Badge>
          </div>
          <p className="text-slate-500">Compete with students from Addis Ababa to Mekelle.</p>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 mb-10">
          {/* 2nd place */}
          {top3[1] && (
            <div className="flex flex-col items-center gap-3 flex-1 max-w-[160px]">
              <div className="size-12 rounded-full bg-gradient-to-br from-slate-300 to-slate-200 flex items-center justify-center font-serif font-bold text-slate-600 text-sm ring-2 ring-slate-300">
                {top3[1].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <p className="text-xs font-semibold text-center text-slate-700 leading-tight">
                {top3[1].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {top3[1].xp.toLocaleString()} XP
              </p>
              <div className="w-full h-24 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-100 border border-slate-300 flex items-center justify-center">
                <span className="text-2xl font-serif font-bold text-slate-500">2</span>
              </div>
            </div>
          )}
          {/* 1st place */}
          {top3[0] && (
            <div className="flex flex-col items-center gap-3 flex-1 max-w-[160px]">
              <p className="text-xl">👑</p>
              <div className="size-14 rounded-full bg-gradient-to-br from-brand-gold to-amber-500 flex items-center justify-center font-serif font-bold text-white text-base ring-2 ring-brand-gold/60 ring-offset-2 shadow-lg shadow-brand-gold/30">
                {top3[0].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <p className="text-xs font-bold text-center text-brand-navy leading-tight">
                {top3[0].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-brand-gold font-mono font-bold">
                {top3[0].xp.toLocaleString()} XP
              </p>
              <div className="w-full h-36 rounded-t-2xl bg-gradient-to-b from-brand-gold/20 to-brand-gold/5 border-2 border-brand-gold/40 flex items-center justify-center shadow-sm">
                <span className="text-3xl font-serif font-bold text-brand-gold">1</span>
              </div>
            </div>
          )}
          {/* 3rd place */}
          {top3[2] && (
            <div className="flex flex-col items-center gap-3 flex-1 max-w-[160px]">
              <div className="size-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 flex items-center justify-center font-serif font-bold text-amber-700 text-xs ring-2 ring-amber-200">
                {top3[2].name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <p className="text-xs font-semibold text-center text-slate-700 leading-tight">
                {top3[2].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {top3[2].xp.toLocaleString()} XP
              </p>
              <div className="w-full h-20 rounded-t-2xl bg-gradient-to-b from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center">
                <span className="text-xl font-serif font-bold text-amber-600">3</span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link
            to="/leaderboard"
            className="text-sm font-bold text-brand-navy hover:underline decoration-brand-gold underline-offset-4 transition-colors"
          >
            View Full Leaderboard →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function FaqList({ faqs }: { faqs: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      {faqs.map((faq, i) => (
        <div key={faq.id}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50"
          >
            <span className="font-semibold text-brand-navy text-sm sm:text-base">{faq.q}</span>
            <ChevronDown
              className={`size-5 shrink-0 text-slate-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
