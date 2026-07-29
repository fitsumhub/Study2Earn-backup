import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function FormField({
  label,
  id,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  min,
  max,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={type === "number" ? min : undefined}
        max={type === "number" ? max : undefined}
      />
    </div>
  );
}
