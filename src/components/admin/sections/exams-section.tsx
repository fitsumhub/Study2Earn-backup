import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Eye,
  LayoutList,
  Pencil,
  Plus,
  Search,
  Settings2,
  Table2,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminDashboardState } from "@/hooks/use-admin-dashboard";
import {
  buildRealExamStats,
  EXAM_DIFFICULTIES,
  getBankHealth,
  realStatsKey,
  type BankHealth,
  type ExamRealStats,
} from "@/lib/admin-exam-data";
import type { AdminExam } from "@/lib/admin-types";
import type { ExamFormData } from "@/components/admin/forms/exam-form";
import { examToForm } from "@/components/admin/forms/exam-form";
import { examCourses, getCourseById } from "@/lib/exam-data";
import { cn } from "@/lib/utils";

// ─── helpers ──────────────────────────────────────────────────────────────────

function patchExamForm(
  exam: AdminExam,
  patch: Partial<Pick<AdminExam, "xpReward" | "passScore" | "duration" | "published">>,
): ExamFormData {
  return {
    ...examToForm(exam),
    xpReward: String(patch.xpReward ?? exam.xpReward),
    passScore: String(patch.passScore ?? exam.passScore),
    duration: String(patch.duration ?? exam.duration),
    published: patch.published ?? exam.published,
  };
}

// ─── main section ─────────────────────────────────────────────────────────────

export function ExamsSection({ admin }: { admin: AdminDashboardState }) {
  const {
    exams,
    searchQuery,
    setSearchQuery,
    toggleExamPublished,
    openExamManager,
    duplicateExam,
    publishCourseExams,
    deleteExam,
    updateExam,
  } = admin;

  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    () => new Set(examCourses.slice(0, 3).map((c) => c.id)),
  );
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState<AdminExam | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  // ── derived ────────────────────────────────────────────────────────────────
  // Real attempt analytics from actual student attempt records (read once per mount)
  const [realStats] = useState(() => buildRealExamStats());

  const healthById = useMemo(() => {
    const map = new Map<string, BankHealth>();
    for (const e of exams) map.set(e.id, getBankHealth(e.questionBank ?? [], e.questions));
    return map;
  }, [exams]);

  const stats = useMemo(() => {
    const published = exams.filter((e) => e.published).length;
    const totalQuestions = exams.reduce((sum, e) => sum + (e.questionBank?.length ?? 0), 0);
    let totalAttempts = 0;
    let totalPassed = 0;
    for (const s of realStats.values()) {
      totalAttempts += s.attempts;
      totalPassed += Math.round((s.passRate / 100) * s.attempts);
    }
    const withIssues = exams.filter((e) => !healthById.get(e.id)?.ok).length;
    return {
      total: exams.length,
      published,
      drafts: exams.length - published,
      courses: examCourses.length,
      totalQuestions,
      totalAttempts,
      passRate: totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : null,
      withIssues,
    };
  }, [exams, realStats, healthById]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return exams.filter((e) => {
      if (statusFilter === "published" && !e.published) return false;
      if (statusFilter === "draft" && e.published) return false;
      if (subjectFilter !== "all" && e.subject !== subjectFilter) return false;
      if (difficultyFilter !== "all" && e.difficulty !== difficultyFilter) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.chapterTitle.toLowerCase().includes(q) ||
        e.courseId.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q)
      );
    });
  }, [exams, statusFilter, subjectFilter, difficultyFilter, searchQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminExam[]>();
    for (const exam of filtered) {
      const key = exam.courseId || "uncategorized";
      const list = map.get(key) ?? [];
      list.push(exam);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => {
      const nameA = getCourseById(a[0])?.name ?? a[0];
      const nameB = getCourseById(b[0])?.name ?? b[0];
      return nameA.localeCompare(nameB);
    });
  }, [filtered]);

  const subjects = useMemo(() => [...new Set(exams.map((e) => e.subject))].sort(), [exams]);

  // ── selection helpers ──────────────────────────────────────────────────────
  const allFilteredIds = filtered.map((e) => e.id);
  const allSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) {
        s.delete(id);
      } else {
        s.add(id);
      }
      return s;
    });

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allFilteredIds));

  const clearSelection = () => setSelected(new Set());

  const publishToggleWithCheck = (exam: AdminExam) => {
    if (!exam.published) {
      const health = getBankHealth(exam.questionBank ?? [], exam.questions);
      if (!health.ok) {
        toast.warning(`Published "${exam.chapterTitle || exam.title}" with issues`, {
          description: health.issues.join(" · "),
        });
      }
    }
    toggleExamPublished(exam.id);
  };

  const bulkPublish = () => {
    let flagged = 0;
    for (const id of selected) {
      const exam = exams.find((e) => e.id === id);
      if (exam && !exam.published) {
        if (!healthById.get(exam.id)?.ok) flagged += 1;
        toggleExamPublished(id);
      }
    }
    if (flagged > 0) {
      toast.warning(
        `${flagged} published exam${flagged !== 1 ? "s have" : " has"} question-bank issues`,
        { description: "Look for the red issue badge and fix them in the Questions tab." },
      );
    }
    clearSelection();
  };

  const bulkUnpublish = () => {
    for (const id of selected) {
      const exam = exams.find((e) => e.id === id);
      if (exam && exam.published) toggleExamPublished(id);
    }
    clearSelection();
  };

  const bulkDeleteConfirmed = () => {
    for (const id of [...selected]) deleteExam(id);
    clearSelection();
    setConfirmBulkDelete(false);
  };

  const toggleCourse = (courseId: string) =>
    setExpandedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });

  // ── quick-edit handler ─────────────────────────────────────────────────────
  const handleQuickSave = (
    exam: AdminExam,
    patch: Partial<Pick<AdminExam, "xpReward" | "passScore" | "duration">>,
  ) => {
    updateExam(exam.id, patchExamForm(exam, patch));
  };

  return (
    <div className="space-y-6">
      {/* ── stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Chapter exams", value: stats.total, sub: `${stats.courses} courses` },
          { label: "Published", value: stats.published, sub: `${stats.drafts} drafts` },
          {
            label: "Question bank",
            value: stats.totalQuestions.toLocaleString(),
            sub:
              stats.withIssues > 0
                ? `${stats.withIssues} exam${stats.withIssues !== 1 ? "s" : ""} with issues`
                : "all banks healthy",
          },
          {
            label: "Student attempts",
            value: stats.totalAttempts.toLocaleString(),
            sub: stats.passRate !== null ? `${stats.passRate}% pass rate` : "no attempts yet",
          },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 font-serif text-2xl font-bold text-brand-navy">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── toolbar ── */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exams, chapters, courses…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tracks</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {EXAM_DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-md border bg-white shadow-sm">
            <button
              type="button"
              title="Grouped view"
              onClick={() => setViewMode("grouped")}
              className={cn(
                "flex items-center gap-1.5 rounded-l-md px-3 py-2 text-xs font-medium transition",
                viewMode === "grouped"
                  ? "bg-brand-navy text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <LayoutList className="size-3.5" /> Grouped
            </button>
            <button
              type="button"
              title="Table view"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 rounded-r-md border-l px-3 py-2 text-xs font-medium transition",
                viewMode === "table"
                  ? "bg-brand-navy text-white"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Table2 className="size-3.5" /> Table
            </button>
          </div>

          <Button
            className="gap-2 bg-brand-navy hover:bg-brand-navy/90"
            onClick={() => openExamManager()}
          >
            <Plus className="size-4" /> New exam
          </Button>
        </div>
      </div>

      {/* ── bulk action bar ── */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand-navy/20 bg-brand-navy/5 px-4 py-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <span className="text-sm font-semibold text-brand-navy">
            {selected.size} exam{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button size="sm" variant="outline" onClick={bulkPublish} className="gap-1.5">
              <Check className="size-3.5" /> Publish selected
            </Button>
            <Button size="sm" variant="outline" onClick={bulkUnpublish} className="gap-1.5">
              <X className="size-3.5" /> Unpublish selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirmBulkDelete(true)}
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive hover:text-white"
            >
              <Trash2 className="size-3.5" /> Delete selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {exams.length} chapter exams
        {searchQuery ? ` matching "${searchQuery}"` : ""}
      </p>

      {/* ══ TABLE VIEW ══ */}
      {viewMode === "table" &&
        (filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center text-muted-foreground">
              No exams match your filters.
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Exam / Chapter</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-center">Difficulty</TableHead>
                  <TableHead className="text-center">Q / min</TableHead>
                  <TableHead className="text-center">Pass %</TableHead>
                  <TableHead className="text-center">XP</TableHead>
                  <TableHead className="text-center">Attempts</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((exam) => {
                  const course = getCourseById(exam.courseId);
                  const real = realStats.get(realStatsKey(exam));
                  const health = healthById.get(exam.id);
                  return (
                    <TableRow
                      key={exam.id}
                      className={cn(selected.has(exam.id) && "bg-brand-navy/3")}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selected.has(exam.id)}
                          onCheckedChange={() => toggleSelect(exam.id)}
                          aria-label={`Select ${exam.title}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openExamManager(exam)}
                          className="text-left font-semibold text-brand-navy hover:underline text-sm"
                        >
                          {exam.chapterTitle || exam.title}
                        </button>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] text-muted-foreground font-mono">{exam.id}</p>
                          {health && !health.ok && <HealthBadge health={health} />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {course?.short ?? exam.courseId}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {exam.subject}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            exam.difficulty === "Advanced" &&
                              "border-red-200 text-red-600 bg-red-50",
                            exam.difficulty === "Intermediate" &&
                              "border-amber-200 text-amber-700 bg-amber-50",
                            exam.difficulty === "Easy" &&
                              "border-emerald-200 text-emerald-700 bg-emerald-50",
                          )}
                        >
                          {exam.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {exam.questions} Q / {exam.duration} min
                      </TableCell>
                      {/* Pass score — quick editable */}
                      <TableCell className="text-center">
                        <QuickEditCell
                          label="Pass score"
                          value={exam.passScore}
                          unit="%"
                          min={30}
                          max={100}
                          onSave={(v) => handleQuickSave(exam, { passScore: v })}
                        />
                      </TableCell>
                      {/* XP reward — quick editable */}
                      <TableCell className="text-center">
                        <QuickEditCell
                          label="XP reward"
                          value={exam.xpReward}
                          unit="XP"
                          min={10}
                          max={1000}
                          onSave={(v) => handleQuickSave(exam, { xpReward: v })}
                          highlight
                        />
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {real ? (
                          <div>
                            <p className="font-semibold text-slate-700">{real.attempts}</p>
                            <p className="text-[10px]">
                              {real.passRate}% pass · avg {real.avgScore}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => publishToggleWithCheck(exam)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors",
                            exam.published
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                          )}
                        >
                          {exam.published ? (
                            <>
                              <Check className="size-2.5" /> Live
                            </>
                          ) : (
                            "Draft"
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-brand-navy"
                            title="Edit exam"
                            onClick={() => openExamManager(exam)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Duplicate"
                            onClick={() => duplicateExam(exam.id)}
                          >
                            <Copy className="size-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Delete exam"
                            onClick={() => setConfirmDelete(exam)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        ))}

      {/* ══ GROUPED VIEW ══ */}
      {viewMode === "grouped" &&
        (grouped.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="py-16 text-center text-muted-foreground">
              No exams match your filters.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {grouped.map(([courseId, courseExams]) => {
              const course = getCourseById(courseId);
              const expanded = expandedCourses.has(courseId);
              const publishedCount = courseExams.filter((e) => e.published).length;
              const courseSelCount = courseExams.filter((e) => selected.has(e.id)).length;

              return (
                <Card key={courseId} className="overflow-hidden shadow-sm">
                  {/* div (not button) — the action buttons inside would otherwise
                      nest interactive elements, which is invalid HTML */}
                  <div className="flex w-full items-center gap-3 border-b bg-slate-50/80 px-5 py-4 text-left transition hover:bg-slate-100/80">
                    <button
                      type="button"
                      onClick={() => toggleCourse(courseId)}
                      aria-expanded={expanded}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {expanded ? (
                        <ChevronDown className="size-5 shrink-0 text-brand-navy" />
                      ) : (
                        <ChevronRight className="size-5 shrink-0 text-brand-navy" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block font-serif text-lg font-bold text-brand-navy">
                          {course?.name ?? "Other"}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {courseExams.length} chapters · {publishedCount} published ·{" "}
                          {course?.category ?? "—"}
                          {courseSelCount > 0 && (
                            <span className="ml-2 font-semibold text-brand-navy">
                              · {courseSelCount} selected
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => publishCourseExams(courseId)}
                        disabled={publishedCount === courseExams.length}
                      >
                        Publish all
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openExamManager(undefined, {
                            courseId,
                            subject: course?.category ?? "Common",
                            duration: String(course?.durationMinutes ?? 25),
                            questions: String(course?.questionsPerExam ?? 10),
                          })
                        }
                      >
                        <Plus className="size-3.5 mr-1" /> Add chapter
                      </Button>
                    </div>
                  </div>

                  {expanded && (
                    <CardContent className="divide-y p-0">
                      {courseExams.map((exam) => (
                        <ExamRow
                          key={exam.id}
                          exam={exam}
                          real={realStats.get(realStatsKey(exam))}
                          health={healthById.get(exam.id)}
                          selected={selected.has(exam.id)}
                          onSelect={() => toggleSelect(exam.id)}
                          onEdit={() => openExamManager(exam)}
                          onToggle={() => publishToggleWithCheck(exam)}
                          onDuplicate={() => duplicateExam(exam.id)}
                          onDelete={() => setConfirmDelete(exam)}
                          onQuickSave={(patch) => handleQuickSave(exam, patch)}
                        />
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        ))}

      {/* ── quick-tip card ── */}
      <Card className="border-dashed shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-serif text-brand-navy">
            <ClipboardList className="size-5" /> CRUD reference
          </CardTitle>
          <CardDescription className="space-y-1 text-sm">
            <span className="block">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">
                New exam
              </kbd>{" "}
              — create a chapter exam with full question bank editor.
            </span>
            <span className="block">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">
                Manage / Edit
              </kbd>{" "}
              — edit metadata + questions + preview before publishing.
            </span>
            <span className="block">
              <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">
                Quick edit
              </kbd>{" "}
              — click any XP or Pass% value in the table to edit inline.
            </span>
            <span className="block">
              Student route:{" "}
              <code className="rounded bg-slate-100 px-1 text-xs">
                /exams/&#123;course&#125;/&#123;chapter&#125;
              </code>
              . Publish an exam to make it visible to students.
            </span>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ── delete single confirmation ── */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete "{confirmDelete?.chapterTitle || confirmDelete?.title}"?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This exam ({confirmDelete?.id}) will be permanently removed.
              {confirmDelete && (realStats.get(realStatsKey(confirmDelete))?.attempts ?? 0) > 0 && (
                <span className="mt-1 block font-semibold text-amber-600">
                  Warning: {realStats.get(realStatsKey(confirmDelete))!.attempts} recorded student
                  attempt
                  {realStats.get(realStatsKey(confirmDelete))!.attempts !== 1 ? "s" : ""} will be
                  unlinked.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                deleteExam(confirmDelete!.id);
                setConfirmDelete(null);
              }}
            >
              Delete exam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── delete bulk confirmation ── */}
      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selected.size} exam{selected.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All {selected.size} selected exams will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={bulkDeleteConfirmed}
            >
              Delete {selected.size} exam{selected.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── ExamRow ──────────────────────────────────────────────────────────────────

function ExamRow({
  exam,
  real,
  health,
  selected,
  onSelect,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
  onQuickSave,
}: {
  exam: AdminExam;
  real?: ExamRealStats;
  health?: BankHealth;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onQuickSave: (patch: Partial<Pick<AdminExam, "xpReward" | "passScore" | "duration">>) => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors",
        selected && "bg-brand-navy/3",
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          aria-label={`Select ${exam.title}`}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="text-left font-semibold text-brand-navy hover:underline text-sm"
            >
              {exam.chapterTitle || exam.title}
            </button>
            <Badge
              variant="secondary"
              className={cn(
                exam.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600",
              )}
            >
              {exam.published ? "Published" : "Draft"}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                exam.difficulty === "Advanced" && "border-red-200 text-red-600",
                exam.difficulty === "Intermediate" && "border-amber-200 text-amber-700",
                exam.difficulty === "Easy" && "border-emerald-200 text-emerald-700",
              )}
            >
              {exam.difficulty}
            </Badge>
            {health && !health.ok && <HealthBadge health={health} />}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              {exam.questions} Q / {exam.duration} min
            </span>
            <span className="flex items-center gap-1">
              Pass:
              <QuickEditCell
                label="Pass score"
                value={exam.passScore}
                unit="%"
                min={30}
                max={100}
                onSave={(v) => onQuickSave({ passScore: v })}
                compact
              />
            </span>
            <span className="flex items-center gap-1 text-brand-gold font-medium">
              <Zap className="size-3" />
              <QuickEditCell
                label="XP reward"
                value={exam.xpReward}
                unit="XP"
                min={10}
                max={1000}
                onSave={(v) => onQuickSave({ xpReward: v })}
                compact
                highlight
              />
            </span>
            <span>{exam.questionBank?.length ?? 0} in bank</span>
            <span className={cn(real && "text-slate-600 font-medium")}>
              {real
                ? `${real.attempts} attempt${real.attempts !== 1 ? "s" : ""} · ${real.passRate}% pass · avg ${real.avgScore}%`
                : "no attempts yet"}
            </span>
          </div>
        </div>
      </div>

      {/* ── action buttons ── */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
        <Button size="sm" variant="outline" className="gap-1.5 h-8" onClick={onEdit}>
          <Settings2 className="size-3.5" /> Manage
        </Button>
        <Button size="sm" variant="ghost" className="gap-1.5 h-8" onClick={onEdit}>
          <Eye className="size-3.5" /> Preview
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={onDuplicate}
          title="Duplicate exam"
        >
          <Copy className="size-3.5" />
        </Button>
        <Button
          size="sm"
          variant={exam.published ? "outline" : "default"}
          className={cn("h-8 gap-1", !exam.published && "bg-brand-navy hover:bg-brand-navy/90")}
          onClick={onToggle}
        >
          {exam.published ? (
            <>
              <X className="size-3.5" /> Unpublish
            </>
          ) : (
            <>
              <Check className="size-3.5" /> Publish
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1 text-destructive hover:text-destructive hover:bg-destructive/5"
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}

// ─── HealthBadge ──────────────────────────────────────────────────────────────

function HealthBadge({ health }: { health: BankHealth }) {
  return (
    <Badge
      variant="outline"
      title={health.issues.join("\n")}
      className="gap-1 border-red-200 bg-red-50 text-[10px] text-red-600"
    >
      <AlertTriangle className="size-2.5" />
      {health.issues.length} issue{health.issues.length !== 1 ? "s" : ""}
    </Badge>
  );
}

// ─── QuickEditCell ────────────────────────────────────────────────────────────

function QuickEditCell({
  label,
  value,
  unit,
  min,
  max,
  onSave,
  compact = false,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  onSave: (v: number) => void;
  compact?: boolean;
  highlight?: boolean;
}) {
  const [draft, setDraft] = useState(String(value));
  const [open, setOpen] = useState(false);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n) && n >= min && n <= max) {
      onSave(n);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Edit ${label}`}
          className={cn(
            "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold transition-colors hover:ring-1",
            highlight
              ? "text-brand-gold hover:bg-brand-gold/8 hover:ring-brand-gold/30"
              : "hover:bg-slate-100 hover:ring-slate-300",
            compact ? "text-xs" : "text-sm",
          )}
        >
          <Pencil className="size-2.5 opacity-40" />
          {value} {unit}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-3" align="start">
        <p className="mb-2 text-xs font-semibold text-brand-navy">{label}</p>
        <div className="flex gap-2">
          <Input
            type="number"
            min={min}
            max={max}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setOpen(false);
            }}
            className="h-8 text-sm"
            autoFocus
          />
          <Label className="flex items-center text-xs text-muted-foreground">{unit}</Label>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Range: {min}–{max}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            className="flex-1 h-7 bg-brand-navy hover:bg-brand-navy/90 text-xs"
            onClick={commit}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
