import Link from "next/link";
import { Wrench } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", light ? "bg-white/15 text-white" : "bg-navy text-white")}>
        <Wrench className="h-4 w-4" />
      </span>
      <span className={light ? "text-white" : "text-navy"}>{APP_NAME}</span>
    </Link>
  );
}
