"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AccountActions({ id }: { id: string }) {
  const router = useRouter();
  const [testing, setTesting] = useState(false);

  async function remove() {
    await fetch(`/api/searches/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function test() {
    setTesting(true);
    await fetch("/api/alerts/test", { method: "POST" });
    setTesting(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button type="button" onClick={test} className="text-sm text-muted hover:text-foreground">
        {testing ? "Checking…" : "Test alerts"}
      </button>
      <button type="button" onClick={remove} className="text-sm text-muted hover:text-foreground">
        Delete
      </button>
    </div>
  );
}
