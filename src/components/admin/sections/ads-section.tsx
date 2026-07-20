import {
  Clapperboard,
  Code2,
  Copy,
  Eye,
  Image as ImageIcon,
  Megaphone,
  MousePointerClick,
  Pencil,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/admin/forms/media-upload";
import { SponsorAdCard } from "@/components/sponsor-ad";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAds, type AdInput } from "@/hooks/use-ads";
import {
  AD_FORMATS,
  AD_PLACEMENTS,
  ROTATE_UNITS,
  formatLabel,
  placementLabel,
  rotateLabel,
  type AdFormat,
  type AdPlacement,
  type RotateUnit,
  type SponsorAd,
} from "@/lib/ad-store";
import { resolveMediaUrl } from "@/lib/media-store";
import { cn } from "@/lib/utils";

type EditState = { mode: "create" } | { mode: "edit"; ad: SponsorAd } | null;
type StatusFilter = "all" | "active" | "paused";

const formatIcon: Record<AdFormat, typeof Megaphone> = {
  banner: Megaphone,
  image: ImageIcon,
  video: Clapperboard,
  google: Code2,
};

const emptyForm: AdInput = {
  sponsor: "",
  title: "",
  body: "",
  format: "banner",
  imageUrl: "",
  videoUrl: "",
  adCode: "",
  ctaLabel: "Learn more",
  ctaUrl: "",
  placement: "library",
  active: true,
  rotateEvery: 30,
  rotateUnit: "seconds",
};

export function AdsSection() {
  const { ads, addAd, updateAd, deleteAd, duplicateAd, toggleActive, resetToDefaults } = useAds();
  const [editState, setEditState] = useState<EditState>(null);
  const [pendingDelete, setPendingDelete] = useState<SponsorAd | null>(null);
  const [search, setSearch] = useState("");
  const [placementFilter, setPlacementFilter] = useState<AdPlacement | "all">("all");
  const [formatFilter, setFormatFilter] = useState<AdFormat | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const activeCount = ads.filter((a) => a.active).length;
  const totalImpressions = ads.reduce((sum, a) => sum + a.impressions, 0);
  const totalClicks = ads.reduce((sum, a) => sum + a.clicks, 0);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ads.filter((ad) => {
      if (placementFilter !== "all" && ad.placement !== placementFilter) return false;
      if (formatFilter !== "all" && ad.format !== formatFilter) return false;
      if (statusFilter === "active" && !ad.active) return false;
      if (statusFilter === "paused" && ad.active) return false;
      if (!q) return true;
      return (
        ad.sponsor.toLowerCase().includes(q) ||
        ad.title.toLowerCase().includes(q) ||
        ad.body.toLowerCase().includes(q)
      );
    });
  }, [ads, search, placementFilter, formatFilter, statusFilter]);

  const hasFilters =
    search.trim() !== "" ||
    placementFilter !== "all" ||
    formatFilter !== "all" ||
    statusFilter !== "all";

  function clearFilters() {
    setSearch("");
    setPlacementFilter("all");
    setFormatFilter("all");
    setStatusFilter("all");
  }

  function handleDelete() {
    if (!pendingDelete) return;
    deleteAd(pendingDelete.id);
    toast.success(`Ad from "${pendingDelete.sponsor}" removed`);
    setPendingDelete(null);
  }

  function handleDuplicate(ad: SponsorAd) {
    const res = duplicateAd(ad.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`Duplicated "${ad.sponsor}" ad — paused, ready to edit`);
    setEditState({ mode: "edit", ad: res.ad });
  }

  const stats = [
    {
      label: "Total ads",
      value: ads.length,
      icon: Megaphone,
      tint: "bg-brand-navy/5 text-brand-navy",
    },
    { label: "Active", value: activeCount, icon: Eye, tint: "bg-emerald-50 text-emerald-700" },
    {
      label: "Impressions",
      value: totalImpressions.toLocaleString(),
      icon: Eye,
      tint: "bg-blue-50 text-blue-700",
    },
    {
      label: "Clicks",
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
      tint: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("flex size-11 items-center justify-center rounded-xl", s.tint)}>
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
                <p className="font-serif text-2xl font-bold text-brand-navy">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-lg font-bold text-brand-navy">
            Sponsor ads
            {hasFilters && (
              <span className="ml-2 font-sans text-sm font-normal text-slate-400">
                {filtered.length} of {ads.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-muted-foreground">
            Banner, image, video, or Google/embed ads. When several share a spot they rotate on each
            ad's interval.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              resetToDefaults();
              toast.success("Ads reset to defaults");
            }}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button className="gap-2" onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" />
            Add ad
          </Button>
        </div>
      </div>

      {/* Search + filters */}
      {ads.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search sponsor, headline, or body…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-white pl-9"
            />
          </div>
          <Select
            value={placementFilter}
            onValueChange={(v) => setPlacementFilter(v as AdPlacement | "all")}
          >
            <SelectTrigger className="w-full bg-white sm:w-40">
              <SelectValue placeholder="Placement" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All placements</SelectItem>
              {AD_PLACEMENTS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={formatFilter}
            onValueChange={(v) => setFormatFilter(v as AdFormat | "all")}
          >
            <SelectTrigger className="w-full bg-white sm:w-36">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All formats</SelectItem>
              {AD_FORMATS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full bg-white sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
              Clear
            </Button>
          )}
        </div>
      )}

      {/* List */}
      {ads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Megaphone className="mx-auto size-10 text-slate-300" />
          <p className="mt-4 font-semibold text-brand-navy">No sponsor ads yet</p>
          <p className="mt-1 text-sm text-slate-500">Add your first ad to start monetizing.</p>
          <Button className="mt-6 gap-2" onClick={() => setEditState({ mode: "create" })}>
            <Plus className="size-4" />
            Add ad
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
          <Search className="mx-auto size-10 text-slate-300" />
          <p className="mt-4 font-semibold text-brand-navy">No ads match your filters</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or filter.</p>
          <Button variant="outline" className="mt-6" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((ad) => {
            const ctr = ad.impressions > 0 ? Math.round((ad.clicks / ad.impressions) * 100) : 0;
            const FormatIcon = formatIcon[ad.format];
            const thumb = resolveMediaUrl(ad.imageUrl);
            return (
              <Card key={ad.id} className="group shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Thumb */}
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                      {thumb ? (
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-navy to-brand-gold text-white">
                          <FormatIcon className="size-5" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-slate-500">
                          {ad.sponsor}
                        </p>
                        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
                          <FormatIcon className="size-3" />
                          {formatLabel(ad.format)}
                        </Badge>
                        <Badge variant="secondary" className="shrink-0 text-[10px]">
                          {placementLabel(ad.placement)}
                        </Badge>
                        <Badge className="shrink-0 gap-1 bg-violet-100 text-[10px] text-violet-700">
                          <Repeat className="size-3" />
                          {rotateLabel(ad)}
                        </Badge>
                        {!ad.active && (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-slate-100 text-[10px] text-slate-500"
                          >
                            Paused
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate font-bold text-brand-navy">
                        {ad.title || <span className="text-slate-400">Untitled</span>}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-500">{ad.body}</p>

                      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="size-3.5" />
                          {ad.impressions.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MousePointerClick className="size-3.5" />
                          {ad.clicks.toLocaleString()}
                        </span>
                        <span className="font-mono text-slate-400">{ctr}% CTR</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Switch
                        checked={ad.active}
                        onCheckedChange={() => toggleActive(ad.id)}
                        aria-label={ad.active ? "Pause ad" : "Activate ad"}
                      />
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Edit ad"
                          onClick={() => setEditState({ mode: "edit", ad })}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          title="Duplicate ad"
                          onClick={() => handleDuplicate(ad)}
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive"
                          title="Delete ad"
                          onClick={() => setPendingDelete(ad)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AdDialog
        state={editState}
        onClose={() => setEditState(null)}
        onCreate={(data) => {
          const res = addAd(data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          toast.success(`Ad from "${data.sponsor}" added`);
          return true;
        }}
        onUpdate={(id, data) => {
          const res = updateAd(id, data);
          if (!res.ok) {
            toast.error(res.error);
            return false;
          }
          toast.success(`Ad from "${data.sponsor}" updated`);
          return true;
        }}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this ad?</AlertDialogTitle>
            <AlertDialogDescription>
              The ad from "{pendingDelete?.sponsor}" will be removed from every placement. This
              can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AdDialog({
  state,
  onClose,
  onCreate,
  onUpdate,
}: {
  state: EditState;
  onClose: () => void;
  onCreate: (data: AdInput) => boolean;
  onUpdate: (id: string, data: AdInput) => boolean;
}) {
  const editing = state?.mode === "edit" ? state.ad : null;
  const [form, setForm] = useState<AdInput>(emptyForm);

  const key = state?.mode === "edit" ? state.ad.id : (state?.mode ?? "closed");
  useEffect(() => {
    if (editing) {
      setForm({
        sponsor: editing.sponsor,
        title: editing.title,
        body: editing.body,
        format: editing.format,
        imageUrl: editing.imageUrl ?? "",
        videoUrl: editing.videoUrl ?? "",
        adCode: editing.adCode ?? "",
        ctaLabel: editing.ctaLabel,
        ctaUrl: editing.ctaUrl,
        placement: editing.placement,
        active: editing.active,
        rotateEvery: editing.rotateEvery,
        rotateUnit: editing.rotateUnit,
      });
    } else {
      setForm(emptyForm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const open = state !== null;
  const isGoogle = form.format === "google";
  const showCta = form.format !== "google";
  const canSave = form.sponsor.trim() !== "" && (isGoogle || form.title.trim() !== "");

  function set<K extends keyof AdInput>(field: K, value: AdInput[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function submit() {
    if (!canSave) return;
    const ok = editing ? onUpdate(editing.id, form) : onCreate(form);
    if (ok) onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit ad" : "New sponsor ad"}</DialogTitle>
          <DialogDescription>
            Pick a format and where it appears. Turn on the timed pop-up for a full-screen
            interstitial.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Format picker */}
          <div className="grid gap-2">
            <Label>Ad type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {AD_FORMATS.map((f) => {
                const Icon = formatIcon[f.value];
                const selected = form.format === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    title={f.hint}
                    onClick={() => set("format", f.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition",
                      selected
                        ? "border-brand-navy bg-brand-navy/5 text-brand-navy"
                        : "border-slate-200 text-slate-500 hover:border-brand-navy/40",
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-semibold">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ad-sponsor">Sponsor name</Label>
              <Input
                id="ad-sponsor"
                value={form.sponsor}
                onChange={(e) => set("sponsor", e.target.value)}
                placeholder="e.g. Ethio Telecom"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ad-placement">Placement</Label>
              <Select
                value={form.placement}
                onValueChange={(v) => set("placement", v as AdInput["placement"])}
              >
                <SelectTrigger id="ad-placement">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AD_PLACEMENTS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isGoogle && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="ad-title">Headline</Label>
                <Input
                  id="ad-title"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Study data bundle — 2GB for 25 ETB"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ad-body">Body</Label>
                <Textarea
                  id="ad-body"
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="One or two lines about the offer"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Format-specific media */}
          {form.format === "banner" && (
            <ImageUploadField
              label="Logo / image"
              value={form.imageUrl ?? ""}
              onChange={(v) => set("imageUrl", v)}
              hint="Optional — a branded tile is shown if empty. Paste a URL or upload."
            />
          )}

          {form.format === "image" && (
            <ImageUploadField
              label="Creative image"
              value={form.imageUrl ?? ""}
              onChange={(v) => set("imageUrl", v)}
              maxDim={1400}
              previewClassName="aspect-video h-auto w-24"
              hint="Full-width image creative. Paste a URL or upload."
            />
          )}

          {form.format === "video" && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ad-video">Video URL (mp4/webm)</Label>
                <Input
                  id="ad-video"
                  value={form.videoUrl}
                  onChange={(e) => set("videoUrl", e.target.value)}
                  placeholder="https://…/ad.mp4"
                />
                <p className="text-[11px] text-muted-foreground">
                  Host the video file and paste its URL — clips are too large to upload directly.
                </p>
              </div>
              <ImageUploadField
                label="Poster image (optional)"
                value={form.imageUrl ?? ""}
                onChange={(v) => set("imageUrl", v)}
                hint="Shown before the video plays. Paste a URL or upload."
              />
            </div>
          )}

          {isGoogle && (
            <div className="grid gap-2">
              <Label htmlFor="ad-code">Ad code / embed</Label>
              <Textarea
                id="ad-code"
                value={form.adCode}
                onChange={(e) => set("adCode", e.target.value)}
                placeholder={
                  'Paste your AdSense / ad-network snippet, e.g.\n<ins class="adsbygoogle" data-ad-client="ca-pub-…" data-ad-slot="…"></ins>'
                }
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave empty to show a placeholder slot. Pasted code runs on the live site.
              </p>
            </div>
          )}

          {showCta && (
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="ad-cta-label">Button label</Label>
                <Input
                  id="ad-cta-label"
                  value={form.ctaLabel}
                  onChange={(e) => set("ctaLabel", e.target.value)}
                  placeholder="Learn more"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ad-cta-url">Button link</Label>
                <Input
                  id="ad-cta-url"
                  value={form.ctaUrl}
                  onChange={(e) => set("ctaUrl", e.target.value)}
                  placeholder="https://sponsor.example"
                />
              </div>
            </div>
          )}

          {/* Rotation interval */}
          <div className="rounded-lg border bg-slate-50 px-3 py-2.5">
            <Label className="flex items-center gap-1.5 text-sm">
              <Repeat className="size-3.5" />
              Rotation interval
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              How long this ad shows before the slot rotates to the next ad in the same spot.
            </p>
            <div className="mt-3 flex items-center gap-3 border-t border-slate-200 pt-3">
              <Label htmlFor="ad-rotate" className="text-sm">
                Show for
              </Label>
              <Input
                id="ad-rotate"
                type="number"
                min={1}
                value={form.rotateEvery}
                onChange={(e) => set("rotateEvery", Number(e.target.value))}
                className="w-24"
              />
              <Select
                value={form.rotateUnit}
                onValueChange={(v) => set("rotateUnit", v as RotateUnit)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROTATE_UNITS.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2.5">
            <div>
              <Label htmlFor="ad-active" className="text-sm">
                Active
              </Label>
              <p className="text-xs text-muted-foreground">Show this ad on the live site</p>
            </div>
            <Switch
              id="ad-active"
              checked={form.active}
              onCheckedChange={(v) => set("active", v)}
            />
          </div>

          {/* Live preview */}
          <div className="rounded-lg border bg-slate-50 p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Preview
            </p>
            <SponsorAdCard
              preview
              ad={{
                sponsor: form.sponsor.trim() || "Sponsor name",
                title: form.title,
                body: form.body,
                format: form.format,
                imageUrl: form.imageUrl?.trim() || undefined,
                videoUrl: form.videoUrl?.trim() || undefined,
                adCode: form.adCode?.trim() || undefined,
                ctaLabel: form.ctaLabel,
                ctaUrl: form.ctaUrl,
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSave}>
            {editing ? "Save changes" : "Add ad"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
