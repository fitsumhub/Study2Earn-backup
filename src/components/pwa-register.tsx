import { useEffect } from "react";

/**
 * Invisible component mounted at the root. Registers the minimal service
 * worker (public/sw.js) so the browser considers the app installable —
 * required by several browsers' PWA install-eligibility checks alongside
 * the web manifest.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installability just won't be available — nothing else depends on this.
    });
  }, []);

  return null;
}
