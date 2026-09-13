import { sendMessageAction } from "@/app/actions/marketplace";
import { MarkRead } from "@/components/messages/mark-read";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";

export function ThreadView({
  threadId,
  selfId,
  title,
  subtitle,
  jobHref,
  jobLabel,
  messages,
  markRead = true,
  canSend = true,
  returnTo,
}: {
  threadId: string;
  selfId: string;
  title: string;
  subtitle?: string;
  jobHref?: string | null;
  jobLabel?: string | null;
  messages: { id: string; senderId: string; senderName: string; body: string; createdAt: Date }[];
  markRead?: boolean;
  canSend?: boolean;
  returnTo?: string;
}) {
  return (
    <Card className="border-0 p-5">
      {markRead ? <MarkRead threadId={threadId} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-navy">{title}</h2>
          {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
        </div>
        {jobHref ? (
          <Link href={jobHref} className="text-sm font-semibold text-[#2f7bff]">
            {jobLabel ?? "Open job"} →
          </Link>
        ) : null}
      </div>
      <div className="mt-4 max-h-[28rem] space-y-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">No messages yet. Write one below — the other side sees it on their Messages board.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={message.senderId === selfId ? "text-right" : ""}>
              <div
                className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  message.senderId === selfId ? "bg-navy text-white" : "bg-paper text-navy"
                }`}
              >
                {message.body}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                {message.senderName} · {formatRelative(message.createdAt)}
              </p>
            </div>
          ))
        )}
      </div>
      {canSend ? (
        <form action={sendMessageAction} className="mt-4 flex gap-2">
          <input type="hidden" name="threadId" value={threadId} />
          {returnTo ? <input type="hidden" name="returnTo" value={returnTo} /> : null}
          <Input name="body" required placeholder="Write a message" />
          <Button type="submit" name="sendMessage">
            Send
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
