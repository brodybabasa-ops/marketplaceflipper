"use client";

import { resetSchedulerLayoutAction, saveSchedulerLayoutAction } from "@/app/actions/scheduler";
import {
  BOARD_WIDGETS,
  moveWidget,
  restoreWidget,
  toggleRoute,
  WIDGET_META,
  type BoardWidgetId,
  type SchedulerBoardLayout,
} from "@/lib/board-layout";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function BoardSettings({ layout, returnTo }: { layout: SchedulerBoardLayout; returnTo: string }) {
  const [board, setBoard] = useState(layout);

  function persist(next: SchedulerBoardLayout) {
    setBoard(next);
    void saveSchedulerLayoutAction(next);
  }

  function visible(id: BoardWidgetId) {
    return !board.hidden.includes(id);
  }

  return (
    <div className="space-y-4" data-board-settings>
      <section className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4">
        <h3 className="text-sm font-bold text-white">Features on the board</h3>
        <p className="mt-1 text-sm text-white/50">
          Turn panels on or off here. On the scheduler, Customize lets you drag them into place or onto Remove.
        </p>
        <a href="/mechanic/schedule?classic=1&customize=1" className="mt-2 inline-block text-sm font-semibold text-[#7eb0ff]">
          Open the board and drag widgets
        </a>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {BOARD_WIDGETS.map((id) => {
            const on = visible(id);
            return (
              <label
                key={id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
                  on ? "border-[#2f7bff]/40 bg-[#2f7bff]/10" : "border-white/10 bg-[#071422]",
                )}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={(event) => {
                    persist(event.target.checked ? restoreWidget(board, id) : moveWidget(board, id, "hidden"));
                  }}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-semibold text-white">{WIDGET_META[id].label}</span>
                  <span className="block text-xs text-white/45">{WIDGET_META[id].hint}</span>
                </span>
              </label>
            );
          })}
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3",
              board.showRoute ? "border-[#2f7bff]/40 bg-[#2f7bff]/10" : "border-white/10 bg-[#071422]",
            )}
          >
            <input
              type="checkbox"
              checked={board.showRoute}
              onChange={(event) => persist(toggleRoute(board, event.target.checked))}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-white">Mobile route strip</span>
              <span className="block text-xs text-white/45">Stop list under mobile lanes on the day Gantt</span>
            </span>
          </label>
        </div>
      </section>
      <form action={resetSchedulerLayoutAction}>
        <input type="hidden" name="returnTo" value={returnTo} />
        <button type="submit" name="resetBoard" className="h-10 rounded-lg border border-white/15 px-4 text-sm font-semibold text-white/80">
          Reset board to default
        </button>
      </form>
    </div>
  );
}
