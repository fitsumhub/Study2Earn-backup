import { cn } from "@/lib/utils";

/** Visual badge for USDT-via-Binance withdrawals, styled to match BankLogo. */
export function UsdtLogo({
  size = "md",
  className,
}: {
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
      style={{ backgroundColor: "#E7F9F1" }}
      title="USDT via Binance"
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{ background: "linear-gradient(135deg, #26A17B 0%, transparent 60%)" }}
      />
      <div
        className="relative flex size-[70%] items-center justify-center rounded-lg text-white shadow-inner"
        style={{ backgroundColor: "#26A17B" }}
      >
        ₮
      </div>
    </div>
  );
}
