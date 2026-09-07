import assert from "node:assert/strict";
import { test } from "node:test";
import { splitMarketplaceAmount } from "../services/checkout";
import { checklistFor } from "../services/verification";

test("marketplace fee is taken from payout, not added as an estimate line", () => {
  const split = splitMarketplaceAmount(80900, 3);
  assert.equal(split.amountCents, 80900);
  assert.equal(split.commissionCents, 2427);
  assert.equal(split.mechanicPayoutCents, 78473);
});

test("mobile inspection checklist is separate from shop checklist", () => {
  const shop = checklistFor("SHOP");
  const mobile = checklistFor("MOBILE");
  assert.ok(shop.includes("Facility condition"));
  assert.ok(!mobile.includes("Facility condition"));
  assert.ok(mobile.includes("Service vehicle"));
});
