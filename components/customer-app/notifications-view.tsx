import {
  Bell,
  Calendar,
  CircleAlert,
  MessageSquare,
  Wrench,
} from "lucide-react";
import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/notifications";
import { AppCard, AppPageHeader, FilterTabs } from "@/components/customer-app/primitives";
import { formatNoticeTime, noticeKind, notificationGroup, type NoticeKind } from "@/lib/customer-app";
import { cn } from "@/lib/utils";

export function CustomerNotificationsView({
  notifications,
  tab,
}: {
  notifications: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    readAt: Date | null;
    createdAt: Date;
  }[];
  tab: string;
}) {
  const classified = notifications.map((item) => ({ ...item, kind: noticeKind(item.title, item.body, item.href) }));
  const counts = {
    all: classified.length,
    repair: classified.filter((item) => item.kind === "repair").length,
    appointment: classified.filter((item) => item.kind === "appointment").length,
    message: classified.filter((item) => item.kind === "message").length,
    system: classified.filter((item) => item.kind === "system").length,
  };
  const active = (tab || "all") as "all" | NoticeKind;
  const visible = active === "all" ? classified : classified.filter((item) => item.kind === active);
  const groups = new Map<string, typeof visible>();
  for (const item of visible) {
    const key = notificationGroup(item.createdAt);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return (
    <div className="px-4 pt-2">
      <AppPageHeader
        title="Notifications"
        subtitle="Stay updated on your vehicles, repairs, and appointments."
        action={
          <form action={markAllNotificationsReadAction}>
            <button type="submit" className="text-sm font-semibold text-[#7eb0ff]">
              Mark All Read
            </button>
          </form>
        }
      />
      <FilterTabs
        value={active}
        tabs={[
          { id: "all", label: "All", count: counts.all },
          { id: "repair", label: "Repairs", count: counts.repair },
          { id: "appointment", label: "Appointments", count: counts.appointment },
          { id: "message", label: "Messages", count: counts.message },
          { id: "system", label: "System", count: counts.system },
        ]}
      />
      <div className="mt-5 space-y-6">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#0c1d30] p-5 text-sm text-white/55">No alerts yet.</p>
        ) : (
          [...groups.entries()].map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-2 text-sm font-bold text-white/45">{label}</h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <form key={item.id} action={openNotificationAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="w-full text-left">
                      <AppCard className="p-3">
                        <div className="flex gap-3">
                          <span className="relative mt-0.5">
                            <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", iconWrap(item.kind))}>
                              <KindIcon kind={item.kind} />
                            </span>
                            {!item.readAt ? <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[#2f7bff]" /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="text-sm font-extrabold text-white">{item.title}</span>
                              <span className="shrink-0 text-[11px] text-white/35">{formatNoticeTime(item.createdAt)}</span>
                            </span>
                            <span className="mt-0.5 block text-xs text-white/55">{item.body}</span>
                          </span>
                          <span className="self-center text-white/25">›</span>
                        </div>
                      </AppCard>
                    </button>
                  </form>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function KindIcon({ kind }: { kind: NoticeKind }) {
  if (kind === "appointment") return <Calendar className="h-4 w-4" />;
  if (kind === "message") return <MessageSquare className="h-4 w-4" />;
  if (kind === "system") return <Bell className="h-4 w-4" />;
  if (kind === "repair") return <Wrench className="h-4 w-4" />;
  return <CircleAlert className="h-4 w-4" />;
}

function iconWrap(kind: NoticeKind) {
  if (kind === "appointment") return "bg-[#1f8a5b]/20 text-[#3ee08f]";
  if (kind === "message") return "bg-[#2f7bff]/20 text-[#7eb0ff]";
  if (kind === "system") return "bg-white/10 text-white/70";
  return "bg-[#2f7bff]/20 text-[#7eb0ff]";
}
