"use client";

import { saveAvailabilityAction } from "@/app/actions/mechanic";
import { SHOP_CLOCK_OPTIONS } from "@/lib/shop-os";
import { Button } from "@/components/ui/button";

const DAYS = [
  { key: "MONDAY", label: "Monday" },
  { key: "TUESDAY", label: "Tuesday" },
  { key: "WEDNESDAY", label: "Wednesday" },
  { key: "THURSDAY", label: "Thursday" },
  { key: "FRIDAY", label: "Friday" },
  { key: "SATURDAY", label: "Saturday" },
  { key: "SUNDAY", label: "Sunday" },
] as const;

export function ShopOsHoursForm({
  hours,
}: {
  hours: { dayOfWeek: string; startTime: string; endTime: string }[];
}) {
  return (
    <form action={saveAvailabilityAction} className="space-y-2">
      {DAYS.map((day) => {
        const row = hours.find((item) => item.dayOfWeek === day.key);
        const closed = !row;
        return (
          <div key={day.key} className="grid items-center gap-2 sm:grid-cols-[7.5rem_1fr_1fr_auto]">
            <p className="text-sm font-semibold text-[#102033]">{day.label}</p>
            <select
              name={`${day.key}-start`}
              defaultValue={row?.startTime ?? "08:00"}
              className="h-10 rounded-xl border border-[#e6eef6] bg-white px-3 text-sm"
            >
              {SHOP_CLOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name={`${day.key}-end`}
              defaultValue={row?.endTime ?? "17:00"}
              className="h-10 rounded-xl border border-[#e6eef6] bg-white px-3 text-sm"
            >
              {SHOP_CLOCK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 text-sm text-[#6b7c8d]">
              <input type="checkbox" name={`${day.key}-closed`} value="on" defaultChecked={closed} className="peer sr-only" />
              <span className="relative h-6 w-11 rounded-full bg-[#2f7bff] after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:translate-x-5 after:rounded-full after:bg-white peer-checked:bg-[#dbe3ec] peer-checked:after:translate-x-0" />
              <span className="sr-only">Open</span>
            </label>
          </div>
        );
      })}
      <p className="text-[11px] text-[#8a97a6]">Toggle off to mark the day closed. Closed days stay off the book.</p>
      <Button type="submit" size="sm">
        Save hours
      </Button>
    </form>
  );
}
