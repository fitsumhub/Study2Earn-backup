import {
  ArrowUpRight,
  GripVertical,
  Megaphone,
  MoveDown,
  MoveUp,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent } from "@/hooks/use-site-content";
import type { FaqEntry } from "@/lib/site-content-store";

/** A labeled input bound directly to a field, saving on blur — matches the
 * "edit in place, no separate save step" feel of the rest of the admin. */
function LiveField({
  label,
  value,
  onCommit,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onCommit: (next: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  // Keep the field in sync when the underlying value changes from outside
  // this input (Reset to defaults, or a reorder swapping content between rows).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {multiline ? (
        <Textarea
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onCommit(draft)}
          rows={3}
        />
      ) : (
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => draft !== value && onCommit(draft)}
        />
      )}
    </div>
  );
}

export function SiteContentSection() {
  const {
    content,
    updateHero,
    updateTrustStripItem,
    updateAnnouncement,
    addFaq,
    updateFaq,
    deleteFaq,
    moveFaq,
    resetToDefaults,
  } = useSiteContent();
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingDeleteFaq, setPendingDeleteFaq] = useState<FaqEntry | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Site Content</h1>
          <p className="text-sm text-muted-foreground">
            Edit what visitors see on the public homepage — no code changes needed.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/" target="_blank" rel="noopener noreferrer" className="gap-2">
              <ArrowUpRight className="size-4" />
              View homepage
            </a>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" />
            Reset to defaults
          </Button>
        </div>
      </div>

      {/* Hero */}
      <Card>
        <CardHeader>
          <CardTitle>Hero section</CardTitle>
          <CardDescription>
            The first thing visitors see at the top of the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <LiveField
              label="Eyebrow badge"
              value={content.hero.eyebrow}
              onCommit={(v) => updateHero({ eyebrow: v })}
            />
            <LiveField
              label="Eyebrow badge (flash)"
              value={content.hero.eyebrowFlash}
              onCommit={(v) => updateHero({ eyebrowFlash: v })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <LiveField
              label="Headline"
              value={content.hero.headline}
              onCommit={(v) => updateHero({ headline: v })}
            />
            <LiveField
              label="Headline accent (gold line)"
              value={content.hero.headlineAccent}
              onCommit={(v) => updateHero({ headlineAccent: v })}
            />
          </div>
          <LiveField
            label="Amharic subtitle"
            value={content.hero.amharic}
            onCommit={(v) => updateHero({ amharic: v })}
          />
          <LiveField
            label="Description"
            value={content.hero.description}
            onCommit={(v) => updateHero({ description: v })}
            multiline
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <LiveField
              label="Primary button label"
              value={content.hero.primaryCta}
              onCommit={(v) => updateHero({ primaryCta: v })}
            />
            <LiveField
              label="Secondary button label"
              value={content.hero.secondaryCta}
              onCommit={(v) => updateHero({ secondaryCta: v })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Trust strip */}
      <Card>
        <CardHeader>
          <CardTitle>Trust strip</CardTitle>
          <CardDescription>
            The three small badges under the hero buttons (students / pass rate / free).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {content.trustStrip.map((label, i) => (
            <LiveField
              key={i}
              label={`Badge ${i + 1}`}
              value={label}
              onCommit={(v) => updateTrustStripItem(i as 0 | 1 | 2, v)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Announcement banner */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="size-4 text-brand-gold" />
                Announcement banner
              </CardTitle>
              <CardDescription>
                A dismissible bar shown above the nav on every page across the whole site.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {content.announcement.enabled ? "Live" : "Off"}
              </span>
              <Switch
                checked={content.announcement.enabled}
                onCheckedChange={(v) => updateAnnouncement({ enabled: v })}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <LiveField
            label="Message"
            value={content.announcement.message}
            onCommit={(v) => updateAnnouncement({ message: v })}
            multiline
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <LiveField
              label="Link label (optional)"
              value={content.announcement.linkLabel}
              onCommit={(v) => updateAnnouncement({ linkLabel: v })}
              placeholder="Learn more"
            />
            <LiveField
              label="Link URL (optional)"
              value={content.announcement.linkUrl}
              onCommit={(v) => updateAnnouncement({ linkUrl: v })}
              placeholder="/rewards"
            />
          </div>
          {content.announcement.enabled && content.announcement.message && (
            <div className="rounded-lg border bg-brand-navy px-4 py-2.5 text-center text-sm text-white">
              <span className="text-brand-gold">●</span> {content.announcement.message}
              {content.announcement.linkLabel && (
                <span className="ml-2 font-bold text-brand-gold">
                  {content.announcement.linkLabel} →
                </span>
              )}
              <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">
                Live preview — students who already dismissed the previous message will see this one
                again
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Frequently asked questions</CardTitle>
              <CardDescription>Shown near the bottom of the homepage.</CardDescription>
            </div>
            <Button size="sm" className="gap-2" onClick={addFaq}>
              <Plus className="size-4" />
              Add question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.faqs.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No FAQ entries — add one above.
            </p>
          )}
          {content.faqs.map((faq, i) => (
            <div key={faq.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <GripVertical className="size-3.5" />
                  Question {i + 1}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={i === 0}
                    onClick={() => moveFaq(faq.id, "up")}
                    aria-label="Move up"
                  >
                    <MoveUp className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={i === content.faqs.length - 1}
                    onClick={() => moveFaq(faq.id, "down")}
                    aria-label="Move down"
                  >
                    <MoveDown className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-red-500 hover:text-red-600"
                    onClick={() => setPendingDeleteFaq(faq)}
                    aria-label="Delete question"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3">
                <LiveField
                  label="Question"
                  value={faq.q}
                  onCommit={(v) => updateFaq(faq.id, { q: v })}
                />
                <LiveField
                  label="Answer"
                  value={faq.a}
                  onCommit={(v) => updateFaq(faq.id, { a: v })}
                  multiline
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all site content?</AlertDialogTitle>
            <AlertDialogDescription>
              This replaces the hero, trust strip, announcement, and every FAQ entry with the
              original defaults. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                resetToDefaults();
                setConfirmReset(false);
                toast.success("Site content reset to defaults");
              }}
            >
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!pendingDeleteFaq}
        onOpenChange={(open) => !open && setPendingDeleteFaq(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDeleteFaq?.q}" will be removed from the homepage FAQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (pendingDeleteFaq) {
                  deleteFaq(pendingDeleteFaq.id);
                  toast.success("Question removed");
                }
                setPendingDeleteFaq(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
