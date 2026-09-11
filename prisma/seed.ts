import { PrismaClient, type DayOfWeek, type JobStatus, type MechanicProfile, type ServiceCategory, type ServiceMode, type VerificationLevel } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_RANKING_WEIGHTS } from "../lib/constants";
import { computeMechanicScore } from "../services/ranking";
import { classifyProblem } from "../services/problem-classifier";

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
  { zip: "84040", city: "Layton", state: "Utah", stateCode: "UT", latitude: 41.078, longitude: -111.92 },
  { zip: "84037", city: "Kaysville", state: "Utah", stateCode: "UT", latitude: 41.0352, longitude: -111.9386 },
  { zip: "84015", city: "Clearfield", state: "Utah", stateCode: "UT", latitude: 41.1108, longitude: -112.0261 },
  { zip: "84025", city: "Farmington", state: "Utah", stateCode: "UT", latitude: 40.9805, longitude: -111.8874 },
  { zip: "84075", city: "Syracuse", state: "Utah", stateCode: "UT", latitude: 41.0894, longitude: -112.0647 },
  { zip: "84067", city: "Roy", state: "Utah", stateCode: "UT", latitude: 41.1616, longitude: -112.0263 },
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
  { name: "Centurion", models: ["Ri245", "Ri230", "Fi23"] },
  { name: "KTM", models: ["450 SX-F", "350 SX-F", "300 XC"] },
  { name: "Yamaha", models: ["FX Cruiser", "VX Cruiser", "YZ450F"] },
  { name: "Winnebago", models: ["Minnie Winnie", "View", "Solis"] },
  { name: "Haulmark", models: ["Trailer", "Passport", "Transport"] },
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
  tagline?: string;
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
    city: "Farmington",
    zip: "84025",
    lat: 41.0,
    lng: -111.89,
    radius: 25,
    diagnostic: 12000,
    labor: 12500,
    mobile: 0,
    level: "PROFESSIONAL_VERIFIED",
    tagline: "European · Japanese · Diagnostics",
    specialties: ["ENGINE", "ELECTRICAL", "DIAGNOSTICS", "BRAKES", "SUSPENSION"],
    makes: ["Toyota", "Honda", "BMW", "Subaru", "Ford"],
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

const DAVIS_SHOPS: MechanicSeed[] = [
  {
    firstName: "Fred",
    lastName: "Jensen",
    email: "fred.jensen@demo.pocketmechanic.app",
    businessName: "Fred's Marine",
    slug: "freds-marine",
    tagline: "Boats · PWCs · Marine Engines",
    bio: "Inboard, outboard, and PWC service for Davis County boaters. We diagnose no-starts, winterize, and get you back on the water.",
    years: 18,
    mode: "SHOP",
    city: "Layton",
    zip: "84041",
    lat: 41.078,
    lng: -111.938,
    radius: 30,
    diagnostic: 12500,
    labor: 13000,
    mobile: 0,
    level: "POCKET_VERIFIED",
    specialties: ["ENGINE", "STARTING", "ELECTRICAL", "DIAGNOSTICS"],
    makes: ["Centurion"],
    response: 18,
    onTime: 98,
    accuracy: 97,
    cancel: 1.1,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "Mercury Certified", issuer: "Mercury Marine", verified: true }],
  },
  {
    firstName: "Dale",
    lastName: "Hatch",
    email: "dale.hatch@demo.pocketmechanic.app",
    businessName: "Layton Diesel & Auto",
    slug: "layton-diesel-auto",
    tagline: "Diesel · Brakes · Suspension",
    bio: "Heavy-duty trucks, Power Stroke diesels, and front-end work. Written estimates before we pull a wrench.",
    years: 16,
    mode: "SHOP",
    city: "Layton",
    zip: "84041",
    lat: 41.042,
    lng: -111.93,
    radius: 30,
    diagnostic: 11000,
    labor: 12800,
    mobile: 0,
    level: "POCKET_VERIFIED",
    specialties: ["SUSPENSION", "BRAKES", "ENGINE", "DIAGNOSTICS"],
    makes: ["Ford", "Chevrolet", "Ram", "GMC"],
    response: 20,
    onTime: 97,
    accuracy: 96,
    cancel: 1.4,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [
      { name: "ASE Master Automobile Technician", issuer: "ASE", verified: true },
      { name: "Ford Diesel Specialist", issuer: "Ford", verified: true },
    ],
  },
  {
    firstName: "Tess",
    lastName: "Ward",
    email: "tess.ward@demo.pocketmechanic.app",
    businessName: "Wasatch Powersports",
    slug: "wasatch-powersports",
    tagline: "Motorcycles · ATVs · Snow",
    bio: "Dirt bikes, ATVs, and snowmobiles. Factory tools for KTM, Honda, and Yamaha with same-week service appointments.",
    years: 12,
    mode: "SHOP",
    city: "Kaysville",
    zip: "84037",
    lat: 41.012,
    lng: -111.91,
    radius: 28,
    diagnostic: 8900,
    labor: 10500,
    mobile: 0,
    level: "PROFESSIONAL_VERIFIED",
    specialties: ["MAINTENANCE", "ENGINE", "BRAKES", "OTHER"],
    makes: ["KTM", "Honda"],
    response: 22,
    onTime: 96,
    accuracy: 95,
    cancel: 1.6,
    days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "KTM Service Certified", issuer: "KTM", verified: true }],
  },
  {
    firstName: "Reed",
    lastName: "Dalton",
    email: "reed.dalton@demo.pocketmechanic.app",
    businessName: "Mountain RV Service",
    slug: "mountain-rv-service",
    tagline: "RVs · Trailers · Generators",
    bio: "Motorhomes, travel trailers, and generators. We keep weekend trips from turning into driveway projects.",
    years: 20,
    mode: "SHOP",
    city: "Clearfield",
    zip: "84015",
    lat: 41.118,
    lng: -112.04,
    radius: 35,
    diagnostic: 13500,
    labor: 12500,
    mobile: 0,
    level: "INSURED",
    specialties: ["MAINTENANCE", "ELECTRICAL", "ENGINE", "OTHER"],
    makes: ["Ford", "Chevrolet"],
    response: 30,
    onTime: 94,
    accuracy: 93,
    cancel: 2.2,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "RVIA Technician", issuer: "RVIA", verified: true }],
  },
  {
    firstName: "Cam",
    lastName: "Boyd",
    email: "cam.boyd@demo.pocketmechanic.app",
    businessName: "Hill Field Tire & Brake",
    slug: "hill-field-tire",
    tagline: "Tires · Brakes · Alignments",
    bio: "Quick tire and brake work near Hill Field. Honest inspections and no upsells on parts you do not need.",
    years: 9,
    mode: "SHOP",
    city: "Clearfield",
    zip: "84015",
    lat: 41.105,
    lng: -112.01,
    radius: 22,
    diagnostic: 6900,
    labor: 9200,
    mobile: 0,
    level: "PROFILE_VERIFIED",
    specialties: ["TIRES", "BRAKES", "SUSPENSION", "STEERING"],
    makes: ["Ford", "Chevrolet", "Honda", "Toyota"],
    response: 16,
    onTime: 95,
    accuracy: 94,
    cancel: 1.8,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "ASE Brakes", issuer: "ASE", verified: true }],
  },
  {
    firstName: "Nina",
    lastName: "Shore",
    email: "nina.shore@demo.pocketmechanic.app",
    businessName: "Great Salt Lake Marine",
    slug: "great-salt-lake-marine",
    tagline: "Boats · Outboards · Winterization",
    bio: "Outboards and sterndrives for Great Salt Lake and Pineview. Seasonal service with pickup for trailered boats.",
    years: 11,
    mode: "BOTH",
    city: "Syracuse",
    zip: "84075",
    lat: 41.0894,
    lng: -112.0647,
    radius: 28,
    diagnostic: 9900,
    labor: 11200,
    mobile: 2800,
    level: "PROFESSIONAL_VERIFIED",
    specialties: ["ENGINE", "STARTING", "ELECTRICAL", "MAINTENANCE"],
    makes: ["Centurion"],
    response: 24,
    onTime: 93,
    accuracy: 92,
    cancel: 2.5,
    days: ["MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "Yamaha Outboard", issuer: "Yamaha", verified: true }],
  },
  {
    firstName: "Todd",
    lastName: "North",
    email: "todd.north@demo.pocketmechanic.app",
    businessName: "Northridge Transmission",
    slug: "northridge-transmission",
    tagline: "Transmissions · 4x4 · Diesels",
    bio: "Transmission diagnostics and rebuilds for trucks that actually work. No mystery fluid flushes.",
    years: 17,
    mode: "SHOP",
    city: "Layton",
    zip: "84040",
    lat: 41.078,
    lng: -111.92,
    radius: 25,
    diagnostic: 12000,
    labor: 13000,
    mobile: 0,
    level: "PROFESSIONAL_VERIFIED",
    specialties: ["TRANSMISSION", "ENGINE", "DIAGNOSTICS"],
    makes: ["Ford", "Chevrolet", "Ram", "GMC"],
    response: 40,
    onTime: 92,
    accuracy: 91,
    cancel: 2.8,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "ASE Transmission", issuer: "ASE", verified: true }],
  },
  {
    firstName: "Paige",
    lastName: "Glass",
    email: "paige.glass@demo.pocketmechanic.app",
    businessName: "Davis Auto Glass",
    slug: "davis-auto-glass",
    tagline: "Windshields · ADAS · Chip repair",
    bio: "Windshield replacement and calibration for trucks and daily drivers in Farmington and Layton.",
    years: 8,
    mode: "MOBILE",
    city: "Farmington",
    zip: "84025",
    lat: 40.9805,
    lng: -111.8874,
    radius: 30,
    diagnostic: 0,
    labor: 8500,
    mobile: 0,
    level: "INSURED",
    specialties: ["OTHER", "DIAGNOSTICS"],
    makes: ["Ford", "Toyota", "Honda", "Chevrolet"],
    response: 14,
    onTime: 97,
    accuracy: 96,
    cancel: 1.2,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "AGRSS Certified", issuer: "AGRSS", verified: true }],
  },
  {
    firstName: "Colt",
    lastName: "Trails",
    email: "colt.trails@demo.pocketmechanic.app",
    businessName: "Wasatch Trailer Repair",
    slug: "wasatch-trailer-repair",
    tagline: "Trailers · Axles · Brakes",
    bio: "Boat trailers, dump trailers, and toy haulers. Bearings, brakes, lights, and welds that last a season.",
    years: 14,
    mode: "SHOP",
    city: "Syracuse",
    zip: "84075",
    lat: 41.07,
    lng: -112.05,
    radius: 30,
    diagnostic: 7500,
    labor: 9800,
    mobile: 0,
    level: "PROFILE_VERIFIED",
    specialties: ["BRAKES", "ELECTRICAL", "SUSPENSION", "OTHER"],
    makes: ["Ford", "Chevrolet"],
    response: 26,
    onTime: 94,
    accuracy: 93,
    cancel: 2,
    days: ["MONDAY", "TUESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "Dexter Axle Training", issuer: "Dexter", verified: true }],
  },
  {
    firstName: "Lane",
    lastName: "Porter",
    email: "lane.porter@demo.pocketmechanic.app",
    businessName: "Utah Powersports",
    slug: "utah-powersports",
    tagline: "PWCs · Outboards · Jet skis",
    bio: "Wave runners and small marine engines. We winterize, rebuild pumps, and keep lake days on the calendar.",
    years: 10,
    mode: "SHOP",
    city: "Syracuse",
    zip: "84075",
    lat: 41.0894,
    lng: -112.0647,
    radius: 28,
    diagnostic: 8900,
    labor: 10200,
    mobile: 0,
    level: "PROFESSIONAL_VERIFIED",
    specialties: ["ENGINE", "MAINTENANCE", "STARTING"],
    makes: ["Yamaha"],
    response: 22,
    onTime: 95,
    accuracy: 94,
    cancel: 1.7,
    days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
    certs: [{ name: "Yamaha PWC Certified", issuer: "Yamaha", verified: true }],
  },
  {
    firstName: "Hank",
    lastName: "Rowe",
    email: "hank.rowe@demo.pocketmechanic.app",
    businessName: "Trailer Pro Services",
    slug: "trailer-pro-services",
    tagline: "Bearings · Axles · Brakes",
    bio: "Enclosed cargo and toy-hauler service in Roy. Bearings, brakes, and lighting done the same week.",
    years: 15,
    mode: "SHOP",
    city: "Roy",
    zip: "84067",
    lat: 41.1616,
    lng: -112.0263,
    radius: 30,
    diagnostic: 7500,
    labor: 9800,
    mobile: 0,
    level: "INSURED",
    specialties: ["BRAKES", "SUSPENSION", "OTHER"],
    makes: ["Haulmark", "Ford"],
    response: 28,
    onTime: 93,
    accuracy: 92,
    cancel: 2.1,
    days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    certs: [{ name: "Dexter Axle Training", issuer: "Dexter", verified: true }],
  },
];

const EXTRA_MECHANICS: Omit<MechanicSeed, "email" | "slug">[] = [
  { firstName: "Nina", lastName: "Alvarez", businessName: "Alvarez Auto Electric", bio: "Starting, charging, and electrical diagnostics for cars and light trucks.", years: 11, mode: "MOBILE", city: "Midvale", zip: "84047", lat: 40.6111, lng: -111.8999, radius: 22, diagnostic: 9900, labor: 11500, mobile: 2500, level: "PROFESSIONAL_VERIFIED", specialties: ["ELECTRICAL", "STARTING", "CHARGING", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram"], response: 22, onTime: 96, accuracy: 93, cancel: 2, days: ["MONDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Electrical", issuer: "ASE", verified: true }] },
  { firstName: "Owen", lastName: "Brooks", businessName: "Brooks Brake Co.", bio: "Brake specialist. Quiet stops, no unnecessary parts, and a written warranty on every job.", years: 9, mode: "BOTH", city: "Lehi", zip: "84043", lat: 40.3916, lng: -111.8508, radius: 28, diagnostic: 7900, labor: 9800, mobile: 3000, level: "PROFILE_VERIFIED", specialties: ["BRAKES", "SUSPENSION", "TIRES"], makes: ["Ford", "Honda", "Toyota"], response: 16, onTime: 94, accuracy: 97, cancel: 1.8, days: ["MONDAY", "TUESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Brakes", issuer: "ASE", verified: true }] },
  { firstName: "Maya", lastName: "Haddad", businessName: "Haddad Import Service", bio: "BMW, Subaru, and Honda specialist with factory-level scan tools.", years: 13, mode: "SHOP", city: "Salt Lake City", zip: "84102", lat: 40.76, lng: -111.858, radius: 16, diagnostic: 13500, labor: 14000, mobile: 0, level: "PROFESSIONAL_VERIFIED", specialties: ["ENGINE", "ELECTRICAL", "DIAGNOSTICS", "COOLING"], makes: ["BMW", "Subaru", "Honda"], response: 45, onTime: 92, accuracy: 95, cancel: 2.4, days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "BMW Specialist", issuer: "Independent", verified: false }] },
  { firstName: "Derek", lastName: "Nguyen", businessName: "Nguyen Mobile Mechanic", bio: "Evenings and weekends. Great for people who cannot leave a car at a shop.", years: 6, mode: "MOBILE", city: "Orem", zip: "84057", lat: 40.2969, lng: -111.6946, radius: 30, diagnostic: 7500, labor: 8900, mobile: 1500, level: "PROFILE_VERIFIED", specialties: ["MAINTENANCE", "BRAKES", "STARTING", "DIAGNOSTICS"], makes: ["Honda", "Toyota", "Nissan"], response: 14, onTime: 90, accuracy: 88, cancel: 5, days: ["WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"], certs: [] },
  { firstName: "Hannah", lastName: "Peters", businessName: "Peak Suspension", bio: "Steering, suspension, and alignment for mountain driving and towing setups.", years: 12, mode: "SHOP", city: "Park City", zip: "84098", lat: 40.6461, lng: -111.498, radius: 25, diagnostic: 11000, labor: 13000, mobile: 0, level: "INSURED", specialties: ["SUSPENSION", "STEERING", "TIRES", "BRAKES"], makes: ["Jeep", "Ford", "Subaru", "Toyota"], response: 50, onTime: 94, accuracy: 91, cancel: 2.8, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Suspension", issuer: "ASE", verified: true }] },
  { firstName: "Luis", lastName: "Morales", businessName: "Morales Transmission", bio: "Transmission diagnostics and rebuilds for trucks and SUVs.", years: 18, mode: "SHOP", city: "Ogden", zip: "84401", lat: 41.223, lng: -111.9738, radius: 35, diagnostic: 12500, labor: 12800, mobile: 0, level: "PROFESSIONAL_VERIFIED", specialties: ["TRANSMISSION", "ENGINE", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram", "GMC"], response: 60, onTime: 89, accuracy: 90, cancel: 3.5, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Transmission", issuer: "ASE", verified: true }] },
  { firstName: "Ava", lastName: "Kim", businessName: "Kim Cool Air", bio: "A/C, heating, and cooling system specialist. Same-week recharge and leak repair.", years: 8, mode: "MOBILE", city: "Roy", zip: "84067", lat: 41.1616, lng: -112.0263, radius: 32, diagnostic: 8000, labor: 9500, mobile: 2200, level: "PROFILE_VERIFIED", specialties: ["AC_HEATING", "COOLING", "MAINTENANCE"], makes: ["Honda", "Toyota", "Ford", "Chevrolet"], response: 20, onTime: 96, accuracy: 93, cancel: 1.9, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "EPA 609", issuer: "EPA", verified: true }] },
  { firstName: "Noah", lastName: "Whitaker", businessName: "Whitaker Jeep Garage", bio: "Jeep and off-road focused shop. Steering, lockers, and trail damage repair.", years: 15, mode: "SHOP", city: "American Fork", zip: "84003", lat: 40.3769, lng: -111.7958, radius: 24, diagnostic: 10000, labor: 11800, mobile: 0, level: "INSURED", specialties: ["SUSPENSION", "STEERING", "ELECTRICAL", "BRAKES"], makes: ["Jeep", "Ford", "Ram"], response: 33, onTime: 92, accuracy: 91, cancel: 2.2, days: ["TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Elena", lastName: "Voss", businessName: "Voss Diagnostics", bio: "Check-engine lights, drivability, and hard-to-find electrical issues.", years: 19, mode: "BOTH", city: "Salt Lake City", zip: "84101", lat: 40.758, lng: -111.888, radius: 20, diagnostic: 15000, labor: 14500, mobile: 3500, level: "POCKET_VERIFIED", specialties: ["DIAGNOSTICS", "ELECTRICAL", "ENGINE", "STARTING"], makes: ["BMW", "Ford", "Toyota", "Subaru"], response: 25, onTime: 97, accuracy: 98, cancel: 0.8, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY"], certs: [{ name: "ASE Master", issuer: "ASE", verified: true }] },
  { firstName: "Marcus", lastName: "Hale", businessName: "Hale Tire & Service", bio: "Tires, alignments, and quick maintenance without the dealership wait.", years: 5, mode: "SHOP", city: "West Jordan", zip: "84081", lat: 40.604, lng: -112.0, radius: 15, diagnostic: 6900, labor: 8500, mobile: 0, level: "UNVERIFIED", specialties: ["TIRES", "MAINTENANCE", "BRAKES"], makes: ["Ford", "Honda", "Nissan", "Toyota"], response: 55, onTime: 88, accuracy: 86, cancel: 6, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [] },
  { firstName: "Sofia", lastName: "Reyes", businessName: "Reyes Mobile Fleet", bio: "Work trucks and small fleets. I keep your vehicles moving with scheduled mobile service.", years: 11, mode: "MOBILE", city: "Provo", zip: "84604", lat: 40.2698, lng: -111.6946, radius: 35, diagnostic: 10500, labor: 11200, mobile: 2800, level: "INSURED", specialties: ["MAINTENANCE", "BRAKES", "ELECTRICAL", "DIAGNOSTICS"], makes: ["Ford", "Chevrolet", "Ram", "GMC"], response: 19, onTime: 95, accuracy: 94, cancel: 1.4, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Ben", lastName: "Iverson", businessName: "Iverson Auto", bio: "General repair with a calm explanation of what actually needs to be done.", years: 20, mode: "SHOP", city: "Kaysville", zip: "84037", lat: 40.995, lng: -111.9, radius: 22, diagnostic: 9000, labor: 10800, mobile: 0, level: "PROFILE_VERIFIED", specialties: ["ENGINE", "BRAKES", "COOLING", "MAINTENANCE"], makes: ["Chevrolet", "GMC", "Ford", "Toyota"], response: 42, onTime: 90, accuracy: 89, cancel: 3.1, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"], certs: [{ name: "ASE Certified", issuer: "ASE", verified: true }] },
  { firstName: "Grace", lastName: "Patel", businessName: "Patel Hybrid Care", bio: "Hybrids and late-model electronics. I explain warning lights in plain language.", years: 8, mode: "MOBILE", city: "Sandy", zip: "84094", lat: 40.572, lng: -111.86, radius: 20, diagnostic: 11500, labor: 12000, mobile: 2500, level: "PROFESSIONAL_VERIFIED", specialties: ["ELECTRICAL", "DIAGNOSTICS", "CHARGING", "ENGINE"], makes: ["Toyota", "Honda", "Ford"], response: 21, onTime: 96, accuracy: 95, cancel: 1.1, days: ["MONDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "Toyota Hybrid Training", issuer: "Toyota", verified: true }] },
  { firstName: "Calvin", lastName: "Ortiz", businessName: "Ortiz Starting & Charging", bio: "Batteries, starters, and alternators done the same day when parts are in stock.", years: 9, mode: "MOBILE", city: "Ogden", zip: "84403", lat: 41.192, lng: -111.944, radius: 28, diagnostic: 7000, labor: 9200, mobile: 1800, level: "PROFILE_VERIFIED", specialties: ["STARTING", "CHARGING", "ELECTRICAL"], makes: ["Ford", "Chevrolet", "Nissan", "Honda"], response: 11, onTime: 97, accuracy: 94, cancel: 1.6, days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], certs: [{ name: "ASE Electrical", issuer: "ASE", verified: true }] },
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

async function seedBrodyStory({
  customerId,
  truck,
  boat,
  bike,
  rv,
  ski,
  trailer,
  shops,
}: {
  customerId: string;
  truck: { id: string; mileage: number };
  boat: { id: string; mileage: number };
  bike: { id: string; mileage: number };
  rv: { id: string; mileage: number };
  ski: { id: string; mileage: number };
  trailer: { id: string; mileage: number };
  shops: Record<string, { id: string; userId: string; shopCity: string | null; shopZip: string | null; latitude: number; longitude: number }>;
}) {
  const fred = shops["freds-marine"];
  const diesel = shops["layton-diesel-auto"];
  const powersports = shops["wasatch-powersports"];
  const mountainRv = shops["mountain-rv-service"];
  const utahPower = shops["utah-powersports"];
  const trailerPro = shops["trailer-pro-services"];
  if (!fred || !diesel || !powersports || !mountainRv || !utahPower || !trailerPro) return;

  async function storyJob({
    vehicleId,
    shop,
    problem,
    category,
    status,
    price,
    estimateStatus,
    scheduledAt,
    createdAt,
    completedAt,
    messages,
    photos,
  }: {
    vehicleId: string;
    shop: { id: string; userId: string; shopCity: string | null; shopZip: string | null; latitude: number; longitude: number };
    problem: string;
    category: ServiceCategory;
    status: JobStatus;
    price: number;
    estimateStatus: "SENT" | "APPROVED";
    scheduledAt?: Date;
    createdAt: Date;
    completedAt?: Date;
    messages: { from: "customer" | "shop"; body: string; at: Date; unread?: boolean }[];
    photos?: { url: string; at: Date }[];
  }) {
    const request = await prisma.serviceRequest.create({
      data: {
        customerId,
        vehicleId,
        mechanicProfileId: shop.id,
        status: status === "REQUESTED" || status === "AWAITING_APPROVAL" ? "OPEN" : "ACCEPTED",
        problemText: problem,
        category,
        zip: shop.shopZip ?? "84041",
        city: shop.shopCity ?? "Layton",
        state: "UT",
        latitude: shop.latitude,
        longitude: shop.longitude,
        createdAt,
      },
    });
    const doneAt = completedAt ?? (status === "COMPLETED" ? new Date(createdAt.getTime() + 86400000 * 3) : undefined);
    const job = await prisma.job.create({
      data: {
        serviceRequestId: request.id,
        customerId,
        mechanicUserId: shop.userId,
        mechanicProfileId: shop.id,
        vehicleId,
        status,
        totalCents: price,
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        scheduledAt,
        completedAt: doneAt,
        createdAt,
        events: {
          create: [
            { status: "REQUESTED", createdAt },
            { status, createdAt: new Date(createdAt.getTime() + 3600000) },
          ],
        },
      },
    });
    const estimate = await prisma.estimate.create({
      data: {
        jobId: job.id,
        mechanicId: shop.userId,
        type: "PRIMARY",
        status: estimateStatus,
        totalCents: price,
        subtotalCents: price,
        sentAt: createdAt,
        lineItems: {
          create: [
            { category: "DIAGNOSTIC", description: "Diagnostic labor", quantity: 1, unitCents: Math.min(12500, price), totalCents: Math.min(12500, price) },
            { category: "LABOR", description: problem, quantity: 1, unitCents: Math.max(0, price - 12500), totalCents: Math.max(0, price - 12500) },
          ],
        },
      },
    });
    if (estimateStatus === "APPROVED") {
      await prisma.estimateApproval.create({
        data: { estimateId: estimate.id, userId: customerId, action: "APPROVED", createdAt: new Date(createdAt.getTime() + 7200000) },
      });
    }
    await prisma.messageThread.create({
      data: {
        customerId,
        mechanicId: shop.userId,
        jobId: job.id,
        requestId: request.id,
        lastMessageAt: messages.at(-1)?.at ?? createdAt,
        messages: {
          create: messages.map((message) => ({
            senderId: message.from === "customer" ? customerId : shop.userId,
            body: message.body,
            createdAt: message.at,
            readAt: message.unread ? undefined : message.at,
          })),
        },
      },
    });
    if (photos?.length) {
      await prisma.jobPhoto.createMany({
        data: photos.map((photo) => ({ jobId: job.id, url: photo.url, createdAt: photo.at })),
      });
    }
    if (status === "COMPLETED") {
      await prisma.repairRecord.create({
        data: {
          jobId: job.id,
          vehicleId,
          title: problem,
          diagnosis: problem,
          workPerformed: problem,
          laborHours: 2,
          warrantySummary: "12 months / 12,000 miles",
          createdAt: doneAt ?? createdAt,
        },
      });
    }
    return job;
  }

  const boatJob = await storyJob({
    vehicleId: boat.id,
    shop: fred,
    problem: "Engine not starting",
    category: "STARTING",
    status: "IN_PROGRESS",
    price: 285000,
    estimateStatus: "APPROVED",
    createdAt: new Date("2026-08-28T16:00:00.000Z"),
    messages: [
      { from: "customer", body: "Boat turned over once then nothing.", at: new Date("2026-08-28T16:05:00.000Z") },
      { from: "shop", body: "We're in service on the engine now. I'll update you when it's ready to pick up.", at: new Date("2026-08-31T16:24:00.000Z"), unread: true },
    ],
    photos: [{ url: "/landing/vehicle-boat.png", at: new Date("2026-08-29T18:00:00.000Z") }],
  });

  await storyJob({
    vehicleId: truck.id,
    shop: diesel,
    problem: "Front-end work (suspension)",
    category: "SUSPENSION",
    status: "AWAITING_APPROVAL",
    price: 142000,
    estimateStatus: "SENT",
    createdAt: new Date("2026-08-27T17:30:00.000Z"),
    messages: [
      { from: "customer", body: "Clunk from the front end on the F-250. Need an estimate before you start.", at: new Date("2026-08-27T17:32:00.000Z") },
      { from: "shop", body: "Estimate is ready — $1,420.00 for ball joints, tie rods, and an alignment.", at: new Date("2026-08-27T20:10:00.000Z"), unread: true },
    ],
  });

  await storyJob({
    vehicleId: bike.id,
    shop: powersports,
    problem: "Routine Service",
    category: "MAINTENANCE",
    status: "DIAGNOSING",
    price: 62000,
    estimateStatus: "APPROVED",
    scheduledAt: new Date("2026-09-14T16:00:00.000Z"),
    createdAt: new Date("2026-08-26T16:00:00.000Z"),
    messages: [
      { from: "customer", body: "Need oil, filter, and a look at the air filter before the next ride.", at: new Date("2026-08-26T16:02:00.000Z") },
      { from: "shop", body: "Parts ETA is Aug 30. You're still on the book for Saturday at 10:00 AM.", at: new Date("2026-08-29T18:40:00.000Z") },
    ],
  });

  await storyJob({
    vehicleId: rv.id,
    shop: mountainRv,
    problem: "Brake service",
    category: "BRAKES",
    status: "COMPLETED",
    price: 48500,
    estimateStatus: "APPROVED",
    createdAt: new Date("2026-08-16T16:00:00.000Z"),
    completedAt: new Date("2026-08-20T18:00:00.000Z"),
    messages: [
      { from: "customer", body: "RV brakes feel soft on the mountain grades.", at: new Date("2026-08-16T16:05:00.000Z") },
      { from: "shop", body: "Pads and fluid are done. You're good to go.", at: new Date("2026-08-20T18:10:00.000Z") },
    ],
  });

  await storyJob({
    vehicleId: ski.id,
    shop: utahPower,
    problem: "Engine service",
    category: "ENGINE",
    status: "COMPLETED",
    price: 32000,
    estimateStatus: "APPROVED",
    createdAt: new Date("2026-08-08T16:00:00.000Z"),
    completedAt: new Date("2026-08-12T18:00:00.000Z"),
    messages: [
      { from: "customer", body: "Ski was running rough after the last lake day.", at: new Date("2026-08-08T16:05:00.000Z") },
      { from: "shop", body: "Impeller and plugs are sorted. Ready for pickup.", at: new Date("2026-08-12T18:10:00.000Z") },
    ],
  });

  await storyJob({
    vehicleId: trailer.id,
    shop: trailerPro,
    problem: "Bearing replacement",
    category: "OTHER",
    status: "IN_PROGRESS",
    price: 78000,
    estimateStatus: "APPROVED",
    createdAt: new Date("2026-08-25T16:00:00.000Z"),
    messages: [
      { from: "customer", body: "Trailer bearings were noisy on the way to the lake.", at: new Date("2026-08-25T16:05:00.000Z") },
      { from: "shop", body: "We're in the middle of the bearing job. Should be wrapped this week.", at: new Date("2026-08-26T18:00:00.000Z") },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { userId: customerId, title: "Estimate received", body: "Layton Diesel & Auto sent a $1,420.00 estimate.", href: `/jobs` },
      { userId: customerId, title: "Repair in progress", body: "Fred's Marine is working on the Centurion.", href: `/jobs/${boatJob.id}` },
    ],
  });
}

async function main() {
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.messageThread.deleteMany(),
    prisma.estimateApproval.deleteMany(),
    prisma.estimateLineItem.deleteMany(),
    prisma.estimate.deleteMany(),
    prisma.jobEvent.deleteMany(),
    prisma.jobPhoto.deleteMany(),
    prisma.repairRecord.deleteMany(),
    prisma.reviewResponse.deleteMany(),
    prisma.review.deleteMany(),
    prisma.dispute.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.job.deleteMany(),
    prisma.serviceRequest.deleteMany(),
    prisma.savedMechanic.deleteMany(),
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
    prisma.payout.deleteMany(),
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

  const customers: { id: string }[] = [];
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
        firstName: i === 0 ? "Brody" : firstName,
        lastName: i === 0 ? "Babasa" : lastName,
        customerProfile: {
          create:
            i === 0
              ? { city: "Layton", state: "UT", zip: "84041", latitude: 41.0602, longitude: -111.9711 }
              : { city: zip.city, state: zip.stateCode, zip: zip.zip, latitude: zip.latitude, longitude: zip.longitude },
        },
      },
    });
    customers.push(user);
  }

  const vehicles = [];
  const vehiclePlan = [
    { owner: 0, year: 2022, make: "Ford", model: "F-250", trim: "Lariat", engine: "6.7 Power Stroke", drivetrain: "4x4", mileage: 41200, nickname: "The truck" },
    { owner: 0, year: 2022, make: "Centurion", model: "Ri245", trim: "Luxury", engine: "6.2 Supercharged", drivetrain: "V-drive", mileage: 186, nickname: "The boat" },
    { owner: 0, year: 2020, make: "KTM", model: "450 SX-F", engine: "450cc", drivetrain: "Chain", mileage: 84, nickname: "The bike" },
    { owner: 0, year: 2021, make: "Winnebago", model: "Minnie Winnie", trim: "22M", engine: "7.3 V8", drivetrain: "RWD", mileage: 28400, nickname: "The RV" },
    { owner: 0, year: 2019, make: "Yamaha", model: "FX Cruiser", engine: "1.8 SHO", drivetrain: "Jet", mileage: 92, nickname: "The ski" },
    { owner: 0, year: 2022, make: "Haulmark", model: "Trailer", trim: "Enclosed", drivetrain: "Tandem", mileage: 4100, nickname: "The trailer" },
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
  }

  const mechanicSeeds: MechanicSeed[] = [
    ...MECHANICS,
    ...DAVIS_SHOPS,
    ...EXTRA_MECHANICS.map((item) => ({
      ...item,
      email: `${item.firstName}.${item.lastName}@demo.pocketmechanic.app`.toLowerCase(),
      slug: item.businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    })),
  ];

  const mechanicProfiles: MechanicProfile[] = [];
  for (const seed of mechanicSeeds) {
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
            tagline: seed.tagline,
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

  const mike = mechanicProfiles[0];
  const activeStatuses: JobStatus[] = ["REQUESTED", "ACCEPTED", "SCHEDULED", "EN_ROUTE", "DIAGNOSING", "AWAITING_APPROVAL", "IN_PROGRESS"];
  let completed = 0;

  for (let i = 0; i < 110; i++) {
    const mechanic =
      i % 4 === 0 || i < 35
        ? mechanicProfiles[0]
        : mechanicProfiles[(i % (mechanicProfiles.length - 1)) + 1];
    const vehicle = vehicles[i % vehicles.length];
    if (vehicle.customerId === customers[0].id) continue;
    const problem = PROBLEMS[i % PROBLEMS.length];
    const customerId = vehicle.customerId;
    const isActiveDemo = i < 8 && mechanic.id === mike.id;
    const status: JobStatus = isActiveDemo ? activeStatuses[i % activeStatuses.length] : "COMPLETED";
    const createdAt = new Date(Date.UTC(2026, (i % 8) + 1, (i % 27) + 1, 15));
    const category = classifyProblem(problem.text);

    const request = await prisma.serviceRequest.create({
      data: {
        customerId,
        vehicleId: vehicle.id,
        mechanicProfileId: mechanic.id,
        status: status === "REQUESTED" ? "OPEN" : "ACCEPTED",
        problemText: problem.text,
        category,
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
        status,
        totalCents: problem.price,
        paymentStatus: status === "COMPLETED" ? "PAID" : "UNPAID",
        scheduledAt: status === "REQUESTED" ? undefined : createdAt,
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

  const brodyVehicles = vehicles.filter((item) => item.customerId === customers[0].id);
  await seedBrodyStory({
    customerId: customers[0].id,
    truck: brodyVehicles[0],
    boat: brodyVehicles[1],
    bike: brodyVehicles[2],
    rv: brodyVehicles[3],
    ski: brodyVehicles[4],
    trailer: brodyVehicles[5],
    shops: Object.fromEntries(mechanicProfiles.map((profile) => [profile.slug, profile])),
  });

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
    },
  });

  for (const [slug, rating, reviews] of [
    ["freds-marine", 4.9, 86],
    ["layton-diesel-auto", 4.8, 64],
    ["wasatch-powersports", 4.7, 41],
    ["mountain-rv-service", 4.9, 38],
    ["precision-auto-care", 4.8, 52],
  ] as const) {
    const shop = mechanicProfiles.find((profile) => profile.slug === slug);
    if (!shop) continue;
    await prisma.mechanicProfile.update({
      where: { id: shop.id },
      data: { averageRating: rating, reviewCount: Math.max(reviews, shop.reviewCount) },
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
      commissionPercent: 10,
      mechanicProMonthlyCents: 4900,
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

  const savedShops = ["freds-marine", "layton-diesel-auto", "precision-auto-care"]
    .map((slug) => mechanicProfiles.find((profile) => profile.slug === slug))
    .filter((profile): profile is (typeof mechanicProfiles)[number] => Boolean(profile));
  await prisma.savedMechanic.createMany({
    data: savedShops.map((profile) => ({ customerId: customers[0].id, mechanicProfileId: profile.id })),
  });

  console.log("Seed complete.");
  console.log("Customer: customer@demo.pocketmechanic.app / Demo1234!  (Brody Babasa, Layton)");
  console.log("Mechanic: mechanic@demo.pocketmechanic.app / Demo1234!");
  console.log("Shop:     sarah.chen@demo.pocketmechanic.app / Demo1234!");
  console.log("Admin:    admin@demo.pocketmechanic.app / Demo1234!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
