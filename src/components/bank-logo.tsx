import { useState } from "react";
import type { EthiopianBank } from "@/lib/ethiopian-banks";
import { cn } from "@/lib/utils";

// Fallback vector emblems if local image is unavailable
function VectorFallback({ bank }: { bank: EthiopianBank }) {
  return (
    <div
      className="flex size-full items-center justify-center rounded-lg font-black text-white shadow-inner text-xs"
      style={{ backgroundColor: bank.color }}
    >
      {bank.short}
    </div>
  );
}

export function BankLogo({
  bank,
  size = "md",
  className,
}: {
  bank: EthiopianBank;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  const sizes = {
    sm: "size-10 p-1",
    md: "size-14 p-1.5",
    lg: "size-20 p-2",
  };

  const logoSrc = bank.logoUrl || `/banks/${bank.id}.svg`;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-xs transition-transform duration-200 hover:scale-105 dark:border-slate-800 dark:bg-slate-900",
        sizes[size],
        className,
      )}
      title={bank.name}
    >
      {!imgError ? (
        <img
          src={logoSrc}
          alt={bank.name}
          loading="lazy"
          className="size-full object-contain filter drop-shadow-xs select-none"
          onError={() => setImgError(true)}
        />
      ) : (
        <VectorFallback bank={bank} />
      )}
    </div>
  );
}
