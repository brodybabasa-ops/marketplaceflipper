import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateSelect, DEFAULT_SELECT_CRITERIA } from "../services/select";

test("founding status is independent of Select and Verified", () => {
  const foundingUnverified = evaluateSelect(
    {
      verificationLevel: "PROFILE_VERIFIED",
      completedJobsCount: 5,
      averageRating: 5,
      disputeRate: 0,
      completionRate: 100,
      avgResponseMinutes: 8,
      repeatCustomers: 12,
    },
    DEFAULT_SELECT_CRITERIA,
  );
  assert.equal(foundingUnverified.eligible, false);
  assert.ok(foundingUnverified.failures.some((item) => item.includes("Verified")));
});

test("Select requires verified performance and is not purchased", () => {
  const ready = evaluateSelect({
    verificationLevel: "POCKET_VERIFIED",
    completedJobsCount: 47,
    averageRating: 4.9,
    disputeRate: 0.5,
    completionRate: 98,
    avgResponseMinutes: 8,
    repeatCustomers: 12,
  });
  assert.equal(ready.eligible, true);
});
