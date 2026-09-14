import Link from "next/link";
import { ChevronLeft, ImagePlus, MoreHorizontal, Phone, Send, Video } from "lucide-react";
import { sendMessageAction } from "@/app/actions/marketplace";
import { MarkRead } from "@/components/messages/mark-read";
import { shopPhotoFor } from "@/lib/landing";
import { VerifiedMark } from "@/components/customer-app/primitives";
import { formatThreadTime } from "@/lib/customer-app";
import { cn } from "@/lib/utils";

export function CustomerThreadView({
  threadId,
  selfId,
  shopName,
  shopSlug,
  verified,
  subtitle,
  messages,
}: {
  threadId: string;
  selfId: string;
  shopName: string;
  shopSlug?: string | null;
  verified?: boolean;
  subtitle?: string;
  messages: {
    id: string;
    senderId: string;
    senderName: string;
    body: string;
    createdAt: Date;
    attachmentUrl?: string | null;
    kind?: string;
  }[];
}) {
  return (
    <div className="flex min-h-[calc(100vh-8.5rem)] flex-col px-4 pt-2">
      <MarkRead threadId={threadId} />
      <div className="flex items-center gap-2 pb-3">
        <Link href="/messages" className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shopPhotoFor(shopSlug ?? "precision-auto-care")} alt="" className="h-9 w-9 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-sm font-extrabold text-white">
            {shopName}
            {verified ? <VerifiedMark /> : null}
          </p>
          <p className="truncate text-[11px] text-white/45">{subtitle ?? "Typically replies in a few minutes"}</p>
        </div>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50">
          <Phone className="h-4 w-4" />
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50">
          <Video className="h-4 w-4" />
        </span>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/50">
          <MoreHorizontal className="h-4 w-4" />
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.length === 0 ? (
          <p className="text-sm text-white/45">No messages yet. Write one below.</p>
        ) : (
          messages.map((message) => {
            const mine = message.senderId === selfId;
            return (
              <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%]", mine ? "items-end" : "items-start")}>
                  {!mine ? (
                    <div className="mb-1 flex items-center gap-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={shopPhotoFor(shopSlug ?? "precision-auto-care")} alt="" className="h-6 w-6 rounded-full object-cover" />
                    </div>
                  ) : null}
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      mine ? "rounded-br-md bg-[#2f7bff] text-white" : "rounded-bl-md bg-[#0c1d30] text-white",
                    )}
                  >
                    {message.attachmentUrl ? (
                      message.attachmentUrl.match(/\.(png|jpe?g|webp|gif)$/i) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.attachmentUrl} alt="" className="mb-2 max-h-40 rounded-xl object-cover" />
                      ) : (
                        <a href={message.attachmentUrl} className="mb-2 block rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold" target="_blank" rel="noreferrer">
                          Attachment
                        </a>
                      )
                    ) : null}
                    {message.body}
                  </div>
                  <p className={cn("mt-1 text-[10px] text-white/35", mine && "text-right")}>{formatThreadTime(message.createdAt)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form action={sendMessageAction} className="sticky bottom-0 flex items-center gap-2 bg-[#071422] py-2">
        <input type="hidden" name="threadId" value={threadId} />
        <input type="hidden" name="returnTo" value={`/messages/${threadId}`} />
        <label className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#0c1d30] text-white/60">
          <ImagePlus className="h-5 w-5" />
          <input type="file" name="attachment" accept="image/*,application/pdf" className="hidden" />
        </label>
        <input
          name="body"
          placeholder="Type a message..."
          className="h-11 flex-1 rounded-full border border-white/10 bg-[#0c1d30] px-4 text-sm text-white outline-none placeholder:text-white/35"
        />
        <button type="submit" name="sendMessage" className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2f7bff] text-white" aria-label="Send">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
