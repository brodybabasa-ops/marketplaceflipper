"use client";

import Link from "next/link";
import { createScheduleBlockAction, moveScheduleBlockAction } from "@/app/actions/vision";
import { cn } from "@/lib/utils";

export type BoardLane = {
  id: string;
  name: string;
  duty?: string;
};

export type BoardCard = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  technicianProfileId: string | null;
  jobId: string | null;
  kind: string;
  assetLabel: string | null;
  customerName: string | null;
  waiting: boolean;
  partsStatus: string;
  authorization: string;
  behind: boolean;
  inProgress: boolean;
  minutesBehind: number;
  durationMin: number;
};

const TONES: Record<string, string> = {
  danger: "bg-danger/20 border-danger/40",
  warning: "bg-warning/15 border-warning/40",
  success: "bg-success/15 border-success/40",
  accent: "bg-accent/20 border-accent/40",
  muted: "bg-slate border-line text-muted",
  navy: "bg-accent/15 border-line",
};

function toneFor(card: BoardCard) {
  if (card.behind) return "danger";
  if (card.waiting || card.partsStatus === "DELAYED") return "warning";
  if (card.inProgress) return "success";
  if (card.kind === "TRAVEL" || card.kind === "BREAK" || card.kind === "PTO" || card.kind === "BUFFER") return "muted";
  if (card.kind === "QC" || card.kind === "ROAD_TEST" || card.kind === "WATER_TEST") return "accent";
  return "navy";
}

export function DayBoard({
  date,
  hours,
  lanes,
  cards,
  nowHour,
  showTravel,
}: {
  date: string;
  hours: number[];
  lanes: BoardLane[];
  cards: BoardCard[];
  nowHour: number;
  showTravel: boolean;
}) {
  async function dropOn(hour: number, laneId: string, payload: { type: string; id: string; title?: string; durationMin: number }) {
    const startsAt = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00`);
    const endsAt = new Date(startsAt.getTime() + payload.durationMin * 60000);
    const form = new FormData();
    form.set("startsAt", startsAt.toISOString());
    form.set("endsAt", endsAt.toISOString());
    if (laneId !== "solo") form.set("technicianProfileId", laneId);
    if (payload.type === "block") {
      form.set("blockId", payload.id);
      await moveScheduleBlockAction(form);
      return;
    }
    form.set("jobId", payload.id);
    form.set("title", payload.title || "Work");
    form.set("kind", "WORK");
    await createScheduleBlockAction(form);
  }

  return (
    <div className="min-w-[640px]">
      <div className="grid text-xs text-muted" style={{ gridTemplateColumns: `4rem repeat(${lanes.length}, minmax(8rem, 1fr))` }}>
        <div />
        {lanes.map((lane) => (
          <div key={lane.id} className="px-1 font-semibold text-ink">
            {lane.name}
            {showTravel && lane.duty ? <span className="block font-normal text-muted">{lane.duty.replaceAll("_", " ").toLowerCase()}</span> : null}
          </div>
        ))}
      </div>
      {hours.map((hour) => (
        <div
          key={hour}
          className={cn("grid border-t border-line py-1", nowHour === hour && "bg-accent/5")}
          style={{ gridTemplateColumns: `4rem repeat(${lanes.length}, minmax(8rem, 1fr))` }}
        >
          <p className="number pt-2 text-xs text-muted">{hour}:00</p>
          {lanes.map((lane) => {
            const slot = cards.filter((card) => {
              const startHour = new Date(card.startsAt).getHours();
              if (startHour !== hour) return false;
              if (lane.id === "solo") return true;
              if (card.technicianProfileId) return card.technicianProfileId === lane.id;
              return lane.id === lanes[0]?.id;
            });
            return (
              <div
                key={lane.id}
                className="min-h-14 rounded-lg px-1"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const raw = event.dataTransfer.getData("application/json") || event.dataTransfer.getData("text/plain");
                  if (!raw) return;
                  void dropOn(hour, lane.id, JSON.parse(raw));
                }}
              >
                {slot.map((card) => (
                  <Link
                    key={card.id}
                    href={card.jobId ? `/mechanic/schedule?block=${card.id}&date=${date}` : `/mechanic/schedule?date=${date}`}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({ type: "block", id: card.id, durationMin: card.durationMin }),
                      );
                    }}
                    className={cn("mb-1 block rounded-xl border px-2 py-1 text-xs text-ink", TONES[toneFor(card)])}
                  >
                    <span className="font-semibold">{card.title}</span>
                    {card.assetLabel ? <span className="block text-muted">{card.assetLabel}</span> : null}
                    <span className="block text-[10px] uppercase tracking-wide text-muted">
                      {new Date(card.startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}–
                      {new Date(card.endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      {card.inProgress ? " · in progress" : ""}
                      {card.behind ? ` · ${card.minutesBehind} min behind` : ""}
                      {card.waiting ? " · waiting" : ""}
                      {card.partsStatus !== "UNKNOWN" ? ` · parts ${card.partsStatus.toLowerCase()}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function DraggableJob({
  jobId,
  title,
  durationMin,
}: {
  jobId: string;
  title: string;
  durationMin: number;
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("application/json", JSON.stringify({ type: "job", id: jobId, title, durationMin }));
      }}
      className="cursor-grab rounded-xl border border-line p-2 text-sm active:cursor-grabbing"
    >
      {title}
    </div>
  );
}
