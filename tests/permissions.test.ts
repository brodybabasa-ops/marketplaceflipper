import assert from "node:assert/strict";
import { test } from "node:test";
import { can } from "../lib/permissions";

test("support cannot revoke verification, edit fees, or issue large refunds", () => {
  assert.equal(can("SUPPORT", "hq.access"), true);
  assert.equal(can("SUPPORT", "support.work"), true);
  assert.equal(can("SUPPORT", "verification.decide"), false);
  assert.equal(can("SUPPORT", "fees.edit"), false);
  assert.equal(can("SUPPORT", "refund.large"), false);
  assert.equal(can("SUPPORT", "roles.edit"), false);
});

test("inspector can inspect but cannot manage finance or roles", () => {
  assert.equal(can("INSPECTOR", "verification.inspect"), true);
  assert.equal(can("INSPECTOR", "verification.decide"), false);
  assert.equal(can("INSPECTOR", "finance.manage"), false);
  assert.equal(can("INSPECTOR", "fees.edit"), false);
  assert.equal(can("INSPECTOR", "roles.edit"), false);
});

test("finance can manage payments but cannot approve verification", () => {
  assert.equal(can("FINANCE", "finance.manage"), true);
  assert.equal(can("FINANCE", "verification.decide"), false);
  assert.equal(can("FINANCE", "roles.edit"), false);
});

test("admin has all privileged actions", () => {
  assert.equal(can("ADMIN", "verification.decide"), true);
  assert.equal(can("ADMIN", "fees.edit"), true);
  assert.equal(can("ADMIN", "refund.large"), true);
  assert.equal(can("ADMIN", "roles.edit"), true);
});
