import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCheck,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Gift,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  Shield,
  Users,
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
  { label: "Exams", section: "exams", icon: ClipboardList, badgeKey: "exams" },
  { label: "Rewards", section: "rewards", icon: Gift, badgeKey: "rewards" },
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
  const { signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-gold font-serif text-lg font-bold text-white">
              S
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif text-base font-bold text-sidebar-foreground">
                Study2Earn
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-brand-gold">
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
                          section === item.section &&
                            "bg-brand-navy text-white hover:bg-brand-navy hover:text-white",
                        )}
                      >
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <Badge className="h-5 min-w-5 justify-center bg-brand-gold px-1.5 text-[10px] text-white">
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
                          section === item.section &&
                            "bg-brand-navy text-white hover:bg-brand-navy hover:text-white",
                        )}
                      >
                        <item.icon className="size-4" />
                        <span className="flex-1">{item.label}</span>
                        {badge > 0 && (
                          <Badge className="h-5 min-w-5 justify-center bg-brand-gold px-1.5 text-[10px] text-white">
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

        <SidebarFooter className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent p-3">
            <Avatar className="size-9">
              <AvatarFallback className="bg-brand-navy text-xs font-bold text-white">
                AM
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Admin Mekonnen</p>
              <p className="truncate text-xs text-muted-foreground">Platform Director</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              title="Sign out"
              onClick={() => {
                signOut();
                void navigate({ to: "/login", search: { redirect: undefined, ref: undefined } });
              }}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <div className="flex flex-1 flex-col">
            <h1 className="font-serif text-lg font-bold text-brand-navy">{title}</h1>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="hidden w-full max-w-sm md:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students, exams, content…"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative shrink-0"
            onClick={() => setNotificationsOpen(true)}
            aria-label="Open notifications"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-gold text-[9px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden gap-2 sm:flex">
                Export report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportReport("csv")}>
                <FileSpreadsheet className="mr-2 size-4" />
                Export students (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport("summary")}>
                <FileText className="mr-2 size-4" />
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
          <div className="space-y-3 pr-4">
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => onOpen(n)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                  !n.read && "border-brand-gold/40 bg-brand-gold/5",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {!n.read && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 bg-brand-gold/20 text-brand-gold"
                    >
                      New
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

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
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "rounded-xl border bg-card p-5 text-left shadow-sm",
        onClick && "cursor-pointer transition-shadow hover:shadow-md",
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl font-bold text-brand-navy">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        <Badge
          variant="secondary"
          className={cn(
            "font-mono text-[10px]",
            trend === "up" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
          )}
        >
          {change}
        </Badge>
        <span className="text-xs text-muted-foreground">{sub}</span>
      </div>
    </Wrapper>
  );
}
