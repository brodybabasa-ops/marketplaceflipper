import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getJobForUser } from "@/services/jobs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/sign-in", request.url));
  const { id } = await params;
  const job = await getJobForUser(id, session.id, session.role);
  if (!job || !job.scheduledAt) return new NextResponse("Appointment not found", { status: 404 });

  const start = job.scheduledAt;
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const stamp = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const summary = `${job.serviceRequest.problemText} — ${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`;
  const location = `${job.mechanicProfile.businessName}${job.mechanicProfile.shopCity ? `, ${job.mechanicProfile.shopCity}` : ""} UT`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pocket Mechanic//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${job.id}@pocketmechanic.app`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escapeIcs(summary)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(`Pocket Mechanic appointment at ${job.mechanicProfile.businessName}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="pocket-mechanic-${job.id.slice(0, 8)}.ics"`,
    },
  });
}

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
