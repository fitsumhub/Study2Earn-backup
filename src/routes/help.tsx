import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Award,
  BookOpen,
  ClipboardList,
  Coins,
  Gift,
  Mail,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help Center — Study2Earn" },
      { name: "description", content: "Get help using Study2Earn for Exit Exam preparation." },
    ],
  }),
  component: HelpPage,
});

type FaqCategory = "All" | "Earning XP" | "Exams" | "Library" | "Rewards" | "Account";

interface Faq {
  q: string;
  a: string;
  category: FaqCategory;
}

const faqs: Faq[] = [
  {
    category: "Earning XP",
    q: "How do I earn XP?",
    a: "You earn XP in three ways: reading books in the Library (5 XP per 30 seconds of verified reading time), passing mock exams (5 XP per 10% score, plus a 25 XP first-completion bonus), and referring friends who sign up and complete an exam.",
  },
  {
    category: "Rewards",
    q: "How does XP convert to ETB?",
    a: "8 XP = 1 ETB. You can redeem XP for catalog items (airtime, vouchers, badges) on the Rewards page, or request a direct bank withdrawal with a minimum of 50 ETB. Withdrawals are processed within 3–5 business days.",
  },
  {
    category: "Account",
    q: "Why can't I see the Leaderboard or Rewards page?",
    a: "These features require a free account. Sign up or log in — the lock icon next to those nav links will disappear, and you'll be redirected back to the page you were trying to access.",
  },
  {
    category: "Library",
    q: "How does the reading timer work?",
    a: "The timer runs automatically whenever you have a PDF open and the tab is visible. It ticks every 30 seconds of verified reading time and awards 5 XP per tick. If you switch tabs or minimize the browser, the timer pauses — we only count real attention time.",
  },
  {
    category: "Earning XP",
    q: "How do referrals work?",
    a: "Go to the Rewards page to copy your unique referral code. Share it with a friend — when they sign up using your code, you both earn bonus XP immediately. Hitting 3, 5, and 10 referrals unlocks additional milestone bonuses.",
  },
  {
    category: "Rewards",
    q: "When are withdrawal requests processed?",
    a: "Bank withdrawals require a minimum of 50 ETB (400 XP). Once submitted, an admin reviews and approves the request within 3–5 business days. You'll see the status change from 'Pending' to 'Approved' to 'Paid' on the Rewards page.",
  },
  {
    category: "Exams",
    q: "What score do I need to pass a mock exam?",
    a: "You need at least 60% to mark a chapter as complete. Passing for the first time gives you a bonus XP reward on top of your score-based XP. You can retake exams as many times as you like — each attempt generates a fresh set of questions.",
  },
  {
    category: "Exams",
    q: "Are the mock exam questions the same as the real Exit Exam?",
    a: "The questions are built from the official Ministry of Education curriculum and past-paper question banks, so they closely mirror the style, difficulty, and topics of the national Exit Exam. New questions are added regularly.",
  },
  {
    category: "Library",
    q: "Which textbooks are available in the Library?",
    a: "The Library contains all core freshman subjects: Physics, Biology, Chemistry, Mathematics, History & Civics, English, Economics, Psychology, Geography, and more — all sourced from the official MoE curriculum.",
  },
  {
    category: "Earning XP",
    q: "Is there a daily XP cap?",
    a: "There is no hard daily cap, but the reading timer awards XP only for verified attention time (tab must be active). Exam XP is capped per attempt. Referral XP has a lifetime milestone structure.",
  },
  {
    category: "Account",
    q: "How do I reset my password?",
    a: "On the login screen, click 'Forgot password?' and enter your registered email. You'll receive a reset link within a few minutes. If you don't see it, check your spam folder.",
  },
  {
    category: "Account",
    q: "Can I use Study2Earn on my phone?",
    a: "Yes — Study2Earn is fully responsive and works on any modern browser including Chrome, Firefox, and Safari on Android and iOS. A dedicated mobile app is planned for a future release.",
  },
];

const CATEGORIES: FaqCategory[] = ["All", "Earning XP", "Exams", "Library", "Rewards", "Account"];

const categoryIcon: Record<FaqCategory, typeof BookOpen> = {
  All: Search,
  "Earning XP": Zap,
  Exams: ClipboardList,
  Library: BookOpen,
  Rewards: Gift,
  Account: Shield,
};

const quickLinks = [
  {
    to: "/library",
    icon: BookOpen,
    label: "Browse Library",
    desc: "Read MoE textbooks",
    color: "bg-blue-50 text-blue-700 border-blue-100",
  },
  {
    to: "/exams",
    icon: ClipboardList,
    label: "Mock Exams",
    desc: "Practice with MCQs",
    color: "bg-violet-50 text-violet-700 border-violet-100",
  },
  {
    to: "/rewards",
    icon: Gift,
    label: "Rewards",
    desc: "Redeem your XP",
    color: "bg-amber-50 text-amber-700 border-amber-100",
  },
  {
    to: "/ai-study",
    icon: Sparkles,
    label: "AI Study",
    desc: "Upload & get MCQs",
    color: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
  {
    to: "/leaderboard",
    icon: Users,
    label: "Leaderboard",
    desc: "National rankings",
    color: "bg-pink-50 text-pink-700 border-pink-100",
  },
  {
    to: "/profile",
    icon: Award,
    label: "Your Profile",
    desc: "Badges & settings",
    color: "bg-orange-50 text-orange-700 border-orange-100",
  },
];

function HelpPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return faqs.filter((f) => {
      const matchCat = activeCategory === "All" || f.category === activeCategory;
      const matchQ = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* ── Hero banner ── */}
        <div className="relative overflow-hidden bg-brand-navy px-6 py-14 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 size-48 rounded-full bg-white/5 blur-2xl" />
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-brand-gold">
              <MessageCircle className="size-3.5" /> Help Center
            </div>
            <h1 className="font-serif text-4xl font-bold">How can we help you?</h1>
            <p className="mt-2 text-white/60 max-w-lg">
              Answers to the most common questions about studying, earning XP, and redeeming rewards
              on Study2Earn.
            </p>
            {/* Search bar */}
            <div className="relative mt-6 max-w-lg">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search questions…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 bg-white text-slate-800 border-0 shadow-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
          {/* Quick nav links */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Quick navigation
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5",
                    l.color,
                  )}
                >
                  <l.icon className="size-5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm">{l.label}</p>
                    <p className="text-[11px] opacity-70 truncate">{l.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ section */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Frequently asked questions
            </h2>

            {/* Category pills */}
            <div className="mb-5 flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = categoryIcon[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                      activeCategory === cat
                        ? "bg-brand-navy text-white border-brand-navy shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-brand-navy/30 hover:text-brand-navy",
                    )}
                  >
                    <Icon className="size-3.5" />
                    {cat}
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
                <Search className="size-10 mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-600">No results found</p>
                <p className="text-sm text-slate-400 mt-1">Try a different keyword or category.</p>
              </div>
            ) : (
              <Accordion type="multiple" className="space-y-3">
                {filtered.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={String(i)}
                    className="rounded-2xl border border-slate-100 bg-white px-6 shadow-sm overflow-hidden data-[state=open]:border-brand-gold/30 data-[state=open]:shadow-md transition-all"
                  >
                    <AccordionTrigger className="py-5 text-left font-semibold text-brand-navy hover:no-underline hover:text-brand-navy/80 [&[data-state=open]]:text-brand-navy">
                      <span className="flex items-center gap-3 text-left">
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            activeCategory === "All"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-brand-gold/10 text-brand-gold",
                          )}
                        >
                          {item.category}
                        </span>
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm text-slate-600 leading-relaxed pl-2">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </section>

          {/* XP earning quick guide */}
          <section className="rounded-2xl border border-brand-gold/25 bg-gradient-to-br from-brand-gold/5 to-amber-50/40 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-8 rounded-lg bg-brand-gold/20 grid place-items-center">
                <Coins className="size-4 text-brand-gold" />
              </div>
              <h3 className="font-semibold text-brand-navy">Quick XP guide</h3>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: BookOpen,
                  label: "Read PDFs",
                  value: "5 XP / 30 sec",
                  desc: "Verified tab-active reading time",
                },
                {
                  icon: ClipboardList,
                  label: "Mock exams",
                  value: "Up to 200 XP",
                  desc: "5 XP per 10% score + first-pass bonus",
                },
                {
                  icon: Users,
                  label: "Refer friends",
                  value: "500 XP each",
                  desc: "When they complete their first exam",
                },
              ].map((e) => (
                <div
                  key={e.label}
                  className="rounded-xl bg-white/70 border border-brand-gold/15 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <e.icon className="size-4 text-brand-gold" />
                    <span className="text-xs font-bold text-slate-600">{e.label}</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-brand-navy">{e.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{e.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact CTA */}
          <div className="rounded-2xl bg-brand-navy p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-white/10 grid place-items-center shrink-0">
                <Mail className="size-6 text-brand-gold" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold">Still need help?</p>
                <p className="mt-0.5 text-sm text-white/70">
                  Email us at{" "}
                  <a
                    href="mailto:support@study2earn.et"
                    className="font-semibold text-brand-gold hover:underline"
                  >
                    support@study2earn.et
                  </a>{" "}
                  — we respond within 24 hours.
                </p>
              </div>
            </div>
            <Link
              to="/register"
              search={{ ref: undefined, redirect: undefined }}
              className="shrink-0 rounded-lg bg-brand-gold px-5 py-2.5 text-sm font-bold text-white hover:brightness-110 transition"
            >
              Create free account
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
