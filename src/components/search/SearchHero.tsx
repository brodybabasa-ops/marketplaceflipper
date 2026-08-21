"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { parseNaturalQuery, toSearchParams } from "@/lib/search/params";

const EXAMPLES = [
  { label: "2018–2022 Ford F-250 under $40k", query: "2018-2022 Ford F-250 under $40k" },
  { label: "Toyota Tacoma under $30k", query: "Toyota Tacoma under $30k" },
  { label: "Porsche 911 under $100k", query: "Porsche 911 under $100k" },
];

export function SearchHero() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(value = query) {
    const parsed = parseNaturalQuery(value);
    const params = toSearchParams({ ...parsed, keyword: parsed.keyword || undefined });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="mx-auto max-w-6xl px-4 pb-8 pt-14 sm:pt-20">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted">
        Vehicle marketplace search
      </p>
      <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-instrument)] text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl">
        What are you looking for?
      </h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg">
        Normalized listings. Honest deal scores. One click to the original marketplace.
      </p>

      <form
        className="mt-10 rounded-2xl border border-border bg-surface p-3 shadow-[0_20px_70px_-45px_rgba(22,21,19,0.6)] sm:p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor="hero-search">
          Search vehicles
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="hero-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="2018-2022 Ford F-250 under $40k"
            className="h-14 flex-1 rounded-xl bg-transparent px-4 text-lg outline-none placeholder:text-muted/70"
          />
          <button
            type="submit"
            className="h-14 rounded-xl bg-accent px-7 text-sm font-semibold text-accent-fg"
          >
            Search listings
          </button>
        </div>
      </form>

      <div className="mt-5 flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example.query}
            type="button"
            onClick={() => submit(example.query)}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-muted hover:text-foreground"
          >
            {example.label}
          </button>
        ))}
      </div>
    </section>
  );
}
