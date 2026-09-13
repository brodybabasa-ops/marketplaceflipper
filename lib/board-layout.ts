export const BOARD_WIDGETS = [
  "stats",
  "filters",
  "calendar",
  "agenda",
  "map",
  "unscheduled",
  "parts",
  "reminders",
  "quickActions",
] as const;

export type BoardWidgetId = (typeof BOARD_WIDGETS)[number];
export type BoardZone = "top" | "rail" | "dock" | "hidden";

export type SchedulerBoardLayout = {
  top: BoardWidgetId[];
  rail: BoardWidgetId[];
  dock: BoardWidgetId[];
  hidden: BoardWidgetId[];
  showRoute: boolean;
};

export const WIDGET_META: Record<BoardWidgetId, { label: string; hint: string; home: Exclude<BoardZone, "hidden"> }> = {
  stats: { label: "Day stats", hint: "Appointments, in progress, parts, revenue", home: "top" },
  filters: { label: "Filters", hint: "Technician, type, status, search", home: "top" },
  calendar: { label: "Mini calendar", hint: "Jump to a day", home: "rail" },
  agenda: { label: "Today's agenda", hint: "Timed list for the selected day", home: "rail" },
  map: { label: "On the road", hint: "Mobile map and route", home: "rail" },
  unscheduled: { label: "Unscheduled requests", hint: "Work that still needs a time", home: "dock" },
  parts: { label: "Parts arriving", hint: "Parts holds on today's jobs", home: "dock" },
  reminders: { label: "Reminders", hint: "Estimates, late jobs, unread", home: "dock" },
  quickActions: { label: "Quick actions", hint: "Block, break, swap, send update", home: "dock" },
};

export function defaultBoardLayout(): SchedulerBoardLayout {
  return {
    top: ["stats", "filters"],
    rail: ["calendar", "agenda", "map"],
    dock: ["unscheduled", "parts", "reminders", "quickActions"],
    hidden: [],
    showRoute: true,
  };
}

function isWidget(value: unknown): value is BoardWidgetId {
  return typeof value === "string" && (BOARD_WIDGETS as readonly string[]).includes(value);
}

function uniqueWidgets(ids: BoardWidgetId[]) {
  const seen = new Set<BoardWidgetId>();
  const next: BoardWidgetId[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    next.push(id);
  }
  return next;
}

export function parseBoardLayout(raw: unknown): SchedulerBoardLayout {
  const fallback = defaultBoardLayout();
  if (!raw || typeof raw !== "object") return fallback;
  const value = raw as Record<string, unknown>;
  const top = Array.isArray(value.top) ? value.top.filter(isWidget) : fallback.top;
  const rail = Array.isArray(value.rail) ? value.rail.filter(isWidget) : fallback.rail;
  const dock = Array.isArray(value.dock) ? value.dock.filter(isWidget) : fallback.dock;
  const hidden = Array.isArray(value.hidden) ? value.hidden.filter(isWidget) : [];
  const placed = new Set([...top, ...rail, ...dock, ...hidden]);
  const missing = BOARD_WIDGETS.filter((id) => !placed.has(id));
  return {
    top: uniqueWidgets(top),
    rail: uniqueWidgets(rail),
    dock: uniqueWidgets(dock),
    hidden: uniqueWidgets([...hidden, ...missing]),
    showRoute: value.showRoute !== false,
  };
}

export function zoneOf(layout: SchedulerBoardLayout, id: BoardWidgetId): BoardZone {
  if (layout.top.includes(id)) return "top";
  if (layout.rail.includes(id)) return "rail";
  if (layout.dock.includes(id)) return "dock";
  return "hidden";
}

export function moveWidget(
  layout: SchedulerBoardLayout,
  id: BoardWidgetId,
  zone: BoardZone,
  dest?: number | { before?: BoardWidgetId },
): SchedulerBoardLayout {
  const next: SchedulerBoardLayout = {
    top: layout.top.filter((item) => item !== id),
    rail: layout.rail.filter((item) => item !== id),
    dock: layout.dock.filter((item) => item !== id),
    hidden: layout.hidden.filter((item) => item !== id),
    showRoute: layout.showRoute,
  };
  if (zone === "hidden") {
    next.hidden.push(id);
    return next;
  }
  const list = next[zone];
  let at = list.length;
  if (typeof dest === "number") {
    at = Math.max(0, Math.min(dest, list.length));
  } else if (dest?.before) {
    const index = list.indexOf(dest.before);
    if (index >= 0) at = index;
  }
  list.splice(at, 0, id);
  return next;
}

export function restoreWidget(layout: SchedulerBoardLayout, id: BoardWidgetId) {
  return moveWidget(layout, id, WIDGET_META[id].home);
}

export function toggleRoute(layout: SchedulerBoardLayout, showRoute: boolean): SchedulerBoardLayout {
  return { ...layout, showRoute };
}
