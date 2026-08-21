"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SearchParams } from "@/types/search";

export function SaveSearchButton({ params }: { params: SearchParams }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "auth">("idle");

  async function save() {
    setStatus("saving");
    const name = [
      params.yearMin && params.yearMax ? `${params.yearMin}-${params.yearMax}` : params.yearMin,
      params.make,
      params.model,
      params.priceMax ? `under $${params.priceMax.toLocaleString()}` : null,
      params.radius ? `within ${params.radius} miles` : null,
    ]
      .filter(Boolean)
      .join(" ") || "Saved search";

    const response = await fetch("/api/searches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, params, notifyEmail: true }),
    });

    if (response.status === 401) {
      setStatus("auth");
      router.push("/login?next=/search");
      return;
    }
    setStatus(response.ok ? "saved" : "idle");
  }

  return (
    <button
      type="button"
      onClick={save}
      className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
    >
      {status === "saved" ? "Search saved" : status === "saving" ? "Saving…" : "Save this search"}
    </button>
  );
}
