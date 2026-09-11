"use client";

import { useState, type ComponentProps, type FormEvent } from "react";
import { Star } from "lucide-react";
import { DIRECTORY_MORE_SERVICES, DIRECTORY_SERVICES, LANDING_LOCATION } from "@/lib/landing";
import type { DirectoryQuery } from "@/components/mechanics/directory-search";

const AMENITIES = ["Loaner Vehicles", "Shuttle Service", "After Hours Drop-Off", "Financing Available", "Warranty on Repairs"];

const CHECK =
  "h-3.5 w-3.5 shrink-0 appearance-none rounded-[3px] border border-white/35 bg-transparent checked:border-[#2f7bff] checked:bg-[#2f7bff] checked:bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22%3E%3Cpath fill=%22none%22 stroke=%22white%22 stroke-width=%222%22 d=%22M2.2 6.2 4.8 8.7 9.8 3.3%22/%3E%3C/svg%3E')] checked:bg-[length:10px_10px] checked:bg-center checked:bg-no-repeat";

export function AutoSubmitSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={className}
      onChange={(event) => event.currentTarget.form?.requestSubmit()}
    >
      {children}
    </select>
  );
}

export function DirectoryFilters({ query }: { query: DirectoryQuery }) {
  const extraOpen =
    Boolean(query.category) &&
    DIRECTORY_MORE_SERVICES.some((item) => item.value === query.category);
  const [more, setMore] = useState(extraOpen);

  function submit(event: FormEvent<HTMLInputElement | HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <aside className="rounded-2xl bg-[#102033] p-4 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Filters</h2>
        <a href={`/mechanics?zip=${encodeURIComponent(LANDING_LOCATION)}`} className="text-xs font-semibold text-[#7eb0ff]">
          Clear all
        </a>
      </div>

      <section className="mt-5">
        <p className="text-sm font-semibold">Distance</p>
        <p className="mt-1 text-xs text-white/60">Within {query.distance ?? "50"} miles</p>
        <input
          type="range"
          name="distance"
          min={5}
          max={100}
          step={5}
          defaultValue={query.distance ?? "50"}
          onMouseUp={submit}
          onTouchEnd={submit}
          className="mt-3 w-full accent-[#2f7bff]"
        />
        <div className="mt-1 flex justify-between text-[10px] text-white/40">
          <span>5</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Shop Type</p>
        <div className="mt-3 space-y-2.5 text-sm">
          <FilterOption name="mode" value="" defaultChecked={!query.mode} onChange={submit}>
            All Shops
          </FilterOption>
          <FilterOption name="mode" value="DEALERSHIP" defaultChecked={query.mode === "DEALERSHIP"} onChange={submit}>
            Dealerships
          </FilterOption>
          <FilterOption name="mode" value="SHOP" defaultChecked={query.mode === "SHOP"} onChange={submit}>
            Independent Shops
          </FilterOption>
          <FilterOption name="mode" value="MOBILE" defaultChecked={query.mode === "MOBILE"} onChange={submit}>
            Mobile Mechanics
          </FilterOption>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Services</p>
        <div className="mt-3 space-y-2.5 text-sm">
          {DIRECTORY_SERVICES.map((item) => (
            <FilterOption
              key={item.value}
              name="category"
              value={item.value}
              defaultChecked={query.category === item.value}
              onChange={submit}
            >
              {item.label}
            </FilterOption>
          ))}
          {more
            ? DIRECTORY_MORE_SERVICES.map((item) => (
                <FilterOption
                  key={item.value}
                  name="category"
                  value={item.value}
                  defaultChecked={query.category === item.value}
                  onChange={submit}
                >
                  {item.label}
                </FilterOption>
              ))
            : null}
          {more ? (
            <FilterOption name="category" value="" defaultChecked={!query.category} onChange={submit}>
              Any service
            </FilterOption>
          ) : null}
          <button
            type="button"
            onClick={() => setMore((value) => !value)}
            className="pt-1 text-xs font-semibold text-[#7eb0ff]"
          >
            {more ? "Show less" : "Show more"}
          </button>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Ratings</p>
        <div className="mt-3 space-y-2.5 text-sm">
          {[
            { value: "4.5", stars: 5, label: "4.5+ " },
            { value: "4", stars: 4, label: "4+ " },
            { value: "3", stars: 3, label: "3+ " },
          ].map((item) => (
            <FilterOption
              key={item.value}
              name="rating"
              value={item.value}
              defaultChecked={query.rating === item.value}
              onChange={submit}
            >
              <span className="inline-flex items-center gap-1">
                {item.label}
                {Array.from({ length: item.stars }).map((_, index) => (
                  <Star key={index} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </span>
            </FilterOption>
          ))}
          <FilterOption name="rating" value="" defaultChecked={!query.rating} onChange={submit}>
            Any rating
          </FilterOption>
        </div>
      </section>

      <section className="mt-6">
        <p className="text-sm font-semibold">Amenities</p>
        <div className="mt-3 space-y-2.5 text-sm text-white/45">
          {AMENITIES.map((item) => (
            <label key={item} className="flex items-center gap-2.5">
              <input type="checkbox" disabled className={`${CHECK} opacity-50`} />
              {item}
            </label>
          ))}
        </div>
      </section>
    </aside>
  );
}

function FilterOption({
  name,
  value,
  defaultChecked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  defaultChecked?: boolean;
  onChange: (event: FormEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className={CHECK}
      />
      {children}
    </label>
  );
}
