import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({ value, count, size = "md" }: { value: number; count?: number; size?: "sm" | "md" }) {
  const full = Math.round(value);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-500">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", index < full ? "fill-current" : "text-line")}
          />
        ))}
      </div>
      <span className={cn("number font-semibold text-ink", size === "sm" ? "text-sm" : "text-base")}>
        {value.toFixed(1)}
      </span>
      {count != null ? <span className="text-sm text-muted">({count})</span> : null}
    </div>
  );
}

export function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" };
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={cn("rounded-full object-cover", sizes[size])} />
    );
  }
  return (
    <div className={cn("flex items-center justify-center rounded-full bg-navy font-semibold text-white", sizes[size])}>
      {initials}
    </div>
  );
}
