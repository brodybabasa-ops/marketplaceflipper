export type SelectCriteria = {
  requireVerified: boolean;
  minCompletedJobs: number;
  minRating: number;
  maxDisputeRate: number;
  minCompletionRate: number;
  maxResponseMinutes: number;
  minRepeatCustomers: number;
};

export const DEFAULT_SELECT_CRITERIA: SelectCriteria = {
  requireVerified: true,
  minCompletedJobs: 25,
  minRating: 4.8,
  maxDisputeRate: 2,
  minCompletionRate: 95,
  maxResponseMinutes: 20,
  minRepeatCustomers: 5,
};

export type SelectSignals = {
  verificationLevel: string;
  completedJobsCount: number;
  averageRating: number;
  disputeRate: number;
  completionRate: number;
  avgResponseMinutes: number;
  repeatCustomers: number;
};

export function evaluateSelect(signals: SelectSignals, criteria: SelectCriteria = DEFAULT_SELECT_CRITERIA) {
  const failures: string[] = [];
  if (criteria.requireVerified && signals.verificationLevel !== "POCKET_VERIFIED") {
    failures.push("Pocket Mechanic Verified is required");
  }
  if (signals.completedJobsCount < criteria.minCompletedJobs) {
    failures.push(`Needs ${criteria.minCompletedJobs}+ completed Pocket Mechanic repairs`);
  }
  if (signals.averageRating < criteria.minRating) {
    failures.push(`Needs ${criteria.minRating.toFixed(1)}+ rating`);
  }
  if (signals.disputeRate > criteria.maxDisputeRate) {
    failures.push("Dispute rate is above the Select threshold");
  }
  if (signals.completionRate < criteria.minCompletionRate) {
    failures.push("Completion rate is below the Select threshold");
  }
  if (signals.avgResponseMinutes > criteria.maxResponseMinutes) {
    failures.push("Response time is slower than the Select threshold");
  }
  if (signals.repeatCustomers < criteria.minRepeatCustomers) {
    failures.push("Needs more repeat customers");
  }
  return { eligible: failures.length === 0, failures, criteria };
}
