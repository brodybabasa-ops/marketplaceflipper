import { PrismaClient, type DayOfWeek, type JobStatus, type ServiceCategory, type ServiceMode, type VerificationLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RANKING_WEIGHTS } from "../lib/constants";
import { REVENUE_STREAMS } from "../lib/catalog";
import { computeMechanicScore } from "../services/ranking";
import { classifyNeed } from "../services/problem-classifier";
import { attachProviderIndustries, createAutomotiveAsset, createGenericAsset, seedIndustryCatalog } from "../services/assets";
import { seedVisionLayer } from "./vision-seed";

const prisma = new PrismaClient();

const PASSWORD = "Demo1234!";

const ZIPS = [
  { zip: "84101", city: "Salt Lake City", state: "Utah", stateCode: "UT", latitude: 40.7608, longitude: -111.891 },
  { zip: "84102", city: "Salt Lake City", state: "Utah", stateCode: "UT", latitude: 40.76, longitude: -111.858 },
  { zip: "84047", city: "Midvale", state: "Utah", stateCode: "UT", latitude: 40.6111, longitude: -111.8999 },
  { zip: "84070", city: "Sandy", state: "Utah", stateCode: "UT", latitude: 40.5649, longitude: -111.838 },
  { zip: "84094", city: "Sandy", state: "Utah", stateCode: "UT", latitude: 40.572, longitude: -111.86 },
  { zip: "84095", city: "South Jordan", state: "Utah", stateCode: "UT", latitude: 40.5622, longitude: -111.9297 },
  { zip: "84009", city: "South Jordan", state: "Utah", stateCode: "UT", latitude: 40.55, longitude: -112.0 },
  { zip: "84084", city: "West Jordan", state: "Utah", stateCode: "UT", latitude: 40.6097, longitude: -111.9391 },
  { zip: "84081", city: "West Jordan", state: "Utah", stateCode: "UT", latitude: 40.604, longitude: -112.0 },
  { zip: "84020", city: "Draper", state: "Utah", stateCode: "UT", latitude: 40.5247, longitude: -111.8638 },
  { zip: "84043", city: "Lehi", state: "Utah", stateCode: "UT", latitude: 40.3916, longitude: -111.8508 },
  { zip: "84003", city: "American Fork", state: "Utah", stateCode: "UT", latitude: 40.3769, longitude: -111.7958 },
  { zip: "84604", city: "Provo", state: "Utah", stateCode: "UT", latitude: 40.2698, longitude: -111.6946 },
  { zip: "84606", city: "Provo", state: "Utah", stateCode: "UT", latitude: 40.2338, longitude: -111.6585 },
  { zip: "84057", city: "Orem", state: "Utah", stateCode: "UT", latitude: 40.2969, longitude: -111.6946 },
  { zip: "84401", city: "Ogden", state: "Utah", stateCode: "UT", latitude: 41.223, longitude: -111.9738 },
  { zip: "84403", city: "Ogden", state: "Utah", stateCode: "UT", latitude: 41.192, longitude: -111.944 },
  { zip: "84041", city: "Layton", state: "Utah", stateCode: "UT", latitude: 41.0602, longitude: -111.9711 },
  { zip: "84037", city: "Kaysville", state: "Utah", stateCode: "UT", latitude: 41.0352, longitude: -111.9386 },
  { zip: "84098", city: "Park City", state: "Utah", stateCode: "UT", latitude: 40.6461, longitude: -111.498 },
  { zip: "84060", city: "Park City", state: "Utah", stateCode: "UT", latitude: 40.6617, longitude: -111.499 },
  { zip: "84092", city: "Sandy", state: "Utah", stateCode: "UT", latitude: 40.56, longitude: -111.79 },
];

const MAKES: { name: string; models: string[] }[] = [
  { name: "Ford", models: ["F-150", "F-250", "F-350", "Ranger", "Explorer", "Escape", "Bronco"] },
  { name: "Chevrolet", models: ["Silverado 1500", "Silverado 2500HD", "Colorado", "Tahoe", "Equinox"] },
  { name: "GMC", models: ["Sierra 1500", "Sierra 2500HD", "Canyon", "Yukon"] },
  { name: "Ram", models: ["1500", "2500", "3500"] },
  { name: "Toyota", models: ["Camry", "RAV4", "Tacoma", "Tundra", "4Runner"] },
  { name: "Honda", models: ["Civic", "Accord", "CR-V", "Pilot"] },
  { name: "Jeep", models: ["Wrangler", "Grand Cherokee", "Gladiator"] },
  { name: "Subaru", models: ["Outback", "Forester", "Crosstrek"] },
  { name: "BMW", models: ["3 Series", "X3", "X5"] },
  { name: "Nissan", models: ["Altima", "Rogue", "Frontier"] },
];

type MechanicSeed = {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  slug: string;
  bio: string;
  years: number;
  mode: ServiceMode;
  city: string;
  zip: string;
  lat: number;
  lng: number;
  radius: number;
  diagnostic: number;
  labor: number;
  mobile: number;
  level: VerificationLevel;
  specialties: ServiceCategory[];
  makes: string[];
  response: number;
  onTime: number;
  accuracy: number;
  cancel: number;
  days: DayOfWeek[];
  certs: { name: string; issuer: string; verified: boolean }[];
};

const MECHANICS: MechanicSeed[] = [
  {
    firstName: "Mike",
    lastName: "Rodriguez",
    email: "mechanic@demo.pocketmechanic.app",
    businessName: "Mike's Mobile Auto",
    slug: "mikes-mobile-auto",
    bio: "10 years specializing in Ford, GM, and diesel vehicles. I come to you with a fully stocked van and treat every truck like I’d treat my own.",
    years: 10,
    mode: "MOBILE",
    city: "Salt Lake City",
    zip: "84101",
    lat: 40.7608,
    lng: -111.891,
    radius: 30,
    diagnostic: 9500,
    labor: 11000,
    mobile: 2500,
    level: "POCKET_VERIFIED",
    specialties: ["BRAKES", "DIESEL" as never, "ELECTRICAL", "DIAGNOSTICS", "SUSPENSION"],
    makes: ["Ford", "Chevrolet", "GMC"],
    response: 12,
    onTime: 98,
    accuracy: 96,
    cancel: 1.2,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [
      { name: "ASE Master Automobile Technician", issuer: "ASE", verified: true },
      { name: "Ford Diesel Specialist", issuer: "Ford", verified: true },
    ],
  },
  {
    firstName: "Sarah",
    lastName: "Chen",
    email: "sarah.chen@demo.pocketmechanic.app",
    businessName: "Precision Auto Care",
    slug: "precision-auto-care",
    bio: "Shop-based diagnostics and European plus Japanese vehicles. Clear estimates, no surprises, and a loaner when you need one.",
    years: 14,
    mode: "SHOP",
    city: "Sandy",
    zip: "84070",
    lat: 40.5649,
    lng: -111.838,
    radius: 20,
    diagnostic: 12000,
    labor: 12500,
    mobile: 0,
    level: "PROFESSIONAL_VERIFIED",
    specialties: ["ENGINE", "ELECTRICAL", "DIAGNOSTICS", "BRAKES"],
    makes: ["Toyota", "Honda", "BMW", "Subaru"],
    response: 28,
    onTime: 95,
    accuracy: 94,
    cancel: 2.1,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }],
  },
  {
    firstName: "James",
    lastName: "Okonkwo",
    email: "james.okonkwo@demo.pocketmechanic.app",
    businessName: "Wasatch Diesel Works",
    slug: "wasatch-diesel-works",
    bio: "Heavy-duty and diesel specialist. Power Stroke, Duramax, and Cummins diagnostics, emissions, and drivability.",
    years: 16,
    mode: "BOTH",
    city: "West Jordan",
    zip: "84084",
    lat: 40.6097,
    lng: -111.9391,
    radius: 40,
    diagnostic: 14000,
    labor: 13500,
    mobile: 4500,
    level: "INSURED",
    specialties: ["ENGINE", "DIAGNOSTICS", "ELECTRICAL", "COOLING"],
    makes: ["Ford", "Chevrolet", "Ram", "GMC"],
    response: 40,
    onTime: 93,
    accuracy: 92,
    cancel: 3,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [
      { name: "ASE Medium-Heavy Truck", issuer: "ASE", verified: true },
      { name: "Liability Insurance on file", issuer: "Hartford", verified: true },
    ],
  },
  {
    firstName: "Priya",
    lastName: "Desai",
    email: "priya.desai@demo.pocketmechanic.app",
    businessName: "Desai Mobile Repair",
    slug: "desai-mobile-repair",
    bio: "Mobile technician focused on commuter cars and crossovers. Fast brake, battery, and maintenance work in your driveway.",
    years: 7,
    mode: "MOBILE",
    city: "South Jordan",
    zip: "84095",
    lat: 40.5622,
    lng: -111.9297,
    radius: 25,
    diagnostic: 8900,
    labor: 9900,
    mobile: 2000,
    level: "PROFILE_VERIFIED",
    specialties: ["BRAKES", "MAINTENANCE", "CHARGING", "TIRES"],
    makes: ["Honda", "Toyota", "Nissan", "Subaru"],
    response: 18,
    onTime: 97,
    accuracy: 95,
    cancel: 1.5,
    days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "ASE Brakes", issuer: "ASE", verified: true }],
  },
  {
    firstName: "Chris",
    lastName: "Larsen",
    email: "chris.larsen@demo.pocketmechanic.app",
    businessName: "Larsen Family Garage",
    slug: "larsen-family-garage",
    bio: "Neighborhood shop in Draper. Honest maintenance, brakes, and cooling work with same-week availability.",
    years: 22,
    mode: "SHOP",
    city: "Draper",
    zip: "84020",
    lat: 40.5247,
    lng: -111.8638,
    radius: 18,
    diagnostic: 8500,
    labor: 10500,
    mobile: 0,
    level: "INSURED",
    specialties: ["MAINTENANCE", "BRAKES", "COOLING", "SUSPENSION"],
    makes: ["Ford", "Chevrolet", "Toyota", "Jeep"],
    response: 35,
    onTime: 91,
    accuracy: 90,
    cancel: 4,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }],
  },
];

const EXTRA_MECHANICS: Omit<MechanicSeed, "email" | "slug">[] = [
  { firstName: "Nina", lastName: "Alvarez", businessName: "Alvarez Auto Electric", bio: "Starting, charging, and electrical diagnostics for cars and light trucks.", years: 11, mode: "MOBILE", city: "Midvale", zip: "84047", lat: 40.6111, lng: -111.8999, radius: 22, diagnostic: 9900, labor: 11500, mobile: 2500, level: "PROFESSIONAL_VERIFIED", specialties: ["ELECTRICAL", "STARTING", "CHARGING", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram"], response: 22, onTime: 96, accuracy: 93, cancel: 2, days: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Electrical", issuer: "ASE", verified: true }] },
  { firstName: "Owen", lastName: "Brooks", businessName: "Brooks Brake Co.", bio: "Brake specialist. Quiet stops, no unnecessary parts, and a written warranty on every job.", years: 9, mode: "BOTH", city: "Lehi", zip: "84043", lat: 40.3916, lng: -111.8508, radius: 28, diagnostic: 7900, labor: 9800, mobile: 3000, level: "PROFILE_VERIFIED", specialties: ["BRAKES", "SUSPENSION", "TIRES"], makes: ["Ford", "Honda", "Toyota"], response: 16, onTime: 94, accuracy: 97, cancel: 1.8, days: ["MONDAY", "TUESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Brakes", issuer: "ASE", verified: true }] },
  { firstName: "Maya", lastName: "Haddad", businessName: "Haddad Import Service", bio: "BMW, Subaru, and Honda specialist with factory-level scan tools.", years: 13, mode: "SHOP", city: "Salt Lake City", zip: "84102", lat: 40.76, lng: -111.858, radius: 16, diagnostic: 13500, labor: 14000, mobile: 0, level: "PROFESSIONAL_VERIFIED", specialties: ["ENGINE", "ELECTRICAL", "DIAGNOSTICS", "COOLING"], makes: ["BMW", "Subaru", "Honda"], response: 45, onTime: 92, accuracy: 95, cancel: 2.4, days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "BMW Specialist", issuer: "Independent", verified: false }] },
  { firstName: "Derek", lastName: "Nguyen", businessName: "Nguyen Mobile Mechanic", bio: "Evenings and weekends. Great for people who cannot leave a car at a shop.", years: 6, mode: "MOBILE", city: "Orem", zip: "84057", lat: 40.2969, lng: -111.6946, radius: 30, diagnostic: 7500, labor: 8900, mobile: 1500, level: "PROFILE_VERIFIED", specialties: ["MAINTENANCE", "BRAKES", "STARTING", "DIAGNOSTICS"], makes: ["Honda", "Toyota", "Nissan"], response: 14, onTime: 90, accuracy: 88, cancel: 5, days: ["WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], certs: [] },
  { firstName: "Hannah", lastName: "Peters", businessName: "Peak Suspension", bio: "Steering, suspension, and alignment for mountain driving and towing setups.", years: 12, mode: "SHOP", city: "Park City", zip: "84098", lat: 40.6461, lng: -111.498, radius: 25, diagnostic: 11000, labor: 13000, mobile: 0, level: "INSURED", specialties: ["SUSPENSION", "STEERING", "TIRES", "BRAKES"], makes: ["Jeep", "Ford", "Subaru", "Toyota"], response: 50, onTime: 94, accuracy: 91, cancel: 2.8, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Suspension", issuer: "ASE", verified: true }] },
  { firstName: "Luis", lastName: "Morales", businessName: "Morales Transmission", bio: "Transmission diagnostics and rebuilds for trucks and SUVs.", years: 18, mode: "SHOP", city: "Ogden", zip: "84401", lat: 41.223, lng: -111.9738, radius: 35, diagnostic: 12500, labor: 12800, mobile: 0, level: "PROFESSIONAL_VERIFIED", specialties: ["TRANSMISSION", "ENGINE", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram", "GMC"], response: 60, onTime: 89, accuracy: 90, cancel: 3.5, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Transmission", issuer: "ASE", verified: true }] },
  { firstName: "Ava", lastName: "Kim", businessName: "Kim Cool Air", bio: "A/C, heating, and cooling system specialist. Same-week recharge and leak repair.", years: 8, mode: "MOBILE", city: "Layton", zip: "84041", lat: 41.0602, lng: -111.9711, radius: 32, diagnostic: 8000, labor: 9500, mobile: 2200, level: "PROFILE_VERIFIED", specialties: ["AC_HEATING", "COOLING", "MAINTENANCE"], makes: ["Honda", "Toyota", "Ford", "Chevrolet"], response: 20, onTime: 96, accuracy: 93, cancel: 1.9, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "EPA 609", issuer: "EPA", verified: true }] },
  { firstName: "Noah", lastName: "Whitaker", businessName: "Whitaker Jeep Garage", bio: "Jeep and off-road focused shop. Steering, lockers, and trail damage repair.", years: 15, mode: "SHOP", city: "American Fork", zip: "84003", lat: 40.3769, lng: -111.7958, radius: 24, diagnostic: 10000, labor: 11800, mobile: 0, level: "INSURED", specialties: ["SUSPENSION", "STEERING", "ELECTRICAL", "BRAKES"], makes: ["Jeep", "Ford", "Ram"], response: 33, onTime: 92, accuracy: 91, cancel: 2.2, days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Elena", lastName: "Voss", businessName: "Voss Diagnostics", bio: "Check-engine lights, drivability, and hard-to-find electrical issues.", years: 19, mode: "BOTH", city: "Salt Lake City", zip: "84101", lat: 40.758, lng: -111.888, radius: 20, diagnostic: 15000, labor: 14500, mobile: 3500, level: "POCKET_VERIFIED", specialties: ["DIAGNOSTICS", "ELECTRICAL", "ENGINE", "STARTING"], makes: ["BMW", "Ford", "Toyota", "Subaru"], response: 25, onTime: 97, accuracy: 98, cancel: 0.8, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"], certs: [{ name: "ASE Master", issuer: "ASE", verified: true }] },
  { firstName: "Marcus", lastName: "Hale", businessName: "Hale Tire & Service", bio: "Tires, alignments, and quick maintenance without the dealership wait.", years: 5, mode: "SHOP", city: "West Jordan", zip: "84081", lat: 40.604, lng: -112.0, radius: 15, diagnostic: 6900, labor: 8500, mobile: 0, level: "UNVERIFIED", specialties: ["TIRES", "MAINTENANCE", "BRAKES"], makes: ["Ford", "Honda", "Nissan", "Toyota"], response: 55, onTime: 88, accuracy: 86, cancel: 6, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [] },
  { firstName: "Sofia", lastName: "Reyes", businessName: "Reyes Mobile Fleet", bio: "Work trucks and small fleets. I keep your vehicles moving with scheduled mobile service.", years: 11, mode: "MOBILE", city: "Provo", zip: "84604", lat: 40.2698, lng: -111.6946, radius: 35, diagnostic: 10500, labor: 11200, mobile: 2800, level: "INSURED", specialties: ["MAINTENANCE", "BRAKES", "ELECTRICAL", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram", "GMC"], response: 19, onTime: 95, accuracy: 94, cancel: 1.4, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Ben", lastName: "Iverson", businessName: "Iverson Auto", bio: "General repair with a calm explanation of what actually needs to be done.", years: 20, mode: "SHOP", city: "Kaysville", zip: "84037", lat: 41.0352, lng: -111.9386, radius: 22, diagnostic: 9000, labor: 10800, mobile: 0, level: "PROFILE_VERIFIED", specialties: ["ENGINE", "BRAKES", "COOLING", "MAINTENANCE"], makes: ["Chevrolet", "GMC", "Ford", "Toyota"], response: 42, onTime: 90, accuracy: 89, cancel: 3.1, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Grace", lastName: "Patel", businessName: "Patel Hybrid Care", bio: "Hybrids and late-model electronics. I explain warning lights in plain language.", years: 8, mode: "MOBILE", city: "Sandy", zip: "84094", lat: 40.572, lng: -111.86, radius: 20, diagnostic: 11500, labor: 12000, mobile: 2500, level: "PROFESSIONAL_VERIFIED", specialties: ["ELECTRICAL", "DIAGNOSTICS", "CHARGING", "ENGINE"], makes: ["Toyota", "Honda", "Ford"], response: 21, onTime: 96, accuracy: 95, cancel: 1.1, days: ["MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "Toyota Hybrid Training", issuer: "Toyota", verified: true }] },
  { firstName: "Calvin", lastName: "Ortiz", businessName: "Ortiz Starting & Charging", bio: "Batteries, starters, and alternators done the same day when parts are in stock.", years: 9, mode: "MOBILE", city: "Ogden", zip: "84403", lat: 41.192, lng: -111.944, radius: 28, diagnostic: 7000, labor: 9200, mobile: 1800, level: "PROFILE_VERIFIED", specialties: ["STARTING", "CHARGING", "ELECTRICAL"], makes: ["Ford", "Chevrolet", "Nissan", "Honda"], response: 11, onTime: 97, accuracy: 94, cancel: 1.6, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Electrical", issuer: "ASE", verified: true }] },
  { firstName: "Dana", lastName: "Whitlock", businessName: "Great Salt Lake Marine", bio: "Wake boats, sterndrives, and outboards. Impellers, ballast, and annuals. I do not take automotive work.", years: 14, mode: "SHOP", city: "Salt Lake City", zip: "84101", lat: 40.7608, lng: -111.891, radius: 40, diagnostic: 12500, labor: 13000, mobile: 0, level: "PROFESSIONAL_VERIFIED", specialties: ["ENGINE", "ELECTRICAL", "MAINTENANCE", "DIAGNOSTICS"], makes: [], response: 24, onTime: 95, accuracy: 94, cancel: 1.5, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "Mercury Certified", issuer: "Mercury", verified: true }] },
  { firstName: "Riley", lastName: "McCabe", businessName: "McCabe Truck Repair", bio: "F-250s, Silverados, and towing setups. I work on the trucks people actually use.", years: 13, mode: "BOTH", city: "South Jordan", zip: "84009", lat: 40.55, lng: -112.0, radius: 30, diagnostic: 11000, labor: 12200, mobile: 3200, level: "POCKET_VERIFIED", specialties: ["BRAKES", "SUSPENSION", "ENGINE", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "GMC", "Ram"], response: 17, onTime: 96, accuracy: 95, cancel: 1.3, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Master", issuer: "ASE", verified: true }, { name: "Garage Keepers Insurance", issuer: "Travelers", verified: true }] },
];

const FIRST_NAMES = ["Alex", "Jordan", "Taylor", "Casey", "Morgan", "Riley", "Quinn", "Avery", "Cameron", "Drew", "Skyler", "Jamie", "Reese", "Parker", "Hayden", "Rowan", "Finley", "Emerson", "Sage", "Blake", "Dana", "Kerry", "Shawn", "Terry", "Pat"];
const LAST_NAMES = ["Harper", "Nguyen", "Patel", "Brooks", "Diaz", "Walsh", "Singh", "Coleman", "Foster", "Bennett", "Hayes", "Reed", "Owens", "Bishop", "Grant", "Barrett", "Holt", "Nash", "Bowen", "Pratt", "Kline", "Moss", "Becker", "Sloan", "Parks"];

const PROBLEMS = [
  { text: "Truck shakes when braking.", repair: "Front wheel bearing replacement", category: "BRAKES" as ServiceCategory, price: 48500 },
  { text: "Grinding noise when I turn.", repair: "Brake pad and rotor service", category: "BRAKES" as ServiceCategory, price: 42000 },
  { text: "Check engine light came on this morning.", repair: "Diagnostic and oxygen sensor", category: "DIAGNOSTICS" as ServiceCategory, price: 28000 },
  { text: "It cranks but doesn't fire.", repair: "Fuel pump replacement", category: "STARTING" as ServiceCategory, price: 64000 },
  { text: "A/C blows warm on the highway.", repair: "A/C recharge and leak repair", category: "AC_HEATING" as ServiceCategory, price: 31000 },
  { text: "Oil change and inspection.", repair: "Oil service", category: "MAINTENANCE" as ServiceCategory, price: 12000 },
  { text: "Battery keeps dying overnight.", repair: "Alternator replacement", category: "CHARGING" as ServiceCategory, price: 39000 },
  { text: "Clunk from the front over speed bumps.", repair: "Sway bar link replacement", category: "SUSPENSION" as ServiceCategory, price: 21000 },
  { text: "Overheating in stop-and-go traffic.", repair: "Thermostat and coolant service", category: "COOLING" as ServiceCategory, price: 26000 },
  { text: "Delayed shifting when cold.", repair: "Transmission fluid service", category: "TRANSMISSION" as ServiceCategory, price: 34000 },
];

const REVIEW_BODIES = [
  "Diagnosed the issue quickly and had it fixed the next morning.",
  "Showed me the worn part before replacing it. Fair price.",
  "Came to my driveway and explained everything in plain English.",
  "On time, tidy work, and a clear invoice.",
  "Would use again. No pressure to buy extra work.",
  "Fixed the noise other shops could not find.",
  "Professional from the first message to the last photo of the repair.",
  "The estimate matched the final bill. That matters.",
  "Patient with my questions. I do not know cars and never felt talked down to.",
  "Solid work on a diesel truck. Knew the platform.",
];

function dieselSafeSpecialties(list: ServiceCategory[]): ServiceCategory[] {
  return list.map((item) => (String(item) === "DIESEL" ? "ENGINE" : item));
}

async function main() {
  await prisma.$transaction([
    prisma.repairAuthorizationDecision.deleteMany(),
    prisma.repairAuthorization.deleteMany(),
    prisma.recommendedWork.deleteMany(),
    prisma.inspectionFinding.deleteMany(),
    prisma.vehicleInspection.deleteMany(),
    prisma.scheduleBlock.deleteMany(),
    prisma.technicianSkill.deleteMany(),
    prisma.repairOutcome.deleteMany(),
    prisma.repairWarranty.deleteMany(),
    prisma.partsQuote.deleteMany(),
    prisma.waitlistEntry.deleteMany(),
    prisma.providerResource.deleteMany(),
    prisma.providerLocation.deleteMany(),
    prisma.technicianProfile.deleteMany(),
    prisma.assetDocument.deleteMany(),
    prisma.assetShare.deleteMany(),
    prisma.assetPreferredProvider.deleteMany(),
    prisma.assetTransfer.deleteMany(),
    prisma.maintenanceItem.deleteMany(),
    prisma.downtimeEvent.deleteMany(),
    prisma.fleetAssignment.deleteMany(),
    prisma.fleetMembership.deleteMany(),
    prisma.fleetAccount.deleteMany(),
    prisma.walletLedger.deleteMany(),
    prisma.walletAccount.deleteMany(),
    prisma.membership.deleteMany(),
    prisma.roadsideRequest.deleteMany(),
    prisma.verificationContent.deleteMany(),
    prisma.hqAlert.deleteMany(),
    prisma.priceBenchmark.deleteMany(),
    prisma.verificationEvent.deleteMany(),
    prisma.verificationChecklistItem.deleteMany(),
    prisma.verificationInspection.deleteMany(),
    prisma.verificationApplication.deleteMany(),
    prisma.auditEvent.deleteMany(),
    prisma.supportTicket.deleteMany(),
    prisma.message.deleteMany(),
    prisma.messageThread.deleteMany(),
    prisma.estimateApproval.deleteMany(),
    prisma.estimateLineItem.deleteMany(),
    prisma.repairGroup.deleteMany(),
    prisma.estimate.deleteMany(),
    prisma.jobEvent.deleteMany(),
    prisma.jobPhoto.deleteMany(),
    prisma.repairRecord.deleteMany(),
    prisma.reviewResponse.deleteMany(),
    prisma.review.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.payout.deleteMany(),
    prisma.mechanicBlockedDate.deleteMany(),
    prisma.job.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.savedMechanic.deleteMany(),
    prisma.assetIdentifier.deleteMany(),
    prisma.assetComponent.deleteMany(),
    prisma.providerOffering.deleteMany(),
    prisma.providerIndustry.deleteMany(),
    prisma.financingOffer.deleteMany(),
    prisma.maintenanceRule.deleteMany(),
    prisma.inspectionTemplate.deleteMany(),
    prisma.serviceTaxonomy.deleteMany(),
    prisma.asset.deleteMany(),
    prisma.assetType.deleteMany(),
    prisma.industry.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.mechanicAvailability.deleteMany(),
    prisma.mechanicCertification.deleteMany(),
    prisma.mechanicSpecialty.deleteMany(),
    prisma.mechanicMakeExpertise.deleteMany(),
    prisma.mechanicServiceArea.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.mechanicProfile.deleteMany(),
    prisma.customerProfile.deleteMany(),
    prisma.adminAction.deleteMany(),
    prisma.fraudSignal.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.favorite.deleteMany(),
    prisma.user.deleteMany(),
    prisma.vehicleModel.deleteMany(),
    prisma.vehicleMake.deleteMany(),
    prisma.zipCode.deleteMany(),
    prisma.platformConfig.deleteMany(),
    prisma.platformStat.deleteMany(),
  ]);

  await prisma.zipCode.createMany({ data: ZIPS });
  await seedIndustryCatalog();

  const makeRecords = [];
  for (const make of MAKES) {
    const created = await prisma.vehicleMake.create({
      data: {
        name: make.name,
        slug: make.name.toLowerCase().replace(/\s+/g, "-"),
        models: { create: make.models.map((model) => ({ name: model, slug: model.toLowerCase().replace(/\s+/g, "-") })) },
      },
      include: { models: true },
    });
    makeRecords.push(created);
  }
  const makeByName = Object.fromEntries(makeRecords.map((make) => [make.name, make]));

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@demo.pocketmechanic.app",
      passwordHash,
      role: "ADMIN",
      firstName: "Jordan",
      lastName: "Hale",
    },
  });

  const inspector = await prisma.user.create({
    data: {
      email: "inspector@demo.pocketmechanic.app",
      passwordHash,
      role: "INSPECTOR",
      firstName: "Riley",
      lastName: "Brooks",
    },
  });
  await prisma.user.create({
    data: {
      email: "support@demo.pocketmechanic.app",
      passwordHash,
      role: "SUPPORT",
      firstName: "Sam",
      lastName: "Nguyen",
    },
  });
  await prisma.user.create({
    data: {
      email: "finance@demo.pocketmechanic.app",
      passwordHash,
      role: "FINANCE",
      firstName: "Casey",
      lastName: "Ortiz",
    },
  });

  const customers = [];
  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const email = i === 0 ? "customer@demo.pocketmechanic.app" : `customer${i + 1}@demo.pocketmechanic.app`;
    const zip = ZIPS[i % ZIPS.length];
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "CUSTOMER",
        firstName: i === 0 ? "Alex" : firstName,
        lastName: i === 0 ? "Harper" : lastName,
        phone: i === 0 ? "+18015550100" : undefined,
        emailNotifications: true,
        smsNotifications: i === 0,
        customerProfile: {
          create: { city: zip.city, state: zip.stateCode, zip: zip.zip, latitude: zip.latitude, longitude: zip.longitude },
        },
      },
    });
    customers.push(user);
  }

  const vehicles = [];
  const assetByVehicleId = new Map<string, string>();
  const vehiclePlan = [
    { owner: 0, year: 2020, make: "Ford", model: "F-250", trim: "Lariat", engine: "6.7 Power Stroke", drivetrain: "4x4", mileage: 87000, nickname: "The truck" },
    { owner: 0, year: 2018, make: "Honda", model: "CR-V", trim: "EX", engine: "1.5T", drivetrain: "AWD", mileage: 64000, nickname: "Daily" },
    { owner: 1, year: 2022, make: "Toyota", model: "Tacoma", trim: "TRD", engine: "3.5 V6", drivetrain: "4x4", mileage: 31000 },
    { owner: 2, year: 2019, make: "Jeep", model: "Wrangler", trim: "Sahara", engine: "3.6 V6", drivetrain: "4x4", mileage: 54000 },
    { owner: 3, year: 2021, make: "Subaru", model: "Outback", trim: "Limited", engine: "2.5", drivetrain: "AWD", mileage: 28000 },
    { owner: 4, year: 2017, make: "Chevrolet", model: "Silverado 1500", trim: "LT", engine: "5.3 V8", drivetrain: "4x4", mileage: 102000 },
    { owner: 5, year: 2023, make: "Ford", model: "F-150", trim: "XLT", engine: "3.5 EcoBoost", drivetrain: "4x4", mileage: 18000 },
    { owner: 6, year: 2016, make: "BMW", model: "3 Series", trim: "330i", engine: "2.0T", drivetrain: "AWD", mileage: 78000 },
    { owner: 7, year: 2020, make: "Ram", model: "2500", trim: "Laramie", engine: "6.7 Cummins", drivetrain: "4x4", mileage: 61000 },
    { owner: 8, year: 2015, make: "Toyota", model: "Camry", trim: "SE", engine: "2.5", drivetrain: "FWD", mileage: 119000 },
  ];

  for (let i = 0; i < 30; i++) {
    const plan = vehiclePlan[i] ?? {
      owner: (i % 40) + 8,
      year: 2014 + (i % 12),
      make: MAKES[i % MAKES.length].name,
      model: MAKES[i % MAKES.length].models[i % MAKES[i % MAKES.length].models.length],
      mileage: 20000 + i * 3700,
    };
    const make = makeByName[plan.make];
    const model = make.models.find((item) => item.name === plan.model) ?? make.models[0];
    const vehicle = await prisma.vehicle.create({
      data: {
        customerId: customers[Math.min(plan.owner, customers.length - 1)].id,
        year: plan.year,
        makeId: make.id,
        modelId: model.id,
        trim: "trim" in plan ? plan.trim : undefined,
        engine: "engine" in plan ? plan.engine : undefined,
        drivetrain: "drivetrain" in plan ? plan.drivetrain : undefined,
        mileage: plan.mileage,
        nickname: "nickname" in plan ? plan.nickname : undefined,
      },
    });
    vehicles.push(vehicle);
    const asset = await createAutomotiveAsset({
      id: vehicle.id,
      customerId: vehicle.customerId,
      year: vehicle.year,
      mileage: vehicle.mileage,
      trim: vehicle.trim,
      nickname: vehicle.nickname,
      makeName: make.name,
      modelName: model.name,
      assetTypeKey: model.name.toLowerCase().includes("f-") || model.name.toLowerCase().includes("silverado") || model.name.toLowerCase().includes("sierra") || model.name.toLowerCase().includes("ram") || model.name.toLowerCase().includes("tundra") || model.name.toLowerCase().includes("tacoma") ? "TRUCK" : "CAR",
    });
    assetByVehicleId.set(vehicle.id, asset.id);
  }

  const mechanicSeeds: MechanicSeed[] = [
    ...MECHANICS,
    ...EXTRA_MECHANICS.map((item) => ({
      ...item,
      email: `${item.firstName}.${item.lastName}@demo.pocketmechanic.app`.toLowerCase(),
      slug: item.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    })),
  ];

  const mechanicProfiles = [];
  for (const seed of mechanicSeeds) {
    const zip = ZIPS.find((item) => item.zip === seed.zip) ?? ZIPS[0];
    const user = await prisma.user.create({
      data: {
        email: seed.email,
        passwordHash,
        role: "MECHANIC",
        firstName: seed.firstName,
        lastName: seed.lastName,
        mechanicProfile: {
          create: {
            slug: seed.slug,
            businessName: seed.businessName,
            bio: seed.bio,
            yearsExperience: seed.years,
            serviceMode: seed.mode,
            shopCity: seed.city,
            shopState: "UT",
            shopZip: seed.zip,
            latitude: seed.lat,
            longitude: seed.lng,
            serviceRadiusMiles: seed.radius,
            diagnosticPriceCents: seed.diagnostic,
            laborRateCents: seed.labor,
            mobileFeeCents: seed.mobile,
            startingPriceCents: seed.diagnostic,
            verificationLevel: seed.level,
            avgResponseMinutes: seed.response,
            onTimePercentage: seed.onTime,
            estimateAccuracy: seed.accuracy,
            cancellationRate: seed.cancel,
            profileCompletePct: 100,
            onboardingStep: 13,
            verificationPipeline: "NOT_STARTED",
            operatingModel: seed.mode === "MOBILE" ? "MOBILE_ONLY" : seed.mode === "SHOP" ? "SHOP_ONLY" : "HYBRID",
            specialties: { create: dieselSafeSpecialties(seed.specialties).map((category) => ({ category })) },
            makeExpertise: {
              create: seed.makes.filter((name) => makeByName[name]).map((name) => ({ vehicleMakeId: makeByName[name].id })),
            },
            certifications: {
              create: seed.certs.map((cert) => ({
                name: cert.name,
                issuer: cert.issuer,
                verified: cert.verified,
                verifiedAt: cert.verified ? new Date("2026-03-01") : undefined,
              })),
            },
            serviceAreas: {
              create: {
                city: seed.city,
                state: "Utah",
                stateCode: "UT",
                zip: seed.zip,
                latitude: seed.lat,
                longitude: seed.lng,
                radiusMiles: seed.radius,
              },
            },
            availability: { create: seed.days.map((dayOfWeek) => ({ dayOfWeek, startTime: "08:00", endTime: "18:00" })) },
            verifications: {
              create:
                seed.level === "UNVERIFIED"
                  ? []
                  : [{ level: seed.level, status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date("2026-04-12") }],
            },
          },
        },
      },
      include: { mechanicProfile: true },
    });
    mechanicProfiles.push(user.mechanicProfile!);
  }

  for (const profile of mechanicProfiles) {
    if (profile.slug === "mikes-mobile-auto") {
      await attachProviderIndustries(profile.id, ["AUTOMOTIVE", "MARINE", "POWERSPORTS"], "AUTOMOTIVE");
    } else if (profile.slug === "great-salt-lake-marine") {
      await attachProviderIndustries(profile.id, ["MARINE"], "MARINE");
    } else {
      await attachProviderIndustries(
        profile.id,
        ["AUTOMOTIVE"],
        profile.verificationLevel === "POCKET_VERIFIED" ? "AUTOMOTIVE" : undefined,
      );
    }
  }

  await createGenericAsset({
    ownerId: customers[0].id,
    industryKey: "MARINE",
    assetTypeKey: "WAKE_BOAT",
    year: 2026,
    manufacturer: "Centurion",
    model: "Ri230",
    nickname: "The boat",
    usageValue: 428,
    usageUnit: "ENGINE_HOURS",
    identifiers: [
      { kind: "HIN", value: "CNT12345G526" },
      { kind: "ENGINE_SERIAL", value: "PCM-88221" },
    ],
    components: [
      { name: "Port engine" },
      { name: "Starboard engine" },
      { name: "Transmission" },
      { name: "V-drive" },
      { name: "Surf system" },
      { name: "Bilge system" },
      { name: "Trailer" },
      { name: "Batteries" },
    ],
  });
  await createGenericAsset({
    ownerId: customers[0].id,
    industryKey: "POWERSPORTS",
    assetTypeKey: "DIRT_BIKE",
    year: 2020,
    manufacturer: "KTM",
    model: "450",
    nickname: "The 450",
    usageValue: 91,
    usageUnit: "ENGINE_HOURS",
    identifiers: [{ kind: "VIN", value: "VBKMXA409LM123456" }],
    components: [{ name: "Engine" }, { name: "Suspension" }, { name: "Driveline" }],
  });

  const mike = mechanicProfiles[0];
  const priya = mechanicProfiles.find((profile) => profile.slug === "desai-mobile-repair");
  const activeStatuses: JobStatus[] = ["REQUESTED", "ACCEPTED", "SCHEDULED", "EN_ROUTE", "DIAGNOSING", "AWAITING_APPROVAL", "IN_PROGRESS"];
  let completed = 0;

  for (let i = 0; i < 110; i++) {
    const mechanic =
      i % 4 === 0 || i < 35
        ? mechanicProfiles[0]
        : mechanicProfiles[(i % (mechanicProfiles.length - 1)) + 1];
    const vehicle = vehicles[i % vehicles.length];
    const problem = PROBLEMS[i % PROBLEMS.length];
    const customerId = vehicle.customerId;
    const isActiveDemo = i < 8 && mechanic.id === mike.id;
    const status: JobStatus = isActiveDemo ? activeStatuses[i % activeStatuses.length] : "COMPLETED";
    const createdAt = new Date(Date.UTC(2026, (i % 8) + 1, (i % 27) + 1, 15));
    const classified = classifyNeed(problem.text, "AUTOMOTIVE");
    const request = await prisma.serviceRequest.create({
      data: {
        customerId,
        vehicleId: vehicle.id,
        assetId: assetByVehicleId.get(vehicle.id),
        industryId: (await prisma.industry.findUniqueOrThrow({ where: { key: "AUTOMOTIVE" } })).id,
        taxonomyKey: classified.taxonomyKey,
        mechanicProfileId: mechanic.id,
        status: status === "REQUESTED" ? "OPEN" : "ACCEPTED",
        problemText: problem.text,
        category: classified.category,
        zip: ZIPS[i % ZIPS.length].zip,
        city: ZIPS[i % ZIPS.length].city,
        state: "UT",
        latitude: ZIPS[i % ZIPS.length].latitude,
        longitude: ZIPS[i % ZIPS.length].longitude,
        createdAt,
      },
    });

    const mechanicUser = await prisma.user.findUniqueOrThrow({
      where: { id: (await prisma.mechanicProfile.findUniqueOrThrow({ where: { id: mechanic.id } })).userId },
    });

    const job = await prisma.job.create({
      data: {
        serviceRequestId: request.id,
        customerId,
        mechanicUserId: mechanicUser.id,
        mechanicProfileId: mechanic.id,
        vehicleId: vehicle.id,
        assetId: assetByVehicleId.get(vehicle.id),
        status,
        totalCents: problem.price,
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        scheduledAt: status === "REQUESTED" ? undefined : createdAt,
        scheduledConfirmedAt: status === "SCHEDULED" || status === "EN_ROUTE" || status === "DIAGNOSING" || status === "IN_PROGRESS" ? createdAt : undefined,
        completedAt: status === "COMPLETED" ? new Date(createdAt.getTime() + 86400000 * 2) : undefined,
        createdAt,
        events: {
          create: [{ status: "REQUESTED", createdAt }, ...(status === "REQUESTED" ? [] : [{ status, createdAt: new Date(createdAt.getTime() + 3600000) }])],
        },
      },
    });

    const estimate = await prisma.estimate.create({
      data: {
        jobId: job.id,
        mechanicId: mechanicUser.id,
        type: "PRIMARY",
        status: status === "REQUESTED" || status === "ACCEPTED" ? "SENT" : "APPROVED",
        totalCents: problem.price,
        subtotalCents: problem.price,
        sentAt: createdAt,
        lineItems: {
          create: [
            { category: "DIAGNOSTIC", description: "Diagnostic labor", quantity: 1, unitCents: 9500, totalCents: 9500 },
            { category: "LABOR", description: problem.repair, quantity: 1, unitCents: problem.price - 9500, totalCents: problem.price - 9500 },
          ],
        },
      },
    });

    if (estimate.status === "APPROVED") {
      await prisma.estimateApproval.create({
        data: { estimateId: estimate.id, userId: customerId, action: "APPROVED", createdAt: new Date(createdAt.getTime() + 7200000) },
      });
    }

    await prisma.messageThread.create({
      data: {
        customerId,
        mechanicId: mechanicUser.id,
        jobId: job.id,
        requestId: request.id,
        lastMessageAt: createdAt,
        messages: {
          create: [
            { senderId: customerId, body: problem.text, createdAt },
            { senderId: mechanicUser.id, body: "I can take a look and send a written estimate before any work starts.", createdAt: new Date(createdAt.getTime() + 1800000) },
          ],
        },
      },
    });

    if (status === "COMPLETED") {
      completed += 1;
      await prisma.repairRecord.create({
        data: {
          jobId: job.id,
          vehicleId: vehicle.id,
          title: problem.repair,
          diagnosis: problem.text,
          workPerformed: problem.repair,
          mileage: vehicle.mileage + i * 12,
          laborHours: 1.5 + (i % 3),
          warrantySummary: "12 months / 12,000 miles",
          createdAt: job.completedAt ?? createdAt,
        },
      });
      if (completed <= 100) {
        const rating = mechanic.id === mike.id ? (i % 12 === 0 ? 4 : 5) : 4 + (i % 8 === 0 ? 0 : 1);
        await prisma.review.create({
          data: {
            jobId: job.id,
            customerId,
            mechanicProfileId: mechanic.id,
            overallRating: rating,
            communicationRating: rating,
            professionalismRating: Math.min(5, rating + (i % 2)),
            pricingRating: rating,
            timelinessRating: rating,
            qualityRating: rating,
            wouldUseAgain: rating >= 4,
            body: REVIEW_BODIES[i % REVIEW_BODIES.length],
            repairSummary: problem.repair,
            priceCents: problem.price,
            createdAt: job.completedAt ?? createdAt,
          },
        });
      }
    }
  }

  for (const profile of mechanicProfiles) {
    const stats = await prisma.review.aggregate({
      where: { mechanicProfileId: profile.id },
      _avg: { overallRating: true, qualityRating: true },
      _count: true,
    });
    const completedJobs = await prisma.job.count({ where: { mechanicProfileId: profile.id, status: "COMPLETED" } });
    const repeat = await prisma.review.count({ where: { mechanicProfileId: profile.id, wouldUseAgain: true } });
    const averageRating = stats._avg.overallRating ?? 0;
    const reviewQualityScore = (stats._avg.qualityRating ?? 0) * 20;
    const customerRepeatRate = stats._count ? (repeat / stats._count) * 100 : 0;
    const mechanicScore = computeMechanicScore(
      {
        averageRating,
        completedJobsCount: completedJobs,
        onTimePercentage: profile.onTimePercentage,
        estimateAccuracy: profile.estimateAccuracy,
        customerRepeatRate,
        reviewQualityScore,
        verificationLevel: profile.verificationLevel,
        avgResponseMinutes: profile.avgResponseMinutes,
        cancellationRate: profile.cancellationRate,
      },
      DEFAULT_RANKING_WEIGHTS,
    );
    await prisma.mechanicProfile.update({
      where: { id: profile.id },
      data: {
        averageRating,
        reviewCount: stats._count,
        completedJobsCount: completedJobs,
        customerRepeatRate,
        reviewQualityScore,
        mechanicScore,
      },
    });
  }

  const mikeFresh = await prisma.mechanicProfile.findUniqueOrThrow({ where: { id: mike.id } });
  const featuredScore = computeMechanicScore(
    {
      ...mikeFresh,
      completedJobsCount: Math.max(mikeFresh.completedJobsCount, 183),
      averageRating: Math.max(mikeFresh.averageRating, 4.9),
    },
    DEFAULT_RANKING_WEIGHTS,
  );
  await prisma.mechanicProfile.update({
    where: { id: mike.id },
    data: {
      completedJobsCount: Math.max(mikeFresh.completedJobsCount, 183),
      averageRating: Math.max(mikeFresh.averageRating, 4.9),
      mechanicScore: Math.max(featuredScore, 96),
      stripeConnectAccountId: "acct_mock_mikesmobile",
      stripeChargesEnabled: true,
      isFoundingProvider: true,
      foundingNumber: 18,
      foundingApprovedAt: new Date("2026-01-15"),
      subscriptionFeeWaived: true,
      foundingProgramVersion: "founding-100-v1",
      lastVerifiedAt: new Date("2026-06-12"),
      isSelect: true,
      verificationPipeline: "VERIFIED",
      marketplaceEligible: true,
    },
  });
  if (priya) {
    await prisma.mechanicProfile.update({
      where: { id: priya.id },
      data: {
        isFoundingProvider: true,
        foundingNumber: 42,
        foundingApprovedAt: new Date("2026-02-01"),
        subscriptionFeeWaived: true,
        foundingProgramVersion: "founding-100-v1",
        verificationPipeline: "APPLICATION_RECEIVED",
      },
    });
  }

  await prisma.platformConfig.create({
    data: {
      rankingWeights: DEFAULT_RANKING_WEIGHTS,
      verificationLevels: [
        { key: "PROFILE_VERIFIED", label: "Profile verified" },
        { key: "PROFESSIONAL_VERIFIED", label: "Professional verified" },
        { key: "INSURED", label: "Insured" },
        { key: "POCKET_VERIFIED", label: "Pocket Verified" },
      ],
      commissionPercent: 3,
      marketplaceFeePercent: 3,
      processorFeePercent: 0,
      mechanicProMonthlyCents: 4900,
      selectCriteria: {
        requireVerified: true,
        minCompletedJobs: 25,
        minRating: 4.8,
        maxDisputeRate: 2,
        minCompletionRate: 95,
        maxResponseMinutes: 20,
        minRepeatCustomers: 5,
      },
      marketplaceName: "Pocket Mechanic",
      revenueStreams: [...REVENUE_STREAMS],
      verificationStandards: {
        shop: ["Facility condition", "Repair equipment", "Diagnostics", "Insurance", "Professionalism"],
        mobile: ["Service vehicle", "Tool inventory", "Diagnostics", "Insurance", "Professionalism"],
      },
    },
  });

  await prisma.platformStat.create({
    data: {
      averageRating: 4.9,
      verifiedJobsCount: 25840,
      mechanicCount: 1280,
      statesCovered: 50,
    },
  });

  await prisma.savedMechanic.create({
    data: { customerId: customers[0].id, mechanicProfileId: mike.id },
  });
  await prisma.favorite.create({
    data: { userId: customers[0].id, targetType: "mechanic", targetId: mike.id },
  });

  const commissionPercent = 3;
  const paidJobs = await prisma.job.findMany({
    where: { status: "COMPLETED", paymentStatus: "PAID" },
    include: { mechanicProfile: true },
  });
  for (const job of paidJobs) {
    const commissionCents = Math.round(job.totalCents * (commissionPercent / 100));
    const mechanicPayoutCents = job.totalCents - commissionCents;
    const intentId = `mock_pi_${job.id.replace(/-/g, "").slice(0, 12)}`;
    await prisma.payment.create({
      data: {
        jobId: job.id,
        customerId: job.customerId,
        mechanicUserId: job.mechanicUserId,
        amountCents: job.totalCents,
        commissionCents,
        mechanicPayoutCents,
        status: "PAID",
        provider: "mock",
        providerIntentId: intentId,
        createdAt: job.completedAt ?? job.createdAt,
      },
    });
    await prisma.payout.create({
      data: {
        mechanicUserId: job.mechanicUserId,
        jobId: job.id,
        amountCents: mechanicPayoutCents,
        commissionCents,
        status: "PAID",
        stripeConnectAccountId: job.mechanicProfile.stripeConnectAccountId,
        stripeTransferId: intentId,
        createdAt: job.completedAt ?? job.createdAt,
      },
    });
  }

  const alexTruck = vehicles[0];
  const alexAssetId = assetByVehicleId.get(alexTruck.id);
  const crvAssetId = assetByVehicleId.get(vehicles[1].id);
  const mikeUser = await prisma.user.findUniqueOrThrow({ where: { id: mike.userId } });
  const unpaidCreatedAt = new Date();
  unpaidCreatedAt.setDate(unpaidCreatedAt.getDate() - 2);
  const unpaidRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].id,
      vehicleId: alexTruck.id,
      assetId: alexAssetId,
      mechanicProfileId: mike.id,
      status: "ACCEPTED",
      problemText: "Squeal from the left rear brake after the last service.",
      category: "BRAKES",
      zip: "84101",
      city: "Salt Lake City",
      state: "UT",
      latitude: 40.7608,
      longitude: -111.891,
      createdAt: unpaidCreatedAt,
    },
  });
  const unpaidJob = await prisma.job.create({
    data: {
      serviceRequestId: unpaidRequest.id,
      customerId: customers[0].id,
      mechanicUserId: mikeUser.id,
      mechanicProfileId: mike.id,
      vehicleId: alexTruck.id,
      assetId: alexAssetId,
      status: "COMPLETED",
      totalCents: 36500,
      paymentStatus: "UNPAID",
      scheduledAt: unpaidCreatedAt,
      scheduledConfirmedAt: unpaidCreatedAt,
      completedAt: new Date(),
      createdAt: unpaidCreatedAt,
      events: {
        create: [
          { status: "REQUESTED", createdAt: unpaidCreatedAt },
          { status: "COMPLETED", createdAt: new Date(), note: "Work complete. Awaiting payment." },
        ],
      },
    },
  });
  await prisma.mechanicProfile.update({
    where: { id: mike.id },
    data: { completedJobsCount: { increment: 1 } },
  });
  await prisma.estimate.create({
    data: {
      jobId: unpaidJob.id,
      mechanicId: mikeUser.id,
      type: "PRIMARY",
      status: "APPROVED",
      totalCents: 36500,
      subtotalCents: 36500,
      sentAt: unpaidCreatedAt,
      lineItems: {
        create: [
          { category: "DIAGNOSTIC", description: "Diagnostic labor", quantity: 1, unitCents: 9500, totalCents: 9500 },
          { category: "LABOR", description: "Rear brake hardware service", quantity: 1, unitCents: 18000, totalCents: 18000 },
          { category: "PARTS", description: "Rear pads and hardware", quantity: 1, unitCents: 9000, totalCents: 9000 },
        ],
      },
    },
  });
  await prisma.repairRecord.create({
    data: {
      jobId: unpaidJob.id,
      vehicleId: alexTruck.id,
      assetId: alexAssetId,
      title: "Rear brake hardware service",
      diagnosis: "Squeal from the left rear brake after the last service.",
      workPerformed: "Replaced rear pads and hardware, cleaned and lubricated slides.",
      partsReplaced: "Rear pads, abutment clips",
      mileage: alexTruck.mileage + 420,
      laborHours: 1.8,
      warrantySummary: "12 months / 12,000 miles",
    },
  });
  await prisma.messageThread.create({
    data: {
      customerId: customers[0].id,
      mechanicId: mikeUser.id,
      jobId: unpaidJob.id,
      requestId: unpaidRequest.id,
      lastMessageAt: new Date(),
      messages: {
        create: [
          { senderId: customers[0].id, body: "Squeal from the left rear brake after the last service." },
          { senderId: mikeUser.id, body: "I replaced the rear hardware. Pay when you are ready — the invoice is on the job." },
        ],
      },
    },
  });
  await prisma.jobPhoto.createMany({
    data: [
      {
        jobId: unpaidJob.id,
        kind: "BEFORE",
        url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=800&q=80",
        caption: "Rear rotor before service",
      },
      {
        jobId: unpaidJob.id,
        kind: "AFTER",
        url: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80",
        caption: "Pads installed",
      },
    ],
  });

  const groupedRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].id,
      vehicleId: alexTruck.id,
      assetId: alexAssetId,
      mechanicProfileId: mike.id,
      status: "ACCEPTED",
      problemText: "My F-150 clicks when I turn left.",
      category: "SUSPENSION",
      zip: "84101",
      city: "Salt Lake City",
      state: "UT",
      latitude: 40.7608,
      longitude: -111.891,
      whenItHappens: "moving",
      startedWhen: "Last week",
      drivability: "yes",
      summary: "Customer reports a click on left turns. Matching and communication only — not a diagnosis.",
    },
  });
  const groupedJob = await prisma.job.create({
    data: {
      serviceRequestId: groupedRequest.id,
      customerId: customers[0].id,
      mechanicUserId: mikeUser.id,
      mechanicProfileId: mike.id,
      vehicleId: alexTruck.id,
      assetId: alexAssetId,
      status: "AWAITING_APPROVAL",
      totalCents: 192900,
      paymentStatus: "UNPAID",
      events: {
        create: [
          { status: "REQUESTED", note: "Customer requested service." },
          { status: "ACCEPTED", note: "Mike accepted." },
          { status: "AWAITING_APPROVAL", note: "Grouped estimate sent." },
        ],
      },
    },
  });
  const groupedEstimate = await prisma.estimate.create({
    data: {
      jobId: groupedJob.id,
      mechanicId: mikeUser.id,
      type: "PRIMARY",
      status: "SENT",
      totalCents: 192900,
      subtotalCents: 192900,
      sentAt: new Date(),
    },
  });
  const groupSeeds = [
    {
      title: "Front Brake Service",
      total: 68000,
      items: [
        { category: "PARTS" as const, description: "Front brake pads", quantity: 1, unit: 22000 },
        { category: "LABOR" as const, description: "Labor 3.5 hours", quantity: 3.5, unit: 10000 },
        { category: "SUPPLIES" as const, description: "Shop supplies", quantity: 1, unit: 11000 },
      ],
    },
    {
      title: "Four Tires",
      total: 112000,
      items: [{ category: "PARTS" as const, description: "Four tires mounted and balanced", quantity: 4, unit: 28000 }],
    },
    {
      title: "Oil Change",
      total: 12900,
      items: [{ category: "OTHER" as const, description: "Oil and filter", quantity: 1, unit: 12900 }],
    },
  ];
  for (const [index, group] of groupSeeds.entries()) {
    const created = await prisma.repairGroup.create({
      data: {
        estimateId: groupedEstimate.id,
        jobId: groupedJob.id,
        title: group.title,
        totalCents: group.total,
        sortOrder: index,
      },
    });
    await prisma.estimateLineItem.createMany({
      data: group.items.map((item) => ({
        estimateId: groupedEstimate.id,
        repairGroupId: created.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        unitCents: item.unit,
        totalCents: Math.round(item.quantity * item.unit),
      })),
    });
  }
  await prisma.messageThread.create({
    data: {
      customerId: customers[0].id,
      mechanicId: mikeUser.id,
      jobId: groupedJob.id,
      requestId: groupedRequest.id,
      messages: {
        create: [{ senderId: customers[0].id, body: "My F-150 clicks when I turn left." }],
      },
    },
  });

  await prisma.verificationApplication.create({
    data: {
      mechanicProfileId: mike.id,
      status: "VERIFIED",
      kind: "MOBILE",
      notes: "In-person evaluation completed.",
      events: {
        create: [
          { toStatus: "APPLICATION_RECEIVED", reason: "Applied for in-person evaluation." },
          { actorId: admin.id, fromStatus: "APPLICATION_RECEIVED", toStatus: "VERIFIED", reason: "Mobile inspection passed." },
        ],
      },
      inspections: {
        create: {
          mechanicProfileId: mike.id,
          inspectorId: inspector.id,
          kind: "MOBILE",
          status: "VERIFIED",
          passed: true,
          score: 94,
          completedAt: new Date("2026-06-12"),
          notes: "HQ only. Provider does not see this score.",
        },
      },
    },
  });
  if (priya) {
    await prisma.verificationApplication.create({
      data: {
        mechanicProfileId: priya.id,
        status: "APPLICATION_RECEIVED",
        kind: "MOBILE",
        events: { create: { toStatus: "APPLICATION_RECEIVED", reason: "Provider applied for in-person evaluation." } },
      },
    });
  }

  const photoJobs = await prisma.job.findMany({
    where: { customerId: customers[0].id, status: "COMPLETED", id: { not: unpaidJob.id } },
    take: 4,
  });
  for (const job of photoJobs) {
    await prisma.jobPhoto.createMany({
      data: [
        {
          jobId: job.id,
          kind: "BEFORE",
          url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80",
          caption: "Before photos",
        },
        {
          jobId: job.id,
          kind: "AFTER",
          url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80",
          caption: "After the repair",
        },
      ],
    });
  }

  const appointment = new Date();
  appointment.setDate(appointment.getDate() + (appointment.getDay() === 6 ? 2 : appointment.getDay() === 0 ? 1 : 1));
  appointment.setHours(10, 0, 0, 0);
  if (appointment.getDay() === 0) appointment.setDate(appointment.getDate() + 1);
  const scheduleRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customers[0].id,
      vehicleId: vehicles[1].id,
      assetId: crvAssetId,
      mechanicProfileId: mike.id,
      status: "ACCEPTED",
      problemText: "Pre-trip inspection before a canyon drive.",
      category: "MAINTENANCE",
      zip: "84101",
      city: "Salt Lake City",
      state: "UT",
      latitude: 40.7608,
      longitude: -111.891,
    },
  });
  const scheduledJob = await prisma.job.create({
    data: {
      serviceRequestId: scheduleRequest.id,
      customerId: customers[0].id,
      mechanicUserId: mikeUser.id,
      mechanicProfileId: mike.id,
      vehicleId: vehicles[1].id,
      assetId: crvAssetId,
      status: "SCHEDULED",
      totalCents: 12000,
      paymentStatus: "UNPAID",
      scheduledAt: appointment,
      scheduledConfirmedAt: appointment,
      events: {
        create: [
          { status: "REQUESTED", note: "Customer requested a pre-trip inspection." },
          { status: "SCHEDULED", note: "Appointment confirmed." },
        ],
      },
    },
  });
  await prisma.estimate.create({
    data: {
      jobId: scheduledJob.id,
      mechanicId: mikeUser.id,
      type: "PRIMARY",
      status: "APPROVED",
      totalCents: 12000,
      subtotalCents: 12000,
      sentAt: new Date(),
      lineItems: {
        create: [{ category: "DIAGNOSTIC", description: "Inspection labor", quantity: 1, unitCents: 12000, totalCents: 12000 }],
      },
    },
  });
  await prisma.messageThread.create({
    data: {
      customerId: customers[0].id,
      mechanicId: mikeUser.id,
      jobId: scheduledJob.id,
      requestId: scheduleRequest.id,
      messages: {
        create: [
          { senderId: customers[0].id, body: "Can you look it over before we head up the canyon?" },
          { senderId: mikeUser.id, body: "Yes — I have you on the calendar. See you then." },
        ],
      },
    },
  });

  await prisma.mechanicBlockedDate.createMany({
    data: [
      { mechanicProfileId: mike.id, date: new Date("2026-12-24"), reason: "Holiday" },
      { mechanicProfileId: mike.id, date: new Date("2026-12-25"), reason: "Holiday" },
    ],
  });

  const disputedJob = await prisma.job.findFirst({
    where: { customerId: customers[0].id, mechanicProfileId: mike.id, status: "COMPLETED", id: { not: unpaidJob.id } },
  });
  if (disputedJob) {
    await prisma.dispute.create({
      data: {
        jobId: disputedJob.id,
        customerId: customers[0].id,
        mechanicId: mikeUser.id,
        category: "COMMUNICATION",
        status: "OPEN",
        description: "Demo case: customer asked for a clearer parts breakdown after the job.",
      },
    });
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: customers[0].id,
        channel: "IN_APP",
        title: "Repair complete",
        body: "Pay the approved amount for the rear brake hardware service.",
        href: `/jobs/${unpaidJob.id}/pay`,
      },
      {
        userId: customers[0].id,
        channel: "IN_APP",
        title: "Appointment confirmed",
        body: appointment.toLocaleString(),
        href: `/jobs/${scheduledJob.id}`,
      },
      {
        userId: mikeUser.id,
        channel: "IN_APP",
        title: "Customer waiting to pay",
        body: "Alex Harper has a completed unpaid invoice.",
        href: `/mechanic/jobs/${unpaidJob.id}`,
      },
      {
        userId: mikeUser.id,
        channel: "IN_APP",
        title: "Appointment on the calendar",
        body: "Pre-trip inspection is confirmed.",
        href: `/mechanic/schedule`,
      },
    ],
  });

  await seedVisionLayer(prisma, {
    passwordHash,
    alexId: customers[0].id,
    mikeProfileId: mike.id,
    mikeUserId: mikeUser.id,
    sarahProfileId: mechanicProfiles.find((profile) => profile.slug === "precision-auto-care")?.id,
    marineProfileId: mechanicProfiles.find((profile) => profile.slug === "great-salt-lake-marine")?.id,
  });

  console.log("Seed complete.");
  console.log("Customer:  customer@demo.pocketmechanic.app / Demo1234!");
  console.log("Mechanic:  mechanic@demo.pocketmechanic.app / Demo1234!");
  console.log("Admin:     admin@demo.pocketmechanic.app / Demo1234!");
  console.log("Inspector: inspector@demo.pocketmechanic.app / Demo1234!");
  console.log("Support:   support@demo.pocketmechanic.app / Demo1234!");
  console.log("Fleet:     fleet@demo.pocketmechanic.app / Demo1234!");
  console.log(`Unpaid demo job: /jobs/${unpaidJob.id}/pay`);
  console.log(`Grouped estimate job: /jobs/${groupedJob.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
