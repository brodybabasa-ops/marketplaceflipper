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

  const sarah = await prisma.mechanicProfile.findFirst({
    where: { user: { email: "sarah.chen@demo.pocketmechanic.app" } },
    include: { technicianProfiles: true, resources: true, user: true },
  });
  if (!sarah) return;
  const sarahToday = await prisma.scheduleBlock.count({
    where: { mechanicProfileId: sarah.id, startsAt: { gte: dayStart }, title: { startsWith: "Demo:" } },
  });
  if (sarahToday > 0) return;

  if (sarah.technicianProfiles.length < 2) {
    await prisma.technicianProfile.create({
      data: {
        mechanicProfileId: sarah.id,
        displayName: "Jordan Hale",
        title: "Shop technician",
        duty: "SHOP",
        specialties: ["BRAKES", "MAINTENANCE"],
      },
    });
  }
  const techs = await prisma.technicianProfile.findMany({ where: { mechanicProfileId: sarah.id, active: true } });
  const dana = techs.find((tech) => tech.displayName.includes("Dana")) ?? techs[0];
  const jordan = techs.find((tech) => tech.displayName.includes("Jordan")) ?? techs[1] ?? dana;
  const bay1 = sarah.resources.find((item) => item.name === "Bay 1") ?? sarah.resources[0];
  const rack = sarah.resources.find((item) => item.kind === "ALIGNMENT_RACK");
  const customer = await prisma.user.findUnique({ where: { email: "customer@demo.pocketmechanic.app" } });
  const vehicle = customer
    ? await prisma.vehicle.findFirst({ where: { customerId: customer.id }, include: { asset: true } })
    : null;
  if (!customer || !vehicle || !dana) return;

  async function shopJob(input: {
    problem: string;
    category: "BRAKES" | "MAINTENANCE" | "SUSPENSION" | "ENGINE";
    status: "IN_PROGRESS" | "SCHEDULED" | "AWAITING_APPROVAL" | "CHECKED_IN";
    totalCents: number;
    partsStatus?: "READY" | "DELAYED" | "ORDERED";
    waiting?: boolean;
  }) {
    const request = await prisma.serviceRequest.create({
      data: {
        customerId: customer!.id,
        vehicleId: vehicle!.id,
        assetId: vehicle!.asset?.id,
        mechanicProfileId: sarah!.id,
        status: "ACCEPTED",
        problemText: input.problem,
        category: input.category,
        zip: "84070",
        city: "Sandy",
        state: "UT",
        mobilePreferred: false,
      },
    });
    return prisma.job.create({
      data: {
        serviceRequestId: request.id,
        customerId: customer!.id,
        mechanicUserId: sarah!.userId,
        mechanicProfileId: sarah!.id,
        vehicleId: vehicle!.id,
        assetId: vehicle!.asset?.id,
        status: input.status,
        totalCents: input.totalCents,
        partsStatus: input.partsStatus ?? "UNKNOWN",
        customerWaiting: Boolean(input.waiting),
        scheduledAt: today,
        promisedReadyAt: atHour(today, 16, 30),
        technicianProfileId: dana!.id,
        events: { create: [{ status: input.status, note: "Demo: shop operations fixture" }] },
      },
    });
  }

  const brakes = await shopJob({
    problem: "Front brakes grind on the F-250",
    category: "BRAKES",
    status: "IN_PROGRESS",
    totalCents: 68000,
    partsStatus: "READY",
    waiting: true,
  });
  const alignment = await shopJob({
    problem: "Pulls right after tire replacement",
    category: "SUSPENSION",
    status: "SCHEDULED",
    totalCents: 12900,
    partsStatus: "READY",
  });
  await shopJob({
    problem: "Estimate waiting on Tahoe oil leak",
    category: "ENGINE",
    status: "AWAITING_APPROVAL",
    totalCents: 84000,
  });
  await shopJob({
    problem: "Centurion waiting on a delayed pump",
    category: "MAINTENANCE",
    status: "CHECKED_IN",
    totalCents: 42000,
    partsStatus: "DELAYED",
  });

  await prisma.scheduleBlock.createMany({
    data: [
      {
        mechanicProfileId: sarah.id,
        jobId: brakes.id,
        technicianProfileId: dana.id,
        resourceId: bay1?.id,
        kind: "DROP_OFF",
        title: "Demo: Customer drop-off",
        startsAt: atHour(today, 8),
        endsAt: atHour(today, 8, 15),
      },
      {
        mechanicProfileId: sarah.id,
        jobId: brakes.id,
        technicianProfileId: dana.id,
        resourceId: bay1?.id,
        kind: "WORK",
        title: "Demo: Brake job",
        startsAt: atHour(today, 9, 30),
        endsAt: atHour(today, 11, 30),
      },
      {
        mechanicProfileId: sarah.id,
        jobId: brakes.id,
        kind: "PICKUP",
        title: "Demo: Promised pickup",
        startsAt: atHour(today, 16, 30),
        endsAt: atHour(today, 16, 45),
      },
      {
        mechanicProfileId: sarah.id,
        jobId: alignment.id,
        technicianProfileId: jordan.id,
        resourceId: rack?.id,
        kind: "WORK",
        title: "Demo: Alignment",
        startsAt: atHour(today, 13),
        endsAt: atHour(today, 14, 30),
      },
    ],
  });
}
