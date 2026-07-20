import {
  BarChart3,
  Coffee,
  FastForward,
  Gauge,
  Lock,
  RotateCcw,
  ShieldCheck,
  TrendingDown,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useIntegrity } from "@/hooks/use-integrity";
import {
  INTEGRITY_RULE_META,
  type IntegrityRuleId,
  type IntegritySeverity,
} from "@/lib/integrity-store";
import { cn } from "@/lib/utils";

const ruleIcon: Record<IntegrityRuleId, typeof Coffee> = {
  idleReading: Coffee,
  speedReading: Gauge,
  examRush: FastForward,
  dailyCap: BarChart3,
  inactivityDecay: TrendingDown,
  withdrawalHold: Lock,
};

const severityBadge: Record<IntegritySeverity, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-600",
};

export function IntegritySection() {
  const { rules, events, activeRuleCount, updateRule, toggleRule, resetRules, setEventStatus } =
    useIntegrity();

  const openFlags = events.filter((e) => e.status === "auto").length;
  const highSeverity = events.filter((e) => e.severity === "high").length;

  const stats = [
    {
      label: "Active rules",
      value: `${activeRuleCount}/${INTEGRITY_RULE_META.length}`,
      icon: ShieldCheck,
      tint: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Total flags",
      value: events.length,
      icon: BarChart3,
      tint: "bg-brand-navy/5 text-brand-navy",
    },
    { label: "Needs review", value: openFlags, icon: Coffee, tint: "bg-amber-50 text-amber-700" },
    {
      label: "High severity",
      value: highSeverity,
      icon: TrendingDown,
      tint: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("flex size-11 items-center justify-center rounded-xl", s.tint)}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="font-serif text-2xl font-bold text-brand-navy">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rule controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-brand-navy">
            <ShieldCheck className="size-5 text-emerald-600" />
            Integrity &amp; anti-abuse controls
          </h2>
          <p className="text-sm text-muted-foreground">
            Regulations that keep rewards tied to real studying — not gaming the system for money.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          onClick={() => {
            resetRules();
            toast.success("Anti-abuse rules reset to defaults");
          }}
        >
          <RotateCcw className="size-3.5" />
          Reset rules
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {INTEGRITY_RULE_META.map((meta) => {
          const rule = rules[meta.id];
          const Icon = ruleIcon[meta.id];
          return (
            <Card
              key={meta.id}
              className={cn("shadow-sm transition-opacity", !rule.enabled && "opacity-70")}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl",
                      rule.enabled
                        ? "bg-brand-navy/5 text-brand-navy"
                        : "bg-slate-100 text-slate-400",
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-brand-navy">{meta.title}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-[10px]",
                          meta.live
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {meta.live ? "Live" : "Policy"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      {meta.description}
                    </p>
                  </div>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(meta.id)}
                    aria-label={`${rule.enabled ? "Disable" : "Enable"} ${meta.title}`}
                  />
                </div>

                {/* Parameters */}
                <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
                  <ParamField
                    label={meta.thresholdLabel}
                    unit={meta.thresholdUnit}
                    value={rule.threshold}
                    disabled={!rule.enabled}
                    onChange={(v) => updateRule(meta.id, { threshold: v })}
                  />
                  {meta.penaltyLabel && (
                    <ParamField
                      label={meta.penaltyLabel}
                      unit={meta.penaltyUnit ?? ""}
                      value={rule.penalty}
                      disabled={!rule.enabled}
                      onChange={(v) => updateRule(meta.id, { penalty: v })}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Violations log */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif text-brand-navy">Integrity flags</CardTitle>
          <CardDescription>
            Students automatically caught by the rules above. Confirm to keep the penalty, or
            dismiss a false positive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No integrity flags — students are playing fair. 🎉
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead className="min-w-[220px]">Detail</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((e) => {
                    const meta = INTEGRITY_RULE_META.find((m) => m.id === e.rule);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium text-brand-navy">{e.student}</TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {meta?.title ?? e.rule}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{e.detail}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn("text-[10px]", severityBadge[e.severity])}
                          >
                            {e.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-slate-400">
                          {e.at}
                        </TableCell>
                        <TableCell className="text-right">
                          {e.status === "auto" ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1 text-xs"
                                onClick={() => {
                                  setEventStatus(e.id, "reviewed");
                                  toast.success(`Penalty confirmed for ${e.student}`);
                                }}
                              >
                                <Check className="size-3" />
                                Confirm
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-xs text-slate-500"
                                onClick={() => {
                                  setEventStatus(e.id, "dismissed");
                                  toast(`Flag dismissed for ${e.student}`);
                                }}
                              >
                                <X className="size-3" />
                                Dismiss
                              </Button>
                            </div>
                          ) : (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px]",
                                e.status === "reviewed"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {e.status === "reviewed" ? "Confirmed" : "Dismissed"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ParamField({
  label,
  unit,
  value,
  disabled,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-9 w-24"
        />
        <span className="text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
}
