"use client";

import { useState } from "react";
import type { SearchParams } from "@/types/search";
import { FilterForm } from "@/components/search/FilterForm";

export function FilterSidebar({ values }: { values: SearchParams }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-24 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-semibold">Filters</h2>
        <div className="mt-4">
          <FilterForm values={values} />
        </div>
      </div>
    </aside>
  );
}

export function FilterSheet({ values }: { values: SearchParams }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium"
      >
        Filters & sort
      </button>
      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/30"
            aria-label="Close filters"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Filters</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-sm text-muted">
                Done
              </button>
            </div>
            <FilterForm values={values} compact />
          </div>
        </div>
      ) : null}
    </div>
  );
}
