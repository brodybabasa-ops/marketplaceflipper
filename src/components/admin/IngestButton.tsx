"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function IngestButton() {
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);

  async function run() {
    setStatus("Running…");
    const response = await fetch("/api/admin/ingest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: "mock" }),
    });
    const data = await response.json();
    setStatus(response.ok ? "Completed" : data.error || "Failed");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={run}
        className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-fg"
      >
        Run mock ingest
      </button>
      {status ? <span className="text-sm text-muted">{status}</span> : null}
    </div>
  );
}
