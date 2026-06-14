import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Study2Earn" },
      {
        name: "description",
        content: "Your academic info, notification preferences, and account settings.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <header className="mb-10 flex items-center gap-6">
            <div className="size-24 rounded-full bg-gradient-to-br from-brand-navy to-brand-gold outline outline-4 outline-offset-2 outline-brand-gold/30" />
            <div>
              <h1 className="font-serif text-4xl font-bold text-brand-navy">Abebe Balcha</h1>
              <p className="text-slate-600">Addis Ababa University • Civil Engineering</p>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className="px-2 py-0.5 bg-brand-gold/10 text-brand-gold font-bold rounded uppercase">
                  Year 1
                </span>
                <span className="text-slate-500">Joined March 2026</span>
              </div>
            </div>
          </header>

          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Account">
              <Field label="Full name" value="Abebe Balcha" />
              <Field label="Email" value="abebe.balcha@aau.edu.et" />
              <Field label="Phone" value="+251 91 234 5678" />
              <Field label="University" value="Addis Ababa University" />
              <Field label="Track" value="Engineering" />
            </Card>

            <Card title="Notifications">
              <Toggle label="Daily study reminder" defaultChecked />
              <Toggle label="Streak warning" defaultChecked />
              <Toggle label="New exam released" defaultChecked />
              <Toggle label="Leaderboard rank changes" />
              <Toggle label="Reward delivery emails" defaultChecked />
            </Card>

            <Card title="Study preferences">
              <Field label="Daily goal" value="60 minutes" />
              <Field label="Preferred subjects" value="Engineering, Mathematics" />
              <Field label="Language" value="English / አማርኛ" />
            </Card>

            <Card title="Security">
              <button className="w-full text-left py-3 border-b border-slate-100 text-sm font-medium hover:text-brand-navy">
                Change password
              </button>
              <button className="w-full text-left py-3 border-b border-slate-100 text-sm font-medium hover:text-brand-navy">
                Two-factor authentication
              </button>
              <button className="w-full text-left py-3 border-b border-slate-100 text-sm font-medium hover:text-brand-navy">
                Sign out everywhere
              </button>
              <button className="w-full text-left py-3 text-sm font-medium text-red-600 hover:underline">
                Delete account
              </button>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-6">
      <h2 className="font-serif text-xl font-bold text-brand-navy mb-4">{title}</h2>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="accent-brand-navy size-4" />
    </label>
  );
}
