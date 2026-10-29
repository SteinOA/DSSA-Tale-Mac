import { effectiveLocalHistoryEnabled, isPolicyActionAllowed, type PolicyDecisionSnapshot } from '../stores/policyRules';

/** Unresolved policy suspends checkpoint access; it is not a request to delete history. */
export function nbImportRetentionSnapshot(policy: PolicyDecisionSnapshot, personal: boolean, retentionDays: number) {
  const ready = policy.status === 'idle' || policy.status === 'unmanaged' || (policy.status === 'managed' && !!policy.policy);
  const knownForcedOn = policy.policy?.dataRetention?.localHistoryMode === 'always_on';
  // An explicit personal opt-out can be applied immediately unless a known policy requires history.
  const explicitOff = !personal && !knownForcedOn;
  return {
    synced: ready || explicitOff,
    enabled: ready && isPolicyActionAllowed(policy) ? effectiveLocalHistoryEnabled(policy, personal) : false,
    retentionDays,
  };
}
