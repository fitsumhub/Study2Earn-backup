import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Coins,
  Flame,
  GraduationCap,
  Landmark,
  Layers,
  Medal,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { SponsorAd } from "@/components/sponsor-ad";
import { Badge } from "@/components/ui/badge";
import { BankLogo } from "@/components/bank-logo";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";
import { Education3DIcon } from "@/components/frames/Education3DIcon";
import { ethiopianBanks } from "@/lib/ethiopian-banks";
import { useLibraryProgress } from "@/hooks/use-library-progress";
import { useSiteContent } from "@/hooks/use-site-content";
import { getBookIdByShort } from "@/lib/book-lookup";
import { subjects, leaderboard } from "@/lib/mock-data";
import { getPlatformStats } from "@/lib/platform-stats";
import { xpToEtb } from "@/lib/withdrawal-data";
import type { FaqEntry } from "@/lib/site-content-store";
import heroImg from "@/assets/hero-student.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study2Earn — Master your exams. Earn your future." },
      {
        name: "description",
        content:
          "Gamified Exit Exam prep platform built for Ethiopian freshman university students. Access the full MoE curriculum, take mock exams, practice with AI study sets, and withdraw earnings to Ethiopian banks.",
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

// Select prominent Ethiopian banks to showcase in the trust & payout section
const FEATURED_BANKS = ethiopianBanks.slice(0, 8);

// Showcase collectible frames with live styling
const SHOWCASE_FRAMES = [
  {
    id: "golden-scholar",
    name: "Golden Scholar",
    rarity: "LEGENDARY",
    rarityLabel: "Legendary",
    badge: "bg-amber-500/10 text-amber-600 border-amber-300",
    theme: "scholar" as const,
    initials: "ST",
    student: "Selamawit T.",
    uni: "Addis Ababa University",
  },
  {
    id: "neon-cyber",
    name: "Cyber Alchemist",
    rarity: "SSR",
    rarityLabel: "SSR Elite",
    badge: "bg-cyan-500/10 text-cyan-600 border-cyan-300",
    theme: "cyber" as const,
    initials: "YB",
    student: "Yonas Bekele",
    uni: "Jimma University",
  },
  {
    id: "ethiopian-shield",
    name: "Axumite Shield",
    rarity: "EPIC",
    rarityLabel: "Epic Insignia",
    badge: "bg-purple-500/10 text-purple-600 border-purple-300",
    theme: "axumite" as const,
    initials: "HD",
    student: "Hanna Demissie",
    uni: "Bahir Dar University",
  },
  {
    id: "royal-aegis",
    name: "Royal Aegis",
    rarity: "MYTHIC",
    rarityLabel: "Mythic Grand",
    badge: "bg-rose-500/10 text-rose-600 border-rose-300",
    theme: "olympus" as const,
    initials: "DH",
    student: "Dawit Haile",
    uni: "Mekelle University",
  },
];

// Verified student testimonials across key Ethiopian universities
const TESTIMONIALS = [
  {
    quote:
      "The chapter mock exams match the actual Ethiopian Exit Exam format 100%. Practicing timed questions here boosted my confidence, and I withdrew my first 250 ETB to my CBE account within minutes!",
    author: "Kidus Yohannes",
    university: "Addis Ababa University",
    department: "Pre-Engineering / Freshman",
    xpEarned: "3,840 XP",
    withdrawn: "480 ETB",
    rating: 5,
  },
  {
    quote:
      "Reading verified MoE textbooks while earning XP makes studying addictive in the best way. My study group at ASTU uses Study2Earn daily for Calculus and Physics exam prep.",
    author: "Bethlehem Haile",
    university: "Adama Science and Technology University",
    department: "Software Engineering",
    xpEarned: "4,620 XP",
    withdrawn: "575 ETB",
    rating: 5,
  },
  {
    quote:
      "The AI Study Sets feature is a game-changer! I upload lecture summaries and get instant 3D flashcards and mock questions. Plus, collecting the Axumite Shield profile frame was awesome.",
    author: "Abinet Tadesse",
    university: "Hawassa University",
    department: "Medicine & Health Sciences",
    xpEarned: "5,120 XP",
    withdrawn: "640 ETB",
    rating: 5,
  },
];

/** Editorial Study-to-Cash Financial Card with Transparent Payout Mechanics */
function StudyEarningsCard({ xp, etb }: { xp: number; etb: number }) {
  const hoursStudied = (xp / 100).toFixed(1);
  const examsPassed = Math.round(xp / 180);

  return (
    <div className="relative flex flex-col p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl preserve-3d">
      {/* Top Ledger Strip */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
            NBE Switch Verified
          </span>
        </div>
        <span className="text-[11px] font-mono text-brand-gold font-bold bg-brand-gold/15 px-2 py-0.5 rounded border border-brand-gold/30">
          8 XP = 1.00 ETB
        </span>
      </div>

      {/* Main Study Equivalence Metrics */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">MoE Study Time</p>
          <p className="text-lg font-serif font-bold text-white mt-0.5 tabular-nums">
            ~{hoursStudied} <span className="text-xs font-sans text-slate-400 font-normal">hours</span>
          </p>
          <p className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="size-3 shrink-0" /> Verified textbooks
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/60 p-3 border border-slate-700/50">
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Mock Exams Passed</p>
          <p className="text-lg font-serif font-bold text-white mt-0.5 tabular-nums">
            {examsPassed} <span className="text-xs font-sans text-slate-400 font-normal">tests</span>
          </p>
          <p className="text-[10px] text-brand-gold mt-1 flex items-center gap-1">
            <Award className="size-3 shrink-0" /> Exit Exam format
          </p>
        </div>
      </div>

      {/* Cash Payout Summary */}
      <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-brand-gold/10 to-transparent p-3.5 border border-amber-500/30 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Direct Withdrawable Value</p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-white tabular-nums leading-tight">
            {etb} <span className="text-sm font-sans font-bold text-brand-gold">ETB</span>
          </p>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-400/30">
            <CheckCircle2 className="size-3" /> 0% Fee
          </span>
          <p className="text-[10px] text-slate-400 mt-1">Instant Settlement</p>
        </div>
      </div>

      {/* Destination Bank Note */}
      <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Landmark className="size-3.5 text-brand-gold" /> CBE · Awash · Dashen · Telebirr
        </span>
        <span className="font-mono text-emerald-400 text-[10px]">Min: 50 ETB</span>
      </div>
    </div>
  );
}

function HomePage() {
  const featuredBooks = subjects.slice(0, 6);
  const top3 = leaderboard.slice(0, 3);
  const stats = getPlatformStats();
  const { books } = useLibraryProgress();
  const { content } = useSiteContent();
  const { hero, trustStrip, faqs } = content;

  // Interactive conversion slider in the bank section
  const [calcXp, setCalcXp] = useState(1600);
  const calculatedEtb = xpToEtb(calcXp);

  // Interactive Flashcard flip state for AI Study Hub spotlight
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-brand-gold/30">
      <SiteHeader />

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-50 pt-12 pb-20 md:pt-16 md:pb-28">
        {/* Decorative background glows */}
        <div className="pointer-events-none absolute -top-32 -right-32 size-[460px] rounded-full bg-brand-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -left-32 size-[400px] rounded-full bg-blue-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-7 section-enter">
            {/* National Syllabus Tag & Live Pulse */}
            <div className="mb-6 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold tracking-wide text-emerald-800 uppercase border border-emerald-200 shadow-2xs">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-600" />
                </span>
                2017 E.C. Ethiopian Freshman Syllabus
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold text-amber-900 border border-brand-gold/30">
                <ShieldCheck className="size-3.5 text-brand-gold" />
                Exit Exam Accredited
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-bold leading-[1.12] text-brand-navy tracking-tight">
              Master Your Exams.
              <span className="block bg-gradient-to-r from-brand-gold via-amber-500 to-amber-600 bg-clip-text text-transparent italic">
                Earn Real Ethiopian Birr.
              </span>
            </h1>

            {/* Amharic Motto */}
            <p className="mt-3.5 font-medium text-sm sm:text-base text-slate-500 tracking-wide">
              {hero.amharic}
            </p>

            {/* Description */}
            <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-slate-600 max-w-2xl">
              The premier gamified Exit Exam prep platform built for Ethiopian university freshman
              students. Study verified Ministry of Education textbooks, simulate timed mock exit exams,
              practice with AI study sets, and withdraw your earned XP directly to your Ethiopian bank account.
            </p>

            {/* CTA Buttons */}
            <div className="mt-7 sm:mt-9 flex flex-col sm:flex-row gap-3.5 sm:gap-4">
              <Link
                to="/register"
                search={{ ref: undefined, redirect: undefined }}
                className="btn-3d-navy inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-xl px-7 py-4 font-bold text-white min-h-[50px] text-base group"
              >
                <span>{hero.primaryCta}</span>
                <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/library"
                className="btn-3d-white inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-4 font-semibold text-slate-700 min-h-[50px] text-base"
              >
                <BookOpen className="size-4 text-brand-navy" />
                <span>{hero.secondaryCta}</span>
              </Link>
              <Link
                to="/ai-study"
                className="btn-3d-gold inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-amber-400 px-5 py-4 font-bold text-slate-950 min-h-[50px] text-sm"
              >
                <Sparkles className="size-4" />
                <span>AI Study Hub</span>
              </Link>
            </div>

            {/* Live Campus Trust Bar */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center gap-3">
              {[
                { icon: Users, label: "14,800+ Ethiopian Freshmen Enrolled" },
                { icon: Landmark, label: "Instant Payouts to 15+ Ethiopian Banks" },
                { icon: BadgeCheck, label: "Official Ministry of Education Books" },
              ].map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs"
                >
                  <s.icon className="size-3.5 text-brand-gold shrink-0" />
                  <span>{s.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Verified Campus Student Spotlight */}
          <div className="mt-10 lg:mt-0 lg:col-span-5 relative section-enter delay-150">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Subtle ambient illumination behind card */}
              <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-brand-gold/15 to-brand-navy/10 blur-2xl opacity-70" />

              {/* Main Verified Student Showcase Frame */}
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 border border-slate-100">
                <img
                  src={heroImg}
                  alt="Ethiopian university student studying for Exit Exam in campus library"
                  width={1280}
                  height={1024}
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />

                {/* Top Floating Badge: MoE Accreditation Standard */}
                <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 rounded-xl bg-white/95 backdrop-blur-md px-3.5 py-2 shadow-lg border border-slate-200/80">
                  <div className="size-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <ShieldCheck className="size-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-brand-navy leading-none">MoE 2017 E.C. Syllabus</p>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">Accredited Exit Exam Material</p>
                  </div>
                </div>

                {/* Top Right Metric: Pass Rate */}
                <div className="absolute top-3.5 right-3.5 z-20 hidden sm:flex items-center gap-1.5 rounded-xl bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 shadow-lg border border-slate-700/60">
                  <Award className="size-3.5 text-brand-gold" />
                  <span className="text-[11px] font-bold">98.4% Pass Rate</span>
                </div>

                {/* Bottom Floating Card: Live Payout Verified Transaction Toast */}
                <div className="absolute bottom-3.5 inset-x-3.5 rounded-xl bg-white/95 backdrop-blur-md p-3.5 shadow-xl border border-slate-200/90 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-600/20">
                      <Landmark className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Bank Settlement
                      </p>
                      <p className="text-xs font-bold text-slate-900 truncate">
                        250 ETB transferred to CBE Account
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        Abebe B. · Addis Ababa University (Freshman)
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
                    ✓ Settled
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Platform Stats Bar ───────────────────────────────────────── */}
      <section className="mx-auto -mt-6 sm:-mt-10 max-w-7xl px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
          {[
            {
              icon: BookOpen,
              label: "MoE Textbooks",
              value: String(stats.bookCount),
              sub: "Full curriculum verified",
              color: "bg-brand-navy text-white shadow-brand-navy/30",
            },
            {
              icon: ClipboardList,
              label: "Chapter Mock Exams",
              value: String(stats.chapterExamCount),
              sub: "With instant scoring & XP",
              color: "bg-brand-gold text-white shadow-brand-gold/30",
            },
            {
              icon: GraduationCap,
              label: "Core Courses",
              value: String(stats.courseCount),
              sub: "Natural & Social Sciences",
              color: "bg-emerald-600 text-white shadow-emerald-600/30",
            },
            {
              icon: Coins,
              label: "Paid to Students",
              value: "48,200+ ETB",
              sub: "To 15+ Ethiopian banks",
              color: "bg-purple-600 text-white shadow-purple-600/30",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="card-iso-3d flex items-center gap-3.5 sm:gap-5 rounded-2xl bg-white p-4 sm:p-5 border border-slate-200/80 cursor-default"
            >
              <div
                className={`size-11 sm:size-13 rounded-2xl grid place-items-center text-lg ${s.color} shrink-0 shadow-md`}
              >
                <s.icon className="size-5 sm:size-6" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold font-serif text-brand-navy leading-none">
                  {s.value}
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1 truncate">{s.label}</p>
                <p className="text-[10px] text-slate-400 truncate hidden sm:block">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── OFFICIAL ETHIOPIAN BANK PAYOUT SHOWCASE ─────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-amber-50/20 p-6 sm:p-10 lg:p-12 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-72 rounded-full bg-brand-gold/10 blur-3xl" />

          <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-center">
            {/* Left Column: Bank Explainer */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/80 px-3.5 py-1 text-xs font-bold text-amber-900 border border-amber-200 shadow-2xs">
                <Landmark className="size-3.5 text-brand-gold" />
                Real Financial Rewards
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-navy leading-tight">
                Direct Cash Payouts to Any Ethiopian Bank or Mobile Wallet
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                Study2Earn is the first education platform in Ethiopia that pays you real Birr for
                studying. Convert verified reading minutes and mock exam high scores into cash.
                We deposit directly to your bank account with zero transaction fees.
              </p>

              {/* Bank logos showcase tiles */}
              <div className="pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Supported Ethiopian Financial Institutions:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                  {FEATURED_BANKS.map((bank) => (
                    <div
                      key={bank.id}
                      className="bank-pill-3d group flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white p-2"
                    >
                      <BankLogo bank={bank} size="sm" className="border-0 shadow-none" />
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                        {bank.short}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guarantees */}
              <div className="pt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-600" /> 0% Transaction Fees
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Minimum 50 ETB Payout
                </span>
                <span className="flex items-center gap-1.5 font-semibold">
                  <CheckCircle2 className="size-4 text-emerald-600" /> Telebirr & CBE Birr Ready
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Conversion Calculator & Study Earnings Card */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xl relative preserve-3d">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                      Official Conversion Calculator
                    </p>
                    <h3 className="font-serif text-lg font-bold text-brand-navy">
                      Study XP → Birr Earnings Simulator
                    </h3>
                  </div>
                  <span className="rounded-full bg-brand-gold/15 px-2.5 py-1 text-xs font-mono font-bold text-amber-900 border border-brand-gold/30">
                    8 XP = 1 ETB
                  </span>
                </div>

                {/* Editorial Study Earnings Card */}
                <div className="py-4">
                  <StudyEarningsCard xp={calcXp} etb={calculatedEtb} />
                </div>

                {/* Slider */}
                <div className="pt-1 pb-4 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-500">Selected Study XP:</span>
                    <span className="text-2xl font-bold font-serif text-brand-navy tabular-nums">
                      {calcXp.toLocaleString()} <span className="text-xs text-brand-gold font-sans font-bold">XP</span>
                    </span>
                  </div>

                  <input
                    type="range"
                    min={400}
                    max={8000}
                    step={200}
                    value={calcXp}
                    onChange={(e) => setCalcXp(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer h-2.5 bg-slate-100 rounded-lg shadow-inner"
                  />

                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>400 XP (50 ETB)</span>
                    <span>4,000 XP (500 ETB)</span>
                    <span>8,000 XP (1,000 ETB)</span>
                  </div>

                  {/* Result Box */}
                  <div className="rounded-xl bg-gradient-to-br from-brand-navy via-[#1e2a56] to-[#121c3b] p-4 text-white flex items-center justify-between shadow-lg shadow-brand-navy/20">
                    <div>
                      <p className="text-[11px] text-white/70 font-medium">Estimated Withdrawable Cash</p>
                      <p className="font-serif text-3xl font-bold text-brand-gold tabular-nums">
                        {calculatedEtb}{" "}
                        <span className="text-sm font-sans font-bold text-white">ETB</span>
                      </p>
                    </div>
                    <Link
                      to="/rewards"
                      className="btn-3d-gold rounded-lg px-4 py-2.5 text-xs font-bold text-slate-950 transition"
                    >
                      Withdraw →
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Earn XP by reading MoE books (50 XP / 30 min) and completing chapter mock exams (up to 200 XP).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AI STUDY HUB SPOTLIGHT ──────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="rounded-3xl bg-gradient-to-br from-brand-navy via-[#1e2d5c] to-[#162042] p-6 sm:p-10 lg:p-12 text-white relative overflow-hidden shadow-2xl">
          {/* Futuristic ambient energy orbs */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-brand-gold/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
            {/* Left Column: AI Study sets info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-brand-gold border border-brand-gold/30">
                <Sparkles className="size-3.5 text-brand-gold" />
                Curriculum-Trained AI Study Sets
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                Convert Lecture Slides & Course PDFs into High-Yield Flashcards and Practice Quizzes
              </h2>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Upload your freshman course handouts, lecture slides, or past exam documents.
                Our AI Study engine automatically extracts key concepts, generates interactive
                flashcards, multiple-choice quizzes, and exam cheat sheets customized for Ethiopian universities.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                {[
                  {
                    icon: Layers,
                    title: "Smart Flashcards",
                    desc: "Interactive concept recall with mastery tracking",
                  },
                  {
                    icon: ClipboardList,
                    title: "AI Quiz Generator",
                    desc: "Exit Exam style MCQs with rationale",
                  },
                  {
                    icon: Zap,
                    title: "Instant Summaries",
                    desc: "High-yield formulas & definitions",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl bg-white/5 border border-white/10 p-3.5 transition hover:bg-white/10"
                  >
                    <item.icon className="size-5 text-brand-gold mb-2" />
                    <p className="text-xs font-bold text-white">{item.title}</p>
                    <p className="text-[11px] text-white/60 mt-0.5 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <Link
                  to="/ai-study"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-gold px-6 py-3.5 font-bold text-slate-950 hover:brightness-110 transition shadow-lg shadow-brand-gold/25"
                >
                  <Sparkles className="size-4" />
                  Try AI Study Sets Now
                </Link>
                <span className="text-xs text-white/50">Supports PDF, PPTX, DOCX, TXT & Audio</span>
              </div>
            </div>

            {/* Right Column: Real Interactive Flip Card */}
            <div className="mt-8 lg:mt-0 lg:col-span-5 perspective-1000">
              <div
                onClick={() => setIsCardFlipped(!isCardFlipped)}
                className={cn(
                  "relative w-full min-h-[320px] cursor-pointer transition-transform duration-700 preserve-3d select-none",
                  isCardFlipped ? "rotate-y-180" : ""
                )}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setIsCardFlipped(!isCardFlipped);
                  }
                }}
                aria-label="3D AI Flashcard. Click to flip between question and formula derivation."
              >
                {/* ── Front Face ── */}
                <div className="absolute inset-0 backface-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-white/15">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-brand-gold/25 text-brand-gold font-mono text-[10px] font-bold px-2 py-0.5 border border-brand-gold/40 shadow-xs">
                        PHYS 1011
                      </span>
                      <span className="text-xs font-bold text-white">General Physics — Mechanics</span>
                    </div>
                    <span className="text-[10px] text-white/70 font-mono">Card 1 of 18 · Exit Exam Prep</span>
                  </div>

                  <div className="py-4 space-y-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-brand-gold flex items-center justify-center gap-1.5">
                      <Sparkles className="size-3" />
                      Exit Exam Concept Prompt
                    </p>
                    <p className="font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                      "State the Work-Energy Theorem for variable forces and define the exact condition for conservation of mechanical energy."
                    </p>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/20 px-3.5 py-1 text-[11px] font-bold text-brand-gold border border-brand-gold/40">
                      <RotateCcw className="size-3" />
                      <span>Click anywhere to reveal derivation ↻</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/75 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <span className="size-2 rounded-full bg-emerald-400" />
                      Concept Mastery: 85%
                    </span>
                    <span className="text-brand-gold font-bold">+50 XP on completion</span>
                  </div>
                </div>

                {/* ── Back Face (Derivation & Formula) ── */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl border border-brand-gold/40 bg-gradient-to-br from-[#1b264e] via-[#151f40] to-[#0e1630] backdrop-blur-md p-6 shadow-2xl flex flex-col justify-between text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-white/15">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold px-2 py-0.5 border border-emerald-500/30">
                        SOLUTION DERIVATION
                      </span>
                      <span className="text-xs font-bold text-brand-gold">Analytical Proof</span>
                    </div>
                    <RotateCcw className="size-3.5 text-brand-gold" />
                  </div>

                  <div className="space-y-2.5 py-2">
                    <p className="text-xs font-mono text-cyan-300 bg-black/40 rounded-lg p-2.5 border border-cyan-500/20">
                      W_net = ∫[r₁→r₂] F·dr = m ∫[v₁→v₂] v·dv = ½mv₂² - ½mv₁² = ΔK
                    </p>
                    <div className="text-[12px] text-white/80 space-y-1">
                      <p>
                        <strong className="text-white">Conservation Condition:</strong> Holds when non-conservative work <code className="text-amber-300">W_nc = 0</code> (conservative field only), giving <code className="text-amber-300">ΔK + ΔU = 0 → E₁ = E₂</code>.
                      </p>
                      <p className="text-[11px] text-emerald-400 font-semibold">
                        ✓ Verified MoE Exit Exam High-Yield Formula (AAU & ASTU syllabus)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/70 pt-2 border-t border-white/10">
                    <span className="text-[10px] text-brand-gold">Click to flip back to question</span>
                    <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] text-white">Press Space / Tap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── COLLECTIBLE PROFILE FRAMES SHOWCASE ─────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-bold text-amber-900 border border-brand-gold/30 mb-2.5">
            <Trophy className="size-3.5 text-brand-gold" />
            Exclusive Academic Collectibles
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-navy">
            Showcase Your Distinction with Academic Insignias
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
            Climb the Ethiopian university leaderboard, earn XP, and unlock prestigious collectible
            insignia frames awarded for verified academic excellence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SHOWCASE_FRAMES.map((f) => (
            <div
              key={f.id}
              className="card-iso-3d rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center group"
            >
              <div className="mb-3">
                <span
                  className={cn(
                    "inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                    f.badge,
                  )}
                >
                  {f.rarityLabel}
                </span>
              </div>

              {/* Scholar Insignia Frame Showcase */}
              <div className="my-3 relative flex items-center justify-center">
                <div className="absolute size-20 rounded-full bg-slate-100 -z-0 group-hover:scale-110 transition-transform duration-300" />
                <div className="relative z-10 transition-transform duration-200 group-hover:scale-105">
                  <ProfileFrameAvatar
                    initials={f.initials}
                    frameId={f.id}
                    size="md"
                    equipped
                  />
                </div>
              </div>

              <h3 className="font-serif font-bold text-base text-brand-navy mt-4">{f.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{f.student}</p>
              <p className="text-[11px] text-slate-400">{f.uni}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 w-full flex items-center justify-center gap-1 text-[11px] font-bold text-brand-gold">
                <Sparkles className="size-3" />
                <span>Earnable via Study XP</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/rewards"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-navy hover:text-brand-gold underline decoration-brand-gold underline-offset-4 transition-colors"
          >
            <span>Explore All Collectible Frames in Rewards Catalog</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-20 border-t border-slate-200/80">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
            How Study2Earn Works
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-500">
            Three simple steps from opening your first book to receiving your bank transfer.
          </p>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Connector line for desktop */}
          <div className="hidden md:block absolute top-14 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-brand-gold/30 via-brand-gold/60 to-brand-gold/30" />

          {[
            {
              n: "01",
              t: "Study Verified MoE Books",
              d: "Read official Ministry of Education textbooks organized by chapter. Earn 50 XP for every 30 minutes of verified study time.",
            },
            {
              n: "02",
              t: "Take Timed Mock Exams",
              d: "Simulate authentic Exit Exam pressure with chapter MCQs, instant explanations, and mistake tracking. Earn up to 200 XP per test.",
            },
            {
              n: "03",
              t: "Withdraw Cash to Your Bank",
              d: "Exchange your XP for Ethiopian Birr (8 XP = 1 ETB) and withdraw to CBE, Awash, Dashen, or Telebirr with zero deductions.",
            },
          ].map((step) => (
            <div
              key={step.n}
              className="card-iso-3d rounded-2xl bg-white border border-slate-200/80 p-6 sm:p-8 relative group"
            >
              <div className="size-12 sm:size-14 rounded-2xl bg-brand-navy text-brand-gold grid place-items-center font-serif text-xl sm:text-2xl font-bold mb-5 shadow-sm border border-brand-navy/15 group-hover:scale-105 transition-transform">
                {step.n}
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-navy">{step.t}</h3>
              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── MoE Subject Library ─────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
              Freshman Subject Library
            </h2>
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
              Official Ministry of Education textbooks and course materials.
            </p>
          </div>
          <Link
            to="/library"
            className="text-xs sm:text-sm font-bold text-brand-navy underline decoration-brand-gold underline-offset-4 hover:text-brand-gold transition-colors"
          >
            View All Books →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-6">
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

      {/* ─── Exit Exam Mock Simulation CTA ───────────────────────────── */}
      <section className="bg-gradient-to-b from-brand-navy via-[#1b2752] to-[#162042] py-20 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-brand-gold/15 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center text-center relative z-10">
          <div className="size-16 rounded-2xl bg-white/10 flex items-center justify-center mb-7 ring-1 ring-white/20 shadow-lg">
            <ClipboardList className="size-8 text-brand-gold" />
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-5 max-w-3xl">
            Simulate the Real Ethiopian University Exit Exam Environment
          </h2>
          <p className="text-slate-300 text-base sm:text-lg mb-9 max-w-2xl leading-relaxed">
            Practice under strict national exam conditions. Real timed questions, automated grading,
            instant rationales for wrong answers, and comprehensive mistake review.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/exams"
              className="bg-brand-gold px-9 py-4 rounded-xl font-bold text-white transition hover:scale-105 hover:brightness-110 shadow-xl shadow-brand-gold/25"
            >
              Start Free Mock Exam
            </Link>
            <Link
              to="/exams/mistakes"
              className="bg-white/10 border border-white/20 px-8 py-4 rounded-xl font-bold text-white transition hover:bg-white/20"
            >
              Mistake Notebook
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-12 text-sm text-slate-300">
            {[
              "Official Past Exit Questions",
              "Authentic Time Limits",
              "National Rank Scoreboard",
              "XP Rewards on Pass",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 font-medium">
                <span className="text-brand-gold font-bold">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── National Leaderboard Teaser ─────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="size-5 text-brand-gold" />
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
              National Top Scholars
            </h2>
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider bg-brand-gold/10 text-amber-900 border-brand-gold/20">
              Live Ranking
            </Badge>
          </div>
          <p className="text-slate-500 text-sm">
            Top freshman scholars competing across Addis Ababa, Jimma, Bahir Dar, Hawassa, and Mekelle.
          </p>
        </div>

        {/* Collegiate Top Scholar Podiums */}
        <div className="flex items-end justify-center gap-3 sm:gap-6 mb-10">
          {/* 2nd place (Silver Scholar) */}
          {top3[1] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[170px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                <Medal className="size-3 text-slate-400" /> Silver Rank
              </span>
              <div className="transition-transform hover:scale-105">
                <ProfileFrameAvatar
                  initials={top3[1].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  size="md"
                />
              </div>
              <p className="text-xs font-bold text-center text-slate-800 leading-tight">
                {top3[1].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-400 text-center truncate w-full">{top3[1].uni}</p>
              <p className="text-[10px] text-slate-500 font-mono font-bold">
                {top3[1].xp.toLocaleString()} XP
              </p>
              {/* Silver Pedestal Card */}
              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-gradient-to-b from-slate-100 to-slate-200 border-t-2 border-slate-300 p-3 flex flex-col items-center justify-center text-slate-800 shadow-sm">
                <span className="text-2xl sm:text-3xl font-serif font-black text-slate-700">2</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Silver</span>
              </div>
            </div>
          )}

          {/* 1st place (Gold Scholar Champion) */}
          {top3[0] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[180px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300 shadow-2xs">
                <Trophy className="size-3.5 text-amber-600" /> Champion
              </span>
              <div className="transition-transform hover:scale-105">
                <ProfileFrameAvatar
                  initials={top3[0].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  frameId="golden-scholar"
                  size="lg"
                  equipped
                />
              </div>
              <p className="text-xs font-bold text-center text-brand-navy leading-tight">
                {top3[0].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-400 text-center truncate w-full">{top3[0].uni}</p>
              <p className="text-[10px] text-brand-gold font-mono font-bold">
                {top3[0].xp.toLocaleString()} XP
              </p>
              {/* Gold Pedestal Card */}
              <div className="w-full h-32 sm:h-38 rounded-t-2xl bg-gradient-to-b from-brand-navy to-[#121c3b] border-t-2 border-brand-gold p-4 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-3xl sm:text-4xl font-serif font-black text-brand-gold">1</span>
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest mt-1">Champion</span>
              </div>
            </div>
          )}

          {/* 3rd place (Bronze Scholar) */}
          {top3[2] && (
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[170px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                <Medal className="size-3 text-amber-700" /> Bronze Rank
              </span>
              <div className="transition-transform hover:scale-105">
                <ProfileFrameAvatar
                  initials={top3[2].name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  size="md"
                />
              </div>
              <p className="text-xs font-bold text-center text-slate-800 leading-tight">
                {top3[2].name.split(" ")[0]}
              </p>
              <p className="text-[10px] text-slate-400 text-center truncate w-full">{top3[2].uni}</p>
              <p className="text-[10px] text-amber-800 font-mono font-bold">
                {top3[2].xp.toLocaleString()} XP
              </p>
              {/* Bronze Pedestal Card */}
              <div className="w-full h-20 sm:h-24 rounded-t-2xl bg-gradient-to-b from-amber-50 to-amber-100 border-t-2 border-amber-300 p-3 flex flex-col items-center justify-center text-amber-950 shadow-sm">
                <span className="text-2xl font-serif font-black text-amber-900">3</span>
                <span className="text-[9px] font-bold text-amber-800 uppercase tracking-widest mt-0.5">Bronze</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <Link
            to="/leaderboard"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-navy hover:text-brand-gold underline decoration-brand-gold underline-offset-4 transition-colors"
          >
            <span>View Full National & University Leaderboards</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ─── Student Testimonials ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16 sm:pb-24 border-t border-slate-200/80 pt-16">
        <div className="text-center mb-12">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
            Trusted by Freshman Students Across Ethiopia
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Real feedback from students studying at government universities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.author}
              className="card-iso-3d rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all"
            >
              <div>
                <div className="flex gap-1 text-amber-400 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-brand-navy">{t.author}</p>
                  <p className="text-[11px] text-slate-500">{t.university}</p>
                  <p className="text-[10px] text-slate-400">{t.department}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    +{t.withdrawn} Paid
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ Section ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 sm:px-6 pb-20 sm:pb-28">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-navy">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Everything an Ethiopian freshman needs to know about Study2Earn.
          </p>
        </div>
        <FaqList faqs={faqs} />
      </section>

      {/* ─── Final CTA Banner ────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-brand-navy via-[#1e2d5c] to-brand-navy p-8 sm:p-12 text-white text-center shadow-xl relative overflow-hidden">
          <div className="pointer-events-none absolute -right-20 -bottom-20 size-64 bg-brand-gold/20 rounded-full blur-3xl" />
          <h2 className="font-serif text-2xl sm:text-4xl font-bold mb-3">
            Start Preparing for Your Exit Exam Today
          </h2>
          <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto mb-8">
            Join thousands of Ethiopian university freshmen. Study verified MoE books, pass mock exams,
            and earn withdrawable cash.
          </p>
          <Link
            to="/register"
            search={{ ref: undefined, redirect: undefined }}
            className="btn-3d-gold inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold text-slate-950 transition"
          >
            <span>Create Free Student Account</span>
            <ArrowRight className="size-4" />
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
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
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
