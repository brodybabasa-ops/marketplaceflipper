import assert from "node:assert/strict";
import { test } from "node:test";
import { totalsForGroups } from "../services/repair-groups";

test("estimate scenario: brakes and oil approved, tires declined", () => {
  const groups = [
    { status: "APPROVED", totalCents: 68000 },
    { status: "DECLINED", totalCents: 112000 },
    { status: "APPROVED", totalCents: 12900 },
  ];
  const totals = totalsForGroups(groups);
  assert.equal(totals.originalCents, 192900);
  assert.equal(totals.approvedCents, 80900);
  assert.equal(totals.declinedCents, 112000);
  assert.equal(totals.pendingCents, 0);
  assert.equal(totals.authorizedCents, 80900);
});

test("supplemental authorization stacks without rewriting original totals", () => {
  const original = totalsForGroups([
    { status: "APPROVED", totalCents: 68000 },
    { status: "DECLINED", totalCents: 112000 },
    { status: "APPROVED", totalCents: 12900 },
  ]);
  const supplemental = totalsForGroups([{ status: "APPROVED", totalCents: 42000 }]);
  assert.equal(original.authorizedCents, 80900);
  assert.equal(original.authorizedCents + supplemental.authorizedCents, 122900);
});
