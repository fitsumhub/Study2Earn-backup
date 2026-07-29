import { Download, Share, SquarePlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwaInstall } from "@/hooks/use-pwa-install";

/** "Download as App" button — footer CTA that drives the PWA install flow. */
export function PwaInstallButton({ className }: { className?: string }) {
  const { canInstall, isIOS, promptInstall } = usePwaInstall();
  const [iosDialogOpen, setIosDialogOpen] = useState(false);

  if (!canInstall && !isIOS) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          if (canInstall) {
            void promptInstall();
          } else {
            setIosDialogOpen(true);
          }
        }}
      >
        <Download className="size-3.5" />
        Download as App
      </Button>

      <Dialog open={iosDialogOpen} onOpenChange={setIosDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Study2Earn to your Home Screen</DialogTitle>
            <DialogDescription>
              iOS doesn't let websites trigger this automatically — two quick taps in Safari:
            </DialogDescription>
          </DialogHeader>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-bold text-brand-navy">
                1
              </span>
              <span className="flex items-center gap-1.5">
                Tap the Share icon <Share className="size-4 text-brand-navy" /> in Safari's toolbar
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-navy/10 text-xs font-bold text-brand-navy">
                2
              </span>
              <span className="flex items-center gap-1.5">
                Scroll down and tap <SquarePlus className="size-4 text-brand-navy" /> "Add to Home
                Screen"
              </span>
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
}
