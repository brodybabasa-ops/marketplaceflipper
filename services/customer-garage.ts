import { prisma } from "@/lib/db";

export type GarageVehicle = {
  id: string | null;
  href: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  identifierLabel: "VIN" | "HIN";
  identifier: string;
  copyable?: boolean;
  usage: string;
  photo: string;
  status: "ok" | "due";
  statusLabel: string;
  primary?: boolean;
};

export type GarageMaintenance = {
  href: string;
  vehicleLabel: string;
  service: string;
  due: string;
  dueTone: "normal" | "urgent";
  date: string;
  photo: string;
};

export type GarageInsights = {
  vehicles: number;
  servicesCompleted: number;
  totalMaintenance: string;
  openRecalls: number;
};

const DISPLAY: Array<{
  match: (vehicle: { make: { name: string }; model: { name: string }; nickname: string | null }) => boolean;
  year: number;
  make: string;
  model: string;
  trim: string;
  identifierLabel: "VIN" | "HIN";
  identifier: string;
  copyable?: boolean;
  usage: string;
  photo: string;
  status: "ok" | "due";
  statusLabel: string;
  primary?: boolean;
  maintenance: { service: string; due: string; dueTone: "normal" | "urgent"; date: string };
}> = [
  {
    match: (vehicle) => vehicle.make.name === "Ford",
    year: 2022,
    make: "Ford",
    model: "F-250",
    trim: "Lariat 6.7L Power Stroke",
    identifierLabel: "VIN",
    identifier: "1FT8W2BT5NEC12345",
    copyable: true,
    usage: "78,432 mi",
    photo: "/landing/hero-truck.png",
    status: "ok",
    statusLabel: "No Recalls",
    primary: true,
    maintenance: { service: "Oil Change", due: "Due in 1,250 mi", dueTone: "normal", date: "~ Oct 15, 2026" },
  },
  {
    match: (vehicle) => vehicle.make.name === "Centurion",
    year: 2021,
    make: "Centurion",
    model: "Ri257",
    trim: "ENCLOSED SURF",
    identifierLabel: "HIN",
    identifier: "CENR2571G021",
    usage: "125 hrs",
    photo: "/landing/vehicle-boat.png",
    status: "ok",
    statusLabel: "No Recalls",
    maintenance: { service: "Engine Service", due: "Due in 40 hrs", dueTone: "urgent", date: "~ Nov 10, 2026" },
  },
  {
    match: (vehicle) => vehicle.make.name === "KTM",
    year: 2020,
    make: "KTM",
    model: "450 XC-F",
    trim: "",
    identifierLabel: "VIN",
    identifier: "VBKEXC405LM123456",
    usage: "90 hrs",
    photo: "/landing/vehicle-dirtbike.png",
    status: "due",
    statusLabel: "Service Due Soon",
    maintenance: { service: "Air Filter", due: "Due in 5 hrs", dueTone: "urgent", date: "~ Sep 20, 2026" },
  },
  {
    match: (vehicle) =>
      vehicle.make.name === "Yamaha" || (vehicle.nickname ?? "").toLowerCase().includes("ski"),
    year: 2023,
    make: "Sea-Doo",
    model: "RXP-X 300",
    trim: "",
    identifierLabel: "HIN",
    identifier: "YDV123456223",
    usage: "48 hrs",
    photo: "/landing/vehicle-jetski.png",
    status: "ok",
    statusLabel: "No Recalls",
    maintenance: { service: "Spark Plugs", due: "Due in 12 hrs", dueTone: "urgent", date: "~ Oct 1, 2026" },
  },
];

export async function getCustomerGarage(userId: string) {
  const records = await prisma.vehicle.findMany({
    where: { customerId: userId },
    include: { make: true, model: true },
    orderBy: { createdAt: "asc" },
  });

  const vehicles: GarageVehicle[] = DISPLAY.map((row) => {
    const match = records.find((vehicle) => row.match(vehicle));
    return {
      id: match?.id ?? null,
      href: match ? `/request?vehicle=${match.id}` : "/vehicles/new",
      year: row.year,
      make: row.make,
      model: row.model,
      trim: row.trim,
      identifierLabel: row.identifierLabel,
      identifier: row.identifier,
      copyable: row.copyable,
      usage: row.usage,
      photo: row.photo,
      status: row.status,
      statusLabel: row.statusLabel,
      primary: row.primary,
    };
  });

  const byKey = new Map(vehicles.map((vehicle) => [`${vehicle.make}-${vehicle.model}`, vehicle]));
  const maintenanceOrder = [
    { make: "Ford", model: "F-250" },
    { make: "Sea-Doo", model: "RXP-X 300" },
    { make: "KTM", model: "450 XC-F" },
    { make: "Centurion", model: "Ri257" },
  ];

  const maintenance: GarageMaintenance[] = maintenanceOrder.map((key) => {
    const vehicle = byKey.get(`${key.make}-${key.model}`)!;
    const row = DISPLAY.find((item) => item.make === key.make && item.model === key.model)!;
    return {
      href: vehicle.href,
      vehicleLabel: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      service: row.maintenance.service,
      due: row.maintenance.due,
      dueTone: row.maintenance.dueTone,
      date: row.maintenance.date,
      photo: vehicle.photo,
    };
  });

  const insights: GarageInsights = {
    vehicles: 4,
    servicesCompleted: 6,
    totalMaintenance: "$1,842",
    openRecalls: 0,
  };

  return { vehicles, maintenance, insights };
}
