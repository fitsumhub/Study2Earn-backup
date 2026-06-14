import { Link, useRouterState } from "@tanstack/react-router";
import { Lock } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/library", label: "Library" },
  { to: "/exams", label: "Mock Exams" },
  { to: "/leaderboard", label: "Leaderboard", protected: true },
  { to: "/rewards", label: "Rewards", protected: true },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loggedIn, user } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded bg-brand-navy grid place-items-center text-white font-serif font-bold text-xl">
            S
          </div>
          <span className="font-serif text-xl font-bold tracking-tight text-brand-navy">
            Study2Earn
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {navItems.map((item) => {
            const active = pathname === item.to || pathname.startsWith(item.to + "/");
            const locked = item.protected && !loggedIn;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={
                  active
                    ? "text-brand-navy font-semibold"
                    : "hover:text-brand-navy transition-colors"
                }
              >
                <span className="inline-flex items-center gap-1">
                  {item.label}
                  {locked && <Lock className="size-3 text-brand-gold" />}
                </span>
              </Link>
            );
          })}
        </div>

        {loggedIn && user ? (
          <Link to="/profile" className="flex items-center gap-4">
            <div className="flex flex-col items-end leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                {user.xp.toLocaleString()} XP
              </span>
              <span className="text-xs font-medium">{user.name}</span>
            </div>
            <div className="size-10 rounded-full bg-gradient-to-br from-brand-navy to-brand-gold outline outline-2 outline-offset-2 outline-brand-gold/30" />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" search={{ redirect: undefined, ref: undefined }} className="text-sm font-medium text-slate-600 hover:text-brand-navy">
              Sign in
            </Link>
            <Link
              to="/register"
              search={{ ref: undefined, redirect: undefined }}
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:bg-brand-navy/90 transition"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-6 rounded bg-brand-navy/10 grid place-items-center text-brand-navy font-serif font-bold text-sm">
            S
          </div>
          <span className="font-serif text-lg font-bold tracking-tight text-brand-navy">
            Study2Earn
          </span>
        </Link>
        <p className="text-sm text-slate-500 text-center">
          © 2026 Study2Earn Ethiopia. Built for the next generation of Ethiopian scholars.
        </p>
        <div className="flex gap-6 text-sm font-medium text-slate-600">
          <a href="#" className="hover:text-brand-navy">
            Help Center
          </a>
          <a href="#" className="hover:text-brand-navy">
            Terms
          </a>
          <a href="#" className="hover:text-brand-navy">
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}

export { BookCover } from "@/components/book-cover";
