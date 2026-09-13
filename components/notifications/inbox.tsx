import { markAllNotificationsReadAction, openNotificationAction } from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/card";
import { formatRelative } from "@/lib/utils";

export function NotificationsInbox({
  notifications,
}: {
  notifications: {
    id: string;
    title: string;
    body: string;
    href: string | null;
    readAt: Date | null;
    createdAt: Date;
  }[];
}) {
  const unread = notifications.filter((item) => !item.readAt).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">{unread} unread</p>
        {unread ? (
          <form action={markAllNotificationsReadAction}>
            <Button type="submit" size="sm" variant="secondary">
              Mark all read
            </Button>
          </form>
        ) : null}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="No alerts yet" body="Job updates, estimates, and appointment changes land here." />
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <form key={item.id} action={openNotificationAction}>
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className={`w-full rounded-xl border border-line px-4 py-3 text-left ${item.readAt ? "bg-paper" : "bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-navy">{item.title}</p>
                  <span className="shrink-0 text-[11px] text-muted">{formatRelative(item.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{item.body}</p>
              </button>
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
