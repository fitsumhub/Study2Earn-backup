import { Link, useRouterState } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Coins,
  LayoutDashboard,
  Lock,
  Megaphone,
  Menu,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useCosmetics } from "@/hooks/use-cosmetics";
import { useSiteContent } from "@/hooks/use-site-content";
import { useTheme } from "@/hooks/use-theme";
import { useWallet } from "@/hooks/use-wallet";
import { isAdminUser } from "@/lib/auth-data";
import { DEFAULT_AVATAR_RING, GLOW_STYLES } from "@/lib/cosmetics-store";
import { resolveMediaUrl } from "@/lib/media-store";
import { xpToEtb } from "@/lib/withdrawal-data";
import { cn, safeHref } from "@/lib/utils";
import { UserNotificationBell } from "@/components/user-notification-bell";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { useFrames } from "@/hooks/use-frames";
import { ProfileFrameAvatar } from "@/components/frames/ProfileFrameAvatar";

const DISMISSED_KEY = "study2earn-announcement-dismissed";

/** Site-wide banner, admin-controlled from Site Content → Announcement. Dismissing
 * one message keeps it hidden for that message specifically — editing the message
 * (or its link) brings the banner back even if the old one was dismissed. */
function AnnouncementBanner() {
  const { content } = useSiteContent();
  const { announcement } = content;
  const [dismissedText, setDismissedText] = useState<string | null>(null);

  useEffect(() => {
    setDismissedText(localStorage.getItem(DISMISSED_KEY));
  }, []);

  if (!announcement.enabled || !announcement.message) return null;
  if (dismissedText === announcement.message) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, announcement.message);
    setDismissedText(announcement.message);
  };

  return (
    <div className="relative bg-brand-navy text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-10 py-2 text-center text-xs font-medium sm:text-sm">
        <Megaphone className="size-3.5 shrink-0 text-brand-gold" />
        <span className="truncate">{announcement.message}</span>
        {announcement.linkUrl && announcement.linkLabel && safeHref(announcement.linkUrl) && (
          <a
            href={safeHref(announcement.linkUrl)}
            className="inline-flex shrink-0 items-center gap-1 font-bold text-brand-gold hover:underline"
          >
            {announcement.linkLabel}
            <ArrowRight className="size-3" />
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, protected: true },
  { to: "/library", label: "Library", icon: BookOpen, protected: false },
  { to: "/ai-study", label: "AI Study", icon: Sparkles, protected: false },
  { to: "/exams", label: "Mock Exams", icon: ClipboardList, protected: false },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, protected: true },
  { to: "/rewards", label: "Rewards", icon: Coins, protected: true },
] as const;

function NavLink({
  item,
  pathname,
  loggedIn,
  onNavigate,
}: {
  item: (typeof navItems)[number];
  pathname: string;
  loggedIn: boolean;
  onNavigate?: () => void;
}) {
  const active = pathname === item.to || pathname.startsWith(item.to + "/");
  const locked = item.protected && !loggedIn;
  const Icon = item.icon;

  const className = cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium transition-all",
    active
      ? "bg-brand-navy text-white font-semibold shadow-xs shadow-brand-navy/20"
      : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
  );

  if (locked) {
    return (
      <Link
        to="/login"
        search={{ redirect: item.to, ref: undefined }}
        className={className}
        onClick={onNavigate}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        <Lock className="size-3.5 text-brand-gold" />
      </Link>
    );
  }

  return (
    <Link to={item.to} className={className} onClick={onNavigate}>
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { loggedIn, user } = useAuth();
  const wallet = useWallet();
  const { active: activeGlow } = useCosmetics();
  const { equipped: equippedFrame } = useFrames();
  const [mobileOpen, setMobileOpen] = useState(false);
  const displayXp = loggedIn ? wallet.balance : 0;
  const displayEtb = xpToEtb(displayXp);
  const showAdmin = loggedIn && isAdminUser(user);
  const { isDark, toggleTheme } = useTheme();
  const glow = activeGlow ? GLOW_STYLES[activeGlow] : null;

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <AnnouncementBanner />
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              className="inline-flex size-9 sm:size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 md:hidden transition-colors"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-4 sm:size-5" />
            </button>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="size-7 sm:size-8 rounded bg-brand-navy grid place-items-center text-white font-serif font-bold text-lg sm:text-xl transition-transform group-hover:scale-105 shrink-0">
                S
              </div>
              <span className="font-serif text-base sm:text-xl font-bold tracking-tight text-brand-navy truncate max-w-[130px] xs:max-w-none">
                Study2Earn
              </span>
            </Link>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const locked = item.protected && !loggedIn;
              const Icon = item.icon;
              const cls = cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-gold",
                active
                  ? "bg-brand-navy text-white font-semibold shadow-xs shadow-brand-navy/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
              );
              if (locked) {
                return (
                  <Link
                    key={item.to}
                    to="/login"
                    search={{ redirect: item.to, ref: undefined }}
                    className={cls}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {item.label}
                    <Lock className="size-3 text-brand-gold" />
                  </Link>
                );
              }
              return (
                <Link key={item.to} to={item.to} className={cls}>
                  <Icon className="size-3.5 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
            {showAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand-gold",
                  pathname.startsWith("/admin")
                    ? "bg-brand-navy text-white font-semibold shadow-xs shadow-brand-navy/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
                )}
              >
                <Shield className="size-3.5 shrink-0" />
                Admin
              </Link>
            )}
          </div>

          {/* Right: Actions, Theme, Notifications & Profile */}
          <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
            {/* Notifications */}
            {loggedIn && <UserNotificationBell />}

            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="rounded-lg p-1.5 sm:p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>

            {/* Right: wallet / auth */}
            {loggedIn && user ? (
              <Link to="/profile" className="flex items-center gap-1.5 sm:gap-3 group">
                <div className="hidden sm:flex flex-col items-end leading-tight">
                  {/* XP pill */}
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2.5 py-0.5 text-[10px] font-bold text-brand-gold uppercase tracking-wide">
                    <Coins className="size-3" />
                    {displayXp.toLocaleString()} XP
                  </span>
                  <span className="mt-0.5 text-[10px] text-slate-500">
                    ≈ {displayEtb} ETB · {user.name}
                  </span>
                </div>
                <div className="flex sm:hidden flex-col items-end leading-tight">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-gold">
                    <Coins className="size-2.5" />
                    {displayXp >= 1000 ? `${(displayXp / 1000).toFixed(1)}k` : displayXp}
                  </span>
                </div>
                {equippedFrame ? (
                  <div className="transition-transform group-hover:scale-105">
                    <ProfileFrameAvatar
                      initials={user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                      avatarUrl={resolveMediaUrl(user.avatarUrl)}
                      frameId={equippedFrame}
                      size="xs"
                      equipped
                    />
                  </div>
                ) : (
                  <div
                    className={cn(
                      "size-8 sm:size-9 rounded-full bg-gradient-to-br from-brand-navy to-brand-gold ring-2 ring-offset-1 transition-transform group-hover:scale-105 grid place-items-center text-white font-serif font-bold text-xs sm:text-sm overflow-hidden",
                      glow ? cn(glow.ring, glow.shadow) : DEFAULT_AVATAR_RING,
                    )}
                  >
                    {resolveMediaUrl(user.avatarUrl) ? (
                      <img
                        src={resolveMediaUrl(user.avatarUrl)}
                        alt={user.name}
                        className="size-full object-cover"
                      />
                    ) : (
                      user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    )}
                  </div>
                )}
              </Link>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  to="/login"
                  search={{ redirect: undefined, ref: undefined }}
                  className="hidden xs:inline-flex text-xs sm:text-sm font-medium text-slate-600 hover:text-brand-navy transition-colors px-2 py-1"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  search={{ ref: undefined, redirect: undefined }}
                  className="rounded-lg bg-brand-navy px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white hover:bg-brand-navy/90 transition shadow-xs shadow-brand-navy/20 shrink-0"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[min(100vw-2rem,320px)] p-0">
          <SheetHeader className="border-b border-slate-100 p-4 text-left">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-serif text-brand-navy">Study2Earn</SheetTitle>
              <Button variant="ghost" size="icon" onClick={closeMobile} aria-label="Close menu">
                <X className="size-4" />
              </Button>
            </div>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-1 p-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                item={item}
                pathname={pathname}
                loggedIn={loggedIn}
                onNavigate={closeMobile}
              />
            ))}
            {showAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                  pathname.startsWith("/admin")
                    ? "bg-brand-navy text-white font-semibold shadow-sm shadow-brand-navy/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-brand-navy",
                )}
                onClick={closeMobile}
              >
                <Shield className="size-4 shrink-0" />
                <span className="flex-1">Admin</span>
              </Link>
            )}
            {!loggedIn && (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  search={{ redirect: undefined, ref: undefined }}
                  className="block rounded-lg border border-slate-200 px-3 py-2.5 text-center text-sm font-semibold transition-colors hover:bg-slate-50"
                  onClick={closeMobile}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  search={{ ref: undefined, redirect: undefined }}
                  className="block rounded-lg bg-brand-navy px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm shadow-brand-navy/20"
                  onClick={closeMobile}
                >
                  Get started
                </Link>
              </div>
            )}
            {loggedIn && user && (
              <div className="mt-4 rounded-xl bg-gradient-to-br from-brand-navy/5 to-brand-gold/5 border border-brand-gold/15 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your wallet
                </p>
                <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">
                  {displayXp.toLocaleString()} <span className="text-base text-brand-gold">XP</span>
                </p>
                <p className="text-xs text-slate-500">≈ {displayEtb} ETB withdrawable</p>
                <Link
                  to="/profile"
                  className="mt-3 block text-sm font-semibold text-brand-navy hover:underline"
                  onClick={closeMobile}
                >
                  View profile →
                </Link>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-40 flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg text-slate-500 transition hover:bg-brand-navy hover:text-white hover:border-brand-navy focus-visible:outline-brand-gold"
    >
      <svg viewBox="0 0 16 16" fill="none" className="size-4" aria-hidden>
        <path
          d="M8 12V4M4 8l4-4 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Brand column */}
          <div>
            <Link to="/" className="flex items-center gap-2 group">
              <div className="size-8 rounded bg-white/10 grid place-items-center text-white font-serif font-bold text-lg transition-transform group-hover:scale-105">
                S
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white">
                Study2Earn
              </span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
              🇪🇹 Built for Ethiopian students. Master the MoE Exit Exam, earn real rewards.
            </p>
            <PwaInstallButton className="mt-5 gap-2 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" />
            <p className="mt-4 text-xs text-slate-600">© 2026 Study2Earn Ethiopia</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Platform
            </p>
            <ul className="space-y-2.5">
              {[
                { to: "/", label: "Home" },
                { to: "/library", label: "Library" },
                { to: "/exams", label: "Mock Exams" },
                { to: "/leaderboard", label: "Leaderboard" },
                { to: "/rewards", label: "Rewards" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Legal & Support
            </p>
            <ul className="space-y-2.5">
              {[
                { to: "/help", label: "Help Center" },
                { to: "/terms", label: "Terms of Service" },
                { to: "/privacy", label: "Privacy Policy" },
              ].map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { BookCover } from "@/components/book-cover";
