export const adminStats = [
  {
    label: "Total Students",
    value: "24,850",
    change: "+12.4%",
    trend: "up" as const,
    sub: "vs last month",
  },
  {
    label: "Active Today",
    value: "3,214",
    change: "+8.1%",
    trend: "up" as const,
    sub: "68% of weekly avg",
  },
  {
    label: "Exams Completed",
    value: "18,402",
    change: "+22.6%",
    trend: "up" as const,
    sub: "this month",
  },
  {
    label: "Rewards Redeemed",
    value: "1,847",
    change: "-3.2%",
    trend: "down" as const,
    sub: "ETB 184,700 value",
  },
];

export const weeklyEngagement = [
  { day: "Mon", active: 2840, exams: 420 },
  { day: "Tue", active: 3120, exams: 510 },
  { day: "Wed", active: 2980, exams: 480 },
  { day: "Thu", active: 3350, exams: 590 },
  { day: "Fri", active: 3214, exams: 540 },
  { day: "Sat", active: 1890, exams: 310 },
  { day: "Sun", active: 1640, exams: 260 },
];

export const examsBySubject = [
  { subject: "Physics", count: 3240 },
  { subject: "Maths", count: 4120 },
  { subject: "English", count: 2890 },
  { subject: "Civics", count: 1980 },
  { subject: "Biology", count: 2560 },
  { subject: "Logic", count: 1612 },
];

export const recentUsers = [
  {
    id: "STU-8841",
    name: "Selamawit Tadesse",
    university: "Addis Ababa University",
    program: "Civil Engineering",
    status: "active" as const,
    joined: "Jun 14, 2026",
    xp: 4820,
  },
  {
    id: "STU-8840",
    name: "Yonas Bekele",
    university: "Jimma University",
    program: "Medicine",
    status: "active" as const,
    joined: "Jun 14, 2026",
    xp: 4150,
  },
  {
    id: "STU-8839",
    name: "Hanna Demissie",
    university: "Bahir Dar University",
    program: "Electrical Eng.",
    status: "pending" as const,
    joined: "Jun 13, 2026",
    xp: 0,
  },
  {
    id: "STU-8838",
    name: "Dawit Haile",
    university: "Mekelle University",
    program: "Computer Science",
    status: "active" as const,
    joined: "Jun 13, 2026",
    xp: 3720,
  },
  {
    id: "STU-8837",
    name: "Meron Tesfaye",
    university: "Hawassa University",
    program: "Law",
    status: "suspended" as const,
    joined: "Jun 12, 2026",
    xp: 3540,
  },
  // Matches DEMO_USER.id in auth-data.ts, so the signed-in demo account has a
  // real row here too — adjusting its XP from admin actually updates the
  // demo account's own wallet, not just a disconnected mock number.
  {
    id: "STU-8842",
    name: "Abebe Balcha",
    university: "Addis Ababa University",
    program: "Engineering",
    status: "active" as const,
    joined: "Jun 10, 2026",
    xp: 1240,
  },
];

export const adminActivity = [
  {
    time: "2 min ago",
    action: "New registration",
    detail: "Hanna Demissie — Bahir Dar University",
    type: "user" as const,
  },
  {
    time: "18 min ago",
    action: "Reward redeemed",
    detail: "100 ETB Airtime — Abebe Balcha",
    type: "reward" as const,
  },
  {
    time: "42 min ago",
    action: "Exam published",
    detail: "Structural Analysis II — 60 questions",
    type: "exam" as const,
  },
  {
    time: "1 hr ago",
    action: "Content updated",
    detail: "General Physics Ch. 8 — MoE curriculum sync",
    type: "content" as const,
  },
  {
    time: "2 hr ago",
    action: "Flag resolved",
    detail: "Duplicate account report — STU-7712",
    type: "moderation" as const,
  },
];

export const universityBreakdown = [
  { name: "Addis Ababa University", students: 4820, share: 19.4 },
  { name: "Jimma University", students: 3140, share: 12.6 },
  { name: "Bahir Dar University", students: 2890, share: 11.6 },
  { name: "Mekelle University", students: 2410, share: 9.7 },
  { name: "Hawassa University", students: 2180, share: 8.8 },
];

export const platformHealth = [
  { label: "API uptime", value: "99.97%", status: "healthy" as const },
  { label: "Avg response", value: "142ms", status: "healthy" as const },
  { label: "MoE sync", value: "11/12", status: "warning" as const },
  { label: "Error rate", value: "0.04%", status: "healthy" as const },
];

export const readingHoursTrend = [
  { day: "Mon", hours: 1240 },
  { day: "Tue", hours: 1380 },
  { day: "Wed", hours: 1290 },
  { day: "Thu", hours: 1510 },
  { day: "Fri", hours: 1420 },
  { day: "Sat", hours: 890 },
  { day: "Sun", hours: 760 },
];

export const xpRedemptionTrend = [
  { week: "W1", redeemed: 420, issued: 5800 },
  { week: "W2", redeemed: 510, issued: 6200 },
  { week: "W3", redeemed: 480, issued: 5900 },
  { week: "W4", redeemed: 437, issued: 6100 },
];

export const topPerformers = [
  { rank: 1, name: "Selamawit Tadesse", university: "AAU", xp: 4820, exams: 28, streak: 18 },
  { rank: 2, name: "Yonas Bekele", university: "Jimma", xp: 4150, exams: 24, streak: 14 },
  { rank: 3, name: "Dawit Haile", university: "Mekelle", xp: 3720, exams: 21, streak: 11 },
  { rank: 4, name: "Meron Tesfaye", university: "Hawassa", xp: 3540, exams: 19, streak: 9 },
  { rank: 5, name: "Abebe Balcha", university: "AAU", xp: 2640, exams: 15, streak: 12 },
];

export const overviewMiniStats = [
  { label: "Avg study time", value: "2h 14m", sub: "per active student today" },
  { label: "Chapter completion", value: "67%", sub: "across all courses" },
  { label: "Pending approvals", value: "3", sub: "students awaiting review" },
  { label: "Open flags", value: "2", sub: "moderation queue" },
];

export const trackEngagement = [
  { track: "Natural Science", students: 9840, completion: 72 },
  { track: "Social Science", students: 7120, completion: 64 },
  { track: "Common", students: 5280, completion: 78 },
  { track: "Engineering", students: 1640, completion: 58 },
  { track: "Medicine", students: 970, completion: 51 },
];
