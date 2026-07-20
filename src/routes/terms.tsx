import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Coins, FileText, Mail, Shield, Users } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Study2Earn" },
      {
        name: "description",
        content:
          "Terms of Service for Study2Earn — the Ethiopian freshman Exit Exam preparation platform.",
      },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  { id: "eligibility", label: "1. Eligibility" },
  { id: "account", label: "2. Account" },
  { id: "rewards", label: "3. Rewards & Payouts" },
  { id: "content", label: "4. Content" },
  { id: "prohibited", label: "5. Prohibited Uses" },
  { id: "disclaimer", label: "6. Disclaimer" },
  { id: "changes", label: "7. Changes to Terms" },
  { id: "contact", label: "8. Contact" },
];

function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <div className="relative overflow-hidden bg-brand-navy px-6 py-14 text-white">
          <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-brand-gold/10 blur-3xl" />
          <div className="relative mx-auto max-w-3xl">
            <Link
              to="/"
              className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Back to home
            </Link>
            <div className="mb-4 flex items-center gap-3">
              <div className="size-10 rounded-xl bg-white/10 grid place-items-center">
                <FileText className="size-5 text-brand-gold" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold">Terms of Service</h1>
                <p className="text-sm text-white/50">
                  Last updated: June 2026 · Effective immediately
                </p>
              </div>
            </div>
            <p className="mt-2 text-white/60 max-w-lg text-sm leading-relaxed">
              By accessing or using Study2Earn you agree to be bound by these terms. Please read
              them carefully.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
            {/* Sticky TOC */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 space-y-1">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Contents
                </p>
                {SECTIONS.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="block rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-white hover:text-brand-navy"
                  >
                    {s.label}
                  </a>
                ))}
              </nav>
            </aside>

            {/* Content */}
            <div className="space-y-10 text-sm leading-relaxed text-slate-600">
              <Section id="eligibility" icon={Users} title="1. Eligibility">
                <p>
                  Study2Earn is designed for Ethiopian university students preparing for the
                  national freshman Exit Exam. You must be at least 15 years old to create an
                  account. By registering, you confirm that all information you provide is accurate
                  and up to date.
                </p>
                <p className="mt-3">
                  During the preview season, access is open to all students on a first-come basis.
                  Commercial use (reselling content, automated access, or bulk scraping) is not
                  permitted.
                </p>
              </Section>

              <Section id="account" icon={Shield} title="2. Account">
                <p>
                  You are responsible for maintaining the confidentiality of your login credentials.
                  Do not share your account with others. Notify us immediately at{" "}
                  <a
                    href="mailto:support@study2earn.et"
                    className="font-semibold text-brand-navy hover:underline"
                  >
                    support@study2earn.et
                  </a>{" "}
                  if you suspect unauthorised access.
                </p>
                <p className="mt-3">
                  We reserve the right to suspend or terminate accounts that violate these terms,
                  including accounts showing signs of automated activity or fraudulent XP
                  accumulation.
                </p>
              </Section>

              <Section id="rewards" icon={Coins} title="3. Rewards & Payouts">
                <p>
                  XP earned through verified reading time and mock exam performance can be redeemed
                  for catalog items or withdrawn as ETB at a rate of{" "}
                  <strong className="text-brand-navy">8 XP = 1 ETB</strong>. The minimum withdrawal
                  threshold is <strong className="text-brand-navy">50 ETB (400 XP)</strong>.
                </p>
                <ul className="mt-3 space-y-2 list-none">
                  {[
                    "Withdrawal requests are subject to identity verification before the first payout.",
                    "XP earned through referrals is contingent on the referred user completing a verified exam attempt.",
                    "Study2Earn reserves the right to revoke XP or freeze accounts where fraudulent activity is detected.",
                    "Payout timelines are 3–5 business days after admin approval. Delays due to banking partners are outside our control.",
                    "Rewards are offered as incentives for genuine study activity, not as guaranteed financial instruments.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </Section>

              <Section id="content" icon={BookOpen} title="4. Content">
                <p>
                  All textbooks and course materials on Study2Earn are sourced from the official
                  Ministry of Education (MoE) freshman curriculum. Study2Earn is a supplementary
                  preparation tool and is not an official MoE product unless explicitly stated.
                </p>
                <p className="mt-3">
                  AI-generated MCQs and study summaries are produced algorithmically for educational
                  purposes. They reflect curriculum content but should not be treated as definitive
                  exam predictions. Study2Earn makes no guarantee that any specific question will
                  appear on the national exam.
                </p>
                <p className="mt-3">
                  Users may not reproduce, distribute, or commercially exploit any content from the
                  platform without written permission.
                </p>
              </Section>

              <Section id="prohibited" icon={Shield} title="5. Prohibited Uses">
                <p>You agree not to:</p>
                <ul className="mt-3 space-y-2 list-none">
                  {[
                    "Use automated scripts, bots, or other tools to artificially accumulate XP or manipulate leaderboard rankings.",
                    "Attempt to reverse-engineer, decompile, or exploit the platform's backend systems.",
                    "Upload content that is illegal, offensive, or violates third-party intellectual property rights.",
                    "Create multiple accounts to circumvent XP or referral limits.",
                    "Misrepresent your identity or impersonate another student or administrator.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">
                  Violations may result in immediate account suspension and forfeiture of all
                  accumulated XP and pending payouts.
                </p>
              </Section>

              <Section id="disclaimer" icon={FileText} title="6. Disclaimer">
                <p>
                  Study2Earn is provided <strong className="text-brand-navy">"as is"</strong> during
                  the preview season. We do not guarantee uninterrupted service, specific exam
                  results, or that content is free of errors. While we strive for accuracy, the
                  national Exit Exam is administered by the MoE and our practice questions are
                  illustrative only.
                </p>
                <p className="mt-3">
                  To the maximum extent permitted by Ethiopian law, Study2Earn and its operators are
                  not liable for any indirect, incidental, or consequential damages arising from
                  your use of the platform.
                </p>
              </Section>

              <Section id="changes" icon={FileText} title="7. Changes to Terms">
                <p>
                  We may update these terms from time to time. Material changes will be communicated
                  via email or an in-app notice at least 7 days before taking effect. Continued use
                  of the platform after the effective date constitutes acceptance of the updated
                  terms.
                </p>
              </Section>

              <Section id="contact" icon={Mail} title="8. Contact">
                <p>Questions about these terms? Reach us at:</p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-brand-navy">Study2Earn Support</p>
                  <a
                    href="mailto:support@study2earn.et"
                    className="text-brand-gold hover:underline font-medium"
                  >
                    support@study2earn.et
                  </a>
                  <p className="mt-1 text-xs text-slate-400">
                    We respond within 24 business hours.
                  </p>
                </div>
              </Section>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <p className="text-xs text-slate-400">Also read our</p>
                <Link
                  to="/privacy"
                  className="mt-1 inline-block font-semibold text-brand-navy hover:underline decoration-brand-gold underline-offset-4"
                >
                  Privacy Policy →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-8 rounded-lg bg-brand-navy/5 grid place-items-center shrink-0">
          <Icon className="size-4 text-brand-navy" />
        </div>
        <h2 className="font-serif text-lg font-bold text-brand-navy">{title}</h2>
      </div>
      <div className="pl-11">{children}</div>
    </section>
  );
}
