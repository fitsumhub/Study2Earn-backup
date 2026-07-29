import {
  Check,
  Plus,
  PowerOff,
  RotateCcw,
  Share2,
  Trash2,
  Trophy,
  UserCheck,
  UserPlus,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useReferralTiers } from "@/hooks/use-referral-tiers";
import type { AdminReferral } from "@/lib/admin-types";
import type { ReferralTierConfig } from "@/lib/referral-tiers-store";
import { cn } from "@/lib/utils";

const statusStyles: Record<AdminReferral["status"], string> = {
  pending: "bg-amber-50 text-amber-700",
  signed_up: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
};

const statusLabels: Record<AdminReferral["status"], string> = {
  pending: "Pending",
  signed_up: "Signed up",
  completed: "Completed",
};

export function ReferralsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    referrals,
    settings,
    setSettings,
    saveSettings,
    searchQuery,
    approveReferral,
    markReferralSignedUp,
    rejectReferral,
    deleteReferral,
  } = admin;

  const [statusFilter, setStatusFilter] = useState<AdminReferral["status"] | "all">("all");

  const stats = useMemo(() => {
    const pending = referrals.filter((r) => r.status === "pending").length;
    const signedUp = referrals.filter((r) => r.status === "signed_up").length;
    const completed = referrals.filter((r) => r.status === "completed").length;
    const totalXp = referrals.reduce((sum, r) => sum + r.xpAwarded, 0);
    const uniqueReferrers = new Set(referrals.map((r) => r.referrerId)).size;
    return { pending, signedUp, completed, totalXp, uniqueReferrers, total: referrals.length };
  }, [referrals]);

  const topReferrers = useMemo(() => {
    const map = new Map<
      string,
      { name: string; code: string; count: number; completed: number; xp: number }
    >();
    for (const r of referrals) {
      const entry = map.get(r.referrerId) ?? {
        name: r.referrerName,
        code: r.referrerCode,
        count: 0,
        completed: 0,
        xp: 0,
      };
      entry.count += 1;
      if (r.status === "completed") entry.completed += 1;
      entry.xp += r.xpAwarded;
      map.set(r.referrerId, entry);
    }
    return [...map.entries()]
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.completed - a.completed || b.count - a.count)
      .slice(0, 5);
  }, [referrals]);

  const displayed = referrals.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.referrerName.toLowerCase().includes(q) ||
      r.referrerCode.toLowerCase().includes(q) ||
      r.referredName.toLowerCase().includes(q) ||
      r.referredUniversity.toLowerCase().includes(q)
    );
  });

  const referralsEnabled = settings.referralsEnabled ?? true;

  const toggleReferrals = () =>
    setSettings((s) => ({ ...s, referralsEnabled: !s.referralsEnabled }));

  return (
    <div className="space-y-6">
      {/* ── Referral system on/off ── */}
      <div
        className={cn(
          "rounded-2xl border bg-white shadow-sm overflow-hidden transition-all",
          !referralsEnabled && "border-red-200 bg-red-50/30",
        )}
      >
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-colors",
                referralsEnabled ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500",
              )}
            >
              <Share2 className="size-5" />
            </div>
            <div>
              <p className="font-bold text-brand-navy text-sm">Referral system</p>
              <p className="text-xs text-slate-400">
                {referralsEnabled
                  ? "Students can share invite codes and earn XP bonuses"
                  : "Referral program is paused — no new invites accepted"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-xs font-semibold",
                referralsEnabled ? "text-emerald-600" : "text-red-500",
              )}
            >
              {referralsEnabled ? "ON" : "OFF"}
            </span>
            <button
              type="button"
              onClick={toggleReferrals}
              className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none",
                referralsEnabled ? "bg-emerald-500" : "bg-slate-300",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
                  referralsEnabled ? "translate-x-5" : "translate-x-0",
                )}
              />
            </button>
          </div>
        </div>

        {!referralsEnabled && (
          <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <PowerOff className="size-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600 font-medium">
              The referral program is currently disabled. Students cannot generate invite codes or
              earn referral XP.
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total referrals", value: stats.total, icon: Share2 },
          { label: "Pending review", value: stats.pending, icon: UserPlus },
          { label: "Signed up", value: stats.signedUp, icon: UserCheck },
          { label: "Completed", value: stats.completed, icon: Check },
          { label: "XP awarded", value: stats.totalXp.toLocaleString(), icon: Share2 },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-brand-navy/5 text-brand-navy">
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </p>
                <p className="font-serif text-2xl font-bold text-brand-navy">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-serif text-brand-navy">Referral program settings</CardTitle>
            <CardDescription>XP bonuses paid to referrers and new students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="friend-bonus">Friend signup bonus (XP)</Label>
                <Input
                  id="friend-bonus"
                  type="number"
                  value={settings.referralFriendBonus}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, referralFriendBonus: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signup-xp">Referrer signup XP</Label>
                <Input
                  id="signup-xp"
                  type="number"
                  value={settings.referralSignupXp}
                  onChange={(e) => setSettings((s) => ({ ...s, referralSignupXp: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="complete-xp">Referrer completion XP</Label>
                <Input
                  id="complete-xp"
                  type="number"
                  value={settings.referralCompleteXp}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, referralCompleteXp: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="auto-referrals">Auto-approve completed referrals</Label>
                <p className="text-xs text-muted-foreground">
                  Award completion XP when a referred student finishes onboarding
                </p>
              </div>
              <Switch
                id="auto-referrals"
                checked={settings.autoApproveReferrals}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, autoApproveReferrals: v }))}
              />
            </div>
            <Button onClick={saveSettings}>Save referral settings</Button>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-brand-navy">Top ambassadors</CardTitle>
            <CardDescription>{stats.uniqueReferrers} active referrers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topReferrers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No referrers yet</p>
            ) : (
              topReferrers.map((ref, i) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-brand-navy">
                      #{i + 1} {ref.name}
                    </p>
                    <p className="font-mono text-xs text-muted-foreground">{ref.code}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold text-brand-navy">{ref.completed} completed</p>
                    <p className="text-muted-foreground">{ref.xp} XP</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="font-serif text-brand-navy">Referral queue</CardTitle>
              <CardDescription>
                Review invites, confirm signups, and approve completion bonuses
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["all", "pending", "signed_up", "completed"] as const).map((f) => (
                <Button
                  key={f}
                  variant={statusFilter === f ? "default" : "outline"}
                  size="sm"
                  className={statusFilter === f ? "bg-brand-navy" : ""}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === "all"
                    ? `All (${stats.total})`
                    : f === "pending"
                      ? `Pending (${stats.pending})`
                      : f === "signed_up"
                        ? `Signed up (${stats.signedUp})`
                        : `Completed (${stats.completed})`}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayed.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No referrals match filters
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[640px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referred student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>XP</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((ref) => (
                    <ReferralRow
                      key={ref.id}
                      referral={ref}
                      onApprove={() => approveReferral(ref.id)}
                      onSignUp={() => markReferralSignedUp(ref.id)}
                      onReject={() => rejectReferral(ref.id)}
                      onDelete={() => deleteReferral(ref.id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MilestoneTiersCard />
    </div>
  );
}

function MilestoneTiersCard() {
  const { tiers, addTier, updateTier, removeTier, resetToDefaults } = useReferralTiers();

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-brand-navy flex items-center gap-2">
              <Trophy className="size-5 text-brand-gold" />
              Milestone tiers
            </CardTitle>
            <CardDescription>
              Bonus XP unlocked when referrers hit invite targets — shown on the student referral
              panel
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={resetToDefaults}>
            <RotateCcw className="size-3.5" />
            Reset to defaults
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map((tier) => (
          <TierRow
            key={tier.id}
            tier={tier}
            onUpdate={(patch) => updateTier(tier.id, patch)}
            onRemove={() => removeTier(tier.id)}
          />
        ))}
        <Button variant="outline" className="gap-2" onClick={addTier}>
          <Plus className="size-4" />
          Add milestone
        </Button>
      </CardContent>
    </Card>
  );
}

function TierRow({
  tier,
  onUpdate,
  onRemove,
}: {
  tier: ReferralTierConfig;
  onUpdate: (patch: Partial<Omit<ReferralTierConfig, "id">>) => void;
  onRemove: () => void;
}) {
  // Numeric fields are edited as local drafts and only committed (and thus
  // only re-sorted by count) on blur/Enter — committing on every keystroke
  // made the field snap back to 1/0 whenever it was cleared mid-edit, and
  // reordering the list while the admin was still typing was disorienting.
  const [countDraft, setCountDraft] = useState(String(tier.count));
  const [xpDraft, setXpDraft] = useState(String(tier.xpBonus));

  useEffect(() => setCountDraft(String(tier.count)), [tier.count]);
  useEffect(() => setXpDraft(String(tier.xpBonus)), [tier.xpBonus]);

  const commitCount = () => {
    const n = parseInt(countDraft, 10);
    if (Number.isFinite(n) && n >= 1) onUpdate({ count: n });
    else setCountDraft(String(tier.count));
  };

  const commitXp = () => {
    const n = parseInt(xpDraft, 10);
    if (Number.isFinite(n) && n >= 0) onUpdate({ xpBonus: n });
    else setXpDraft(String(tier.xpBonus));
  };

  const blurOnEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") e.currentTarget.blur();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className="grid gap-1.5">
        <Label htmlFor={`tier-count-${tier.id}`} className="text-[11px] text-muted-foreground">
          Referrals needed
        </Label>
        <Input
          id={`tier-count-${tier.id}`}
          type="number"
          min={1}
          value={countDraft}
          onChange={(e) => setCountDraft(e.target.value)}
          onBlur={commitCount}
          onKeyDown={blurOnEnter}
          className="w-28"
        />
      </div>
      <div className="grid min-w-[10rem] flex-1 gap-1.5">
        <Label htmlFor={`tier-reward-${tier.id}`} className="text-[11px] text-muted-foreground">
          Reward label
        </Label>
        <Input
          id={`tier-reward-${tier.id}`}
          value={tier.reward}
          onChange={(e) => onUpdate({ reward: e.target.value })}
          placeholder="e.g. Campus champion bonus"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`tier-xp-${tier.id}`} className="text-[11px] text-muted-foreground">
          XP bonus
        </Label>
        <Input
          id={`tier-xp-${tier.id}`}
          type="number"
          min={0}
          value={xpDraft}
          onChange={(e) => setXpDraft(e.target.value)}
          onBlur={commitXp}
          onKeyDown={blurOnEnter}
          className="w-28"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="mt-5 shrink-0 text-destructive hover:bg-destructive/10"
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

function ReferralRow({
  referral,
  onApprove,
  onSignUp,
  onReject,
  onDelete,
}: {
  referral: AdminReferral;
  onApprove: () => void;
  onSignUp: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <p className="font-semibold text-brand-navy">{referral.referrerName}</p>
        <p className="font-mono text-xs text-muted-foreground">{referral.referrerCode}</p>
        <p className="text-[10px] text-muted-foreground">{referral.referrerId}</p>
      </TableCell>
      <TableCell>
        <p className="font-medium">{referral.referredName}</p>
        <p className="text-xs text-muted-foreground">{referral.referredUniversity}</p>
        {referral.notes && (
          <p className="mt-1 text-[10px] italic text-amber-700">{referral.notes}</p>
        )}
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={cn(statusStyles[referral.status])}>
          {statusLabels[referral.status]}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="font-mono font-semibold">{referral.xpAwarded}</span>
        <span className="text-xs text-muted-foreground"> XP</span>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{referral.date}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          {referral.status === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={onSignUp}>
                Confirm signup
              </Button>
              <Button size="sm" variant="outline" className="text-red-600" onClick={onReject}>
                <X className="size-3.5" />
              </Button>
            </>
          )}
          {referral.status === "signed_up" && (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={onApprove}>
                Approve bonus
              </Button>
              <Button size="sm" variant="outline" className="text-red-600" onClick={onReject}>
                <X className="size-3.5" />
              </Button>
            </>
          )}
          {referral.status === "completed" && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
