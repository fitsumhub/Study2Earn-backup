import type { EthiopianBank } from "@/lib/ethiopian-banks";
import { cn } from "@/lib/utils";

export function BankLogo({
  bank,
  size = "md",
  className,
}: {
  bank: EthiopianBank;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "size-10 text-[10px]",
    md: "size-14 text-xs",
    lg: "size-20 text-sm",
  };

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-bold shadow-sm ring-1 ring-black/5",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: bank.accent }}
      title={bank.name}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${bank.color} 0%, transparent 60%)`,
        }}
      />
      <div
        className="relative flex size-[70%] items-center justify-center rounded-lg text-white shadow-inner"
        style={{ backgroundColor: bank.color }}
      >
        {bank.short}
      </div>
    </div>
  );
}
