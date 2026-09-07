import type { PrismaClient } from "@prisma/client";
import { createGenericAsset } from "../services/assets";
import { evaluateMaintenance } from "../services/maintenance";

type Ctx = {
  passwordHash: string;
  alexId: string;
  mikeProfileId: string;
  mikeUserId: string;
  sarahProfileId: string | undefined;
  marineProfileId: string | undefined;
};

export async function seedVisionLayer(prisma: PrismaClient, ctx: Ctx) {
  const fleetUser = await prisma.user.create({
    data: {
      email: "fleet@demo.pocketmechanic.app",
      passwordHash: ctx.passwordHash,
      role: "CUSTOMER",
      firstName: "Morgan",
      lastName: "Ellis",
      phone: "+18015550190",
      customerProfile: {
        create: { city: "Salt Lake City", state: "UT", zip: "84101", latitude: 40.7608, longitude: -111.891 },
      },
    },
  });

  const extra = [
    {
      industryKey: "POWERSPORTS" as const,
      assetTypeKey: "UTV",
      year: 2022,
      manufacturer: "Polaris",
      model: "RZR",
      nickname: "The RZR",
      usageValue: 186,
      usageUnit: "ENGINE_HOURS" as const,
      identifiers: [{ kind: "SERIAL_NUMBER" as const, value: "3NSRZR22DEMO" }],
    },
    {
      industryKey: "RV" as const,
      assetTypeKey: "TOY_HAULER",
      year: 2021,
      manufacturer: "Grand Design",
      model: "Momentum",
      nickname: "The trailer",
      usageValue: 18400,
      usageUnit: "MILES" as const,
      identifiers: [{ kind: "VIN" as const, value: "573GDMOM21DEMO" }],
    },
    {
      industryKey: "HEAVY_EQUIPMENT" as const,
      assetTypeKey: "SKID_STEER",
      year: 2019,
      manufacturer: "CAT",
      model: "262D",
      nickname: "Skid steer",
      usageValue: 2140,
      usageUnit: "OPERATING_HOURS" as const,
      identifiers: [{ kind: "SERIAL_NUMBER" as const, value: "CAT262D-DEMO" }],
    },
    {
      industryKey: "SMALL_ENGINE" as const,
      assetTypeKey: "GENERATOR",
      year: 2023,
      manufacturer: "Honda",
      model: "EU7000is",
      nickname: "Generator",
      usageValue: 64,
      usageUnit: "OPERATING_HOURS" as const,
      identifiers: [{ kind: "SERIAL_NUMBER" as const, value: "HND-EU7-DEMO" }],
    },
  ];
  for (const item of extra) {
    await createGenericAsset({ ownerId: ctx.alexId, ...item });
  }

  const fleetAssets = [];
  for (let i = 0; i < 6; i++) {
    fleetAssets.push(
      await createGenericAsset({
        ownerId: fleetUser.id,
        industryKey: "COMMERCIAL_FLEET",
        assetTypeKey: "FLEET_VEHICLE",
        year: 2019 + (i % 4),
        manufacturer: i % 2 ? "Ford" : "Ram",
        model: i % 2 ? "Transit" : "ProMaster",
        nickname: `Unit ${20 + i}`,
        usageValue: 48000 + i * 6200,
        usageUnit: "MILES",
        identifiers: [{ kind: "FLEET_ID", value: `WRS-${20 + i}` }],
      }),
    );
  }

  const fleet = await prisma.fleetAccount.create({
    data: {
      name: "Western Ridge Services",
      ownerId: fleetUser.id,
      city: "Salt Lake City",
      state: "UT",
      memberships: { create: { userId: fleetUser.id, role: "OWNER" } },
      assignments: {
        create: fleetAssets.map((asset, index) => ({ assetId: asset.id, label: `Unit ${20 + index}` })),
      },
    },
  });
  await prisma.downtimeEvent.create({
    data: {
      fleetId: fleet.id,
      assetId: fleetAssets[0].id,
      reason: "Waiting on authorization",
    },
  });

  await prisma.technicianProfile.createMany({
    data: [
      {
        mechanicProfileId: ctx.mikeProfileId,
        displayName: "Alex Johnson",
        title: "Lead technician",
        duty: "OFF_SITE",
        specialties: ["ELECTRICAL", "BRAKES", "ENGINE"],
      },
      {
        mechanicProfileId: ctx.mikeProfileId,
        displayName: "Tyler Grant",
        title: "Mobile technician",
        duty: "OFF_SITE",
        specialties: ["BRAKES", "MAINTENANCE"],
      },
    ],
  });
  if (ctx.sarahProfileId) {
    await prisma.technicianProfile.create({
      data: {
        mechanicProfileId: ctx.sarahProfileId,
        displayName: "Dana Park",
        title: "Shop technician",
        duty: "SHOP",
        specialties: ["ENGINE", "ELECTRICAL"],
      },
    });
    await prisma.providerLocation.create({
      data: {
        mechanicProfileId: ctx.sarahProfileId,
        name: "Sandy shop",
        city: "Sandy",
        state: "UT",
        zip: "84070",
        isPrimary: true,
        resources: {
          create: [
            { mechanicProfileId: ctx.sarahProfileId, kind: "BAY", name: "Bay 1" },
            { mechanicProfileId: ctx.sarahProfileId, kind: "BAY", name: "Bay 2" },
            { mechanicProfileId: ctx.sarahProfileId, kind: "ALIGNMENT_RACK", name: "Alignment" },
          ],
        },
      },
    });
  }

  const alexAssets = await prisma.asset.findMany({ where: { ownerId: ctx.alexId } });
  for (const asset of alexAssets) {
    const industry = await prisma.industry.findUnique({ where: { id: asset.industryId } });
    if (!industry) continue;
    const items = evaluateMaintenance({
      industryKey: industry.key,
      usageValue: asset.usageValue,
      usageUnit: asset.usageUnit,
      createdAt: asset.createdAt,
    });
    if (items.length) {
      await prisma.maintenanceItem.createMany({
        data: items.map((item) => ({
          assetId: asset.id,
          title: item.title,
          taxonomyKey: item.taxonomyKey,
          status: item.status,
          source: item.source,
          notes: item.remainingLabel,
        })),
      });
    }
  }

  const completed = await prisma.job.findMany({
    where: { mechanicProfileId: ctx.mikeProfileId, status: "COMPLETED", customerId: ctx.alexId },
    include: { serviceRequest: true, repairRecord: true },
    take: 4,
  });
  if (completed[0]) {
    await prisma.repairWarranty.create({
      data: {
        jobId: completed[0].id,
        repairRecordId: completed[0].repairRecord?.id,
        assetId: completed[0].assetId,
        mechanicProfileId: ctx.mikeProfileId,
        title: completed[0].repairRecord?.title || "Completed repair",
        partsCoverage: "12 months",
        laborCoverage: "12 months / 12,000 miles",
        providerName: "Mike's Mobile Auto",
        expiresAt: new Date(Date.now() + 300 * 86400000),
        usageLimit: 12000,
        usageUnit: "MILES",
      },
    });
    await prisma.repairOutcome.create({
      data: {
        jobId: completed[0].id,
        customerId: ctx.alexId,
        mechanicProfileId: ctx.mikeProfileId,
        assetId: completed[0].assetId,
        originalProblem: completed[0].serviceRequest.problemText,
        category: completed[0].serviceRequest.category,
        taxonomyKey: completed[0].serviceRequest.taxonomyKey,
        resolved: "YES",
      },
    });
  }

  const brakeJobs = await prisma.job.findMany({
    where: { status: "COMPLETED", totalCents: { gt: 0 }, serviceRequest: { taxonomyKey: "BRAKES" } },
    select: { totalCents: true },
    take: 40,
  });
  if (brakeJobs.length >= 5) {
    const amounts = brakeJobs.map((item) => item.totalCents).sort((a, b) => a - b);
    await prisma.priceBenchmark.create({
      data: {
        industryKey: "AUTOMOTIVE",
        taxonomyKey: "BRAKES",
        region: "UT",
        minCents: amounts[Math.floor(amounts.length * 0.2)],
        maxCents: amounts[Math.floor(amounts.length * 0.8)],
        sampleSize: amounts.length,
        provenance: "VERIFIED_TRANSACTION",
      },
    });
  }
  await prisma.priceBenchmark.create({
    data: {
      industryKey: "AUTOMOTIVE",
      taxonomyKey: "BRAKES",
      region: "Salt Lake metro",
      minCents: 68000,
      maxCents: 81000,
      sampleSize: 24,
      provenance: "DEMO_FIXTURE",
    },
  });

  const techs = await prisma.technicianProfile.findMany({ where: { mechanicProfileId: ctx.mikeProfileId } });
  const activeJob = await prisma.job.findFirst({
    where: { mechanicProfileId: ctx.mikeProfileId, status: { notIn: ["COMPLETED", "CANCELLED"] }, scheduledAt: { not: null } },
  });
  if (techs[0] && activeJob?.scheduledAt) {
    const start = new Date(activeJob.scheduledAt);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);
    await prisma.scheduleBlock.create({
      data: {
        mechanicProfileId: ctx.mikeProfileId,
        jobId: activeJob.id,
        technicianProfileId: techs[0].id,
        kind: "WORK",
        title: "On-site diagnosis",
        startsAt: start,
        endsAt: end,
      },
    });
  }

  await prisma.hqAlert.create({
    data: {
      kind: "SHORTAGE",
      title: "Diesel coverage is thin in Boise",
      body: "Development fixture for recruiting. Disable with PM_VISION_DEMO=false.",
      href: "/admin/recruiting",
      severity: "warning",
      provenance: "DEMO_FIXTURE",
    },
  });

  await prisma.walletAccount.create({
    data: {
      userId: ctx.alexId,
      entries: {
        create: {
          kind: "MAINTENANCE_FUND",
          amountCents: 0,
          note: "Architecture only — not a bank balance",
          provenance: "DEMO_FIXTURE",
        },
      },
    },
  });

  await prisma.membership.create({ data: { userId: ctx.alexId, tier: "NONE" } });

  if (ctx.marineProfileId) {
    await prisma.verificationContent.create({
      data: {
        mechanicProfileId: ctx.marineProfileId,
        title: "Meet the Mechanic",
        kind: "SHOP_TOUR",
        notes: "Optional content. Participation never determines verification approval.",
      },
    });
  }

  await prisma.platformConfig.update({
    where: { id: "default" },
    data: { visionDemoEnabled: true },
  });

  await seedTodayOperations(prisma);
}

function atHour(day: Date, hour: number, minute = 0) {
  const next = new Date(day);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export async function seedTodayOperations(prisma: PrismaClient) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dayStart = new Date(today);
  dayStart.setHours(0, 0, 0, 0);

  const mike = await prisma.mechanicProfile.findFirst({
    where: { user: { email: "mechanic@demo.pocketmechanic.app" } },
    include: { technicianProfiles: true, resources: true, user: true },
  });
  if (mike) {
    const todayBlocks = await prisma.scheduleBlock.count({
      where: { mechanicProfileId: mike.id, startsAt: { gte: dayStart, lt: atHour(today, 23) }, title: { startsWith: "Demo:" } },
    });
    if (todayBlocks === 0) {
      const alex = mike.technicianProfiles.find((tech) => tech.displayName.includes("Alex")) ?? mike.technicianProfiles[0];
      const tyler = mike.technicianProfiles.find((tech) => tech.displayName.includes("Tyler")) ?? mike.technicianProfiles[1] ?? alex;
      if (!mike.resources.length) {
        await prisma.providerResource.create({
          data: { mechanicProfileId: mike.id, kind: "SERVICE_TRUCK", name: "Van 1" },
        });
      }
      const jobs = await prisma.job.findMany({
        where: { mechanicProfileId: mike.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
        include: { serviceRequest: true },
        orderBy: { updatedAt: "desc" },
      });
      const inProgress = jobs.find((job) => job.status === "IN_PROGRESS") ?? jobs[0];
      const enRoute = jobs.find((job) => job.status === "EN_ROUTE") ?? jobs[1];
      const delayed = jobs.find((job) => job.status === "REQUESTED") ?? jobs[2];
      const waiting = jobs.find((job) => job.status === "ACCEPTED") ?? jobs[3];
      if (inProgress) {
        await prisma.job.update({
          where: { id: inProgress.id },
          data: { customerWaiting: false, partsStatus: "READY", promisedReadyAt: atHour(today, 13) },
        });
        await prisma.scheduleBlock.create({
          data: {
            mechanicProfileId: mike.id,
            jobId: inProgress.id,
            technicianProfileId: alex?.id,
            kind: "WORK",
            title: "Demo: On-site diagnosis",
            startsAt: atHour(today, 8, 30),
            endsAt: atHour(today, 10, 30),
          },
        });
      }
      if (enRoute && tyler) {
        await prisma.scheduleBlock.createMany({
          data: [
            {
              mechanicProfileId: mike.id,
              jobId: enRoute.id,
              technicianProfileId: tyler.id,
              kind: "TRAVEL",
              title: "Demo: Travel to customer",
              startsAt: atHour(today, 10, 30),
              endsAt: atHour(today, 11),
            },
            {
              mechanicProfileId: mike.id,
              jobId: enRoute.id,
              technicianProfileId: tyler.id,
              kind: "WORK",
              title: "Demo: Field repair",
              startsAt: atHour(today, 11),
              endsAt: atHour(today, 13),
            },
          ],
        });
      }
      if (delayed) {
        await prisma.job.update({ where: { id: delayed.id }, data: { partsStatus: "DELAYED" } });
      }
      if (waiting) {
        await prisma.job.update({ where: { id: waiting.id }, data: { customerWaiting: true } });
      }
    }
  }

  await seedBusyShopDay(prisma, today, dayStart);
}

async function shopWork(
  prisma: PrismaClient,
  input: {
    sarahId: string;
    sarahUserId: string;
    customerId: string;
    vehicleId: string;
    assetId?: string;
    problem: string;
    category: "BRAKES" | "MAINTENANCE" | "SUSPENSION" | "ENGINE" | "ELECTRICAL" | "AC_HEATING" | "DIAGNOSTICS";
    status: "IN_PROGRESS" | "SCHEDULED" | "AWAITING_APPROVAL" | "CHECKED_IN" | "DIAGNOSING" | "QUALITY_CHECK" | "READY" | "REQUESTED";
    totalCents: number;
    partsStatus?: "READY" | "DELAYED" | "ORDERED" | "UNKNOWN";
    waiting?: boolean;
    requestKind?: "REPAIR" | "MAINTENANCE" | "DIAGNOSTIC" | "PRE_PURCHASE" | "FLEET_PM";
    technicianProfileId?: string;
    promisedReadyAt?: Date;
    scheduledAt?: Date;
  },
) {
  const request = await prisma.serviceRequest.create({
    data: {
      customerId: input.customerId,
      vehicleId: input.vehicleId,
      assetId: input.assetId,
      mechanicProfileId: input.sarahId,
      status: input.status === "REQUESTED" ? "OPEN" : "ACCEPTED",
      problemText: input.problem,
      category: input.category,
      requestKind: input.requestKind ?? "REPAIR",
      zip: "84070",
      city: "Sandy",
      state: "UT",
      mobilePreferred: false,
      urgencyMode: input.waiting ? "URGENT" : "NORMAL",
    },
  });
  return prisma.job.create({
    data: {
      serviceRequestId: request.id,
      customerId: input.customerId,
      mechanicUserId: input.sarahUserId,
      mechanicProfileId: input.sarahId,
      vehicleId: input.vehicleId,
      assetId: input.assetId,
      status: input.status,
      totalCents: input.totalCents,
      partsStatus: input.partsStatus ?? "UNKNOWN",
      customerWaiting: Boolean(input.waiting),
      scheduledAt: input.scheduledAt ?? new Date(),
      promisedReadyAt: input.promisedReadyAt,
      technicianProfileId: input.technicianProfileId,
      events: { create: [{ status: input.status, note: "Demo: busy shop board fixture" }] },
    },
  });
}

export async function seedBusyShopDay(prisma: PrismaClient, today: Date, dayStart: Date) {
  const sarah = await prisma.mechanicProfile.findFirst({
    where: { user: { email: "sarah.chen@demo.pocketmechanic.app" } },
    include: { technicianProfiles: true, resources: true, user: true },
  });
  if (!sarah) return;
  const existing = await prisma.scheduleBlock.count({
    where: { mechanicProfileId: sarah.id, startsAt: { gte: dayStart }, title: { startsWith: "Board:" } },
  });
  if (existing > 0) return;

  await prisma.scheduleBlock.deleteMany({
    where: { mechanicProfileId: sarah.id, startsAt: { gte: dayStart }, title: { startsWith: "Demo:" } },
  });

  const wanted = [
    { displayName: "Dana Park", title: "Lead technician", duty: "SHOP" as const, specialties: ["ENGINE", "ELECTRICAL"] },
    { displayName: "Jordan Hale", title: "Shop technician", duty: "SHOP" as const, specialties: ["BRAKES", "MAINTENANCE"] },
    { displayName: "Mike Reyes", title: "Technician", duty: "SHOP" as const, specialties: ["DIAGNOSTICS", "ENGINE"] },
    { displayName: "Alex Ruiz", title: "Technician", duty: "SHOP" as const, specialties: ["AC_HEATING", "ELECTRICAL"] },
    { displayName: "Ryan Cole", title: "Technician", duty: "SHOP" as const, specialties: ["MAINTENANCE"] },
  ];
  for (const tech of wanted) {
    if (!sarah.technicianProfiles.find((item) => item.displayName === tech.displayName)) {
      await prisma.technicianProfile.create({ data: { mechanicProfileId: sarah.id, ...tech } });
    }
  }
  const techs = await prisma.technicianProfile.findMany({ where: { mechanicProfileId: sarah.id, active: true } });
  const dana = techs.find((item) => item.displayName.includes("Dana"));
  const jordan = techs.find((item) => item.displayName.includes("Jordan"));
  const mike = techs.find((item) => item.displayName.includes("Mike"));
  const alex = techs.find((item) => item.displayName.includes("Alex"));
  const ryan = techs.find((item) => item.displayName.includes("Ryan"));
  const bay1 = sarah.resources.find((item) => item.name === "Bay 1");
  const bay2 = sarah.resources.find((item) => item.name === "Bay 2");
  const rack = sarah.resources.find((item) => item.kind === "ALIGNMENT_RACK");
  const customer = await prisma.user.findUnique({ where: { email: "customer@demo.pocketmechanic.app" } });
  const vehicles = customer
    ? await prisma.vehicle.findMany({ where: { customerId: customer.id }, include: { asset: true }, take: 6 })
    : [];
  const v = (index: number) => vehicles[index % Math.max(1, vehicles.length)];
  if (!customer || !vehicles.length || !dana || !jordan || !mike || !alex || !ryan) return;

  const lateEnd = new Date(Date.now() - 25 * 60000);
  const lateStart = new Date(lateEnd.getTime() - 2 * 3600000);
  const arriving = new Date(Date.now() + 8 * 60000);

  const oil = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(0).id, assetId: v(0).asset?.id,
    problem: "Board: Oil change", category: "MAINTENANCE", status: "QUALITY_CHECK", totalCents: 12900, partsStatus: "READY", technicianProfileId: dana.id, promisedReadyAt: atHour(today, 11),
  });
  const brakes = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(1).id, assetId: v(1).asset?.id,
    problem: "Board: Brake service running late", category: "BRAKES", status: "IN_PROGRESS", totalCents: 68000, partsStatus: "READY", waiting: true, technicianProfileId: jordan.id, promisedReadyAt: atHour(today, 12),
  });
  const diag = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(2).id, assetId: v(2).asset?.id,
    problem: "Board: Engine diagnostics", category: "DIAGNOSTICS", status: "DIAGNOSING", totalCents: 18900, partsStatus: "READY", requestKind: "DIAGNOSTIC", technicianProfileId: mike.id,
  });
  const trans = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(3).id, assetId: v(3).asset?.id,
    problem: "Board: Transmission inspection", category: "ENGINE", status: "CHECKED_IN", totalCents: 42000, partsStatus: "READY", technicianProfileId: alex.id,
  });
  const ppi = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(4).id, assetId: v(4).asset?.id,
    problem: "Board: Pre-purchase inspection", category: "DIAGNOSTICS", status: "SCHEDULED", totalCents: 24900, requestKind: "PRE_PURCHASE", technicianProfileId: dana.id,
  });
  const ac = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(5).id, assetId: v(5).asset?.id,
    problem: "Board: AC repair", category: "AC_HEATING", status: "SCHEDULED", totalCents: 54000, technicianProfileId: mike.id,
  });
  const engine = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(0).id, assetId: v(0).asset?.id,
    problem: "Board: Engine repair", category: "ENGINE", status: "SCHEDULED", totalCents: 680000, technicianProfileId: alex.id,
  });
  const tires = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(1).id, assetId: v(1).asset?.id,
    problem: "Board: Tire service", category: "MAINTENANCE", status: "SCHEDULED", totalCents: 89000, technicianProfileId: jordan.id,
  });
  const follow = await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(2).id, assetId: v(2).asset?.id,
    problem: "Board: Customer follow-up", category: "MAINTENANCE", status: "SCHEDULED", totalCents: 0, technicianProfileId: jordan.id,
  });
  await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(3).id, assetId: v(3).asset?.id,
    problem: "Board: Estimate waiting on Tahoe oil leak", category: "ENGINE", status: "AWAITING_APPROVAL", totalCents: 214000,
  });
  await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(4).id, assetId: v(4).asset?.id,
    problem: "Board: Waiting on delayed hub assembly", category: "BRAKES", status: "CHECKED_IN", totalCents: 42000, partsStatus: "DELAYED",
  });
  await shopWork(prisma, {
    sarahId: sarah.id, sarahUserId: sarah.userId, customerId: customer.id, vehicleId: v(5).id, assetId: v(5).asset?.id,
    problem: "Board: Marketplace — grinding noise, customer requested ASAP", category: "BRAKES", status: "REQUESTED", totalCents: 0, waiting: true,
  });
  const fleetUser = await prisma.user.findUnique({ where: { email: "fleet@demo.pocketmechanic.app" } });
  const fleetAsset = fleetUser ? await prisma.asset.findFirst({ where: { ownerId: fleetUser.id } }) : null;
  if (fleetUser && fleetAsset) {
    const fleetJob = await shopWork(prisma, {
      sarahId: sarah.id, sarahUserId: sarah.userId, customerId: fleetUser.id, vehicleId: v(0).id, assetId: fleetAsset.id,
      problem: "Board: Fleet PM Unit 214", category: "MAINTENANCE", status: "SCHEDULED", totalCents: 32000, requestKind: "FLEET_PM", technicianProfileId: dana.id, scheduledAt: atHour(today, 15, 30),
    });
    await prisma.scheduleBlock.create({
      data: {
        mechanicProfileId: sarah.id, jobId: fleetJob.id, technicianProfileId: dana.id, kind: "WORK",
        title: "Board: Fleet PM Unit 214", startsAt: atHour(today, 15, 30), endsAt: atHour(today, 16, 30),
      },
    });
  }

  await prisma.scheduleBlock.createMany({
    data: [
      { mechanicProfileId: sarah.id, jobId: oil.id, technicianProfileId: dana.id, resourceId: bay1?.id, kind: "WORK", title: "Board: Oil change", startsAt: atHour(today, 8), endsAt: atHour(today, 9) },
      { mechanicProfileId: sarah.id, jobId: brakes.id, technicianProfileId: jordan.id, resourceId: bay2?.id, kind: "WORK", title: "Board: Brake service", startsAt: lateStart, endsAt: lateEnd },
      { mechanicProfileId: sarah.id, jobId: diag.id, technicianProfileId: mike.id, kind: "WORK", title: "Board: Engine diagnostics", startsAt: atHour(today, 9), endsAt: atHour(today, 11) },
      { mechanicProfileId: sarah.id, jobId: trans.id, technicianProfileId: alex.id, resourceId: bay1?.id, kind: "WORK", title: "Board: Transmission", startsAt: atHour(today, 9), endsAt: atHour(today, 12) },
      { mechanicProfileId: sarah.id, kind: "DROP_OFF", title: "Board: Customer arriving", jobId: ppi.id, technicianProfileId: dana.id, startsAt: arriving, endsAt: new Date(arriving.getTime() + 15 * 60000) },
      { mechanicProfileId: sarah.id, jobId: ppi.id, technicianProfileId: dana.id, kind: "WORK", title: "Board: PPI", startsAt: atHour(today, 10, 30), endsAt: atHour(today, 12) },
      { mechanicProfileId: sarah.id, technicianProfileId: dana.id, kind: "BREAK", title: "Board: Lunch", startsAt: atHour(today, 12), endsAt: atHour(today, 13) },
      { mechanicProfileId: sarah.id, technicianProfileId: jordan.id, kind: "BREAK", title: "Board: Lunch", startsAt: atHour(today, 12), endsAt: atHour(today, 13) },
      { mechanicProfileId: sarah.id, jobId: ac.id, technicianProfileId: mike.id, kind: "WORK", title: "Board: AC repair", startsAt: atHour(today, 13), endsAt: atHour(today, 15) },
      { mechanicProfileId: sarah.id, jobId: engine.id, technicianProfileId: alex.id, resourceId: bay1?.id, kind: "WORK", title: "Board: Engine repair", startsAt: atHour(today, 13), endsAt: atHour(today, 16) },
      { mechanicProfileId: sarah.id, jobId: tires.id, technicianProfileId: jordan.id, resourceId: rack?.id, kind: "WORK", title: "Board: Tire service", startsAt: atHour(today, 13, 30), endsAt: atHour(today, 15) },
      { mechanicProfileId: sarah.id, jobId: follow.id, technicianProfileId: jordan.id, kind: "ADMIN", title: "Board: Customer follow-up", startsAt: atHour(today, 16), endsAt: atHour(today, 16, 30) },
      { mechanicProfileId: sarah.id, technicianProfileId: ryan.id, kind: "PTO", title: "Board: Time off", startsAt: atHour(today, 8), endsAt: atHour(today, 17) },
    ],
  });
}
