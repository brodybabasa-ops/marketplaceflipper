import assert from "node:assert/strict";
import { test } from "node:test";
import { assistIntake } from "../lib/intake-assistant";
import { expertiseBand, matchExplanation } from "../services/trust-graph";
import { evaluateMaintenance } from "../services/maintenance";
import { operatingViews, resolveOperatingModel, operatingModelFromForm } from "../lib/operating-model";
import { totalsForGroups } from "../services/repair-groups";

test("Fix It assistant routes and explains without diagnosing", () => {
  const result = assistIntake("There is a clunk in the front whenever I hit a bump.", "AUTOMOTIVE");
  assert.match(result.routingNote, /inspection/i);
  assert.doesNotMatch(result.routingNote.toLowerCase(), /you have a bad ball joint/);
  assert.equal(result.taxonomyKey, "SUSPENSION");
  const marine = assistIntake("My boat won't get on plane.", "MARINE");
  assert.equal(marine.taxonomyKey, "SURF_SYSTEM");
  assert.match(marine.routingNote, /does not diagnose/i);
});

test("trust graph bands require evidence", () => {
  assert.equal(expertiseBand(0), "INSUFFICIENT_DATA");
  assert.equal(expertiseBand(4), "LIMITED_HISTORY");
  assert.equal(expertiseBand(12), "COMPETENT");
  assert.equal(expertiseBand(30), "ADVANCED");
  assert.equal(expertiseBand(62, 0.97), "EXCEPTIONAL");
  const explanation = matchExplanation({ reasons: ["4.9 rating"], completedSimilar: 1 });
  assert.ok(explanation.precisionNote);
});

test("maintenance engine uses usage remainder, not invented failures", () => {
  const items = evaluateMaintenance({ industryKey: "AUTOMOTIVE", usageValue: 87000, usageUnit: "MILES" });
  const oil = items.find((item) => item.title === "Oil change");
  assert.ok(oil);
  assert.ok(oil.remainingLabel?.includes("miles"));
  assert.notEqual(oil.status, undefined);
});

test("operating model hides the wrong scheduler concepts", () => {
  const shop = operatingViews(resolveOperatingModel({ serviceMode: "SHOP" }));
  assert.equal(shop.showBays, true);
  assert.equal(shop.showRoutes, false);
  const mobile = operatingViews(resolveOperatingModel({ serviceMode: "MOBILE" }));
  assert.equal(mobile.showRoutes, true);
  assert.equal(mobile.showBays, false);
  assert.equal(operatingModelFromForm(true, true), "HYBRID");
});

test("authorization math stays canonical after vision work", () => {
  const totals = totalsForGroups([
    { status: "APPROVED", totalCents: 68000 },
    { status: "DECLINED", totalCents: 112000 },
    { status: "APPROVED", totalCents: 12900 },
  ]);
  assert.equal(totals.authorizedCents, 80900);
});

test("fair price withholds a range when there is no comparable set", () => {
  const explanation = matchExplanation({ reasons: ["Nearby"], completedSimilar: 0 });
  assert.ok(explanation.precisionNote);
});
