import { useCallback, useEffect, useState } from "react";

// Not in the standard DOM lib typings yet — this is the real shape Chromium
// browsers send.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function detectIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as "MacIntel" with touch support — the standard sniff.
  const isIPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIOSDevice || isIPadOS;
}

function detectStandalone() {
  if (typeof window === "undefined") return false;
  const mql = window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari's own non-standard flag — not covered by the media query.
  const iosStandalone = (navigator as { standalone?: boolean }).standalone === true;
  return mql || iosStandalone;
}

/**
 * Drives the "Download as App" install flow.
 *
 * - Chromium (desktop/Android): captures `beforeinstallprompt` and exposes
 *   `promptInstall()` to trigger the native install dialog.
 * - iOS Safari: never fires `beforeinstallprompt` — `isIOS` is exposed so
 *   the caller can show "Add to Home Screen" instructions instead.
 * - Already installed / unsupported browser (e.g. desktop Firefox): neither
 *   `canInstall` nor `isIOS` is true, so the caller can hide the button.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  // Both start false (SSR-safe) and get their real value from a client-only
  // effect below — computing these in the initializer would run during SSR
  // too (Node has a synthetic `navigator`), causing a hydration mismatch for
  // real iOS visitors when the client then wants to show the button.
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsInstalled(detectStandalone());
    setIsIOS(detectIOS());
  }, []);

  useEffect(() => {
    if (isInstalled) return;

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isInstalled]);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return choice.outcome;
  }, [deferredPrompt]);

  return {
    canInstall: !isInstalled && deferredPrompt !== null,
    isIOS: !isInstalled && isIOS,
    isInstalled,
    promptInstall,
  };
}
