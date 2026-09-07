import { classifyNeed } from "@/services/problem-classifier";
import { industryByKey, TAXONOMY, type IndustryKey } from "@/lib/catalog";

export type IntakeDraft = {
  problemText: string;
  industryKey: IndustryKey;
  category: string;
  taxonomyKey: string;
  routingNote: string;
  specialties: string[];
  followUps: { id: string; prompt: string; placeholder: string; choices?: string[] }[];
};

function taxonomyLabel(industryKey: string, taxonomyKey: string) {
  return TAXONOMY.find((item) => item.industry === industryKey && item.key === taxonomyKey)?.label ?? taxonomyKey.toLowerCase();
}

export function assistIntake(problemText: string, industryKey: string = "AUTOMOTIVE"): IntakeDraft {
  const classified = classifyNeed(problemText, industryKey);
  const industry = industryByKey(classified.industryKey);
  const label = taxonomyLabel(classified.industryKey, classified.taxonomyKey);
  const haystack = problemText.toLowerCase();

  const routingNote = haystack.includes("not sure") || classified.taxonomyKey === "DIAGNOSTICS"
    ? `Several things could cause this on a ${industry.consumerLabel}. An inspection is the right next step — Pocket Mechanic will not pretend to diagnose it from a description.`
    : `This sounds consistent with a ${label.toLowerCase()} concern on a ${industry.consumerLabel}. Several components could cause it, so an inspection is appropriate. Pocket Mechanic routes and explains — it does not diagnose without a physical inspection.`;

  const followUps: IntakeDraft["followUps"] = [
    {
      id: "conditions",
      prompt: "When does it happen?",
      placeholder: "Highway speed, after warmup, hitting bumps…",
      choices: haystack.includes("shake") || haystack.includes("65")
        ? ["Only at highway speed", "At all speeds", "When braking", "Not sure"]
        : haystack.includes("bump") || haystack.includes("clunk")
          ? ["Hitting bumps", "Turning", "All the time", "Not sure"]
          : ["Just started", "Comes and goes", "All the time", "Not sure"],
    },
    { id: "attempts", prompt: "Have you already tried a repair?", placeholder: "New battery last month, shop looked at it…" },
  ];
  if (classified.industryKey === "AUTOMOTIVE") {
    followUps.push({ id: "lights", prompt: "Any warning lights?", placeholder: "Check engine, ABS, none" });
    followUps.push({ id: "drive", prompt: "Can you still use it?", placeholder: "Yes / limited / no" });
  } else {
    followUps.push({ id: "usage", prompt: "When did you first notice it?", placeholder: "This weekend / last trip / gradually" });
  }

  return {
    problemText,
    industryKey: classified.industryKey,
    category: classified.category,
    taxonomyKey: classified.taxonomyKey,
    routingNote,
    specialties: [classified.taxonomyKey, classified.category].filter(Boolean),
    followUps,
  };
}
