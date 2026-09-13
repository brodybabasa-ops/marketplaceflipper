import type { ServiceCategory, VerificationLevel } from "@prisma/client";

export const APP_NAME = "Pocket Mechanic";
export const TAGLINE = "Find a mechanic you can trust.";
export const SUPPORTING_PHRASE = "Your vehicle. Your mechanic. Your peace of mind.";

export const PLATFORM_DISCLAIMER =
  "Pocket Mechanic connects customers with independent automotive service providers. Mechanics are independent service providers and are responsible for the services they perform.";

export const PRICING_DISCLAIMER =
  "Listed prices are informational. A mechanic provides a written estimate after diagnosis. Additional work requires your approval.";

export const DEMO_PASSWORD = "Demo1234!";

/** Live shops customers can actually book. Other directory shops still accept requests onto real Job rows. */
export const FREDS_MARINE_SLUG = "freds-marine";
export const PRECISION_AUTO_SLUG = "precision-auto-care";

export const SERVICE_CATEGORIES: {
  value: ServiceCategory;
  label: string;
  helper: string;
}[] = [
  { value: "BRAKES", label: "Brakes", helper: "Grinding, shaking, or warning lights when you stop" },
  { value: "ENGINE", label: "Engine", helper: "Rough running, smoke, or loss of power" },
  { value: "TRANSMISSION", label: "Transmission", helper: "Slipping, delayed shifting, or leaking fluid" },
  { value: "ELECTRICAL", label: "Electrical", helper: "Lights, sensors, or electronics acting up" },
  { value: "SUSPENSION", label: "Suspension", helper: "Bouncing, clunks, or uneven ride height" },
  { value: "STEERING", label: "Steering", helper: "Wander, pulling, or noise when you turn" },
  { value: "COOLING", label: "Cooling", helper: "Overheating or coolant leaks" },
  { value: "AC_HEATING", label: "A/C & heating", helper: "No cold air, weak heat, or strange smells" },
  { value: "STARTING", label: "Starting", helper: "Won't start, clicks, or slow cranking" },
  { value: "CHARGING", label: "Battery & charging", helper: "Dead battery or dim lights" },
  { value: "TIRES", label: "Tires", helper: "Wear, punctures, or vibration on the highway" },
  { value: "MAINTENANCE", label: "Maintenance", helper: "Oil, filters, fluids, and regular service" },
  { value: "DIAGNOSTICS", label: "Diagnostics", helper: "Check-engine light or an unknown problem" },
  { value: "OTHER", label: "Something else", helper: "Describe it in your own words" },
];

export const VERIFICATION_LEVELS: {
  value: VerificationLevel;
  label: string;
  description: string;
}[] = [
  {
    value: "UNVERIFIED",
    label: "Unverified",
    description: "Profile created. Identity and credentials have not been reviewed.",
  },
  {
    value: "PROFILE_VERIFIED",
    label: "Profile verified",
    description: "Identity and business information reviewed by Pocket Mechanic.",
  },
  {
    value: "PROFESSIONAL_VERIFIED",
    label: "Professional verified",
    description: "Submitted credentials and certifications have been reviewed.",
  },
  {
    value: "INSURED",
    label: "Insured",
    description: "Insurance documentation has been reviewed by Pocket Mechanic.",
  },
  {
    value: "POCKET_VERIFIED",
    label: "Pocket Verified",
    description: "Highest trust tier based on credentials, insurance, and completed Pocket Mechanic jobs.",
  },
];

export const DEFAULT_RANKING_WEIGHTS = {
  rating: 0.3,
  completedJobs: 0.15,
  onTime: 0.1,
  estimateAccuracy: 0.1,
  repeatRate: 0.1,
  reviewQuality: 0.05,
  verification: 0.1,
  responseTime: 0.05,
  cancellationRate: 0.05,
};

export const US_STATES: { code: string; name: string; slug: string }[] = [
  { code: "AL", name: "Alabama", slug: "alabama" },
  { code: "AK", name: "Alaska", slug: "alaska" },
  { code: "AZ", name: "Arizona", slug: "arizona" },
  { code: "AR", name: "Arkansas", slug: "arkansas" },
  { code: "CA", name: "California", slug: "california" },
  { code: "CO", name: "Colorado", slug: "colorado" },
  { code: "CT", name: "Connecticut", slug: "connecticut" },
  { code: "DE", name: "Delaware", slug: "delaware" },
  { code: "FL", name: "Florida", slug: "florida" },
  { code: "GA", name: "Georgia", slug: "georgia" },
  { code: "HI", name: "Hawaii", slug: "hawaii" },
  { code: "ID", name: "Idaho", slug: "idaho" },
  { code: "IL", name: "Illinois", slug: "illinois" },
  { code: "IN", name: "Indiana", slug: "indiana" },
  { code: "IA", name: "Iowa", slug: "iowa" },
  { code: "KS", name: "Kansas", slug: "kansas" },
  { code: "KY", name: "Kentucky", slug: "kentucky" },
  { code: "LA", name: "Louisiana", slug: "louisiana" },
  { code: "ME", name: "Maine", slug: "maine" },
  { code: "MD", name: "Maryland", slug: "maryland" },
  { code: "MA", name: "Massachusetts", slug: "massachusetts" },
  { code: "MI", name: "Michigan", slug: "michigan" },
  { code: "MN", name: "Minnesota", slug: "minnesota" },
  { code: "MS", name: "Mississippi", slug: "mississippi" },
  { code: "MO", name: "Missouri", slug: "missouri" },
  { code: "MT", name: "Montana", slug: "montana" },
  { code: "NE", name: "Nebraska", slug: "nebraska" },
  { code: "NV", name: "Nevada", slug: "nevada" },
  { code: "NH", name: "New Hampshire", slug: "new-hampshire" },
  { code: "NJ", name: "New Jersey", slug: "new-jersey" },
  { code: "NM", name: "New Mexico", slug: "new-mexico" },
  { code: "NY", name: "New York", slug: "new-york" },
  { code: "NC", name: "North Carolina", slug: "north-carolina" },
  { code: "ND", name: "North Dakota", slug: "north-dakota" },
  { code: "OH", name: "Ohio", slug: "ohio" },
  { code: "OK", name: "Oklahoma", slug: "oklahoma" },
  { code: "OR", name: "Oregon", slug: "oregon" },
  { code: "PA", name: "Pennsylvania", slug: "pennsylvania" },
  { code: "RI", name: "Rhode Island", slug: "rhode-island" },
  { code: "SC", name: "South Carolina", slug: "south-carolina" },
  { code: "SD", name: "South Dakota", slug: "south-dakota" },
  { code: "TN", name: "Tennessee", slug: "tennessee" },
  { code: "TX", name: "Texas", slug: "texas" },
  { code: "UT", name: "Utah", slug: "utah" },
  { code: "VT", name: "Vermont", slug: "vermont" },
  { code: "VA", name: "Virginia", slug: "virginia" },
  { code: "WA", name: "Washington", slug: "washington" },
  { code: "WV", name: "West Virginia", slug: "west-virginia" },
  { code: "WI", name: "Wisconsin", slug: "wisconsin" },
  { code: "WY", name: "Wyoming", slug: "wyoming" },
];

export const JOB_STATUS_ORDER = [
  "REQUESTED",
  "ACCEPTED",
  "SCHEDULED",
  "EN_ROUTE",
  "ARRIVED",
  "DIAGNOSING",
  "AWAITING_APPROVAL",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const LEGAL_PAGES = [
  { href: "/legal/terms", title: "Terms of Service", status: "Placeholder pending legal review" },
  { href: "/legal/privacy", title: "Privacy Policy", status: "Placeholder pending legal review" },
  { href: "/legal/mechanic-agreement", title: "Mechanic Agreement", status: "Placeholder pending legal review" },
  { href: "/legal/customer-agreement", title: "Customer Agreement", status: "Placeholder pending legal review" },
  { href: "/legal/dispute-policy", title: "Dispute Policy", status: "Placeholder pending legal review" },
  { href: "/legal/review-policy", title: "Review Policy", status: "Placeholder pending legal review" },
  { href: "/legal/protection-terms", title: "Pocket Protect Terms", status: "Placeholder pending legal review" },
] as const;
