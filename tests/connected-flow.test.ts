import assert from "node:assert/strict";
import { test } from "node:test";
import { providerAssignmentPlan } from "../services/jobs";
import { groupedEstimateTypeForJob, shouldAppendFindingToOpenPrimary, totalsForGroups } from "../services/repair-groups";

test("Fix It match binds the existing request instead of opening a second intake", () => {
  const open = providerAssignmentPlan({
    actorId: "cust-1",
    customerId: "cust-1",
    requestStatus: "OPEN",
    mechanicProfileId: "mech-1",
    jobs: [],
  });
  assert.equal(open.ok, true);
  if (open.ok) assert.equal(open.action, "create");

  const reuse = providerAssignmentPlan({
    actorId: "cust-1",
    customerId: "cust-1",
    requestStatus: "MATCHED",
    mechanicProfileId: "mech-1",
    jobs: [{ id: "job-1", mechanicProfileId: "mech-1", status: "REQUESTED" }],
  });
  assert.equal(reuse.ok, true);
  if (reuse.ok && reuse.action === "reuse") assert.equal(reuse.jobId, "job-1");

  const switchProvider = providerAssignmentPlan({
    actorId: "cust-1",
    customerId: "cust-1",
    requestStatus: "MATCHED",
    mechanicProfileId: "mech-2",
    jobs: [{ id: "job-1", mechanicProfileId: "mech-1", status: "REQUESTED" }],
  });
  assert.equal(switchProvider.ok, true);
  if (switchProvider.ok && switchProvider.action === "create") {
    assert.deepEqual(switchProvider.cancelJobIds, ["job-1"]);
  }

  const blocked = providerAssignmentPlan({
    actorId: "cust-1",
    customerId: "cust-1",
    requestStatus: "ACCEPTED",
    mechanicProfileId: "mech-2",
    jobs: [{ id: "job-1", mechanicProfileId: "mech-1", status: "IN_PROGRESS" }],
  });
  assert.equal(blocked.ok, false);

  const stranger = providerAssignmentPlan({
    actorId: "other",
    customerId: "cust-1",
    requestStatus: "OPEN",
    mechanicProfileId: "mech-1",
    jobs: [],
  });
  assert.equal(stranger.ok, false);
});

test("findings join the open primary estimate until authorization, then become a supplemental", () => {
  assert.equal(shouldAppendFindingToOpenPrimary(false, true), true);
  assert.equal(shouldAppendFindingToOpenPrimary(true, true), false);
  assert.equal(groupedEstimateTypeForJob(false, "PRIMARY"), "PRIMARY");
  assert.equal(groupedEstimateTypeForJob(true, "PRIMARY"), "CHANGE_ORDER");
});

test("canonical authorization plus wheel-bearing supplemental stacks to $1,229", () => {
  const original = totalsForGroups([
    { status: "APPROVED", totalCents: 68000 },
    { status: "DECLINED", totalCents: 112000 },
    { status: "APPROVED", totalCents: 12900 },
  ]);
  const supplemental = totalsForGroups([{ status: "APPROVED", totalCents: 42000 }]);
  assert.equal(original.authorizedCents, 80900);
  assert.equal(original.declinedCents, 112000);
  assert.equal(original.pendingCents, 0);
  assert.equal(original.authorizedCents + supplemental.authorizedCents, 122900);
});
