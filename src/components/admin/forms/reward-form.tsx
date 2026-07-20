import { useEffect, useState, type FormEvent } from "react";

import { FormField } from "@/components/admin/forms/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminReward } from "@/lib/admin-types";

// Every reward is one of exactly four kinds — see src/routes/rewards.tsx
// `kindOf()`. ETB/USDT redemptions route through the real withdrawal
// pipeline; Theme and AdFree apply instantly and client-side.
const REWARD_TAGS = ["ETB", "USDT", "Theme", "AdFree"];

export type RewardFormData = {
  title: string;
  xp: string;
  tag: string;
  active: boolean;
};

const emptyReward: RewardFormData = {
  title: "",
  xp: "500",
  tag: "ETB",
  active: true,
};

export function RewardForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<RewardFormData>;
  onSubmit: (data: RewardFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<RewardFormData>({ ...emptyReward, ...initial });

  useEffect(() => {
    setForm({ ...emptyReward, ...initial });
  }, [initial]);

  const set = (key: keyof RewardFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4"
    >
      <FormField
        label="Title"
        id="reward-title"
        value={form.title}
        onChange={(v) => set("title", v)}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="XP cost"
          id="reward-xp"
          type="number"
          value={form.xp}
          onChange={(v) => set("xp", v)}
          required
        />
        <div className="grid gap-2">
          <Label htmlFor="reward-tag">Category</Label>
          <Select value={form.tag} onValueChange={(v) => set("tag", v)}>
            <SelectTrigger id="reward-tag">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REWARD_TAGS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">
        {form.tag === "Theme"
          ? "Applies instantly to the student's avatar — no admin action needed."
          : form.tag === "AdFree"
            ? 'Applies instantly and hides sponsor ads for the student — no admin action needed. Include a duration like "1-Month" in the title (defaults to 30 days).'
            : "Sends the student to Withdraw to enter delivery details — you approve and send it from the Withdrawals section."}
      </p>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="reward-active">Active</Label>
          <p className="text-xs text-muted-foreground">Available in the rewards catalog</p>
        </div>
        <Switch
          id="reward-active"
          checked={form.active}
          onCheckedChange={(v) => set("active", v)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

export function rewardToForm(reward: AdminReward): RewardFormData {
  return {
    title: reward.title,
    xp: String(reward.xp),
    tag: reward.tag,
    active: reward.active,
  };
}

export function formToReward(
  data: RewardFormData,
  id?: string,
): Omit<AdminReward, "id"> & { id?: string } {
  return {
    id,
    title: data.title,
    xp: parseInt(data.xp, 10) || 500,
    tag: data.tag,
    active: data.active,
  };
}
