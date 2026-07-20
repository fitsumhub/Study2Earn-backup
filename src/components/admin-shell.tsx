import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  FolderTree,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Banknote,
  PanelTop,
  Search,
  Settings,
  Share2,
  Shield,
  TestTube2,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import { useAuth } from "@/hooks/use-auth";
import type { AdminNotification, AdminSection } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

const navMain: {
  label: string;
  section: AdminSection;
  icon: typeof LayoutDashboard;
  badgeKey?: keyof AdminDashboardState["navBadges"];
}[] = [
  { label: "Overview", section: "overview", icon: LayoutDashboard },
  { label: "Students", section: "students", icon: Users, badgeKey: "students" },
  { label: "Content", section: "content", icon: BookOpen, badgeKey: "content" },
  { label: "Categories", section: "categories", icon: FolderTree },
  { label: "Site Content", section: "siteContent", icon: PanelTop },
  { label: "Exams", section: "exams", icon: ClipboardList, badgeKey: "exams" },
  { label: "Rewards", section: "rewards", icon: Gift, badgeKey: "rewards" },
  { label: "Sponsors", section: "ads", icon: Megaphone },
  { label: "Withdrawals", section: "withdrawals", icon: Banknote, badgeKey: "withdrawals" },
  { label: "Referrals", section: "referrals", icon: Share2, badgeKey: "referrals" },
  { label: "Analytics", section: "analytics", icon: BarChart3 },
];

const navSystem: {
  label: string;
  section: AdminSection;
  icon: typeof Shield;
  badgeKey?: keyof AdminDashboardState["navBadges"];
}[] = [
  { label: "Moderation", section: "moderation", icon: Shield, badgeKey: "moderation" },
  { label: "Settings", section: "settings", icon: Settings },
  { label: "System Tests", section: "tests", icon: TestTube2 },
];

export function AdminShell({
  title,
  description,
  admin,
  children,
}: {
  title: string;
  description?: string;
  admin: AdminDashboardState;
  children: ReactNode;
}) {
  const {
    section,
    setSection,
    searchQuery,
    setSearchQuery,
    notifications,
    unreadCount,
    notificationsOpen,
    setNotificationsOpen,
    markAllNotificationsRead,
    openNotification,
    exportReport,
    navBadges,
  } = admin;
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const adminName = user?.name ?? "Admin";
  const adminInitials =
    adminName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD";

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-gold to-amber-500 font-serif text-lg font-bold text-white shadow-md shadow-brand-gold/30 transition-transform group-hover:scale-105">
              S
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-bold text-sidebar-foreground">
                Study2Earn
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                <Shield className="size-2.5" />
                Admin Console
              </span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navMain.map((item) => {
                  const badge = item.badgeKey ? navBadges[item.badgeKey] : 0;
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton
                        isActive={section === item.section}
                        onClick={() => setSection(item.section)}
                        className={cn(
                          "relative transition-all",
                          section === item.section
                            ? "bg-brand-navy text-white hover:bg-brand-navy hover:text-white font-semibold shadow-sm"
                            : "hover:bg-brand-navy/5",
                        )}
                      >
                        {section === item.section && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-gold" />
                        )}
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <Badge
                            className={cn(
                              "h-5 min-w-5 justify-center px-1.5 text-[10px] text-white",
                              section === item.section
                                ? "bg-brand-gold"
                                : "bg-brand-gold animate-pulse",
                            )}
                          >
                            {badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>System</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navSystem.map((item) => {
                  const badge = item.badgeKey ? navBadges[item.badgeKey] : 0;
                  return (
                    <SidebarMenuItem key={item.section}>
                      <SidebarMenuButton
                        isActive={section === item.section}
                        onClick={() => setSection(item.section)}
                        className={cn(
                          "relative transition-all",
                          section === item.section
                            ? "bg-brand-navy text-white hover:bg-brand-navy hover:text-white font-semibold shadow-sm"
                            : "hover:bg-brand-navy/5",
                        )}
                      >
                        {section === item.section && (
                          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-gold" />
                        )}
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <Badge
                            className={cn(
                              "h-5 min-w-5 justify-center px-1.5 text-[10px] text-white",
                              section === item.section
                                ? "bg-brand-gold"
                                : "bg-brand-gold animate-pulse",
                            )}
                          >
                            {badge}
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="rounded-xl border border-brand-gold/20 bg-gradient-to-br from-brand-navy/5 to-brand-gold/5 p-3">
            <div className="flex items-center gap-3">
              <Avatar className="size-10 ring-2 ring-brand-gold/40 ring-offset-1">
                <AvatarFallback className="bg-gradient-to-br from-brand-navy to-brand-gold text-xs font-bold text-white">
                  {adminInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-brand-navy">{adminName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <p className="truncate text-[10px] font-semibold text-emerald-600">
                    Platform Director
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                title="Sign out"
                onClick={() => {
                  signOut();
                  void navigate({ to: "/login", search: { redirect: undefined, ref: undefined } });
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-white/95 px-6 backdrop-blur shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="hidden h-5 w-px bg-slate-200 sm:block" />
          <div className="flex flex-1 flex-col min-w-0">
            <h1 className="font-serif text-lg font-bold text-brand-navy leading-tight truncate">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] text-slate-400 leading-tight truncate">{description}</p>
            )}
          </div>
          <div className="hidden w-full max-w-xs md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search…"
                className="pl-8 h-9 text-sm bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            type="button"
            className="relative flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-navy transition-colors"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Open notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-white shadow-sm animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden gap-2 sm:flex h-9 text-sm">
                <FileText className="size-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => exportReport("csv")}>
                <FileSpreadsheet className="mr-2 size-4 text-emerald-600" />
                Export students (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport("withdrawals")}>
                <Banknote className="mr-2 size-4 text-brand-gold" />
                Export withdrawals (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport("summary")}>
                <FileText className="mr-2 size-4 text-blue-600" />
                Download summary (TXT)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 bg-slate-50/80 p-6">{children}</main>
      </SidebarInset>

      <NotificationSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onMarkAllRead={markAllNotificationsRead}
        onOpen={openNotification}
      />
    </SidebarProvider>
  );
}

function NotificationSheet({
  open,
  onOpenChange,
  notifications,
  onMarkAllRead,
  onOpen,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: AdminNotification[];
  onMarkAllRead: () => void;
  onOpen: (n: AdminNotification) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>Platform alerts and pending actions</SheetDescription>
        </SheetHeader>
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" className="gap-2" onClick={onMarkAllRead}>
            <CheckCheck className="size-4" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="mt-2 h-[calc(100vh-10rem)]">
          <div className="space-y-2 pr-4">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onOpen(n)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                  !n.read
                    ? "border-brand-gold/40 bg-brand-gold/5 hover:bg-brand-gold/8"
                    : "border-slate-100 bg-white hover:bg-slate-50/60",
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
                      !n.read ? "bg-brand-gold/20 text-brand-gold" : "bg-slate-100 text-slate-400",
                    )}
                  >
                    <Bell className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-brand-navy leading-tight">
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="shrink-0 size-2 rounded-full bg-brand-gold mt-1.5" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

const statIconMap: Record<
  string,
  { icon: typeof Users; color: string; bg: string; border: string }
> = {
  "Total Students": {
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-l-4 border-l-blue-400",
  },
  "Active Today": {
    icon: Zap,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-l-4 border-l-emerald-400",
  },
  "Exams Completed": {
    icon: ClipboardList,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-l-4 border-l-violet-400",
  },
  "Rewards Redeemed": {
    icon: Wallet,
    color: "text-brand-gold",
    bg: "bg-amber-50",
    border: "border-l-4 border-l-brand-gold",
  },
  "Pending Payouts": {
    icon: Banknote,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-l-4 border-l-emerald-400",
  },
};

export function AdminStatCard({
  label,
  value,
  change,
  trend,
  sub,
  onClick,
}: {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down";
  sub: string;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";
  const meta = statIconMap[label];
  const Icon = meta?.icon ?? TrendingUp;

  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-white p-5 text-left shadow-sm transition-all duration-200",
        meta?.border ?? "border-l-4 border-l-slate-200",
        onClick && "cursor-pointer hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            meta?.bg ?? "bg-slate-50",
            meta?.color ?? "text-slate-500",
          )}
        >
          <Icon className="size-5" />
        </div>
        <Badge
          variant="secondary"
          className={cn(
            "font-mono text-[10px] shrink-0",
            trend === "up"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-red-50 text-red-600 border border-red-100",
          )}
        >
          {change}
        </Badge>
      </div>
      <p className="mt-3 font-serif text-3xl font-bold text-brand-navy">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>
    </Wrapper>
  );
}
