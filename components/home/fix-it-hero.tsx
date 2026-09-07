"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export function FixItHero({ defaultAssetId }: { defaultAssetId?: string }) {
  const router = useRouter();
  const [problem, setProblem] = useState("");
  return (
    <form
      className="mt-5"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (defaultAssetId) params.set("asset", defaultAssetId);
        if (problem.trim()) params.set("q", problem.trim());
        router.push(`/fix?${params.toString()}`);
      }}
    >
      <label className="sr-only" htmlFor="home-fix-it">
        Tell us what’s going on
      </label>
      <Textarea
        id="home-fix-it"
        value={problem}
        onChange={(event) => setProblem(event.target.value)}
        placeholder="My truck shakes at 65 mph…"
        className="min-h-24 rounded-2xl border-line bg-navy/60 text-base"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="submit" size="lg">
          Fix It
        </Button>
        <p className="self-center text-xs text-muted">Everyday language is enough. Pocket Mechanic does not diagnose from this description.</p>
      </div>
    </form>
  );
}
