import { useEffect, useState, type FormEvent } from "react";

import { FormField } from "@/components/admin/forms/field";
import { Button } from "@/components/ui/button";
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
import type { AdminExam, AdminExamQuestion } from "@/lib/admin-types";
import {
  EXAM_DIFFICULTIES,
  getChapterOptions,
  getCourseOptions,
  templateQuestionsForChapter,
} from "@/lib/admin-exam-data";
import { getCourseById } from "@/lib/exam-data";

export type ExamFormData = {
  title: string;
  subject: string;
  questions: string;
  duration: string;
  difficulty: string;
  published: boolean;
  courseId: string;
  chapterId: string;
  chapterTitle: string;
  description: string;
  passScore: string;
  xpReward: string;
  questionBank: AdminExamQuestion[];
};

const emptyExam: ExamFormData = {
  title: "",
  subject: "Common",
  questions: "10",
  duration: "25",
  difficulty: "Intermediate",
  published: false,
  courseId: "",
  chapterId: "",
  chapterTitle: "",
  description: "",
  passScore: "60",
  xpReward: "100",
  questionBank: [],
};

export function ExamForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  compact,
}: {
  initial?: Partial<ExamFormData>;
  onSubmit: (data: ExamFormData) => void;
  onCancel?: () => void;
  submitLabel?: string;
  compact?: boolean;
}) {
  const [form, setForm] = useState<ExamFormData>({ ...emptyExam, ...initial });
  const courses = getCourseOptions();
  const chapters = getChapterOptions(form.courseId);

  useEffect(() => {
    setForm({ ...emptyExam, ...initial });
  }, [initial]);

  const set = <K extends keyof ExamFormData>(key: K, value: ExamFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onCourseChange = (courseId: string) => {
    const course = getCourseById(courseId);
    const firstChapter = course?.chapters[0];
    setForm((prev) => ({
      ...prev,
      courseId,
      chapterId: firstChapter?.id ?? "",
      chapterTitle: firstChapter?.title ?? "",
      subject: course?.category ?? prev.subject,
      duration: String(course?.durationMinutes ?? prev.duration),
      questions: String(course?.questionsPerExam ?? prev.questions),
      title: firstChapter ? `${course?.short} — ${firstChapter.title}` : prev.title,
    }));
  };

  const onChapterChange = (chapterId: string) => {
    const chapter = chapters.find((c) => c.id === chapterId);
    const course = getCourseById(form.courseId);
    setForm((prev) => ({
      ...prev,
      chapterId,
      chapterTitle: chapter?.title ?? "",
      title: chapter && course ? `${course.short} — ${chapter.title}` : prev.title,
    }));
  };

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="grid gap-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Course</Label>
          <Select value={form.courseId || undefined} onValueChange={onCourseChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Chapter</Label>
          <Select
            value={form.chapterId || undefined}
            onValueChange={onChapterChange}
            disabled={!form.courseId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chapter" />
            </SelectTrigger>
            <SelectContent>
              {chapters.map((ch) => (
                <SelectItem key={ch.id} value={ch.id}>
                  {ch.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormField
        label="Exam title"
        id="exam-title"
        value={form.title}
        onChange={(v) => set("title", v)}
        required
      />

      {!compact && (
        <div className="grid gap-2">
          <Label htmlFor="exam-description">Description</Label>
          <Textarea
            id="exam-description"
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Shown to students before they start the mock exam"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField
          label="Subject track"
          id="exam-subject"
          value={form.subject}
          onChange={(v) => set("subject", v)}
          required
        />
        <div className="grid gap-2">
          <Label>Difficulty</Label>
          <Select value={form.difficulty} onValueChange={(v) => set("difficulty", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_DIFFICULTIES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <FormField
          label="Questions / attempt"
          id="exam-questions"
          type="number"
          value={form.questions}
          onChange={(v) => set("questions", v)}
          required
          min={1}
          max={100}
        />
        <FormField
          label="Duration (min)"
          id="exam-duration"
          type="number"
          value={form.duration}
          onChange={(v) => set("duration", v)}
          required
          min={1}
        />
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="Pass score (%)"
            id="exam-pass"
            type="number"
            value={form.passScore}
            onChange={(v) => set("passScore", v)}
            min={1}
            max={100}
          />
          <FormField
            label="XP reward"
            id="exam-xp"
            type="number"
            value={form.xpReward}
            onChange={(v) => set("xpReward", v)}
            min={1}
          />
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="exam-published">Published</Label>
          <p className="text-xs text-muted-foreground">
            Visible to students on /exams when enabled
          </p>
        </div>
        <Switch
          id="exam-published"
          checked={form.published}
          onCheckedChange={(v) => set("published", v)}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}

export function examToForm(exam: AdminExam): ExamFormData {
  return {
    title: exam.title,
    subject: exam.subject,
    questions: String(exam.questions),
    duration: String(exam.duration),
    difficulty: exam.difficulty,
    published: exam.published,
    courseId: exam.courseId,
    chapterId: exam.chapterId,
    chapterTitle: exam.chapterTitle,
    description: exam.description,
    passScore: String(exam.passScore),
    xpReward: String(exam.xpReward),
    questionBank: exam.questionBank ?? [],
  };
}

/** Parses a numeric field, falling back to `fallback` for NaN/zero/negative/out-of-range input. */
function parseBounded(raw: string, fallback: number, min: number, max: number): number {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
}

export function formToExam(
  data: ExamFormData,
  id?: string,
): Omit<AdminExam, "id"> & { id?: string } {
  return {
    id,
    title: data.title,
    subject: data.subject,
    questions: parseBounded(data.questions, 10, 1, 100),
    duration: parseBounded(data.duration, 25, 1, 300),
    difficulty: data.difficulty,
    published: data.published,
    courseId: data.courseId,
    chapterId: data.chapterId,
    chapterTitle: data.chapterTitle,
    description: data.description,
    passScore: parseBounded(data.passScore, 60, 1, 100),
    xpReward: parseBounded(data.xpReward, 100, 1, 5000),
    questionBank: data.questionBank,
    attempts: 0,
  };
}

export function loadTemplateBank(courseId: string, chapterId: string): AdminExamQuestion[] {
  return templateQuestionsForChapter(courseId, chapterId);
}
