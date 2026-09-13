import type { EstimateStatus, JobStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDirectoryShops, type DirectoryShop } from "@/services/landing";
import { FEATURED_SHOP_SLUGS, vehiclePhotoFor } from "@/lib/landing";
import { formatCents } from "@/lib/money";
import { formatAppointment, formatRelative } from "@/lib/utils";

export type DashboardRepair = {
  id: string;
  vehicleLabel: string;
  problem: string;
  shopName: string;
  shopCity: string;
  photo: string;
  status: JobStatus;
  badge: { label: string; tone: "info" | "warning" | "success" | "muted" };
  estimateLabel: string | null;
  appointmentLabel: string | null;
  updatedLabel: string;
  showStepper: boolean;
  stepIndex: number;
  actions: { href: string; label: string; variant: "primary" | "secondary" }[];
};

export type DashboardActivity = {
  id: string;
  title: string;
  detail: string;
  when: string;
  href: string;
};

export type DashboardMessage = {
  id: string;
  href: string;
  shopName: string;
  preview: string;
  when: string;
};

export type DashboardVehicle = {
  id: string;
  label: string;
  year: number;
  photo: string;
};

export async function getCustomerChrome(userId: string) {
  const [profile, unreadMessages, unreadNotifications] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId } }),
    prisma.message.count({
      where: {
        readAt: null,
        senderId: { not: userId },
        thread: { customerId: userId },
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  const location = profile?.city && profile.state ? `${profile.city}, ${profile.state}` : null;
  return {
    location,
    zip: profile?.zip ?? null,
    unreadMessages,
    unreadNotifications,
  };
}

export async function getCustomerDashboard(userId: string) {
  const chrome = await getCustomerChrome(userId);
  const [vehicles, jobs, threads, reviews, photos] = await Promise.all([
    prisma.vehicle.findMany({
      where: { customerId: userId, archivedAt: null },
      include: { make: true, model: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.job.findMany({
      where: { customerId: userId },
      include: {
        mechanicProfile: true,
        vehicle: { include: { make: true, model: true } },
        serviceRequest: true,
        estimates: { orderBy: { createdAt: "desc" }, take: 1 },
        events: { orderBy: { createdAt: "desc" }, take: 8 },
        thread: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.messageThread.findMany({
      where: { customerId: userId },
      include: {
        mechanic: { include: { mechanicProfile: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 6,
    }),
    prisma.review.findMany({
      where: { customerId: userId },
      include: { mechanic: true, job: { include: { vehicle: { include: { make: true, model: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.jobPhoto.findMany({
      where: { job: { customerId: userId } },
      include: { job: { include: { vehicle: { include: { make: true, model: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const dashboardVehicles = [...vehicles].reverse().slice(0, 10);
  const activeJobs = jobs.filter((job) => job.status !== "COMPLETED" && job.status !== "CANCELLED");
  const { shops, zip } = await getDirectoryShops({
    zip: chrome.zip ?? "84041",
    distance: "50",
    sort: "closest",
  });

  const sortedActive = [...activeJobs].sort((a, b) => {
    const now = Date.now();
    const aSoon = a.scheduledAt && a.scheduledAt.getTime() >= now ? a.scheduledAt.getTime() : Number.MAX_SAFE_INTEGER;
    const bSoon = b.scheduledAt && b.scheduledAt.getTime() >= now ? b.scheduledAt.getTime() : Number.MAX_SAFE_INTEGER;
    if (aSoon !== bSoon) return aSoon - bSoon;
    if (a.status === "AWAITING_APPROVAL" && b.status !== "AWAITING_APPROVAL") return -1;
    if (b.status === "AWAITING_APPROVAL" && a.status !== "AWAITING_APPROVAL") return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
  const repairs: DashboardRepair[] = sortedActive.slice(0, 6).map((job) => {
    const estimate = job.estimates[0];
    const estimateReady = Boolean(estimate && (estimate.status === "SENT" || job.status === "AWAITING_APPROVAL"));
    const hasAppointment = Boolean(job.scheduledAt);
    const actions: DashboardRepair["actions"] = [];
    if (estimateReady) actions.push({ href: `/jobs/${job.id}`, label: "View Estimate", variant: "primary" });
    actions.push({
      href: `/jobs/${job.id}#appointment`,
      label: hasAppointment ? "Reschedule" : "Set time",
      variant: estimateReady ? "secondary" : "primary",
    });
    if (!estimateReady) {
      actions.push({ href: `/jobs/${job.id}`, label: "View Details", variant: "secondary" });
    }
    return {
      id: job.id,
      vehicleLabel: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name}`,
      problem: job.serviceRequest.problemText,
      shopName: job.mechanicProfile.businessName,
      shopCity: job.mechanicProfile.shopCity ?? "",
      photo: vehiclePhotoFor(job.vehicle.make.name, job.vehicle.model.name),
      status: job.status,
      badge: repairBadge(job.status, estimate?.status, hasAppointment),
      estimateLabel: estimateReady && estimate ? formatCents(estimate.totalCents) : null,
      appointmentLabel: hasAppointment && job.scheduledAt ? formatAppointment(job.scheduledAt) : "Needs a time",
      updatedLabel: formatRelative(job.updatedAt),
      showStepper: job.status === "IN_PROGRESS" || job.status === "DIAGNOSING" || job.status === "EN_ROUTE" || job.status === "ARRIVED",
      stepIndex: stepperIndex(job.status),
      actions,
    };
  });

  const activity = buildActivity({ jobs, threads, reviews, photos, userId }).slice(0, 5);
  const messages: DashboardMessage[] = threads.slice(0, 4).map((thread) => ({
    id: thread.id,
    href: `/messages/${thread.id}`,
    shopName: thread.mechanic.mechanicProfile?.businessName ?? `${thread.mechanic.firstName} ${thread.mechanic.lastName}`,
    preview: thread.messages[0]?.body ?? "No messages yet",
    when: formatRelative(thread.lastMessageAt),
  }));

  return {
    locationLabel: chrome.location ?? (zip ? `${zip.city}, ${zip.stateCode}` : "Utah"),
    vehicles: dashboardVehicles.map((vehicle): DashboardVehicle => ({
      id: vehicle.id,
      label: `${vehicle.make.name} ${vehicle.model.name}`,
      year: vehicle.year,
      photo: vehiclePhotoFor(vehicle.make.name, vehicle.model.name),
    })),
    repairs,
    shops: preferFeatured(shops).slice(0, 3),
    origin: zip ? { latitude: zip.latitude, longitude: zip.longitude, city: zip.city } : null,
    activity,
    messages,
    unreadMessages: chrome.unreadMessages,
  };
}

function repairBadge(status: JobStatus, estimateStatus?: EstimateStatus, scheduled?: boolean) {
  if (status === "AWAITING_APPROVAL" || (status === "REQUESTED" && estimateStatus === "SENT")) {
    return { label: "Estimate Received", tone: "warning" as const };
  }
  if (status === "SCHEDULED" || ((status === "ACCEPTED" || status === "REQUESTED") && scheduled)) {
    return { label: "Appointment Scheduled", tone: "success" as const };
  }
  if (status === "ACCEPTED") return { label: "Accepted", tone: "success" as const };
  if (status === "IN_PROGRESS") return { label: "In Progress", tone: "info" as const };
  if (status === "DIAGNOSING") return { label: "Diagnosing", tone: "info" as const };
  if (status === "EN_ROUTE" || status === "ARRIVED") return { label: "In Service", tone: "info" as const };
  if (status === "REQUESTED") return { label: "Request sent", tone: "muted" as const };
  return { label: status.replaceAll("_", " ").toLowerCase(), tone: "muted" as const };
}

function stepperIndex(status: JobStatus) {
  if (status === "COMPLETED") return 4;
  if (status === "IN_PROGRESS") return 3;
  if (status === "AWAITING_APPROVAL") return 2;
  if (status === "DIAGNOSING" || status === "EN_ROUTE" || status === "ARRIVED") return 1;
  return 0;
}

function preferFeatured(shops: DirectoryShop[]) {
  const preferred = FEATURED_SHOP_SLUGS.filter((slug) => slug !== "mountain-rv-service");
  const preferredSet = new Set<string>(preferred);
  return [
    ...preferred.map((slug) => shops.find((shop) => shop.slug === slug)).filter((shop): shop is DirectoryShop => Boolean(shop)),
    ...shops.filter((shop) => !preferredSet.has(shop.slug)),
  ];
}

function buildActivity({
  jobs,
  threads,
  reviews,
  photos,
  userId,
}: {
  jobs: {
    id: string;
    status: JobStatus;
    scheduledAt: Date | null;
    mechanicProfile: { businessName: string };
    vehicle: { year: number; make: { name: string }; model: { name: string } };
    estimates: { status: EstimateStatus; totalCents: number; sentAt: Date | null; createdAt: Date }[];
  }[];
  threads: { id: string; jobId: string | null; lastMessageAt: Date; mechanic: { mechanicProfile: { businessName: string } | null }; messages: { body: string; senderId: string; createdAt: Date }[] }[];
  reviews: { id: string; createdAt: Date; overallRating: number; mechanic: { businessName: string } }[];
  photos: { id: string; createdAt: Date; jobId: string; job: { vehicle: { year: number; make: { name: string }; model: { name: string } } } }[];
  userId: string;
}) {
  const items: (DashboardActivity & { at: number })[] = [];

  for (const job of jobs) {
    const estimate = job.estimates[0];
    if (estimate?.status === "SENT" || estimate?.status === "APPROVED") {
      const at = estimate.sentAt ?? estimate.createdAt;
      items.push({
        id: `est-${job.id}`,
        title: `Estimate received from ${job.mechanicProfile.businessName}`,
        detail: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name} · ${formatCents(estimate.totalCents)}`,
        when: formatRelative(at),
        href: `/jobs/${job.id}`,
        at: at.getTime(),
      });
    }
    if (job.scheduledAt && job.status !== "COMPLETED" && job.status !== "CANCELLED") {
      items.push({
        id: `apt-${job.id}`,
        title: `Appointment scheduled`,
        detail: `${job.vehicle.year} ${job.vehicle.make.name} ${job.vehicle.model.name} · ${formatAppointment(job.scheduledAt)}`,
        when: formatRelative(job.scheduledAt),
        href: `/jobs/${job.id}`,
        at: job.scheduledAt.getTime(),
      });
    }
  }

  for (const thread of threads) {
    const message = thread.messages[0];
    if (!message || message.senderId === userId) continue;
    const shop = thread.mechanic.mechanicProfile?.businessName ?? "Shop";
    items.push({
      id: `msg-${thread.id}`,
      title: `New message from ${shop}`,
      detail: `“${message.body}”`,
      when: formatRelative(message.createdAt),
      href: `/messages/${thread.id}`,
      at: message.createdAt.getTime(),
    });
  }

  for (const review of reviews) {
    items.push({
      id: `rev-${review.id}`,
      title: `Left a review for ${review.mechanic.businessName}`,
      detail: `${review.overallRating} stars`,
      when: formatRelative(review.createdAt),
      href: "/reviews",
      at: review.createdAt.getTime(),
    });
  }

  const photosByJob = new Map<string, typeof photos>();
  for (const photo of photos) {
    const list = photosByJob.get(photo.jobId) ?? [];
    list.push(photo);
    photosByJob.set(photo.jobId, list);
  }
  for (const [jobId, group] of photosByJob) {
    const photo = group[0];
    items.push({
      id: `photo-${jobId}`,
      title: group.length > 1 ? `You uploaded ${group.length} photos` : "You uploaded a photo",
      detail: `${photo.job.vehicle.year} ${photo.job.vehicle.make.name} ${photo.job.vehicle.model.name}`,
      when: formatRelative(photo.createdAt),
      href: `/jobs/${jobId}`,
      at: photo.createdAt.getTime(),
    });
  }

  return items
    .sort((a, b) => b.at - a.at)
    .map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.detail,
      when: item.when,
      href: item.href,
    }));
}

export type { DirectoryShop };
