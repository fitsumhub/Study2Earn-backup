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
import type { AdminUser, UserStatus } from "@/lib/admin-types";

export type StudentFormData = {
  name: string;
  university: string;
  program: string;
  status: UserStatus;
  xp: string;
};

const emptyStudent: StudentFormData = {
  name: "",
  university: "",
  program: "",
  status: "pending",
  xp: "0",
};

export function StudentForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<StudentFormData>;
  onSubmit: (data: StudentFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<StudentFormData>({ ...emptyStudent, ...initial });

  useEffect(() => {
    setForm({ ...emptyStudent, ...initial });
  }, [initial]);

  const set = (key: keyof StudentFormData, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <FormField
        label="Full name"
        id="student-name"
        value={form.name}
        onChange={(v) => set("name", v)}
        required
      />
      <FormField
        label="University"
        id="student-uni"
        value={form.university}
        onChange={(v) => set("university", v)}
        required
      />
      <FormField
        label="Program"
        id="student-program"
        value={form.program}
        onChange={(v) => set("program", v)}
        required
      />
      <div className="grid gap-2">
        <Label htmlFor="student-status">Status</Label>
        <Select value={form.status} onValueChange={(v) => set("status", v)}>
          <SelectTrigger id="student-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["active", "pending", "suspended"] as const).map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <FormField
        label="XP balance"
        id="student-xp"
        type="number"
        value={form.xp}
        onChange={(v) => set("xp", v)}
      />
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

export function studentToForm(user: AdminUser): StudentFormData {
  return {
    name: user.name,
    university: user.university,
    program: user.program,
    status: user.status,
    xp: String(user.xp),
  };
}

export function formToStudent(
  data: StudentFormData,
  id?: string,
): Omit<AdminUser, "joined"> & { joined?: string } {
  return {
    id: id ?? "",
    name: data.name,
    university: data.university,
    program: data.program,
    status: data.status,
    xp: parseInt(data.xp, 10) || 0,
  };
}
