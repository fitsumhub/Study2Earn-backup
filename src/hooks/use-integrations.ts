import { useCallback, useEffect, useState } from "react";

import {
  DEFAULT_INTEGRATIONS,
  isValidAdsensePublisherId,
  readIntegrations,
  subscribeIntegrations,
  writeIntegrations,
  type CustomApiKey,
  type IntegrationsConfig,
} from "@/lib/integrations-store";

function nextKeyId() {
  return `key-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Live-synced access to third-party integration settings for the admin
 * console and the public site (AdSense loader). Persists to localStorage and
 * broadcasts to every subscriber, same pattern as useAds.
 */
export function useIntegrations() {
  const [config, setConfig] = useState<IntegrationsConfig>(DEFAULT_INTEGRATIONS);

  useEffect(() => {
    setConfig(readIntegrations());
    return subscribeIntegrations(() => setConfig(readIntegrations()));
  }, []);

  const persist = useCallback((next: IntegrationsConfig) => {
    setConfig(next);
    writeIntegrations(next);
  }, []);

  const setAdsense = useCallback(
    (patch: Partial<IntegrationsConfig["googleAdsense"]>) => {
      const current = readIntegrations();
      const publisherId = patch.publisherId ?? current.googleAdsense.publisherId;
      if (publisherId.trim() && !isValidAdsensePublisherId(publisherId)) {
        return {
          ok: false as const,
          error: "Publisher ID should look like ca-pub-1234567890123456",
        };
      }
      persist({ ...current, googleAdsense: { ...current.googleAdsense, ...patch } });
      return { ok: true as const };
    },
    [persist],
  );

  const setAiStudy = useCallback(
    (patch: Partial<Omit<IntegrationsConfig["aiStudy"], "custom">>) => {
      const current = readIntegrations();
      persist({ ...current, aiStudy: { ...current.aiStudy, ...patch } });
    },
    [persist],
  );

  const setAiStudyCustom = useCallback(
    (patch: Partial<IntegrationsConfig["aiStudy"]["custom"]>) => {
      const current = readIntegrations();
      persist({
        ...current,
        aiStudy: { ...current.aiStudy, custom: { ...current.aiStudy.custom, ...patch } },
      });
    },
    [persist],
  );

  const setAiStudyProviderSettings = useCallback(
    (
      provider: IntegrationsConfig["aiStudy"]["provider"],
      settings: Partial<{ apiKey: string; model: string; baseUrl: string }>,
    ) => {
      const current = readIntegrations();
      const existing = current.aiStudy.providers?.[provider] || {
        apiKey: "",
        model: "",
        baseUrl: "",
      };
      const updatedProvider = { ...existing, ...settings };
      const updatedProviders = {
        ...(current.aiStudy.providers || {}),
        [provider]: updatedProvider,
      };

      persist({
        ...current,
        aiStudy: {
          ...current.aiStudy,
          // If configuring the active provider, sync top-level apiKey and model
          ...(current.aiStudy.provider === provider
            ? {
                apiKey: updatedProvider.apiKey,
                ...(provider === "deepseek" ? { deepseekModel: updatedProvider.model } : {}),
                ...(provider === "custom"
                  ? {
                      custom: {
                        ...current.aiStudy.custom,
                        model: updatedProvider.model,
                        baseUrl: updatedProvider.baseUrl || "",
                      },
                    }
                  : {}),
              }
            : {}),
          providers: updatedProviders as any,
        },
      });
    },
    [persist],
  );

  const addCustomKey = useCallback(
    (label: string, value: string) => {
      if (!label.trim()) return { ok: false as const, error: "Label is required" };
      const current = readIntegrations();
      const key: CustomApiKey = { id: nextKeyId(), label: label.trim(), value: value.trim() };
      persist({ ...current, customKeys: [...current.customKeys, key] });
      return { ok: true as const };
    },
    [persist],
  );

  const updateCustomKey = useCallback(
    (id: string, patch: Partial<Omit<CustomApiKey, "id">>) => {
      const current = readIntegrations();
      persist({
        ...current,
        customKeys: current.customKeys.map((k) => (k.id === id ? { ...k, ...patch } : k)),
      });
    },
    [persist],
  );

  const removeCustomKey = useCallback(
    (id: string) => {
      const current = readIntegrations();
      persist({ ...current, customKeys: current.customKeys.filter((k) => k.id !== id) });
    },
    [persist],
  );

  return {
    config,
    setAdsense,
    setAiStudy,
    setAiStudyCustom,
    setAiStudyProviderSettings,
    addCustomKey,
    updateCustomKey,
    removeCustomKey,
  };
}
