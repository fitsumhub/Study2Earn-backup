import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, Eye, FileText, Lock, Mail, Shield, Trash2 } from "lucide-react";

import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Study2Earn" },
      {
        name: "description",
        content: "Privacy Policy for Study2Earn — how we collect, use, and protect your data.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  { id: "collect", label: "1. What We Collect" },
  { id: "use", label: "2. How We Use It" },
  { id: "storage", label: "3. Data Storage" },
  { id: "sharing", label: "4. Data Sharing" },
  { id: "rights", label: "5. Your Rights" },
  { id: "cookies", label: "6. Cookies" },
  { id: "children", label: "7. Children's Privacy" },
  { id: "contact", label: "8. Contact" },
];

function PrivacyPage() {
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
                <Shield className="size-5 text-brand-gold" />
              </div>
              <div>
                <h1 className="font-serif text-3xl font-bold">Privacy Policy</h1>
                <p className="text-sm text-white/50">
                  Last updated: June 2026 · Effective immediately
                </p>
              </div>
            </div>
            <p className="mt-2 text-white/60 max-w-lg text-sm leading-relaxed">
              We are committed to protecting your personal information. This policy explains what we
              collect, how we use it, and your rights.
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
              <Section id="collect" icon={Database} title="1. What We Collect">
                <p>We collect only what is necessary to operate Study2Earn:</p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      label: "Account information",
                      desc: "Your name, email address, and university name when you register.",
                    },
                    {
                      label: "Study activity",
                      desc: "Reading time (seconds of verified PDF reading), mock exam scores, XP balance, and chapter completion status.",
                    },
                    {
                      label: "Referral data",
                      desc: "Your referral code usage and the accounts of referred users (first name only, for milestone tracking).",
                    },
                    {
                      label: "Withdrawal details",
                      desc: "Bank name and account number submitted for payout requests. Stored only for the purpose of processing approved payouts.",
                    },
                    {
                      label: "Device & usage data",
                      desc: "Browser type, approximate location (country-level), and page interaction events for performance monitoring.",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex gap-3 rounded-xl border border-slate-100 bg-white p-4"
                    >
                      <div className="mt-0.5 size-2 shrink-0 rounded-full bg-brand-gold" />
                      <div>
                        <p className="font-semibold text-brand-navy">{item.label}</p>
                        <p className="mt-0.5 text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>

              <Section id="use" icon={Eye} title="2. How We Use It">
                <p>Your data is used to:</p>
                <ul className="mt-3 space-y-2 list-none">
                  {[
                    "Authenticate your account and maintain your session.",
                    "Calculate XP earned, update your balance, and process reward redemptions.",
                    "Display your progress on the leaderboard (username and XP only — no contact information is visible to other users).",
                    "Send essential account emails (password reset, withdrawal confirmation).",
                    "Detect and prevent fraudulent XP accumulation or account abuse.",
                    "Improve platform features through aggregated, anonymised usage analytics.",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-navy" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-4">We do not use your data for targeted advertising.</p>
              </Section>

              <Section id="storage" icon={Lock} title="3. Data Storage">
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3 mb-4">
                  <p className="font-semibold text-amber-800 text-xs uppercase tracking-wider mb-1">
                    Preview season notice
                  </p>
                  <p>
                    During the current preview, study activity (XP, progress, reading time) is
                    stored in your browser's{" "}
                    <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                      localStorage
                    </code>
                    . This data is private to your device and is not transmitted to our servers
                    unless you submit a withdrawal or referral.
                  </p>
                </div>
                <p>
                  In the production release, all data will be stored on encrypted servers with
                  row-level security (each user can only access their own records). Bank details
                  submitted for withdrawals are encrypted at rest using AES-256 and are accessible
                  only to authorised admin accounts for payment processing.
                </p>
                <p className="mt-3">
                  We retain your account data for as long as your account is active. Inactive
                  accounts (no login for 24 months) may be deleted after 30 days' notice.
                </p>
              </Section>

              <Section id="sharing" icon={Shield} title="4. Data Sharing">
                <p>
                  We do not sell your personal data. We share data only in the following limited
                  circumstances:
                </p>
                <ul className="mt-3 space-y-2 list-none">
                  {[
                    {
                      who: "Payment processors",
                      why: "Bank name and account number are shared with Ethiopian banking partners solely to process approved withdrawal requests.",
                    },
                    {
                      who: "Infrastructure providers",
                      why: "Hosting and database providers process data on our behalf under strict data processing agreements.",
                    },
                    {
                      who: "Law enforcement",
                      why: "We may disclose data if required by Ethiopian law or a valid court order.",
                    },
                  ].map((item) => (
                    <li key={item.who} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span>
                        <strong className="text-brand-navy">{item.who}:</strong> {item.why}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section id="rights" icon={Trash2} title="5. Your Rights">
                <p>You have the right to:</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Access",
                      desc: "Request a copy of all personal data we hold about you.",
                    },
                    {
                      label: "Correct",
                      desc: "Update inaccurate information from the Profile page at any time.",
                    },
                    {
                      label: "Delete",
                      desc: "Request account deletion — all personal data removed within 30 days.",
                    },
                    {
                      label: "Withdraw",
                      desc: "Withdraw consent for optional data processing (e.g., analytics) at any time.",
                    },
                  ].map((right) => (
                    <div
                      key={right.label}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <p className="font-bold text-brand-navy">{right.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{right.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4">
                  To exercise any of these rights, email{" "}
                  <a
                    href="mailto:support@study2earn.et"
                    className="font-semibold text-brand-navy hover:underline"
                  >
                    support@study2earn.et
                  </a>
                  .
                </p>
              </Section>

              <Section id="cookies" icon={Database} title="6. Cookies">
                <p>Study2Earn uses minimal browser storage:</p>
                <ul className="mt-3 space-y-2 list-none">
                  {[
                    {
                      name: "study2earn-auth",
                      purpose: "Authentication session token. Expires on sign-out.",
                    },
                    {
                      name: "study2earn-theme",
                      purpose: "Your dark/light mode preference. Persists across sessions.",
                    },
                    {
                      name: "study2earn-*",
                      purpose:
                        "localStorage keys for XP, progress, and reading time (preview season only).",
                    },
                  ].map((c) => (
                    <li key={c.name} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
                      <span>
                        <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs">
                          {c.name}
                        </code>{" "}
                        — {c.purpose}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3">We do not use third-party advertising cookies.</p>
              </Section>

              <Section id="children" icon={Shield} title="7. Children's Privacy">
                <p>
                  Study2Earn is designed for university students aged 15 and older. We do not
                  knowingly collect personal data from users under 15. If you believe a minor has
                  registered, please contact us and we will delete their account promptly.
                </p>
              </Section>

              <Section id="contact" icon={Mail} title="8. Contact">
                <p>Privacy questions or data requests:</p>
                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <p className="font-semibold text-brand-navy">Study2Earn Data Team</p>
                  <a
                    href="mailto:support@study2earn.et"
                    className="text-brand-gold hover:underline font-medium"
                  >
                    support@study2earn.et
                  </a>
                  <p className="mt-1 text-xs text-slate-400">
                    We respond to data requests within 30 days as required.
                  </p>
                </div>
              </Section>

              <div className="rounded-xl border border-slate-200 bg-white p-5 text-center">
                <p className="text-xs text-slate-400">Also read our</p>
                <Link
                  to="/terms"
                  className="mt-1 inline-block font-semibold text-brand-navy hover:underline decoration-brand-gold underline-offset-4"
                >
                  Terms of Service →
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
