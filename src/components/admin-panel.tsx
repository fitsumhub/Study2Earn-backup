import {
  ArrowUpRight,
  BookOpen,
  Check,
  ClipboardList,
  Clock,
  Flame,
  ShieldAlert,
  Share2,
  TrendingUp,
  UserPlus,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import { AdminStatCard } from "@/components/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdsSection } from "@/components/admin/sections/ads-section";
import { CategoriesSection } from "@/components/admin/sections/categories-section";
import { IntegritySection } from "@/components/admin/sections/integrity-section";
import { ContentSection } from "@/components/admin/sections/content-section";
import { SiteContentSection } from "@/components/admin/sections/site-content-section";
import { ExamsSection } from "@/components/admin/sections/exams-section";
import { ReferralsSection } from "@/components/admin/sections/referrals-section";
import { RewardsSection } from "@/components/admin/sections/rewards-section";
import { StudentsSection } from "@/components/admin/sections/students-section";
import { TestsSection } from "@/components/admin/sections/tests-section";
import { WithdrawalsSection } from "@/components/admin/sections/withdrawals-section";
import {
  activityIcons,
  engagementChartConfig,
  quickActions,
  readingChartConfig,
  subjectChartConfig,
  xpChartConfig,
} from "@/components/admin/shared";
import { StudentsTable } from "@/components/admin/students-table";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import {
  examsBySubject,
  overviewMiniStats,
  platformHealth,
  readingHoursTrend,
  topPerformers,
  trackEngagement,
  universityBreakdown,
  weeklyEngagement,
  xpRedemptionTrend,
} from "@/lib/admin-data";
import { readExamAttempts } from "@/hooks/use-exam-progress";
import { readRedemptions } from "@/lib/redemption-store";
import { cn } from "@/lib/utils";

export function AdminPanel({ admin }: { admin: AdminDashboardState }) {
  const { section } = admin;

  switch (section) {
    case "students":
      return <StudentsSection admin={admin} full />;
    case "content":
      return <ContentSection admin={admin} />;
    case "categories":
      return <CategoriesSection admin={admin} />;
    case "siteContent":
      return <SiteContentSection />;
    case "exams":
      return <ExamsSection admin={admin} />;
    case "rewards":
      return <RewardsSection admin={admin} />;
    case "ads":
      return <AdsSection />;
    case "withdrawals":
      return <WithdrawalsSection admin={admin} />;
    case "referrals":
      return <ReferralsSection admin={admin} />;
    case "analytics":
      return <AnalyticsSection />;
    case "moderation":
      return <ModerationSection admin={admin} />;
    case "settings":
      return <SettingsSection admin={admin} />;
    case "tests":
      return <TestsSection />;
    default:
      return <OverviewSection admin={admin} />;
  }
}

function OverviewSection({ admin }: { admin: AdminDashboardState }) {
  const {
    users,
    filteredUsers,
    activity,
    withdrawals,
    pendingStudents,
    openFlags,
    unsyncedContent,
    draftExams,
    pendingWithdrawals,
    pendingReferrals,
    setSection,
    setProfileUser,
    setMessageUser,
    setSuspendUser,
    updateUserStatus,
    openQuickAction,
  } = admin;

  // Live platform numbers from the real stores (read once per mount) — the
  // old cards showed hardcoded demo figures.
  const [realCounts] = useState(() => ({
    attempts: readExamAttempts().length,
    redemptions: readRedemptions().length,
  }));
  const pendingEtb = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum, w) => sum + w.amountEtb, 0);

  const liveStats = [
    {
      label: "Total Students",
      value: users.length.toLocaleString(),
      change: "live",
      trend: "up" as const,
      sub: `${pendingStudents} pending approval`,
      target: "students" as const,
    },
    {
      label: "Exams Completed",
      value: realCounts.attempts.toLocaleString(),
      change: "live",
      trend: "up" as const,
      sub: "recorded student attempts",
      target: "exams" as const,
    },
    {
      label: "Rewards Redeemed",
      value: realCounts.redemptions.toLocaleString(),
      change: "live",
      trend: "up" as const,
      sub: "catalog redemptions",
      target: "rewards" as const,
    },
    {
      label: "Pending Payouts",
      value: `${pendingEtb.toLocaleString()} ETB`,
      change: `${pendingWithdrawals} request${pendingWithdrawals !== 1 ? "s" : ""}`,
      trend: pendingWithdrawals > 0 ? ("down" as const) : ("up" as const),
      sub: "awaiting approval",
      target: "withdrawals" as const,
    },
  ];

  const pendingActions = [
    {
      label: "Pending approvals",
      count: pendingStudents,
      section: "students" as const,
      icon: UserPlus,
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      label: "Open flags",
      count: openFlags,
      section: "moderation" as const,
      icon: ShieldAlert,
      color: "bg-red-50 text-red-700 border-red-200",
    },
    {
      label: "Unsynced books",
      count: unsyncedContent,
      section: "content" as const,
      icon: BookOpen,
      color: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Draft exams",
      count: draftExams,
      section: "exams" as const,
      icon: ClipboardList,
      color: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      label: "Referral reviews",
      count: pendingReferrals,
      section: "referrals" as const,
      icon: Share2,
      color: "bg-orange-50 text-orange-700 border-orange-200",
    },
    {
      label: "Withdrawal requests",
      count: pendingWithdrawals,
      section: "withdrawals" as const,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      {pendingActions.length > 0 && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
              Needs attention · {pendingActions.length} item{pendingActions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pendingActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => setSection(action.section)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                  action.color,
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-current/10">
                  <action.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold font-serif">{action.count}</p>
                  <p className="text-xs font-semibold">{action.label}</p>
                </div>
                <ArrowUpRight className="size-4 opacity-50" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {liveStats.map(({ target, ...stat }) => (
          <AdminStatCard key={stat.label} {...stat} onClick={() => setSection(target)} />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overviewMiniStats.map((stat) => {
          const isPending = stat.label === "Pending approvals";
          const isFlags = stat.label === "Open flags";
          return (
            <Card key={stat.label} className="shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
                  {stat.label.includes("study") ? (
                    <Clock className="size-4" />
                  ) : stat.label.includes("completion") ? (
                    <TrendingUp className="size-4" />
                  ) : stat.label.includes("Pending") ? (
                    <UserPlus className="size-4" />
                  ) : (
                    <ShieldAlert className="size-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="font-serif text-xl font-bold text-brand-navy">
                    {isPending ? pendingStudents : isFlags ? openFlags : stat.value}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{stat.sub}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.key}
            variant="outline"
            className="gap-2 bg-white"
            onClick={() => openQuickAction(action.key)}
          >
            <action.icon className="size-4" />
            {action.label}
          </Button>
        ))}
      </div>

      <AnalyticsCharts />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif text-brand-navy">Recent students</CardTitle>
              <CardDescription>Latest registrations and account status</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-brand-navy"
              onClick={() => setSection("students")}
            >
              View all
              <ArrowUpRight className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <StudentsTable
              users={filteredUsers.slice(0, 5)}
              onView={setProfileUser}
              onEdit={(user) => admin.openEdit({ type: "student", item: user })}
              onMessage={setMessageUser}
              onSuspend={setSuspendUser}
              onApprove={(id) => updateUserStatus(id, "active")}
              onReactivate={(id) => updateUserStatus(id, "active")}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-brand-navy">Activity feed</CardTitle>
            <CardDescription>Latest platform events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 p-4">
            {activity.map((item) => {
              const Icon = activityIcons[item.type];
              const typeStyle =
                {
                  user: "bg-blue-50 text-blue-600",
                  exam: "bg-amber-50 text-amber-600",
                  reward: "bg-emerald-50 text-emerald-600",
                  content: "bg-violet-50 text-violet-600",
                  moderation: "bg-red-50 text-red-600",
                  referral: "bg-teal-50 text-teal-600",
                }[item.type] ?? "bg-brand-navy/5 text-brand-navy";

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.type === "user") setSection("students");
                    else if (item.type === "exam") setSection("exams");
                    else if (item.type === "reward") setSection("rewards");
                    else if (item.type === "content") setSection("content");
                    else setSection("moderation");
                  }}
                  className="flex w-full gap-3 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg",
                      typeStyle,
                    )}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-navy leading-tight">
                        {item.action}
                      </p>
                      <span className="shrink-0 text-[10px] text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{item.detail}</p>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TopPerformersCard />
        <PlatformHealthCard />
      </div>

      <TrackEngagementCard />
      <UniversityCard />
    </div>
  );
}

function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <AnalyticsCharts />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-brand-navy">Reading hours</CardTitle>
            <CardDescription>Verified PDF reading time across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={readingChartConfig} className="h-[280px] w-full">
              <LineChart
                data={readingHoursTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/50"
                />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="hours"
                  stroke="var(--color-hours)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-brand-navy">XP economy</CardTitle>
            <CardDescription>XP issued vs redeemed over the past 4 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={xpChartConfig} className="h-[280px] w-full">
              <BarChart
                data={xpRedemptionTrend}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  className="stroke-border/50"
                />
                <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="issued" fill="var(--color-issued)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="redeemed" fill="var(--color-redeemed)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      <TrackEngagementCard />
      <UniversityCard />
    </div>
  );
}

function AnalyticsCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">Weekly engagement</CardTitle>
          <CardDescription>Active users and exam completions over the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={engagementChartConfig} className="h-[280px] w-full">
            <AreaChart data={weeklyEngagement} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="active"
                stroke="var(--color-active)"
                fill="var(--color-active)"
                fillOpacity={0.12}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="exams"
                stroke="var(--color-exams)"
                fill="var(--color-exams)"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">Exams by subject</CardTitle>
          <CardDescription>Total mock exam completions this semester</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={subjectChartConfig} className="h-[280px] w-full">
            <BarChart data={examsBySubject} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
              <XAxis dataKey="subject" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function TopPerformersCard() {
  const medalColors = [
    "bg-gradient-to-br from-brand-gold to-amber-500 text-white shadow-md shadow-brand-gold/30",
    "bg-gradient-to-br from-slate-300 to-slate-200 text-slate-600",
    "bg-gradient-to-br from-amber-200 to-amber-100 text-amber-700",
  ];

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-brand-gold to-amber-400" />
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
          <TrendingUp className="size-4 text-brand-gold" />
          Top performers
        </CardTitle>
        <CardDescription>Highest XP earners this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {topPerformers.map((student) => (
          <div
            key={student.rank}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50",
              student.rank === 1 && "bg-brand-gold/5 hover:bg-brand-gold/8",
            )}
          >
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                medalColors[student.rank - 1] ?? "bg-brand-navy/8 text-brand-navy",
              )}
            >
              {student.rank === 1 ? "👑" : student.rank}
            </span>
            <div className="size-8 shrink-0 rounded-full bg-gradient-to-br from-brand-navy/20 to-brand-gold/20 flex items-center justify-center text-[10px] font-bold text-brand-navy">
              {student.name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-navy">{student.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{student.university}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-sm font-bold text-brand-gold">
                {student.xp.toLocaleString()}
                <span className="text-[10px] ml-0.5">XP</span>
              </p>
              <p className="flex items-center justify-end gap-0.5 text-[10px] text-orange-500">
                <Flame className="size-2.5" />
                {student.streak}d
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlatformHealthCard() {
  const healthDot = {
    healthy: "bg-emerald-500",
    warning: "bg-amber-400",
    critical: "bg-red-500 animate-pulse",
  };
  const healthBadge = {
    healthy: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    critical: "bg-red-50 text-red-600 border border-red-200",
  };

  const allHealthy = platformHealth.every((m) => m.status === "healthy");

  return (
    <Card className="shadow-sm overflow-hidden">
      <div className={cn("h-1 w-full", allHealthy ? "bg-emerald-400" : "bg-amber-400")} />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
              <Zap className="size-4 text-brand-gold" />
              Platform health
            </CardTitle>
            <CardDescription>System status and infrastructure metrics</CardDescription>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
              allHealthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                allHealthy ? "bg-emerald-500" : "bg-amber-400 animate-pulse",
              )}
            />
            {allHealthy ? "All systems go" : "Attention needed"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 pt-0">
        {platformHealth.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3"
          >
            <div className="flex items-center gap-2">
              <span className={cn("size-2 rounded-full shrink-0", healthDot[metric.status])} />
              <span className="text-xs font-medium text-slate-600">{metric.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-brand-navy">{metric.value}</span>
              <Badge variant="secondary" className={cn("text-[10px]", healthBadge[metric.status])}>
                {metric.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrackEngagementCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-brand-navy">Engagement by track</CardTitle>
        <CardDescription>Student enrollment and chapter completion rates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {trackEngagement.map((track) => (
          <div key={track.track} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{track.track}</span>
              <span className="font-mono text-muted-foreground">
                {track.students.toLocaleString()} students ·{" "}
                <span className="text-brand-gold">{track.completion}%</span>
              </span>
            </div>
            <Progress value={track.completion} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function UniversityCard() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-brand-navy">Top universities</CardTitle>
        <CardDescription>Student distribution across partner institutions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {universityBreakdown.map((uni) => (
          <div key={uni.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{uni.name}</span>
              <span className="font-mono text-muted-foreground">
                {uni.students.toLocaleString()}{" "}
                <span className="text-brand-gold">({uni.share}%)</span>
              </span>
            </div>
            <Progress value={uni.share * 5} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ModerationSection({ admin }: { admin: AdminDashboardState }) {
  const { flags, resolveFlag } = admin;
  const openCount = flags.filter((f) => f.status === "open").length;
  const resolvedCount = flags.filter((f) => f.status === "resolved").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="shadow-sm border-amber-200 bg-amber-50/30">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                Open reports
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{openCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Check className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Resolved
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{resolvedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anti-abuse / integrity regulation controls */}
      <IntegritySection />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">Moderation queue</CardTitle>
          <CardDescription>
            {flags.filter((f) => f.status === "open").length} open report
            {flags.filter((f) => f.status === "open").length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Report</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-mono text-xs">{flag.id}</TableCell>
                  <TableCell>{flag.report}</TableCell>
                  <TableCell>{flag.user}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        flag.status === "open"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700",
                      )}
                    >
                      {flag.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={flag.status === "resolved"}
                      onClick={() => resolveFlag(flag.id)}
                    >
                      {flag.status === "resolved" ? "Resolved" : "Resolve"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSection({ admin }: { admin: AdminDashboardState }) {
  const { settings, setSettings, saveSettings } = admin;

  return (
    <Card className="max-w-xl shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-brand-navy">Platform settings</CardTitle>
        <CardDescription>Configure defaults and notification behavior</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="email-alerts">Email alerts</Label>
            <p className="text-xs text-muted-foreground">Notify admins of pending approvals</p>
          </div>
          <Switch
            id="email-alerts"
            checked={settings.emailAlerts}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, emailAlerts: v }))}
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-approve">Auto-approve students</Label>
            <p className="text-xs text-muted-foreground">
              Skip manual verification for .edu.et emails
            </p>
          </div>
          <Switch
            id="auto-approve"
            checked={settings.autoApprove}
            onCheckedChange={(v) => setSettings((s) => ({ ...s, autoApprove: v }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="max-exams">Max daily exams per student</Label>
          <Input
            id="max-exams"
            type="number"
            value={settings.maxDailyExams}
            onChange={(e) => setSettings((s) => ({ ...s, maxDailyExams: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="default-xp">Default XP per exam</Label>
          <Input
            id="default-xp"
            type="number"
            value={settings.defaultXpReward}
            onChange={(e) => setSettings((s) => ({ ...s, defaultXpReward: e.target.value }))}
          />
        </div>
        <Button onClick={saveSettings}>Save settings</Button>
      </CardContent>
    </Card>
  );
}
