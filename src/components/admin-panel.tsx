import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ClipboardList,
  Clock,
  Flame,
  Gift,
  MoreHorizontal,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  UserCheck,
  UserPlus,
  Wallet,
  X,
  Zap,
} from "lucide-react";
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

import { BookCover } from "@/components/book-cover";
import { BankLogo } from "@/components/bank-logo";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import {
  adminStats,
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
import type { AdminUser, UserStatus } from "@/lib/admin-types";
import { getBankById } from "@/lib/ethiopian-banks";
import type { WithdrawalRequest } from "@/lib/withdrawal-data";
import { cn } from "@/lib/utils";

const engagementChartConfig = {
  active: { label: "Active users", color: "oklch(0.36 0.13 264)" },
  exams: { label: "Exams taken", color: "oklch(0.69 0.16 55)" },
};

const subjectChartConfig = {
  count: { label: "Completions", color: "oklch(0.36 0.13 264)" },
};

const readingChartConfig = {
  hours: { label: "Reading hours", color: "oklch(0.69 0.16 55)" },
};

const xpChartConfig = {
  issued: { label: "XP issued", color: "oklch(0.36 0.13 264)" },
  redeemed: { label: "XP redeemed", color: "oklch(0.69 0.16 55)" },
};

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  suspended: "bg-red-50 text-red-700",
};

const activityIcons = {
  user: UserPlus,
  reward: Gift,
  exam: ClipboardList,
  content: BookOpen,
  moderation: TrendingUp,
};

const quickActions = [
  { key: "addStudent" as const, label: "Add student", icon: UserPlus },
  { key: "publishExam" as const, label: "Publish exam", icon: ClipboardList },
  { key: "uploadContent" as const, label: "Upload content", icon: BookOpen },
  { key: "createReward" as const, label: "Create reward", icon: Gift },
];

export function AdminPanel({ admin }: { admin: AdminDashboardState }) {
  const { section } = admin;

  switch (section) {
    case "students":
      return <StudentsSection admin={admin} full />;
    case "content":
      return <ContentSection admin={admin} />;
    case "exams":
      return <ExamsSection admin={admin} />;
    case "rewards":
      return <RewardsSection admin={admin} />;
    case "analytics":
      return <AnalyticsSection />;
    case "moderation":
      return <ModerationSection admin={admin} />;
    case "settings":
      return <SettingsSection admin={admin} />;
    default:
      return <OverviewSection admin={admin} />;
  }
}

function OverviewSection({ admin }: { admin: AdminDashboardState }) {
  const {
    filteredUsers,
    activity,
    pendingStudents,
    openFlags,
    unsyncedContent,
    draftExams,
    pendingWithdrawals,
    setSection,
    setProfileUser,
    setMessageUser,
    setSuspendUser,
    updateUserStatus,
    openQuickAction,
  } = admin;

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
      label: "Withdrawal requests",
      count: pendingWithdrawals,
      section: "rewards" as const,
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  ].filter((a) => a.count > 0);

  return (
    <div className="space-y-6">
      {pendingActions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pendingActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => setSection(action.section)}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition hover:shadow-md",
                action.color,
              )}
            >
              <action.icon className="size-5 shrink-0" />
              <div>
                <p className="text-2xl font-bold">{action.count}</p>
                <p className="text-xs font-medium">{action.label}</p>
              </div>
              <ArrowUpRight className="ml-auto size-4 opacity-60" />
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {adminStats.map((stat) => (
          <AdminStatCard
            key={stat.label}
            {...stat}
            onClick={() => {
              if (stat.label.includes("Student")) setSection("students");
              else if (stat.label.includes("Exam")) setSection("exams");
              else if (stat.label.includes("Reward")) setSection("rewards");
              else setSection("analytics");
            }}
          />
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
          <CardContent className="space-y-4">
            {activity.map((item) => {
              const Icon = activityIcons[item.type];
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
                  className="flex w-full gap-3 text-left transition-opacity hover:opacity-80"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 border-b border-border/60 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{item.action}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {item.time}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
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

function StudentsSection({ admin, full }: { admin: AdminDashboardState; full?: boolean }) {
  const {
    filteredUsers,
    users,
    searchQuery,
    setSearchQuery,
    setProfileUser,
    setMessageUser,
    setSuspendUser,
    updateUserStatus,
    openQuickAction,
  } = admin;
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");

  const statusCounts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const displayed =
    statusFilter === "all" ? filteredUsers : filteredUsers.filter((u) => u.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {(["all", "active", "pending", "suspended"] as const).map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={cn(
              "rounded-xl border bg-white p-4 text-left transition hover:shadow-sm",
              statusFilter === status && "border-brand-navy ring-1 ring-brand-navy/20",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground capitalize">
              {status === "all" ? "All students" : status}
            </p>
            <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">
              {statusCounts[status]}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="md:hidden w-full max-w-sm">
          <Input
            placeholder="Search students…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button className="gap-2" onClick={() => openQuickAction("addStudent")}>
          <UserPlus className="size-4" />
          Add student
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">
            {full ? "All students" : "Students"}
          </CardTitle>
          <CardDescription>
            {displayed.length} student{displayed.length !== 1 ? "s" : ""}
            {searchQuery ? ` matching "${searchQuery}"` : ""}
            {statusFilter !== "all" ? ` · ${statusFilter}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentsTable
            users={displayed}
            onView={setProfileUser}
            onMessage={setMessageUser}
            onSuspend={setSuspendUser}
            onApprove={(id) => updateUserStatus(id, "active")}
            onReactivate={(id) => updateUserStatus(id, "active")}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function StudentsTable({
  users,
  onView,
  onMessage,
  onSuspend,
  onApprove,
  onReactivate,
}: {
  users: AdminUser[];
  onView: (u: AdminUser) => void;
  onMessage: (u: AdminUser) => void;
  onSuspend: (u: AdminUser) => void;
  onApprove: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  if (users.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No students found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead className="hidden md:table-cell">University</TableHead>
          <TableHead className="hidden lg:table-cell">Program</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">XP</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <button
                type="button"
                className="text-left hover:underline"
                onClick={() => onView(user)}
              >
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.id}</p>
              </button>
            </TableCell>
            <TableCell className="hidden text-muted-foreground md:table-cell">
              {user.university}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{user.program}</TableCell>
            <TableCell>
              <Badge variant="secondary" className={cn("capitalize", statusStyles[user.status])}>
                {user.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right font-mono text-sm">
              {user.xp > 0 ? user.xp.toLocaleString() : "—"}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(user)}>View profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMessage(user)}>Send message</DropdownMenuItem>
                  {user.status === "pending" && (
                    <DropdownMenuItem onClick={() => onApprove(user.id)}>
                      <UserCheck className="mr-2 size-4" />
                      Approve account
                    </DropdownMenuItem>
                  )}
                  {user.status === "suspended" && (
                    <DropdownMenuItem onClick={() => onReactivate(user.id)}>
                      <UserCheck className="mr-2 size-4" />
                      Reactivate account
                    </DropdownMenuItem>
                  )}
                  {user.status !== "suspended" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onSuspend(user)}
                      >
                        Suspend account
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ContentSection({ admin }: { admin: AdminDashboardState }) {
  const { content, syncContent, openQuickAction, unsyncedContent } = admin;
  const syncedCount = content.filter((c) => c.synced).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
              <BookOpen className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total books
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{content.length}</p>
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
                Synced
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">
                {syncedCount}/{content.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <RefreshCw className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending sync
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{unsyncedContent}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => openQuickAction("uploadContent")}>
          <BookOpen className="size-4" />
          Upload content
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">MoE curriculum library</CardTitle>
          <CardDescription>{content.length} books in catalog</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Cover</TableHead>
                <TableHead>Book</TableHead>
                <TableHead>Chapters</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Sync</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.map((item) => {
                const short = item.name.split("(")[0].trim().split(" ").pop() ?? item.name;
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="w-10">
                        <BookCover short={short} name={item.name} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.chapters}</TableCell>
                    <TableCell>{item.students}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          item.synced
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        )}
                      >
                        {item.synced ? "Synced" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        disabled={item.synced}
                        onClick={() => syncContent(item.id)}
                      >
                        <RefreshCw className="size-3.5" />
                        {item.synced ? "Up to date" : "Sync now"}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ExamsSection({ admin }: { admin: AdminDashboardState }) {
  const { exams, toggleExamPublished, openQuickAction } = admin;
  const published = exams.filter((e) => e.published).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total exams
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{exams.length}</p>
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
                Published
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <X className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Drafts
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">
                {exams.length - published}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => openQuickAction("publishExam")}>
          <ClipboardList className="size-4" />
          Publish exam
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">Mock exams</CardTitle>
          <CardDescription>
            {exams.filter((e) => e.published).length} published of {exams.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell className="font-medium">{exam.title}</TableCell>
                  <TableCell>{exam.subject}</TableCell>
                  <TableCell>{exam.questions}</TableCell>
                  <TableCell>{exam.duration} min</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        exam.published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {exam.published ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExamPublished(exam.id)}
                    >
                      {exam.published ? (
                        <>
                          <X className="mr-1 size-3.5" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Check className="mr-1 size-3.5" />
                          Publish
                        </>
                      )}
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

function RewardsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    rewards,
    withdrawals,
    pendingWithdrawals,
    toggleRewardActive,
    openQuickAction,
    approveWithdrawal,
    rejectWithdrawal,
    markPaid,
  } = admin;
  const [withdrawalFilter, setWithdrawalFilter] = useState<"all" | "pending" | "approved">(
    "pending",
  );

  const activeCount = rewards.filter((r) => r.active).length;
  const totalWithdrawnEtb = withdrawals
    .filter((w) => w.status === "paid" || w.status === "approved")
    .reduce((sum, w) => sum + w.amountEtb, 0);

  const filteredWithdrawals = withdrawals.filter((w) => {
    if (withdrawalFilter === "pending") return w.status === "pending";
    if (withdrawalFilter === "approved") return w.status === "approved";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
              <Gift className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total rewards
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{rewards.length}</p>
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
                Active
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pending withdrawals
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">{pendingWithdrawals}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-brand-gold/10 text-brand-gold">
              <Building2 className="size-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ETB disbursed
              </p>
              <p className="font-serif text-2xl font-bold text-brand-navy">
                {totalWithdrawnEtb.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank withdrawal requests */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-brand-navy">Bank withdrawal requests</CardTitle>
              <CardDescription>
                Review and approve XP-to-ETB cash-out requests to Ethiopian banks
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(["pending", "approved", "all"] as const).map((f) => (
                <Button
                  key={f}
                  variant={withdrawalFilter === f ? "default" : "outline"}
                  size="sm"
                  className={withdrawalFilter === f ? "bg-brand-navy" : ""}
                  onClick={() => setWithdrawalFilter(f)}
                >
                  {f === "pending"
                    ? `Pending (${pendingWithdrawals})`
                    : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredWithdrawals.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No {withdrawalFilter === "all" ? "" : withdrawalFilter} withdrawal requests
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Bank</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWithdrawals.map((req) => (
                  <WithdrawalRow
                    key={req.id}
                    request={req}
                    onApprove={() => approveWithdrawal(req.id)}
                    onReject={() => rejectWithdrawal(req.id)}
                    onMarkPaid={() => markPaid(req.id)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={() => openQuickAction("createReward")}>
          <Gift className="size-4" />
          Create reward
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <Card key={reward.id} className={cn("shadow-sm", !reward.active && "opacity-60")}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{reward.title}</CardTitle>
                <Badge variant="secondary">{reward.tag}</Badge>
              </div>
              <CardDescription>{reward.xp.toLocaleString()} XP required</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={reward.active ? "outline" : "default"}
                size="sm"
                className="w-full"
                onClick={() => toggleRewardActive(reward.id)}
              >
                {reward.active ? "Deactivate" : "Activate"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const withdrawalStatusStyles: Record<WithdrawalRequest["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  rejected: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
};

function WithdrawalRow({
  request,
  onApprove,
  onReject,
  onMarkPaid,
}: {
  request: WithdrawalRequest;
  onApprove: () => void;
  onReject: () => void;
  onMarkPaid: () => void;
}) {
  const bank = getBankById(request.bankId);

  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-brand-navy">{request.userName}</p>
        <p className="text-xs text-muted-foreground">{request.university}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{request.requestedAt}</p>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          {bank && <BankLogo bank={bank} size="sm" />}
          <div>
            <p className="text-sm font-medium">{request.bankName}</p>
            <p className="text-xs text-muted-foreground">{request.accountName}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-mono text-sm">{request.accountNumber}</TableCell>
      <TableCell>
        <p className="font-bold text-brand-navy">{request.amountEtb} ETB</p>
        <p className="text-xs text-muted-foreground">-{request.xpDeducted} XP</p>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={withdrawalStatusStyles[request.status]}>
          {request.status}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        {request.status === "pending" && (
          <div className="flex justify-end gap-2">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="outline" className="text-red-600" onClick={onReject}>
              Reject
            </Button>
          </div>
        )}
        {request.status === "approved" && (
          <Button size="sm" variant="outline" onClick={onMarkPaid}>
            Mark paid
          </Button>
        )}
        {(request.status === "paid" || request.status === "rejected") && (
          <span className="text-xs text-muted-foreground">{request.processedAt ?? "—"}</span>
        )}
      </TableCell>
    </TableRow>
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
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-brand-navy">Top performers</CardTitle>
        <CardDescription>Highest XP earners this month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topPerformers.map((student) => (
          <div
            key={student.rank}
            className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                student.rank === 1
                  ? "bg-brand-gold/20 text-brand-gold"
                  : "bg-brand-navy/5 text-brand-navy",
              )}
            >
              {student.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{student.name}</p>
              <p className="text-xs text-muted-foreground">{student.university}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-sm font-bold text-brand-gold">
                {student.xp.toLocaleString()} XP
              </p>
              <p className="flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                <Flame className="size-3 text-orange-500" />
                {student.streak}d streak
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PlatformHealthCard() {
  const healthStyles = {
    healthy: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    critical: "bg-red-50 text-red-700",
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="font-serif text-brand-navy">Platform health</CardTitle>
        <CardDescription>System status and infrastructure metrics</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {platformHealth.map((metric) => (
          <div
            key={metric.label}
            className="flex items-center justify-between rounded-lg border border-border/60 p-3"
          >
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-brand-navy" />
              <span className="text-sm text-muted-foreground">{metric.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-semibold">{metric.value}</span>
              <Badge variant="secondary" className={healthStyles[metric.status]}>
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
