import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Award,
  Bell,
  BookMarked,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  LogOut,
  Pencil,
  Shield,
  Sparkles,
  Star,
  Trophy,
  User,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { RequireAuthClient } from "@/components/require-auth-client";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCosmetics } from "@/hooks/use-cosmetics";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { useNotificationPrefs } from "@/hooks/use-notification-prefs";
import { STUDY_TRACK_LABELS, type StudyTrack } from "@/lib/auth-data";
import { DEFAULT_AVATAR_RING, GLOW_STYLES } from "@/lib/cosmetics-store";
import {
  deleteLocalFile,
  isLocalFileUrl,
  processImageFile,
  resolveMediaUrl,
  saveLocalFile,
} from "@/lib/media-store";
import { useReadingTime } from "@/hooks/use-reading-time";
import { useWallet } from "@/hooks/use-wallet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Study2Earn" },
      {
        name: "description",
        content: "Your academic info, exam history, earnings, and account settings.",
      },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <RequireAuthClient redirectTo="/profile">
        <ProfileContent />
      </RequireAuthClient>
      <SiteFooter />
    </div>
  );
}

/* ── Achievement badge definitions ── */
type Badge = {
  id: string;
  label: string;
  desc: string;
  icon: typeof Star;
  color: string;
  earned: boolean;
};

function getBadges(
  examStats: { completed: number; totalAttempts: number; totalXp: number },
  readingSecs: number,
) {
  const badges: Badge[] = [
    {
      id: "first-exam",
      label: "First Exam",
      desc: "Completed your first mock exam",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      earned: examStats.totalAttempts >= 1,
    },
    {
      id: "scholar",
      label: "Scholar",
      desc: "Passed 5 or more chapters",
      icon: Award,
      color: "text-blue-600 bg-blue-50 border-blue-200",
      earned: examStats.completed >= 5,
    },
    {
      id: "bookworm",
      label: "Bookworm",
      desc: "Read for at least 1 hour",
      icon: BookOpen,
      color: "text-purple-600 bg-purple-50 border-purple-200",
      earned: readingSecs >= 3600,
    },
    {
      id: "persistent",
      label: "Persistent",
      desc: "Attempted 10 or more exams",
      icon: Zap,
      color: "text-amber-600 bg-amber-50 border-amber-200",
      earned: examStats.totalAttempts >= 10,
    },
    {
      id: "earner",
      label: "Earner",
      desc: "Accumulated 200+ XP from exams",
      icon: Coins,
      color: "text-yellow-600 bg-yellow-50 border-yellow-200",
      earned: examStats.totalXp >= 200,
    },
    {
      id: "champion",
      label: "Champion",
      desc: "Completed 10 chapters",
      icon: Trophy,
      color: "text-orange-600 bg-orange-50 border-orange-200",
      earned: examStats.completed >= 10,
    },
  ];
  return badges;
}

function ProfileContent() {
  const { user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { getOverallStats, getRecentAttempts } = useExamProgress();
  const readingTime = useReadingTime();
  const wallet = useWallet();
  const { owned: ownedGlows, active: activeGlow, setActive: setActiveGlow } = useCosmetics();

  const { prefs: notifs, togglePref: toggleNotif } = useNotificationPrefs();

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [editingAccount, setEditingAccount] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [universityDraft, setUniversityDraft] = useState("");
  const [trackDraft, setTrackDraft] = useState<StudyTrack | "none">("none");

  if (!user) return null;

  const examStats = getOverallStats();
  const recentAttempts = getRecentAttempts(5);
  const badges = getBadges(examStats, readingTime.totalSeconds);
  const earnedBadges = badges.filter((b) => b.earned).length;

  const handleSignOut = () => {
    signOut();
    void navigate({ to: "/login", search: { redirect: undefined, ref: undefined } });
  };

  const avatarInitials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarSrc = resolveMediaUrl(user.avatarUrl);

  async function handlePhotoChange(file: File | undefined) {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const dataUrl = await processImageFile(file, { maxDim: 320 });
      const saved = saveLocalFile("img", dataUrl);
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      if (isLocalFileUrl(user!.avatarUrl)) deleteLocalFile(user!.avatarUrl);
      updateProfile({ avatarUrl: saved.pointer });
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not process the image");
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  }

  function handleRemovePhoto() {
    if (isLocalFileUrl(user!.avatarUrl)) deleteLocalFile(user!.avatarUrl);
    updateProfile({ avatarUrl: undefined });
    toast.success("Profile photo removed");
  }

  function startEditAccount() {
    setNameDraft(user!.name);
    setUniversityDraft(user!.university);
    setTrackDraft(user!.studyTrack ?? "none");
    setEditingAccount(true);
  }

  function saveAccount() {
    const name = nameDraft.trim();
    const university = universityDraft.trim();
    if (!name || !university) {
      toast.error("Name and university can't be empty");
      return;
    }
    updateProfile({
      name,
      university,
      studyTrack: trackDraft === "none" ? undefined : trackDraft,
    });
    setEditingAccount(false);
    toast.success("Profile updated");
  }

  const withdrawableEtb = Math.floor(wallet.balance / 8);

  const statCards = [
    {
      label: "XP Balance",
      value: wallet.balance.toLocaleString(),
      sub: `≈ ${withdrawableEtb} ETB withdrawable`,
      icon: Coins,
      color: "bg-amber-50 border-amber-200 text-amber-700",
      iconColor: "bg-amber-100 text-amber-600",
    },
    {
      label: "Chapters done",
      value: `${examStats.completed}`,
      sub: `of ${examStats.total} total · ${examStats.percent}%`,
      icon: CheckCircle2,
      color: "bg-blue-50 border-blue-200 text-blue-700",
      iconColor: "bg-blue-100 text-blue-600",
    },
    {
      label: "Reading time",
      value: readingTime.formatted,
      sub: `${readingTime.progressPercent}% to ${readingTime.rewardEtb} ETB bonus`,
      icon: Clock,
      color: "bg-green-50 border-green-200 text-green-700",
      iconColor: "bg-green-100 text-green-600",
    },
    {
      label: "Badges earned",
      value: `${earnedBadges}`,
      sub: `of ${badges.length} available`,
      icon: Award,
      color: "bg-purple-50 border-purple-200 text-purple-700",
      iconColor: "bg-purple-100 text-purple-600",
    },
  ];

  const xpSources = [
    { label: "Base account XP", value: wallet.baseXp, barClass: "[&>div]:bg-slate-400" },
    { label: "Exam rewards", value: wallet.examXp, barClass: "[&>div]:bg-brand-gold" },
    { label: "Reading bonus", value: wallet.libraryXp, barClass: "[&>div]:bg-green-500" },
    { label: "Referrals", value: wallet.referralXp, barClass: "[&>div]:bg-purple-500" },
  ];
  const totalXp = wallet.lifetimeEarned || 1;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* ── Profile header ── */}
        <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 section-enter">
          <div className="relative shrink-0">
            <div
              className={cn(
                "size-24 rounded-full bg-gradient-to-br from-brand-navy to-brand-gold ring-4 ring-offset-4 ring-offset-slate-50 flex items-center justify-center overflow-hidden",
                activeGlow
                  ? cn(GLOW_STYLES[activeGlow].ring, GLOW_STYLES[activeGlow].shadow)
                  : cn(DEFAULT_AVATAR_RING, "shadow-xl shadow-brand-navy/20"),
              )}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.name} className="size-full object-cover" />
              ) : (
                <span className="font-serif text-2xl font-bold text-white">{avatarInitials}</span>
              )}
            </div>
            {examStats.completed >= 5 && (
              <span className="absolute -top-1 -right-1 size-7 rounded-full bg-brand-gold border-2 border-white grid place-items-center shadow">
                <Star className="size-3.5 fill-white text-white" />
              </span>
            )}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadingPhoto}
              title="Change profile photo"
              className="absolute -bottom-1 -right-1 size-8 rounded-full bg-brand-navy text-white border-2 border-white shadow grid place-items-center hover:bg-brand-navy/90 transition disabled:opacity-60"
            >
              {uploadingPhoto ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Camera className="size-3.5" />
              )}
            </button>
            {avatarSrc && !uploadingPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                title="Remove photo"
                className="absolute -bottom-1 -left-1 size-6 rounded-full bg-white text-slate-400 border-2 border-slate-100 shadow grid place-items-center hover:text-red-500 hover:border-red-200 transition"
              >
                <X className="size-3" />
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handlePhotoChange(e.target.files?.[0])}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-navy">
              {user.name}
            </h1>
            <p className="mt-1 text-slate-500 text-sm">
              {user.university} · {user.email}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-gold/10 text-brand-gold font-bold rounded-full text-xs border border-brand-gold/20">
                <Coins className="size-3" />
                {wallet.balance.toLocaleString()} XP
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-full text-xs border border-emerald-200">
                <Trophy className="size-3" />
                {examStats.completed} chapters passed
              </span>
              <span className="text-xs text-slate-400 bg-white px-2.5 py-1 rounded-full font-mono border border-slate-100">
                {user.id}
              </span>
            </div>
            {ownedGlows.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Glow
                </span>
                <button
                  type="button"
                  onClick={() => setActiveGlow(null)}
                  className={cn(
                    "size-5 rounded-full border-2 border-dashed border-slate-300 bg-white transition",
                    !activeGlow && "ring-2 ring-offset-2 ring-slate-400",
                  )}
                  aria-label="No glow"
                  title="No glow"
                />
                {ownedGlows.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => setActiveGlow(theme)}
                    className={cn(
                      "size-5 rounded-full transition",
                      GLOW_STYLES[theme].dot,
                      activeGlow === theme && "ring-2 ring-offset-2 ring-brand-navy",
                    )}
                    aria-label={GLOW_STYLES[theme].label}
                    title={GLOW_STYLES[theme].label}
                  />
                ))}
              </div>
            )}
          </div>
          <Link
            to="/rewards"
            className="shrink-0 bg-brand-navy text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-navy/90 transition shadow-sm"
          >
            Redeem XP →
          </Link>
        </header>

        {/* ── Getting started (new users only) ── */}
        {examStats.totalAttempts === 0 && readingTime.totalSeconds === 0 && (
          <div className="mb-8 rounded-2xl border border-brand-gold/30 bg-gradient-to-br from-brand-gold/5 to-amber-50/30 p-6 section-enter">
            <div className="flex items-center gap-3 mb-5">
              <div className="size-9 rounded-xl bg-brand-gold/20 grid place-items-center">
                <Sparkles className="size-5 text-brand-gold" />
              </div>
              <div>
                <p className="font-semibold text-brand-navy">Get started — earn your first XP</p>
                <p className="text-xs text-slate-500">
                  Complete these three steps to unlock rewards
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  to: "/library",
                  icon: BookOpen,
                  color: "bg-blue-50 border-blue-100 text-blue-700",
                  label: "1. Read a textbook",
                  sub: "Earn 5 XP every 30 sec",
                },
                {
                  to: "/exams",
                  icon: Trophy,
                  color: "bg-violet-50 border-violet-100 text-violet-700",
                  label: "2. Take a mock exam",
                  sub: "Up to 200 XP per chapter",
                },
                {
                  to: "/rewards",
                  icon: Coins,
                  color: "bg-amber-50 border-amber-100 text-amber-700",
                  label: "3. Redeem your XP",
                  sub: "8 XP = 1 ETB",
                },
              ].map((step) => (
                <Link
                  key={step.to}
                  to={step.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border p-4 transition-all hover:shadow-sm hover:-translate-y-0.5",
                    step.color,
                  )}
                >
                  <step.icon className="size-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{step.label}</p>
                    <p className="text-[11px] opacity-70">{step.sub}</p>
                  </div>
                  <ArrowRight className="size-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className={cn("rounded-2xl border p-4 flex flex-col gap-2", s.color)}
            >
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {s.label}
                </p>
                <div className={cn("size-7 rounded-full grid place-items-center", s.iconColor)}>
                  <s.icon className="size-3.5" />
                </div>
              </div>
              <p className="font-serif text-2xl font-bold">{s.value}</p>
              <p className="text-[11px] opacity-70">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ── XP Breakdown ── */}
          <Card title="XP Breakdown" icon={Zap}>
            <div className="space-y-3 pt-1">
              {xpSources.map((src) => (
                <div key={src.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{src.label}</span>
                    <span className="text-xs font-bold text-slate-800 tabular-nums">
                      {src.value.toLocaleString()} XP
                    </span>
                  </div>
                  <Progress
                    value={Math.round((src.value / totalXp) * 100)}
                    className={cn("h-1.5", src.barClass)}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Lifetime earned
              </span>
              <span className="font-serif text-lg font-bold text-brand-navy">
                {wallet.lifetimeEarned.toLocaleString()} XP
              </span>
            </div>
            {wallet.redeemedXp > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-slate-400">Already redeemed</span>
                <span className="text-xs font-semibold text-slate-500">
                  −{wallet.redeemedXp.toLocaleString()} XP
                </span>
              </div>
            )}
          </Card>

          {/* ── Recent exam activity ── */}
          <Card title="Recent Exams" icon={Trophy}>
            {recentAttempts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BookMarked className="size-8 text-slate-200 mb-3" />
                <p className="text-sm text-slate-400">No exams yet</p>
                <Link
                  to="/exams"
                  className="mt-3 text-xs font-semibold text-brand-navy hover:underline"
                >
                  Start your first mock exam →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentAttempts.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors"
                  >
                    {a.passed ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-red-400" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {a.chapterTitle}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{a.courseName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          a.score >= 80
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : a.score >= 60
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200",
                        )}
                      >
                        {a.score}%
                      </span>
                      <span className="text-[10px] font-semibold text-brand-gold tabular-nums">
                        +{a.xp} XP
                      </span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 text-center">
                  <Link
                    to="/exams"
                    className="text-xs font-semibold text-brand-navy hover:underline"
                  >
                    View all exams →
                  </Link>
                </div>
              </div>
            )}
          </Card>

          {/* ── Reading progress ── */}
          <Card title="Reading Progress" icon={BookOpen}>
            <div className="flex items-center gap-4 mb-4 pt-1">
              <div className="relative size-16 shrink-0">
                <svg viewBox="0 0 64 64" className="size-full -rotate-90">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 26}`}
                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - readingTime.progressPercent / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-bold text-brand-navy leading-none">
                    {readingTime.progressPercent}%
                  </span>
                </div>
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-brand-navy">
                  {readingTime.formatted}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {readingTime.rewardClaimed
                    ? "Reading reward claimed!"
                    : `${readingTime.hoursRemaining}h left for ${readingTime.rewardEtb} ETB bonus`}
                </p>
              </div>
            </div>
            <Progress value={readingTime.progressPercent} className="h-1.5 [&>div]:bg-brand-gold" />
            <p className="mt-2 text-[11px] text-slate-400 text-center">
              Read {readingTime.targetFormatted} total to unlock the reward
            </p>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link
                to="/library"
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-brand-navy/5 text-brand-navy text-xs font-semibold hover:bg-brand-navy/10 transition"
              >
                <BookOpen className="size-3.5" />
                Open Library
              </Link>
            </div>
          </Card>

          {/* ── Achievement badges ── */}
          <Card title="Achievements" icon={Award}>
            <p className="text-xs text-slate-400 mb-4">
              {earnedBadges} of {badges.length} earned
            </p>
            <div className="grid grid-cols-3 gap-2">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.desc}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-all",
                    badge.earned
                      ? badge.color
                      : "bg-slate-50 border-slate-100 text-slate-300 grayscale",
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-full grid place-items-center",
                      badge.earned ? "opacity-100" : "opacity-30",
                    )}
                  >
                    <badge.icon className="size-4" />
                  </div>
                  <span className="text-[10px] font-bold leading-tight">{badge.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Account info ── */}
          <Card title="Account" icon={User}>
            {editingAccount ? (
              <div className="space-y-3.5 pt-1 pb-1">
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className="text-xs font-semibold text-slate-500">
                    Full name
                  </Label>
                  <Input
                    id="profile-name"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="profile-university"
                    className="text-xs font-semibold text-slate-500"
                  >
                    University
                  </Label>
                  <Input
                    id="profile-university"
                    value={universityDraft}
                    onChange={(e) => setUniversityDraft(e.target.value)}
                    placeholder="Your university"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-500">Study track</Label>
                  <Select
                    value={trackDraft}
                    onValueChange={(v) => setTrackDraft(v as StudyTrack | "none")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="natural">Natural Science</SelectItem>
                      <SelectItem value="social">Social Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Button size="sm" onClick={saveAccount} className="gap-1.5">
                    <Check className="size-3.5" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingAccount(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Field label="Full name" value={user.name} />
                <Field label="Email" value={user.email} />
                <Field label="University" value={user.university} />
                <Field
                  label="Study track"
                  value={user.studyTrack ? STUDY_TRACK_LABELS[user.studyTrack] : "Not set"}
                />
                <Field label="Student ID" value={user.id} />
                <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Study goal
                  </span>
                  <span className="text-sm font-medium text-slate-700">60 min / day</span>
                </div>
                <button
                  type="button"
                  onClick={startEditAccount}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-navy hover:underline"
                >
                  <Pencil className="size-3.5" />
                  Edit profile
                </button>
              </>
            )}
          </Card>

          {/* ── Notifications ── */}
          <Card title="Notifications" icon={Bell}>
            {(
              [
                ["dailyReminder", "Daily study reminder"],
                ["streakWarning", "Streak warning"],
                ["newExam", "New exam released"],
                ["leaderboard", "Leaderboard rank changes"],
                ["rewards", "Withdrawal & reward updates"],
              ] as [keyof typeof notifs, string][]
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 cursor-pointer select-none group"
              >
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {label}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={notifs[key]}
                  onClick={() => toggleNotif(key)}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2",
                    notifs[key] ? "bg-brand-gold" : "bg-slate-200",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none block size-4 rounded-full bg-white shadow-lg transition-transform",
                      notifs[key] ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </label>
            ))}
          </Card>

          {/* ── Security ── */}
          <Card title="Security" icon={Shield}>
            <button
              type="button"
              className="flex w-full items-center justify-between py-3 border-b border-slate-100 text-sm font-medium text-slate-300 cursor-not-allowed"
              disabled
            >
              <span>Change password</span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </button>
            <button
              type="button"
              className="flex w-full items-center justify-between py-3 border-b border-slate-100 text-sm font-medium text-slate-300 cursor-not-allowed"
              disabled
            >
              <span>Two-factor authentication</span>
              <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 py-3 border-b border-slate-100 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors rounded-lg px-2 -mx-2"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 py-3 text-sm font-medium text-slate-300 cursor-not-allowed mt-1"
              disabled
            >
              <Shield className="size-4" />
              <span>Delete account</span>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">
                Soon
              </span>
            </button>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-5">
        <div className="size-8 rounded-lg bg-brand-navy/5 grid place-items-center">
          <Icon className="size-4 text-brand-navy" />
        </div>
        <h2 className="font-serif text-xl font-bold text-brand-navy">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-700">{value}</span>
    </div>
  );
}
