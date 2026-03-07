export const FAILURE_POLICY_REJECT_BATCH = 'REJECT_BATCH' as const;

export type FailurePolicy = typeof FAILURE_POLICY_REJECT_BATCH;

export const DEFAULT_FAILURE_POLICY: FailurePolicy =
  FAILURE_POLICY_REJECT_BATCH;

export interface BalanceModuleConfig {
  failurePolicy: FailurePolicy;
}

function resolveFailurePolicy(envValue: string | undefined): FailurePolicy {
  if (!envValue) {
    return DEFAULT_FAILURE_POLICY;
  }
  if (envValue === FAILURE_POLICY_REJECT_BATCH) {
    return FAILURE_POLICY_REJECT_BATCH;
  }
  return DEFAULT_FAILURE_POLICY;
}

export const balanceConfig: BalanceModuleConfig = {
  failurePolicy: resolveFailurePolicy(process.env.BALANCE_FAILURE_POLICY),
};
