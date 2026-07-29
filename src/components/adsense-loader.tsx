import { useEffect } from "react";

import { useIntegrations } from "@/hooks/use-integrations";

const SCRIPT_ID = "study2earn-adsense-loader";

/**
 * Invisible component mounted at the root. Injects (or removes) the Google
 * AdSense loader script site-wide based on the admin-configured publisher ID
 * and enabled toggle in Integrations settings.
 */
export function AdSenseLoader() {
  const { config } = useIntegrations();
  const { publisherId, enabled } = config.googleAdsense;

  useEffect(() => {
    const existing = document.getElementById(SCRIPT_ID);
    if (!enabled || !publisherId) {
      existing?.remove();
      return;
    }
    if (existing && existing.getAttribute("data-ad-client") === publisherId) return;
    existing?.remove();

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`;
    script.crossOrigin = "anonymous";
    script.setAttribute("data-ad-client", publisherId);
    document.head.appendChild(script);
  }, [enabled, publisherId]);

  return null;
}
