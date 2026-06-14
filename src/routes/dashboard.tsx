import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter, BookCover } from "@/components/site-chrome";
import { useExamProgress } from "@/hooks/use-exam-progress";
import { subjects, examHistory, leaderboard } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Study2Earn" },
      {
        name: "description",
        content: "Your study progress, recent books, exam history, and XP wallet.",
      },
    ],
  }),
  component: DashboardPage,
});

function formatAttemptDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreStyle(score: number) {
  if (score >= 80) return "bg-green-50 text-green-700";
  if (score >= 60) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

function DashboardPage() {
  const recent = subjects.slice(0, 4);
  const myRank = leaderboard.find((s) => s.name === "Abebe Balcha");
  const { getNextChapter, getRecentAttempts, getOverallStats, isChapterCompleted } =
    useExamProgress();
  const next = getNextChapter();
  const recentAttempts = getRecentAttempts(5);
  const examStats = getOverallStats();
  const nextIncomplete = next && !isChapterCompleted(next.course.id, next.chapter.id);
  const displayHistory =
    recentAttempts.length > 0
      ? recentAttempts.map((a) => ({
          key: a.id,
          title: `${a.chapterTitle} — ${a.courseName}`,
          date: formatAttemptDate(a.date),
          score: a.score,
          xp: a.xp,
        }))
      : examHistory.map((e) => ({
          key: e.title,
          title: e.title,
          date: e.date,
          score: e.score,
          xp: e.xp,
        }));

  const baseXp = 1240;
  const totalXp = baseXp + examStats.totalXp;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <header className="mb-12">
            <p className="text-sm font-medium text-brand-gold uppercase tracking-wider">
              Welcome back
            </p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-brand-navy mt-1">
              Hello, Abebe.
            </h1>
            <p className="mt-3 text-slate-600">
              Your Civil Engineering exit exam is in{" "}
              <span className="font-semibold text-brand-navy">42 days</span>.
              {examStats.total > 0 && (
                <>
                  {" "}
                  Mock exam progress:{" "}
                  <span className="font-semibold text-brand-navy">
                    {examStats.completed}/{examStats.total} chapters
                  </span>{" "}
                  ({examStats.percent}%).
                </>
              )}
            </p>
          </header>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: "Total XP",
                value: totalXp.toLocaleString(),
                sub: examStats.totalXp > 0 ? `+${examStats.totalXp} from mocks` : "+180 this week",
              },
              { label: "Study Streak", value: "12 days", sub: "Personal best" },
              {
                label: "Chapters Done",
                value: `${examStats.completed} / ${examStats.total || "—"}`,
                sub: `${examStats.percent}% of core courses`,
              },
              { label: "Global Rank", value: "#10", sub: "▲ Up 2 this week" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl bg-white p-6 border border-slate-100 shadow-sm"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {s.label}
                </p>
                <p className="mt-3 font-serif text-3xl font-bold text-brand-navy">{s.value}</p>
                <p className="mt-1 text-xs text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl bg-brand-navy p-8 text-white relative overflow-hidden">
              <div className="absolute -right-20 -top-20 size-64 bg-brand-gold/20 rounded-full blur-3xl" />
              <div className="relative">
                <span className="inline-block px-3 py-1 bg-white/10 text-[10px] font-bold uppercase tracking-widest rounded-full border border-white/20">
                  {nextIncomplete ? "Upcoming Mock" : "Continue Practice"}
                </span>
                {next ? (
                  <>
                    <h2 className="font-serif text-3xl font-bold mt-4">{next.chapter.title}</h2>
                    <p className="text-white/70 mt-2 mb-8">
                      {next.course.name} • {next.course.questionsPerExam} Questions •{" "}
                      {next.course.durationMinutes} Minutes
                    </p>
                    <Link
                      to="/exams/$courseId/$chapterId"
                      params={{
                        courseId: next.course.id,
                        chapterId: next.chapter.id,
                      }}
                      className="inline-block bg-brand-gold px-6 py-3 rounded-lg font-bold text-white text-sm hover:scale-105 transition-transform"
                    >
                      Start Exam Now
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="font-serif text-3xl font-bold mt-4">All chapters complete!</h2>
                    <p className="text-white/70 mt-2 mb-8">
                      Retake any chapter to improve your score.
                    </p>
                    <Link
                      to="/exams"
                      className="inline-block bg-brand-gold px-6 py-3 rounded-lg font-bold text-white text-sm hover:scale-105 transition-transform"
                    >
                      Browse Courses
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Next Reward
              </p>
              <h3 className="mt-3 font-serif text-xl font-bold text-brand-navy">100 ETB Airtime</h3>
              <p className="text-sm text-slate-500 mt-1">800 XP required</p>
              <div className="mt-6 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-gold"
                  style={{ width: `${Math.min(100, Math.round((totalXp / 800) * 100))}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">{totalXp} / 800 XP</p>
              <Link
                to="/rewards"
                className="mt-6 inline-block text-sm font-bold text-brand-navy underline decoration-brand-gold underline-offset-4"
              >
                Browse rewards
              </Link>
            </div>

            <div className="lg:col-span-2 rounded-2xl bg-white p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-brand-navy">Continue reading</h3>
                <Link to="/library" className="text-sm font-medium text-brand-navy hover:underline">
                  All books
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recent.map((b) => (
                  <div key={b.name} className="group cursor-pointer">
                    <div className="mb-3">
                      <BookCover short={b.short} name={b.name} />
                    </div>
                    <h4 className="text-xs font-bold leading-tight line-clamp-2">{b.name}</h4>
                    <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-navy"
                        style={{ width: `${30 + b.chapters * 4}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-brand-navy">Your ranking</h3>
                <Link
                  to="/leaderboard"
                  className="text-sm font-medium text-brand-navy hover:underline"
                >
                  View
                </Link>
              </div>
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((s) => (
                  <div key={s.rank} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-bold text-xs ${s.rank === 1 ? "text-brand-gold" : "text-slate-400"}`}
                      >
                        {String(s.rank).padStart(2, "0")}
                      </span>
                      <span className="font-medium">
                        {s.name.split(" ")[0]} {s.name.split(" ")[1]?.[0]}.
                      </span>
                    </div>
                    <span className="text-xs font-mono text-slate-500">
                      {s.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
                {myRank && (
                  <div className="flex items-center justify-between text-sm pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-brand-gold">
                        {String(myRank.rank).padStart(2, "0")}
                      </span>
                      <span className="font-bold text-brand-navy">You</span>
                    </div>
                    <span className="text-xs font-mono text-brand-navy font-bold">
                      {myRank.xp.toLocaleString()} XP
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 rounded-2xl bg-white p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-brand-navy">Recent exams</h3>
                <Link to="/exams" className="text-sm font-medium text-brand-navy hover:underline">
                  All courses
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-3">Exam</th>
                      <th className="py-3">Date</th>
                      <th className="py-3">Score</th>
                      <th className="py-3 text-right">XP Earned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayHistory.map((e) => (
                      <tr key={e.key} className="border-b border-slate-50 last:border-0">
                        <td className="py-4 font-medium">{e.title}</td>
                        <td className="py-4 text-slate-500">{e.date}</td>
                        <td className="py-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${scoreStyle(e.score)}`}
                          >
                            {e.score}%
                          </span>
                        </td>
                        <td className="py-4 text-right font-mono font-bold text-brand-gold">
                          +{e.xp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
