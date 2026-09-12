"use client";

import { useState } from "react";
import { saveAvailabilityAction } from "@/app/actions/mechanic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAYS = [
  { key: "SUNDAY", label: "Sunday" },
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
] as const;

export function ShopHoursForm({
  hours,
}: {
  hours: { dayOfWeek: string; startTime: string; endTime: string }[];
}) {
  const [state, setState] = useState(() =>
    Object.fromEntries(
      DAYS.map((day) => {
        const row = hours.find((item) => item.dayOfWeek === day.key);
        return [
          day.key,
          {
            closed: !row,
            start: row?.startTime ?? "08:00",
            end: row?.endTime ?? "18:00",
          },
        ];
      }),
    ) as Record<(typeof DAYS)[number]["key"], { closed: boolean; start: string; end: string }>,
  );

  return (
    <form action={saveAvailabilityAction} className="space-y-3">
      {DAYS.map((day) => {
        const slot = state[day.key];
        return (
          <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[7rem_auto_1fr_1fr]">
            <p className="text-sm font-semibold text-navy">{day.label}</p>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                name={`${day.key}-closed`}
                value="on"
                checked={slot.closed}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    [day.key]: { ...current[day.key], closed: event.target.checked },
                  }))
                }
              />
              Closed
            </label>
            <Input
              type="time"
              name={`${day.key}-start`}
              value={slot.start}
              readOnly={slot.closed}
              className={slot.closed ? "opacity-50" : undefined}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  [day.key]: { ...current[day.key], start: event.target.value },
                }))
              }
            />
            <Input
              type="time"
              name={`${day.key}-end`}
              value={slot.end}
              readOnly={slot.closed}
              className={slot.closed ? "opacity-50" : undefined}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  [day.key]: { ...current[day.key], end: event.target.value },
                }))
              }
            />
          </div>
        );
      })}
      <Button type="submit">Save hours</Button>
    </form>
  );
}
