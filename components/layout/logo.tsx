import Link from "next/link";
import { Wrench } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  light,
  stacked,
}: {
  className?: string;
  light?: boolean;
  stacked?: boolean;
}) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-semibold tracking-tight", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          light ? "bg-[#2f7bff] text-white" : "bg-navy text-white",
        )}
      >
        <Wrench className="h-4 w-4" />
      </span>
      {stacked ? (
        <span className={cn("leading-[1.05] tracking-[0.18em]", light ? "text-white" : "text-navy")}>
          <span className="block text-[11px] font-bold">POCKET</span>
          <span className="block text-[11px] font-bold">MECHANIC</span>
        </span>
      ) : (
        <span className={light ? "text-white" : "text-navy"}>{APP_NAME}</span>
      )}
    </Link>
  );
}
