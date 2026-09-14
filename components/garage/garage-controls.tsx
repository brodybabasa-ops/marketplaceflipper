"use client";

import { useState } from "react";
import { ChevronDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function CopyIdentifier({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      className="inline-flex text-white/45 transition hover:text-white"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
    >
      <Copy className="h-3.5 w-3.5" />
    </button>
  );
}

export function InsightsPeriod() {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md border border-white/15 px-2 text-[11px] font-semibold text-white/70",
      )}
    >
      This Year
      <ChevronDown className="h-3 w-3 text-white/45" />
    </button>
  );
}
