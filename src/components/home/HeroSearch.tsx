"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, Search } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import { parseNaturalQuery, toSearchParams } from "@/lib/search/params";

const EXAMPLES = [
  { label: "MacBook Pro", query: "MacBook Pro under $800" },
  { label: "iPhone 15", query: "iPhone 15 under $500" },
  { label: "Jordan 1", query: "Jordan 1 under $150" },
  { label: "Dyson V15", query: "Dyson V15" },
  { label: "Ford F-250", query: "2018-2022 Ford F-250 under $40k" },
];

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Salt Lake City, UT");
  const [radius, setRadius] = useState("50");
  const [priceMax, setPriceMax] = useState("");
  const [category, setCategory] = useState("");

  function submit(value = query) {
    const parsed = parseNaturalQuery(value);
    const params = toSearchParams({
      ...parsed,
      location: location || undefined,
      radius: radius ? Number(radius) : undefined,
      priceMax: priceMax ? Number(priceMax) : parsed.priceMax,
      category: category || parsed.category,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <section className="hero-glow px-4 pb-10 pt-16 sm:pt-24">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">Find Marketplace Deals.</h1>
        <p className="mt-3 text-4xl font-semibold tracking-tight sm:text-6xl">
          <span className="bg-gradient-to-r from-cyan-400 to-sky-400 bg-clip-text text-transparent">Flip.</span>{" "}
          <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Profit.</span>{" "}
          <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Repeat.</span>
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
          Search Facebook Marketplace categories in one place. Score the spread against comparable listings, then
          click through to the original post.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3 text-sm text-slate-300">
          <div className="flex -space-x-2">
            {["#22d3ee", "#8b5cf6", "#34d399", "#60a5fa"].map((color) => (
              <span
                key={color}
                className="inline-block h-7 w-7 rounded-full border-2 border-[#070b14]"
                style={{ background: color }}
              />
            ))}
          </div>
          <span className="text-amber-300">★★★★★</span>
          <span>Trusted by 8,500+ flippers.</span>
        </div>
      </div>

      <form
        className="mx-auto mt-10 max-w-6xl rounded-2xl border border-white/10 bg-[#121826]/90 p-3 shadow-[0_30px_80px_-40px_rgba(34,211,238,0.45)] backdrop-blur"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div className="grid gap-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_0.8fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="MacBook Pro, iPhone 15, Jordan 1..."
              className="h-12 w-full rounded-xl bg-[#0d1320] pl-10 pr-3 text-sm outline-none"
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-12 rounded-xl bg-[#0d1320] px-3 text-sm text-slate-200"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={priceMax}
            onChange={(event) => setPriceMax(event.target.value)}
            className="h-12 rounded-xl bg-[#0d1320] px-3 text-sm text-slate-200"
          >
            <option value="">Max Price</option>
            <option value="100">$100</option>
            <option value="250">$250</option>
            <option value="500">$500</option>
            <option value="1000">$1,000</option>
            <option value="5000">$5,000</option>
            <option value="25000">$25,000</option>
            <option value="40000">$40,000</option>
            <option value="100000">$100,000</option>
          </select>
          <label className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="h-12 w-full rounded-xl bg-[#0d1320] pl-10 pr-3 text-sm outline-none"
            />
          </label>
          <select
            value={radius}
            onChange={(event) => setRadius(event.target.value)}
            className="h-12 rounded-xl bg-[#0d1320] px-3 text-sm text-slate-200"
          >
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
            <option value="100">100 miles</option>
            <option value="250">250 miles</option>
          </select>
          <button type="submit" className="btn-gradient h-12 rounded-xl px-6 text-sm font-semibold">
            Search Deals
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
          <span className="text-xs text-slate-500">Popular:</span>
          {EXAMPLES.map((example) => (
            <button
              key={example.query}
              type="button"
              onClick={() => submit(example.query)}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 hover:text-white"
            >
              {example.label}
            </button>
          ))}
        </div>
      </form>
    </section>
  );
}
