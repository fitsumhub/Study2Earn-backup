import { useState, useEffect } from "react";
import { Ban, CheckCircle2, Clock, Pencil, Trash2, UserPlus, Users, X } from "lucide-react";

import { StudentsTable } from "@/components/admin/students-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import type { UserStatus } from "@/lib/admin-types";
import { cn } from "@/lib/utils";

export function StudentsSection({ admin, full }: { admin: AdminDashboardState; full?: boolean }) {
  const {
    filteredUsers,
    users,
    searchQuery,
    setSearchQuery,
    setProfileUser,
    setMessageUser,
    setSuspendUser,
    setAdjustPointsUser,
    updateUserStatus,
    openQuickAction,
    openEdit,
    deleteStudent,
    bulkUpdateUserStatus,
    bulkDeleteStudents,
  } = admin;
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const statusCounts = {
    all: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    suspended: users.filter((u) => u.status === "suspended").length,
  };

  const displayed =
    statusFilter === "all" ? filteredUsers : filteredUsers.filter((u) => u.status === statusFilter);

  useEffect(() => {
    setSelectedIds([]);
  }, [statusFilter, searchQuery]);

  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAll = (select: boolean) => {
    setSelectedIds(select ? displayed.map((u) => u.id) : []);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {(
          [
            {
              key: "all",
              label: "All Students",
              icon: Users,
              color: "text-brand-navy",
              bg: "bg-brand-navy/8",
              ring: "ring-brand-navy/25",
              border: "border-l-4 border-l-brand-navy",
            },
            {
              key: "active",
              label: "Active",
              icon: CheckCircle2,
              color: "text-emerald-600",
              bg: "bg-emerald-50",
              ring: "ring-emerald-300",
              border: "border-l-4 border-l-emerald-400",
            },
            {
              key: "pending",
              label: "Pending",
              icon: Clock,
              color: "text-amber-600",
              bg: "bg-amber-50",
              ring: "ring-amber-300",
              border: "border-l-4 border-l-amber-400",
            },
            {
              key: "suspended",
              label: "Suspended",
              icon: Ban,
              color: "text-red-600",
              bg: "bg-red-50",
              ring: "ring-red-200",
              border: "border-l-4 border-l-red-400",
            },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = statusFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={cn(
                "rounded-xl border bg-white p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5",
                item.border,
                active && `ring-2 ${item.ring} shadow-sm`,
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg",
                    item.bg,
                    item.color,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                {item.key === "pending" && statusCounts.pending > 0 && (
                  <span className="flex size-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-0.5 font-serif text-3xl font-bold",
                  active ? item.color : "text-brand-navy",
                )}
              >
                {statusCounts[item.key]}
              </p>
            </button>
          );
        })}
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
      
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-brand-gold/30 bg-brand-gold/5 p-3 shadow-sm animate-in fade-in slide-in-from-bottom-2">
          <p className="text-sm font-semibold text-brand-navy ml-2">
            {selectedIds.length} selected
          </p>
          <div className="flex-1" />
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
            onClick={() => {
              bulkUpdateUserStatus(selectedIds, "active");
              setSelectedIds([]);
            }}
          >
            <CheckCircle2 className="mr-2 size-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
            onClick={() => {
              bulkUpdateUserStatus(selectedIds, "suspended");
              setSelectedIds([]);
            }}
          >
            <Ban className="mr-2 size-4" />
            Suspend
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
            onClick={() => {
              if (confirm(`Delete ${selectedIds.length} students? This cannot be undone.`)) {
                bulkDeleteStudents(selectedIds);
                setSelectedIds([]);
              }
            }}
          >
            <Trash2 className="mr-2 size-4" />
            Delete
          </Button>
          <div className="h-4 w-px bg-slate-200 mx-1" />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSelectedIds([])}
            className="size-8 text-slate-500 hover:text-slate-900"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

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
            selectedIds={selectedIds}
            onSelectToggle={handleSelectToggle}
            onSelectAll={handleSelectAll}
            onView={setProfileUser}
            onEdit={(user) => openEdit({ type: "student", item: user })}
            onMessage={setMessageUser}
            onSuspend={setSuspendUser}
            onApprove={(id) => updateUserStatus(id, "active")}
            onReactivate={(id) => updateUserStatus(id, "active")}
            onDelete={deleteStudent}
            onAdjustPoints={setAdjustPointsUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}
