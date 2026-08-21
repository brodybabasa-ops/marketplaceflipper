import type { Listing, SavedSearch, User } from "@prisma/client";
import type { SearchParams } from "@/types/search";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { formatMiles, formatPrice, vehicleTitle } from "@/lib/utils";

type SearchWithUser = SavedSearch & { user: User };

export async function dispatchListingAlert(input: {
  listing: Listing;
  search: SearchWithUser;
}) {
  const { listing, search } = input;

  try {
    const notification = await prisma.notification.create({
      data: {
        userId: search.userId,
        listingId: listing.id,
        savedSearchId: search.id,
        channel: "email",
        status: "pending",
      },
    });

    if (!search.notifyEmail) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "skipped" },
      });
      return;
    }

    const sent = await sendAlertEmail({ listing, search });
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: sent ? "sent" : "logged", sentAt: new Date() },
    });
    await prisma.savedSearch.update({
      where: { id: search.id },
      data: { lastNotifiedAt: new Date() },
    });
    logger.info("alert.created", {
      notificationId: notification.id,
      listingId: listing.id,
      savedSearchId: search.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message.includes("Unique constraint")) {
      logger.info("alert.duplicate_prevented", {
        listingId: listing.id,
        savedSearchId: search.id,
      });
      return;
    }
    logger.error("alert.failed", { error: message, listingId: listing.id });
  }
}

async function sendAlertEmail(input: { listing: Listing; search: SearchWithUser }) {
  const { listing, search } = input;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const subject = `New ${listing.normalizedModel ?? "listing"} matching ${search.name}`;
  const body = [
    `New listing matching your search “${search.name}”`,
    "",
    vehicleTitle(listing),
    formatPrice(listing.price),
    formatMiles(listing.mileage),
    [listing.city, listing.state].filter(Boolean).join(", "),
    "",
    `${appUrl}/listing/${listing.id}`,
    listing.sourceUrl,
  ].join("\n");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.info("alert.email_logged", { subject });
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.ALERT_FROM_EMAIL || "Lotline <alerts@example.com>",
      to: search.user.email,
      subject,
      text: body,
    }),
  });

  if (!response.ok) {
    logger.error("alert.email_failed", { status: response.status });
    return false;
  }
  return true;
}

export async function previewAlertsForUser(userId: string) {
  const searches = await prisma.savedSearch.findMany({ where: { userId } });
  const listings = await prisma.listing.findMany({
    where: { listingStatus: "active" },
    orderBy: { firstSeenAt: "desc" },
    take: 40,
  });
  const { listingMatchesParams } = await import("@/lib/search/query");

  return searches.map((search) => ({
    search,
    matches: listings.filter((listing) =>
      listingMatchesParams(listing, search.params as Partial<SearchParams>),
    ).slice(0, 5),
  }));
}
