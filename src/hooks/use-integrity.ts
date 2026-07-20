import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_RULES,
  readIntegrityEvents,
  readIntegrityRules,
  resetIntegrityRules,
  setIntegrityEventStatus,
  subscribeIntegrity,
  updateIntegrityRule,
  type IntegrityEvent,
  type IntegrityRuleConfig,
  type IntegrityRuleId,
  type IntegrityRules,
  type IntegrityStatus,
} from "@/lib/integrity-store";

/**
 * Live-synced access to the anti-abuse rule config and the violation log for
 * the admin Moderation console. Changes persist to localStorage and broadcast
 * to every subscriber (admin + the in-app enforcers like the reading timer).
 */
export function useIntegrity() {
  const [rules, setRules] = useState<IntegrityRules>(DEFAULT_RULES);
  const [events, setEvents] = useState<IntegrityEvent[]>([]);

  useEffect(() => {
    const refresh = () => {
      setRules(readIntegrityRules());
      setEvents(readIntegrityEvents());
    };
    refresh();
    return subscribeIntegrity(refresh);
  }, []);

  const updateRule = useCallback((id: IntegrityRuleId, patch: Partial<IntegrityRuleConfig>) => {
    updateIntegrityRule(id, patch);
  }, []);

  const toggleRule = useCallback((id: IntegrityRuleId) => {
    updateIntegrityRule(id, { enabled: !readIntegrityRules()[id].enabled });
  }, []);

  const resetRules = useCallback(() => resetIntegrityRules(), []);

  const setEventStatus = useCallback((id: string, status: IntegrityStatus) => {
    setIntegrityEventStatus(id, status);
  }, []);

  return {
    rules,
    events,
    activeRuleCount: (Object.keys(rules) as IntegrityRuleId[]).filter((id) => rules[id].enabled)
      .length,
    updateRule,
    toggleRule,
    resetRules,
    setEventStatus,
  };
}
