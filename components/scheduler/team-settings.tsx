"use client";

import { useEffect, useState } from "react";
import {
  createSchedulerResourceAction,
  deleteSchedulerResourceAction,
  reorderSchedulerResourcesAction,
  updateSchedulerResourceAction,
} from "@/app/actions/scheduler";
import type { SchedulerResourceKind } from "@prisma/client";
import { cn } from "@/lib/utils";

export type TeamLane = {
  id: string;
  kind: SchedulerResourceKind;
  name: string;
  role: string;
  capacityTotal: number;
  sortOrder: number;
};

const KINDS: { value: SchedulerResourceKind; label: string }[] = [
  { value: "TECH", label: "Technician" },
  { value: "BAY", label: "Bay" },
  { value: "MOBILE", label: "Mobile unit" },
];

let activeLane: string | null = null;

export function TeamSettings({ resources, returnTo }: { resources: TeamLane[]; returnTo: string }) {
  const [order, setOrder] = useState(resources.map((item) => item.id));
  const [overId, setOverId] = useState<string | null>(null);
  const byId = new Map(resources.map((item) => [item.id, item]));
  const rows = order.map((id) => byId.get(id)).filter((item): item is TeamLane => Boolean(item));

  useEffect(() => {
    setOrder(resources.map((item) => item.id));
  }, [resources]);

  async function persist(next: string[]) {
    setOrder(next);
    const form = new FormData();
    form.set("ids", next.join(","));
    form.set("returnTo", returnTo);
    await reorderSchedulerResourcesAction(form);
  }

  return (
    <div className="space-y-5" data-team-settings>
      <form action={createSchedulerResourceAction} className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        <h3 className="text-sm font-bold text-white">Add a lane</h3>
        <p className="mt-1 text-sm text-white/50">
          Technicians, bays, and trucks show as rows on the day board. They are shop lanes, not extra logins.
        </p>
        <a href="/mechanic/schedule" className="mt-2 inline-block text-sm font-semibold text-[#7eb0ff]">
          Open the scheduler
        </a>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/55">Name</span>
            <input name="name" required minLength={2} placeholder="Jordan" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/55">Role</span>
            <input name="role" placeholder="Diesel specialist" className={fieldClass} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/55">Type</span>
            <select name="kind" defaultValue="TECH" className={fieldClass}>
              {KINDS.map((kind) => (
                <option key={kind.value} value={kind.value}>
                  {kind.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-white/55">Capacity</span>
            <input name="capacityTotal" type="number" min={1} max={12} defaultValue={5} className={fieldClass} />
          </label>
        </div>
        <button type="submit" name="addLane" className="mt-3 inline-flex h-10 items-center rounded-lg bg-[#2f7bff] px-3 text-sm font-semibold text-white">
          Add to the board
        </button>
      </form>

      <div className="space-y-2">
        <p className="text-sm text-white/50">Drag a row to reorder. Drop on another tech to swap places, or use Move up / Move down.</p>
        {rows.map((resource, index) => (
          <article
            key={resource.id}
            draggable
            data-lane-id={resource.id}
            onDragStart={() => {
              activeLane = resource.id;
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setOverId(resource.id);
            }}
            onDragLeave={() => setOverId((current) => (current === resource.id ? null : current))}
            onDrop={(event) => {
              event.preventDefault();
              const from = activeLane;
              activeLane = null;
              setOverId(null);
              if (!from || from === resource.id) return;
              const next = order.filter((id) => id !== from);
              const at = next.indexOf(resource.id);
              next.splice(at, 0, from);
              void persist(next);
            }}
            className={cn(
              "rounded-2xl border bg-[#0d1c2e] p-4",
              overId === resource.id ? "border-[#2f7bff]" : "border-white/10",
            )}
          >
            <form action={updateSchedulerResourceAction} className="grid gap-3 lg:grid-cols-[1fr_1fr_8rem_6rem_auto] lg:items-end">
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="id" value={resource.id} />
              <label>
                <span className="mb-1 block text-xs font-semibold text-white/55">Name</span>
                <input name="name" required defaultValue={resource.name} className={fieldClass} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-white/55">Role</span>
                <input name="role" defaultValue={resource.role} className={fieldClass} />
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-white/55">Type</span>
                <select name="kind" defaultValue={resource.kind} className={fieldClass}>
                  {KINDS.map((kind) => (
                    <option key={kind.value} value={kind.value}>
                      {kind.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1 block text-xs font-semibold text-white/55">Cap</span>
                <input name="capacityTotal" type="number" min={1} max={12} defaultValue={resource.capacityTotal} className={fieldClass} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" name="saveLane" className="h-10 rounded-lg bg-[#2f7bff] px-3 text-sm font-semibold text-white">
                  Save
                </button>
                <button
                  type="button"
                  disabled={index === 0}
                  className="h-10 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white/80 disabled:opacity-30"
                  onClick={() => {
                    if (index === 0) return;
                    const next = [...order];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    void persist(next);
                  }}
                >
                  Move up
                </button>
                <button
                  type="button"
                  disabled={index === rows.length - 1}
                  className="h-10 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white/80 disabled:opacity-30"
                  onClick={() => {
                    if (index === rows.length - 1) return;
                    const next = [...order];
                    [next[index + 1], next[index]] = [next[index], next[index + 1]];
                    void persist(next);
                  }}
                >
                  Move down
                </button>
              </div>
            </form>
            <form action={deleteSchedulerResourceAction} className="mt-3">
              <input type="hidden" name="returnTo" value={returnTo} />
              <input type="hidden" name="id" value={resource.id} />
              <button
                type="submit"
                name="removeLane"
                className="text-sm font-semibold text-red-300 hover:text-red-200"
                disabled={resources.length === 1}
              >
                Remove lane
              </button>
              <span className="ml-2 text-xs text-white/40">Open jobs move to another lane.</span>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}

const fieldClass =
  "h-10 w-full rounded-lg border border-white/10 bg-[#071422] px-3 text-sm text-white outline-none";
