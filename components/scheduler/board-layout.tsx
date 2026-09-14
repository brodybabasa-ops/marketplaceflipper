"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  resetSchedulerLayoutAction,
  saveSchedulerLayoutAction,
} from "@/app/actions/scheduler";
import {
  BOARD_WIDGETS,
  WIDGET_META,
  moveWidget,
  type BoardWidgetId,
  type BoardZone,
  type SchedulerBoardLayout,
} from "@/lib/board-layout";
import { cn } from "@/lib/utils";

const WIDGET_MIME = "application/x-pm-widget";

export function useBoardLayout(initial: SchedulerBoardLayout) {
  const [layout, setLayout] = useState(initial);
  const [pending, startTransition] = useTransition();
  const lastSaved = useRef(JSON.stringify(initial));

  useEffect(() => {
    setLayout(initial);
    lastSaved.current = JSON.stringify(initial);
  }, [initial]);

  function persist(next: SchedulerBoardLayout) {
    setLayout(next);
    const encoded = JSON.stringify(next);
    if (encoded === lastSaved.current) return;
    lastSaved.current = encoded;
    startTransition(() => {
      void saveSchedulerLayoutAction(next);
    });
  }

  return { layout, persist, pending };
}

export function readWidgetDrag(event: React.DragEvent) {
  const raw = event.dataTransfer.getData(WIDGET_MIME) || event.dataTransfer.getData("text/plain");
  const id = raw.replace(/^pm-widget:/, "") as BoardWidgetId;
  return BOARD_WIDGETS.includes(id) ? id : null;
}

export function isWidgetDrag(event: React.DragEvent) {
  const types = Array.from(event.dataTransfer.types);
  return types.includes(WIDGET_MIME) || types.includes("text/plain");
}

export function writeWidgetDrag(event: React.DragEvent, id: BoardWidgetId) {
  event.dataTransfer.setData(WIDGET_MIME, id);
  event.dataTransfer.setData("text/plain", `pm-widget:${id}`);
  event.dataTransfer.effectAllowed = "move";
}

export function CustomizeBar({
  active,
  pending,
  startHref,
  doneHref,
  resetTo,
}: {
  active: boolean;
  pending: boolean;
  startHref: string;
  doneHref: string;
  resetTo: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-customize-bar>
      <a
        href={active ? doneHref : startHref}
        data-customize-toggle
        className={cn(
          "inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold",
          active ? "bg-amber-400 text-zinc-950" : "border border-white/15 text-white/80 hover:bg-white/5",
        )}
      >
        {active ? "Done customizing" : "Customize board"}
      </a>
      {active ? (
        <>
          <span className="text-[11px] text-white/45">
            Drag by the grip. Drop on another zone or Remove. {pending ? "Saving…" : "Saved."}
          </span>
          <form action={resetSchedulerLayoutAction}>
            <input type="hidden" name="returnTo" value={resetTo} />
            <button
              type="submit"
              name="resetBoard"
              className="inline-flex h-9 items-center rounded-lg border border-white/15 px-3 text-sm font-semibold text-white/80"
            >
              Reset layout
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

export function WidgetChrome({
  id,
  zone,
  customize,
  onPlace,
  children,
}: {
  id: BoardWidgetId;
  zone: BoardZone;
  customize: boolean;
  onPlace: (id: BoardWidgetId, zone: BoardZone, beforeId?: BoardWidgetId) => void;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const meta = WIDGET_META[id];
  return (
    <div
      data-widget={id}
      data-widget-zone={zone}
      className={cn(
        "relative h-full overflow-hidden rounded-2xl",
        customize && "ring-1 ring-amber-400/35",
        over && "ring-2 ring-amber-300",
      )}
      onDragOver={(event) => {
        if (!customize || !isWidgetDrag(event)) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!customize) return;
        const dropped = readWidgetDrag(event);
        if (!dropped) return;
        event.preventDefault();
        event.stopPropagation();
        setOver(false);
        onPlace(dropped, zone, id);
      }}
    >
      {customize ? (
        <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-amber-400/10 px-3 py-1.5">
          <span
            draggable
            data-widget-grip={id}
            onDragStart={(event) => writeWidgetDrag(event, id)}
            className="cursor-grab text-[10px] font-black uppercase tracking-[0.16em] text-amber-200"
          >
            ⋮⋮ {meta.label}
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {(["top", "rail", "dock"] as Exclude<BoardZone, "hidden">[]).map((target) => (
              <button
                key={target}
                type="button"
                data-move-widget={id}
                data-move-zone={target}
                onClick={() => onPlace(id, target)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em]",
                  target === zone ? "bg-amber-400 text-zinc-950" : "border border-white/15 text-white/55",
                )}
              >
                {target}
              </button>
            ))}
            <button
              type="button"
              data-remove-widget={id}
              onClick={() => onPlace(id, "hidden")}
              className="rounded-full border border-rose-400/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-rose-200"
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
      <div className={customize ? "pointer-events-none select-none" : ""}>{children}</div>
    </div>
  );
}

export function WidgetDropZone({
  zone,
  customize,
  onPlace,
  className,
  emptyLabel,
  empty,
  children,
}: {
  zone: BoardZone;
  customize: boolean;
  onPlace: (id: BoardWidgetId, zone: BoardZone) => void;
  className?: string;
  emptyLabel: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  if (!customize) return <div className={className}>{children}</div>;
  return (
    <div
      data-drop-zone={zone}
      className={cn(
        className,
        "rounded-2xl p-1",
        over ? "ring-2 ring-amber-400/80" : "ring-1 ring-dashed ring-white/20",
      )}
      onDragOver={(event) => {
        if (!isWidgetDrag(event)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        const id = readWidgetDrag(event);
        if (!id) return;
        event.preventDefault();
        setOver(false);
        onPlace(id, zone);
      }}
    >
      <p className="col-span-full px-2 pb-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80">
        {zone === "top" ? "Top row" : zone === "rail" ? "Side panels" : "Bottom dock"}
      </p>
      {children}
      {empty ? <p className="col-span-full px-4 py-8 text-center text-[11px] text-white/40">{emptyLabel}</p> : null}
    </div>
  );
}

export function TrashZone({
  customize,
  onPlace,
}: {
  customize: boolean;
  onPlace: (id: BoardWidgetId) => void;
}) {
  const [over, setOver] = useState(false);
  if (!customize) return null;
  return (
    <div
      data-trash-zone
      className={cn(
        "rounded-2xl border-2 border-dashed px-5 py-6 text-center",
        over ? "border-rose-400 bg-rose-500/20" : "border-rose-500/40 bg-rose-500/5",
      )}
      onDragOver={(event) => {
        if (!isWidgetDrag(event)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        const id = readWidgetDrag(event);
        if (!id) return;
        event.preventDefault();
        setOver(false);
        onPlace(id);
      }}
    >
      <p className="text-sm font-black uppercase tracking-[0.16em] text-rose-200">Remove</p>
      <p className="mt-1 text-[11px] text-white/45">Drag a widget here to hide it from the board.</p>
    </div>
  );
}

export function HiddenPalette({
  layout,
  customize,
  onRestore,
}: {
  layout: SchedulerBoardLayout;
  customize: boolean;
  onRestore: (id: BoardWidgetId, zone?: BoardZone) => void;
}) {
  if (!customize) return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d1c2e] p-4" data-hidden-palette>
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">Add back</p>
      {layout.hidden.length === 0 ? (
        <p className="mt-2 text-[11px] text-white/40">Every panel is on the board. Drop one on Remove to stash it here.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {layout.hidden.map((id) => (
            <button
              key={id}
              type="button"
              draggable
              data-restore-widget={id}
              onDragStart={(event) => writeWidgetDrag(event, id)}
              onClick={() => onRestore(id)}
              className="cursor-grab rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold text-white"
            >
              + {WIDGET_META[id].label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { moveWidget };
