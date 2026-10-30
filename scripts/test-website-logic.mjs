/**
 * Comprehensive Automated Logic & Business Rules Test Suite for Study2Earn
 *
 * Usage:
 *   node --experimental-strip-types --import ./scripts/register-loader.mjs scripts/test-website-logic.mjs
 */

import { strict as assert } from "node:assert";

// Setup browser/localStorage polyfill for store tests
const storage = new Map();
globalThis.window = globalThis;
globalThis.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
globalThis.Event = class Event {
  constructor(type) {
    this.type = type;
  }
};
globalThis.dispatchEvent = () => true;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};

// ─── Domain Imports ─────────────────────────────────────────────────────────

// 1. Withdrawals & Ethiopian Banks
import {
  XP_PER_ETB,
  MIN_WITHDRAWAL_ETB,
  MAX_WITHDRAWAL_ETB,
  ETB_PER_USDT,
  XP_PER_USDT,
  MIN_WITHDRAWAL_USDT,
  MAX_WITHDRAWAL_USDT,
  xpToEtb,
  etbToXp,
  xpToUsdt,
  usdtToXp,
  isValidBinanceUid,
} from "@/lib/withdrawal-data";
import { ethiopianBanks, getBankById } from "@/lib/ethiopian-banks";
import { readWithdrawals, writeWithdrawals } from "@/lib/withdrawal-store";

// 2. Exam Progress & Scoring
import { calculateExamXp } from "@/hooks/use-exam-progress";
import {
  examCourses,
  getChapter,
  getCourseById,
  buildQuestionBank,
  getExamQuestions,
  PASSING_SCORE,
} from "@/lib/exam-data";

// 3. Mistakes Bank
import {
  readMistakes,
  writeMistakes,
  recordExamMistakes,
  resolveMistake,
  bumpMistake,
  clearResolvedMistakes,
} from "@/lib/mistake-store";

// 4. Reading Time & Library
import {
  READING_REWARD_HOURS,
  READING_REWARD_ETB,
  READING_REWARD_TARGET_SECONDS,
  READING_REWARD_XP,
  formatReadingDuration,
  readingProgressPercent,
  readingHoursRemaining,
} from "@/lib/reading-time-data";
import {
  readReadingTime,
  addReadingSeconds,
  penalizeReadingSeconds,
  canClaimReadingReward,
  claimReadingReward,
} from "@/lib/reading-time-store";
import { libraryBooks } from "@/lib/mock-data";
import { getBookPdfUrl, DEFAULT_BOOK_PDF } from "@/lib/book-pdfs";

// 5. Reward Kinds & Ad-Free
import { kindOf, adFreeDaysFromTitle, kindMeta } from "@/lib/reward-kind";
import { readPerks, isAdFreeActive, extendAdFree } from "@/lib/perks-store";
import {
  readCosmetics,
  unlockGlow,
  setActiveGlow,
  glowFromRewardTitle,
} from "@/lib/cosmetics-store";

// 6. Referrals & Tiers
import {
  REFERRAL_SIGNUP_XP,
  REFERRAL_COMPLETE_XP,
  REFERRAL_FRIEND_BONUS,
  referralTiers,
  generateReferralCode,
} from "@/lib/referral-data";

// 7. Integrity & Anti-Abuse
import {
  DEFAULT_RULES,
  readIntegrityRules,
  updateIntegrityRule,
  resetIntegrityRules,
  readIntegrityEvents,
  recordIntegrityEvent,
  setIntegrityEventStatus,
  clearIntegrityEvents,
} from "@/lib/integrity-store";

// 8. AI Study Subject Classifier
import { detectSubject, detectSubjectFromText } from "@/components/ai-study/subject";

// 9. Auth & Access Control
import {
  readAuth,
  writeAuth,
  signIn,
  signOut,
  updateUser,
  isAuthenticated,
  readRegisteredUsers,
  saveRegisteredUser,
  findRegisteredUser,
  authenticateUser,
  getRememberedEmail,
  setRememberedEmail,
} from "@/lib/auth-store";
import { DEMO_USER, isAdminUser, isProtectedRoute, defaultSession } from "@/lib/auth-data";

// 10. Admin Store & Categories
import {
  readAdminData,
  writeAdminData,
  buildDefaultAdminData,
  clearAdminData,
} from "@/lib/admin-store";
import {
  readCategories,
  writeCategories,
  resetCategories,
  categoryBadgeClass,
  categoryColorKey,
  slugifyCategory,
  DEFAULT_CATEGORIES,
} from "@/lib/category-store";

// 11. Integrations Store
import {
  readIntegrations,
  writeIntegrations,
  isValidAdsensePublisherId,
  DEFAULT_INTEGRATIONS,
} from "@/lib/integrations-store";

// 12. Profile Frames Store & Catalog
import {
  PROFILE_FRAMES,
  RARITY_META,
  RARITY_ORDER,
  getFrameById,
  getFramesByRarity,
} from "@/lib/frame-data";
import {
  readFrames,
  unlockFrame,
  equipFrame,
} from "@/lib/frame-store";

// 13. Dynamic Profile Synchronization & Leaderboard Engine
import {
  getEffectiveLeaderboard,
  getEffectiveUniversityStudents,
  getEffectiveUniversityRankings,
  getUserNationalRank,
} from "@/lib/leaderboard-store";

// ─── Test Harness ───────────────────────────────────────────────────────────

let totalSuites = 0;
let totalTests = 0;
let passedTests = 0;

function suite(name) {
  totalSuites++;
  console.log(`\n\x1b[1m\x1b[34m[SUITE ${totalSuites}] ${name}\x1b[0m`);
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (err) {
    console.error(`  \x1b[31m✗\x1b[0m ${name}`);
    console.error(`    \x1b[31m${err.message}\x1b[0m`);
    throw err;
  }
}

// ─── Test Implementations ───────────────────────────────────────────────────

async function runAllTests() {
  console.log("\x1b[1m\x1b[36m=====================================================\x1b[0m");
  console.log("\x1b[1m\x1b[36m   Study2Earn Website Logic & Domain Rules Test Suite \x1b[0m");
  console.log("\x1b[1m\x1b[36m=====================================================\x1b[0m");

  // ─── Suite 1: Wallet, XP & Conversions ────────────────────────────────────
  suite("Wallet, XP & Financial Conversions");

  test("XP starting balances for guests, students, and referred students", () => {
    const guestXp = 0;
    const studentBaseXp = 50;
    const referredStudentXp = studentBaseXp + REFERRAL_FRIEND_BONUS;

    assert.equal(guestXp, 0);
    assert.equal(studentBaseXp, 50);
    assert.equal(
      referredStudentXp,
      100,
      "Referred student must start with 100 XP (50 base + 50 bonus)",
    );
  });

  test("Wallet lifetime earned, spent, and zero-floor balance math", () => {
    const baseXp = 50;
    const examXp = 275;
    const referralXp = 200;
    const libraryXp = 80;
    const lifetimeEarned = baseXp + examXp + referralXp + libraryXp;
    assert.equal(lifetimeEarned, 605, "Lifetime XP must strictly equal the sum of all 4 sources");

    // Standard spending
    const redeemedXp = 300;
    const pendingWithdrawalXp = 100;
    const spentXp = redeemedXp + pendingWithdrawalXp;
    const balance = Math.max(0, lifetimeEarned - spentXp);
    assert.equal(balance, 205, "Balance = lifetimeEarned - spentXp");

    // Overspend edge case: balance MUST floor at 0, never negative
    const hugeOverspend = 2000;
    const flooredBalance = Math.max(0, lifetimeEarned - hugeOverspend);
    assert.equal(
      flooredBalance,
      0,
      "Wallet balance must never drop below 0 under any circumstance",
    );
  });

  test("ETB <-> XP conversion rates and edge cases", () => {
    assert.equal(XP_PER_ETB, 8, "Conversion rate must be 8 XP = 1 ETB");
    assert.equal(etbToXp(50), 400);
    assert.equal(etbToXp(100), 800);
    assert.equal(etbToXp(250), 2000);

    // Rounding down fractional ETB
    assert.equal(xpToEtb(400), 50);
    assert.equal(xpToEtb(407), 50, "xpToEtb must floor fractional amounts");
    assert.equal(xpToEtb(799), 99);
    assert.equal(xpToEtb(800), 100);

    // Min / Max limits
    assert.equal(MIN_WITHDRAWAL_ETB, 50, "Min withdrawal is 50 ETB");
    assert.equal(MAX_WITHDRAWAL_ETB, 5000, "Max withdrawal is 5000 ETB");
  });

  test("USDT <-> XP conversion rates and Binance UID validation", () => {
    assert.equal(ETB_PER_USDT, 135, "1 USDT is valued at 135 ETB equivalent");
    assert.equal(XP_PER_USDT, 1080, "1 USDT must convert to 1080 XP (8 * 135)");

    assert.equal(usdtToXp(3), 3240);
    assert.equal(usdtToXp(5), 5400);
    assert.equal(usdtToXp(10), 10800);

    assert.equal(xpToUsdt(3240), 3.0);
    assert.equal(xpToUsdt(5400), 5.0);
    assert.equal(xpToUsdt(10850), 10.04, "xpToUsdt truncates to 2 decimal places");

    // Limits
    assert.equal(MIN_WITHDRAWAL_USDT, 3);
    assert.equal(MAX_WITHDRAWAL_USDT, 40);

    // Binance UID format validation (6–12 numeric digits)
    assert.ok(isValidBinanceUid("123456"), "6 digits is valid");
    assert.ok(isValidBinanceUid("349021558"), "9 digits is valid");
    assert.ok(isValidBinanceUid("123456789012"), "12 digits is valid");
    assert.ok(isValidBinanceUid("  349021558  "), "Trims whitespace");

    assert.ok(!isValidBinanceUid("12345"), "5 digits is too short");
    assert.ok(!isValidBinanceUid("1234567890123"), "13 digits is too long");
    assert.ok(!isValidBinanceUid("UID-123456"), "Alphanumeric is rejected");
    assert.ok(!isValidBinanceUid(""), "Empty string is rejected");
    assert.ok(!isValidBinanceUid("abcdef"), "Letters only are rejected");
  });

  // ─── Suite 2: Mock Exam Engine & Scoring ──────────────────────────────────
  suite("Mock Exam Engine & Scoring Calculations");

  test("calculateExamXp: scoring formula and first-completion bonus", () => {
    // Formula: Math.round(score / 10) * 5 + (firstCompletion && score >= 60 ? 25 : 0)

    // First completion with passing score >= 60%
    assert.equal(calculateExamXp(100, true), 75, "100% first completion = 50 + 25 = 75 XP");
    assert.equal(calculateExamXp(95, true), 75, "95% rounds to 10 * 5 + 25 = 75 XP");
    assert.equal(calculateExamXp(94, true), 70, "94% rounds to 9 * 5 + 25 = 70 XP");
    assert.equal(calculateExamXp(80, true), 65, "80% = 40 + 25 = 65 XP");
    assert.equal(calculateExamXp(60, true), 55, "60% exact passing threshold = 30 + 25 = 55 XP");

    // Below passing threshold (< 60%): NO first-completion bonus
    assert.equal(calculateExamXp(59, true), 30, "59% first completion = 30 base + 0 bonus");
    assert.equal(calculateExamXp(50, true), 25, "50% first completion = 25 base + 0 bonus");
    assert.equal(calculateExamXp(40, true), 20, "40% first completion = 20 base + 0 bonus");
    assert.equal(calculateExamXp(0, true), 0, "0% first completion = 0 base + 0 bonus");

    // Retakes (firstCompletion = false): NEVER award the 25 XP bonus
    assert.equal(calculateExamXp(100, false), 50, "100% retake = 50 XP (no bonus)");
    assert.equal(calculateExamXp(80, false), 40, "80% retake = 40 XP (no bonus)");
    assert.equal(calculateExamXp(60, false), 30, "60% retake = 30 XP (no bonus)");
    assert.equal(calculateExamXp(40, false), 20, "40% retake = 20 XP (no bonus)");
    assert.equal(calculateExamXp(0, false), 0, "0% retake = 0 XP");
  });

  test("Question Bank Integrity: validate all courses, chapters, and MCQs", () => {
    assert.ok(examCourses.length > 0, "Exam courses must not be empty");
    assert.equal(PASSING_SCORE, 60, "Passing score threshold is 60%");
    let totalQuestionsCount = 0;

    for (const course of examCourses) {
      assert.ok(course.id, `Course must have id, got: ${course.id}`);
      assert.ok(course.name, `Course ${course.id} must have a name`);
      assert.ok(course.durationMinutes > 0, `Course ${course.id} duration must be > 0`);
      assert.ok(course.questionsPerExam > 0, `Course ${course.id} questionsPerExam must be > 0`);
      assert.ok(
        Array.isArray(course.chapters) && course.chapters.length > 0,
        `Course ${course.id} must have chapters`,
      );

      for (const chapter of course.chapters) {
        assert.ok(chapter.id, `Chapter must have id in ${course.id}`);
        assert.ok(chapter.title, `Chapter must have title in ${course.id}`);

        // Verify chapter lookup helper
        const lookedUp = getChapter(course.id, chapter.id);
        assert.equal(lookedUp?.id, chapter.id);

        // Build question bank for this chapter
        const bank = buildQuestionBank(course, chapter);
        assert.ok(
          bank.length >= course.questionsPerExam,
          `Bank has at least ${course.questionsPerExam} questions (got ${bank.length})`,
        );

        for (const q of bank) {
          totalQuestionsCount++;
          assert.ok(
            q.id.startsWith(`${course.id}-${chapter.id}-`),
            `Question id prefix check: ${q.id}`,
          );
          assert.ok(
            q.question.includes(course.name) || q.question.includes(chapter.title),
            `Question template substituted course or chapter into stem: ${q.question}`,
          );
          assert.ok(
            Array.isArray(q.options) && q.options.length >= 2,
            `Question ${q.id} must have at least 2 options`,
          );
          assert.ok(
            Number.isInteger(q.correctIndex) &&
              q.correctIndex >= 0 &&
              q.correctIndex < q.options.length,
            `Question ${q.id} correctIndex ${q.correctIndex} is out of bounds [0, ${q.options.length - 1}]`,
          );
          assert.ok(
            typeof q.explanation === "string" && q.explanation.length > 0,
            `Question ${q.id} must have explanation`,
          );
        }

        // Test random exam subset generator
        const examSubset = getExamQuestions(course, chapter, 42);
        assert.equal(
          examSubset.length,
          course.questionsPerExam,
          `Exam subset generates exactly ${course.questionsPerExam} questions`,
        );
      }
    }
    assert.ok(
      totalQuestionsCount >= 100,
      `Verified at least 100 questions generated across all courses (found ${totalQuestionsCount})`,
    );
  });

  // ─── Suite 3: Mistake Notebook Store & Lifecycle ──────────────────────────
  suite("Mistake Notebook Store & Lifecycle");

  test("Mistake notebook: recording misses, retrying, resolving, and clearing", () => {
    storage.clear();

    const course = examCourses[0];
    const chapter = course.chapters[0];
    const bank = buildQuestionBank(course, chapter);
    const [q1, q2, q3] = bank.slice(0, 3);

    // Initial state: 0 mistakes
    assert.equal(readMistakes().length, 0);

    // Submit exam: q1 correct, q2 wrong answer, q3 skipped (undefined answer)
    const examAnswers = {
      [q1.id]: q1.correctIndex, // Correct
      [q2.id]: (q2.correctIndex + 1) % q2.options.length, // Wrong
      // q3 omitted = skipped
    };

    recordExamMistakes(course, chapter, [q1, q2, q3], examAnswers);

    const afterFirstExam = readMistakes();
    assert.equal(afterFirstExam.length, 2, "2 mistakes recorded (q2 wrong, q3 skipped)");

    const m2 = afterFirstExam.find((m) => m.questionId === q2.id);
    const m3 = afterFirstExam.find((m) => m.questionId === q3.id);

    assert.ok(m2 && !m2.resolved && m2.missCount === 1, "q2 is unresolved with missCount 1");
    assert.ok(m3 && !m3.resolved && m3.missCount === 1, "q3 is unresolved with missCount 1");

    // Practice mode: answer q2 correctly -> resolves it
    resolveMistake(q2.id);
    const afterResolve = readMistakes();
    const m2Resolved = afterResolve.find((m) => m.questionId === q2.id);
    assert.equal(m2Resolved?.resolved, true, "q2 is now marked resolved");

    // Practice mode: miss q3 again -> bumps counter and keeps resolved = false
    bumpMistake(q3.id);
    const afterBump = readMistakes();
    const m3Bumped = afterBump.find((m) => m.questionId === q3.id);
    assert.equal(m3Bumped?.missCount, 2, "q3 missCount bumped to 2");
    assert.equal(m3Bumped?.resolved, false, "q3 remains unresolved");

    // Clear resolved mistakes: removes q2, preserves unresolved q3
    clearResolvedMistakes();
    const afterClear = readMistakes();
    assert.equal(afterClear.length, 1, "Only 1 unresolved mistake remains");
    assert.equal(afterClear[0].questionId, q3.id);

    // Later exam: answer q3 correctly -> automatically marks resolved
    recordExamMistakes(course, chapter, [q3], { [q3.id]: q3.correctIndex });
    const afterRetest = readMistakes();
    assert.equal(afterRetest[0].resolved, true, "q3 is resolved after correct exam answer");
  });

  // ─── Suite 4: MoE Library & Reading Progression ──────────────────────────
  suite("MoE Library & Reading Progression");

  test("Reading duration formatting and time calculations", () => {
    assert.equal(formatReadingDuration(0), "0m");
    assert.equal(formatReadingDuration(45), "0m");
    assert.equal(formatReadingDuration(60), "1m");
    assert.equal(formatReadingDuration(1800), "30m");
    assert.equal(formatReadingDuration(3600), "1h 0m");
    assert.equal(formatReadingDuration(5400), "1h 30m");
    assert.equal(formatReadingDuration(36000), "10h 0m");
    assert.equal(formatReadingDuration(39660), "11h 1m");
  });

  test("Reading progress percent and hours remaining", () => {
    assert.equal(READING_REWARD_TARGET_SECONDS, 36000, "10 hours target is 36,000 seconds");
    assert.equal(READING_REWARD_ETB, 100, "100 ETB reward");
    assert.equal(READING_REWARD_XP, 800, "800 XP reward (100 * 8)");

    assert.equal(readingProgressPercent(0), 0);
    assert.equal(readingProgressPercent(9000), 25);
    assert.equal(readingProgressPercent(18000), 50);
    assert.equal(readingProgressPercent(27000), 75);
    assert.equal(readingProgressPercent(36000), 100);
    assert.equal(readingProgressPercent(50000), 100, "Progress percent caps at 100%");

    assert.equal(readingHoursRemaining(0), 10);
    assert.equal(readingHoursRemaining(18000), 5);
    assert.equal(
      readingHoursRemaining(35999),
      1,
      "Ceiling rounded: 1 second left requires 1 hour block",
    );
    assert.equal(readingHoursRemaining(36000), 0);
    assert.equal(readingHoursRemaining(40000), 0, "No hours remaining once target exceeded");
  });

  test("Library reading tick and chapter completion formula", () => {
    // 30s tick = 1% progress = 5 XP
    const SECONDS_PER_TICK = 30;
    const XP_PER_PERCENT = 5;
    assert.equal(100 * XP_PER_PERCENT, 500, "100% read of a book earns 500 XP");

    // Chapter completion calculation
    function completedChapters(progress, totalChapters) {
      return Math.floor((progress / 100) * totalChapters);
    }

    assert.equal(completedChapters(0, 6), 0);
    assert.equal(completedChapters(50, 6), 3);
    assert.equal(completedChapters(99, 6), 5);
    assert.equal(completedChapters(100, 6), 6);
  });

  test("Library catalog structure and PDF links", () => {
    assert.ok(libraryBooks.length > 0, "Library books catalog is populated");
    assert.equal(DEFAULT_BOOK_PDF, "/pdfs/sample-textbook.pdf");
    for (const book of libraryBooks) {
      assert.ok(book.id, "Book must have an ID");
      assert.ok(book.name, `Book ${book.id} must have a name`);
      assert.ok(book.chapters > 0, `Book ${book.id} chapters must be > 0`);
      assert.ok(book.pages > 0, `Book ${book.id} pages must be > 0`);
      assert.ok(book.category, `Book ${book.id} category must be defined`);
      const pdfUrl = getBookPdfUrl(book);
      assert.ok(
        pdfUrl && typeof pdfUrl === "string" && pdfUrl.length > 0,
        `Book ${book.id} must resolve to a valid PDF URL`,
      );
    }
  });

  test("Reading time store: adding seconds, active days streak, and anti-abuse clawback", () => {
    storage.clear();
    const userId = "STU-TEST-1";

    // Add reading time: 1 hour (3600 seconds)
    addReadingSeconds(userId, 3600);
    let record = readReadingTime(userId);
    assert.equal(record.totalSeconds, 3600);
    assert.equal(record.rewardClaimed, false);
    assert.ok(
      Array.isArray(record.activeDays) && record.activeDays.length === 1,
      "1 active day recorded",
    );

    // Add 1 more hour
    addReadingSeconds(userId, 3600);
    record = readReadingTime(userId);
    assert.equal(record.totalSeconds, 7200);

    // Anti-abuse penalty: student caught idling for 10 minutes (600s clawback)
    penalizeReadingSeconds(userId, 600);
    record = readReadingTime(userId);
    assert.equal(record.totalSeconds, 6600, "7200 - 600 = 6600 seconds");

    // Huge penalty floors at 0, never negative
    penalizeReadingSeconds(userId, 100000);
    record = readReadingTime(userId);
    assert.equal(record.totalSeconds, 0, "Penalized reading seconds must floor at 0");

    // Eligibility check
    assert.equal(canClaimReadingReward(userId), false, "Cannot claim reward at 0 seconds");
  });

  // ─── Suite 5: Redemptions, Ethiopian Banking & Withdrawals ────────────────
  suite("Redemptions, Ethiopian Banking & Withdrawals");

  test("Reward classification (kindOf) and title override heuristics", () => {
    // Strict tags
    assert.equal(kindOf("ETB"), "etb");
    assert.equal(kindOf("USDT"), "usdt");
    assert.equal(kindOf("Theme"), "theme");
    assert.equal(kindOf("AdFree"), "adfree");

    // Case insensitivity
    assert.equal(kindOf("etb"), "etb");
    assert.equal(kindOf("usdt"), "usdt");
    assert.equal(kindOf("theme"), "theme");
    assert.equal(kindOf("adfree"), "adfree");

    // Title keyword overrides
    assert.equal(
      kindOf("Unknown", "Bronze Profile Glow"),
      "theme",
      "Glow keyword overrides tag to theme",
    );
    assert.equal(
      kindOf("Unknown", "VIP Silver Theme"),
      "theme",
      "Theme keyword overrides tag to theme",
    );
    assert.equal(
      kindOf("Unknown", "1-Month Ad-Free"),
      "adfree",
      "Ad-Free keyword overrides tag to adfree",
    );
    assert.equal(
      kindOf("Unknown", "Browse with No Ads"),
      "adfree",
      "No Ads keyword overrides tag to adfree",
    );
    assert.equal(
      kindOf("Unknown", "10 USDT Binance Payout"),
      "usdt",
      "USDT keyword overrides tag to usdt",
    );
    assert.equal(kindOf("Other", "General Reward"), "etb", "Default fallback is etb");
  });

  test("Ad-free perk duration parser", () => {
    assert.equal(adFreeDaysFromTitle("1-Month Ad-Free"), 30);
    assert.equal(adFreeDaysFromTitle("3 Month Ad-Free Pass"), 90);
    assert.equal(adFreeDaysFromTitle("6-Month VIP Ad-Free"), 180);
    assert.equal(adFreeDaysFromTitle("1-Year Ad-Free"), 365);
    assert.equal(adFreeDaysFromTitle("2 Year Ad-Free"), 730);
    assert.equal(adFreeDaysFromTitle("Standard Ad-Free Perk"), 30, "Default fallback is 30 days");
  });

  test("Ethiopian Banks dataset integrity", () => {
    assert.equal(ethiopianBanks.length, 15, "15 official Ethiopian banks configured");

    const cbe = getBankById("cbe");
    assert.ok(cbe);
    assert.equal(cbe.name, "Commercial Bank of Ethiopia");
    assert.equal(cbe.short, "CBE");

    const awash = getBankById("awash");
    assert.ok(awash);
    assert.equal(awash.name, "Awash Bank");

    const dashen = getBankById("dashen");
    assert.ok(dashen);
    assert.equal(dashen.name, "Dashen Bank");

    assert.equal(getBankById("non-existent-bank"), undefined);
  });

  test("Withdrawal store: write, read, and persistence", () => {
    storage.clear();
    const initial = readWithdrawals();
    assert.ok(initial.length > 0, "Default seed withdrawals exist");

    const sampleRequest = {
      id: "WD-9999",
      userId: "STU-8842",
      userName: "Abebe Balcha",
      university: "Addis Ababa University",
      method: "bank",
      bankId: "cbe",
      bankName: "Commercial Bank of Ethiopia",
      accountNumber: "100012345678",
      accountName: "Abebe Balcha",
      amountEtb: 150,
      xpDeducted: 1200,
      status: "pending",
      requestedAt: "Jun 14, 2026",
    };

    writeWithdrawals([sampleRequest, ...initial]);
    const updated = readWithdrawals();
    assert.equal(updated.length, initial.length + 1);
    assert.equal(updated[0].id, "WD-9999");
    assert.equal(updated[0].status, "pending");
  });

  // ─── Suite 6: Cosmetics & Perks Stacking ──────────────────────────────────
  suite("Cosmetics & Perks Stacking");

  test("Cosmetics store: unlock glow, prevent duplicates, and equip active", () => {
    storage.clear();
    const userId = "USER-COSMETICS-1";

    assert.deepEqual(readCosmetics(userId), { owned: [], active: null });

    // Unlock bronze
    unlockGlow(userId, "bronze");
    let cosm = readCosmetics(userId);
    assert.deepEqual(cosm.owned, ["bronze"]);
    assert.equal(cosm.active, "bronze", "Unlocking immediately equips the glow");

    // Unlock same glow again: must be idempotent, no duplicates
    unlockGlow(userId, "bronze");
    cosm = readCosmetics(userId);
    assert.equal(cosm.owned.length, 1, "No duplicates in owned array");

    // Unlock silver
    unlockGlow(userId, "silver");
    cosm = readCosmetics(userId);
    assert.deepEqual(cosm.owned, ["bronze", "silver"]);
    assert.equal(cosm.active, "silver");

    // Switch active glow back to bronze
    setActiveGlow(userId, "bronze");
    assert.equal(readCosmetics(userId).active, "bronze");

    // Attempting to equip an unowned glow (e.g. "gold") must be rejected/ignored
    setActiveGlow(userId, "gold");
    assert.equal(readCosmetics(userId).active, "bronze", "Equipping unowned glow was ignored");

    // Unequip
    setActiveGlow(userId, null);
    assert.equal(readCosmetics(userId).active, null);
  });

  test("glowFromRewardTitle mapping helper", () => {
    assert.equal(glowFromRewardTitle("Bronze Profile Glow"), "bronze");
    assert.equal(glowFromRewardTitle("Silver VIP Badge"), "silver");
    assert.equal(glowFromRewardTitle("Emerald Ring"), "emerald");
    assert.equal(glowFromRewardTitle("Purple / Violet Ring"), "violet");
    assert.equal(glowFromRewardTitle("Cherry VIP"), "cherry");
    assert.equal(glowFromRewardTitle("Cosmic Glow"), "cosmic");
    assert.equal(glowFromRewardTitle("Midnight Glow"), "midnight");
    assert.equal(glowFromRewardTitle("Cyberpunk Neon"), "cyberpunk");
    assert.equal(glowFromRewardTitle("Ice Ring"), "ice");
    assert.equal(glowFromRewardTitle("Random Unmatched Name"), "gold", "Defaults to gold");
  });

  test("Perks store: ad-free activation and time stacking", () => {
    storage.clear();
    const userId = "USER-PERK-1";

    let perk = readPerks(userId);
    assert.equal(perk.adFreeUntil, null);
    assert.equal(isAdFreeActive(perk), false);

    // Redeem 30 days
    const DAY_MS = 24 * 60 * 60 * 1000;
    const now = Date.now();
    extendAdFree(userId, 30);

    perk = readPerks(userId);
    assert.ok(isAdFreeActive(perk), "Ad-free perk is active");
    assert.ok(perk.adFreeUntil >= now + 29 * DAY_MS);

    // Redeem 30 more days: MUST stack on top of existing adFreeUntil!
    const firstUntil = perk.adFreeUntil;
    extendAdFree(userId, 30);

    const stackedPerk = readPerks(userId);
    assert.equal(
      stackedPerk.adFreeUntil,
      firstUntil + 30 * DAY_MS,
      "Redeeming while active must stack onto existing expiration, not reset from now",
    );
  });

  // ─── Suite 7: Referral Program & Tiers ────────────────────────────────────
  suite("Referral Program & Tiers");

  test("Referral code generator format", () => {
    const code1 = generateReferralCode("ABEBE");
    const code2 = generateReferralCode("HANNA");

    assert.ok(code1.startsWith("ABEBE-"), "Code must start with seed prefix");
    assert.ok(code2.startsWith("HANNA-"), "Code must start with seed prefix");
    assert.equal(code1.length, 10, "Format is SEED-XXXX (5 + 1 + 4 = 10)");
  });

  test("Referral milestones and tier bonus computations", () => {
    assert.equal(REFERRAL_SIGNUP_XP, 50, "Referrer earns 50 XP upon invite signup");
    assert.equal(REFERRAL_COMPLETE_XP, 100, "Referrer earns 100 XP upon course completion");
    assert.equal(REFERRAL_FRIEND_BONUS, 50, "Invited friend gets 50 XP bonus");

    assert.deepEqual(referralTiers, [
      { count: 1, reward: "Ambassador badge", xpBonus: 0 },
      { count: 3, reward: "Referral starter bonus", xpBonus: 150 },
      { count: 5, reward: "Campus champion bonus", xpBonus: 300 },
      { count: 10, reward: "Elite referrer reward", xpBonus: 750 },
    ]);

    function computeTierBonus(referralCount) {
      return referralTiers
        .filter((t) => referralCount >= t.count)
        .reduce((sum, t) => sum + t.xpBonus, 0);
    }

    assert.equal(computeTierBonus(0), 0);
    assert.equal(computeTierBonus(1), 0, "Tier 1 awards badge, 0 XP");
    assert.equal(computeTierBonus(2), 0);
    assert.equal(computeTierBonus(3), 150, "3 referrals awards Tier 2 (150 XP)");
    assert.equal(computeTierBonus(4), 150);
    assert.equal(
      computeTierBonus(5),
      450,
      "5 referrals awards Tier 2 + Tier 3 (150 + 300 = 450 XP)",
    );
    assert.equal(computeTierBonus(9), 450);
    assert.equal(
      computeTierBonus(10),
      1200,
      "10 referrals awards all tiers (150 + 300 + 750 = 1200 XP)",
    );
  });

  // ─── Suite 8: Admin Integrity Controls & Moderation ───────────────────────
  suite("Admin Integrity Controls & Anti-Abuse Rules");

  test("Integrity rules default configuration and bounds safety", () => {
    storage.clear();
    const rules = readIntegrityRules();

    assert.equal(rules.idleReading.enabled, true);
    assert.equal(rules.idleReading.threshold, 10);
    assert.equal(rules.idleReading.penalty, 5);

    assert.equal(rules.examRush.enabled, true);
    assert.equal(rules.examRush.threshold, 60);

    assert.equal(rules.dailyCap.enabled, true);
    assert.equal(rules.dailyCap.threshold, 500);

    // Update rule with bounds check
    updateIntegrityRule("dailyCap", { threshold: 750 });
    assert.equal(readIntegrityRules().dailyCap.threshold, 750);

    // Update with negative number: clamped to >= 0
    updateIntegrityRule("idleReading", { penalty: -10 });
    assert.equal(readIntegrityRules().idleReading.penalty, 0, "Negative penalty clamped to 0");

    // Reset to defaults
    resetIntegrityRules();
    assert.equal(readIntegrityRules().dailyCap.threshold, 500);
  });

  test("Integrity violation event lifecycle", () => {
    storage.clear();
    clearIntegrityEvents();
    assert.equal(readIntegrityEvents().length, 0);

    recordIntegrityEvent({
      rule: "examRush",
      student: "Test Student",
      detail: "Completed exam in 15 seconds",
      penalty: 50,
      severity: "high",
    });

    const events = readIntegrityEvents();
    assert.equal(events.length, 1);
    const ev = events[0];
    assert.equal(ev.student, "Test Student");
    assert.equal(ev.status, "auto");
    assert.equal(ev.severity, "high");

    // Admin reviews violation
    setIntegrityEventStatus(ev.id, "reviewed");
    assert.equal(readIntegrityEvents()[0].status, "reviewed");

    // Admin dismisses violation
    setIntegrityEventStatus(ev.id, "dismissed");
    assert.equal(readIntegrityEvents()[0].status, "dismissed");
  });

  // ─── Suite 9: AI Study Subject Detection & Heuristics ─────────────────────
  suite("AI Study Subject Detection & Heuristics");

  test("Filename subject detection heuristics", () => {
    assert.equal(detectSubject("physics-midterm-prep.pdf"), "physics");
    assert.equal(detectSubject("General_Motion_and_Kinematics.docx"), "physics");
    assert.equal(detectSubject("cell_biology_genetics.pptx"), "biology");
    assert.equal(detectSubject("organic_chemistry_reactions.txt"), "chemistry");
    assert.equal(detectSubject("calculus_derivatives_integrals.pdf"), "math");
    assert.equal(detectSubject("ethiopian_history_adwa.docx"), "history");
    assert.equal(detectSubject("english_grammar_rules.pdf"), "english");
    assert.equal(detectSubject("forex_trading_currency_pairs.pdf"), "finance");
    assert.equal(detectSubject("web_development_javascript.html"), "technology");
    assert.equal(detectSubject("digital_marketing_seo_strategy.pdf"), "marketing");
    assert.equal(detectSubject("random_unnamed_document.pdf"), "general");
  });

  test("Text content keyword subject classifier", () => {
    // Too short (< 60 chars) -> returns null
    assert.equal(detectSubjectFromText("Just a short sentence about force."), null);

    // Physics content (>= 3 keyword hits: force, velocity, acceleration, newton)
    const physicsText =
      "In this chapter we study newton second law where force equals mass times acceleration and initial velocity determines projectile motion trajectory.";
    assert.equal(detectSubjectFromText(physicsText), "physics");

    // Biology content (cell, dna, rna, photosynthesis, mitochondria)
    const biologyText =
      "Plant cells utilize chloroplasts for photosynthesis while mitochondria generate cellular ATP. Genetic information is encoded in double stranded dna and translated through rna.";
    assert.equal(detectSubjectFromText(biologyText), "biology");

    // Chemistry content (atom, molecule, reaction, acid, base)
    const chemistryText =
      "In chemical equilibrium the forward reaction rate equals the reverse reaction rate. An acid donates a proton while a base accepts a proton between each molecule and atom.";
    assert.equal(detectSubjectFromText(chemistryText), "chemistry");
  });

  // ─── Suite 10: Authentication, Access Control & Route Guarding ───────────
  suite("Authentication, Access Control & Route Guarding");

  test("Session lifecycle: signIn, updateUser, signOut, and storage resilience", () => {
    storage.clear();

    // Default: signed out
    assert.deepEqual(readAuth(), defaultSession);
    assert.equal(isAuthenticated(), false);

    // Sign in with demo user
    signIn(DEMO_USER);
    assert.equal(isAuthenticated(), true);
    assert.equal(readAuth().user?.name, "Abebe Balcha");
    assert.equal(readAuth().user?.xp, 1240);

    // Partial update user profile (e.g. earned XP or changed university)
    updateUser({ xp: 1340, university: "Bahir Dar University" });
    const updated = readAuth();
    assert.equal(updated.user?.xp, 1340);
    assert.equal(updated.user?.university, "Bahir Dar University");
    assert.equal(updated.user?.name, "Abebe Balcha", "Preserves other user fields");

    // Sign out
    signOut();
    assert.equal(isAuthenticated(), false);
    assert.deepEqual(readAuth(), defaultSession);

    // Corrupted localStorage handling
    storage.set("study2earn-auth", "invalid-corrupted-json{[[");
    assert.deepEqual(
      readAuth(),
      defaultSession,
      "Safely returns defaultSession on corrupted storage",
    );
  });

  test("Role authorization: isAdminUser logic", () => {
    assert.equal(isAdminUser(null), false);
    assert.equal(isAdminUser(undefined), false);

    const normalStudent = {
      id: "STU-1234",
      name: "Tigist Alemu",
      email: "tigist@example.com",
      university: "AAU",
      xp: 50,
      role: "student",
    };
    assert.equal(isAdminUser(normalStudent), false, "Standard student is not admin");

    const explicitAdmin = {
      id: "STU-9999",
      name: "Admin User",
      email: "admin@example.com",
      university: "AAU",
      xp: 0,
      role: "admin",
    };
    assert.equal(isAdminUser(explicitAdmin), true, "User with role admin is admin");

    assert.equal(isAdminUser(DEMO_USER), true, "Demo user STU-8842 is admin");
  });

  test("Protected route matcher (isProtectedRoute)", () => {
    // Protected paths
    assert.equal(isProtectedRoute("/rewards"), true);
    assert.equal(isProtectedRoute("/rewards/claim/RD-1001"), true);
    assert.equal(isProtectedRoute("/leaderboard"), true);
    assert.equal(isProtectedRoute("/leaderboard/season-1"), true);

    // Public / guest paths
    assert.equal(isProtectedRoute("/"), false);
    assert.equal(isProtectedRoute("/login"), false);
    assert.equal(isProtectedRoute("/register"), false);
    assert.equal(isProtectedRoute("/dashboard"), false);
    assert.equal(isProtectedRoute("/library"), false);
    assert.equal(isProtectedRoute("/library/read/bk-physics"), false);
    assert.equal(isProtectedRoute("/exams"), false);
    assert.equal(isProtectedRoute("/exams/general-physics"), false);
    assert.equal(isProtectedRoute("/ai-study"), false);
    assert.equal(isProtectedRoute("/admin"), false);
    assert.equal(isProtectedRoute("/terms"), false);
    assert.equal(isProtectedRoute("/privacy"), false);
  });

  test("Enhanced Login Logic: registered accounts, authentication, remember-me, and password verification", () => {
    storage.clear();

    // 1. Pre-seeded registered users exist
    const initialUsers = readRegisteredUsers();
    assert.ok(initialUsers.length >= 3, "At least 3 initial registered users exist");
    assert.ok(findRegisteredUser("aplusethiopia1@gmail.com"), "Demo user is registered");
    assert.ok(findRegisteredUser("admin@study2earn.et"), "Admin user is registered");

    // 2. Authenticate existing demo user
    const demoAuth = authenticateUser("aplusethiopia1@gmail.com", "demo123");
    assert.equal(demoAuth.success, true);
    assert.equal(demoAuth.user?.name, "Abebe Balcha");

    // 3. Authenticate with alias
    const aliasAuth = authenticateUser("demo@study2earn.et", "demo123");
    assert.equal(aliasAuth.success, true);
    assert.equal(aliasAuth.user?.id, "STU-8842");

    // 4. Authenticate campus scholar
    const scholarAuth = authenticateUser("selamawit@aau.edu.et", "student123");
    assert.equal(scholarAuth.success, true);
    assert.equal(scholarAuth.user?.xp, 4820);

    // 5. Wrong password rejected
    const failedAuth = authenticateUser("selamawit@aau.edu.et", "wrongpassword123");
    assert.equal(failedAuth.success, false);
    assert.ok(failedAuth.error?.includes("Incorrect password"));

    // 6. Validation bounds: short password or empty email
    assert.equal(authenticateUser("", "pass123").success, false);
    assert.equal(authenticateUser("user@example.com", "123").success, false);

    // 7. Auto-provisioning new scholar on valid signup credentials
    const newStudent = authenticateUser("kassahun.bekele@aau.edu.et", "securepass123");
    assert.equal(newStudent.success, true);
    assert.equal(newStudent.isNewAccount, true);
    assert.equal(newStudent.user?.email, "kassahun.bekele@aau.edu.et");
    assert.equal(newStudent.user?.xp, 50);

    // 8. Remember-me storage
    assert.equal(getRememberedEmail(), "");
    setRememberedEmail("kassahun.bekele@aau.edu.et");
    assert.equal(getRememberedEmail(), "kassahun.bekele@aau.edu.et");
    setRememberedEmail("");
    assert.equal(getRememberedEmail(), "");
  });

  // ─── Suite 11: Admin Store & Book Category Management ─────────────────────
  suite("Admin Store & Book Category Management");

  test("Admin data store: defaults, data integrity, and corrupted JSON resilience", () => {
    storage.clear();

    const defaults = readAdminData();
    assert.ok(defaults.users.length > 0, "Default users exist");
    assert.ok(defaults.exams.length > 0, "Default exams exist");
    assert.ok(defaults.rewards.length > 0, "Default rewards exist");
    assert.ok(defaults.content.length > 0, "Default content books exist");
    assert.ok(defaults.settings, "Default settings exist");

    // Partial update
    writeAdminData({
      settings: { ...defaults.settings, autoApprove: true, maxDailyExams: "10" },
    });
    const updated = readAdminData();
    assert.equal(updated.settings.autoApprove, true);
    assert.equal(updated.settings.maxDailyExams, "10");

    // Content CRUD with chapterList
    assert.ok(defaults.content.length > 0, "Default content items exist");
    assert.ok(defaults.content[0].chapterList && defaults.content[0].chapterList.length > 0, "Default content includes chapterList");
    const testBook = {
      id: "BK-TEST-99",
      name: "Engineering Mechanics: Statics",
      short: "Statics",
      chapters: 3,
      students: "850",
      synced: true,
      published: true,
      category: "Engineering",
      description: "Equilibrium of particles and rigid bodies.",
      pdfUrl: "/pdfs/sample-textbook.pdf",
      pages: 120,
      chapterList: [
        { title: "Chapter 1: Force Vectors", pages: 35 },
        { title: "Chapter 2: Equilibrium of a Particle", pages: 45 },
        { title: "Chapter 3: Rigid Body Resultants", pages: 40 }
      ]
    };
    writeAdminData({
      content: [testBook, ...defaults.content],
    });
    const contentCheck = readAdminData().content.find((c) => c.id === "BK-TEST-99");
    assert.ok(contentCheck, "Custom book persisted in admin store");
    assert.equal(contentCheck.name, "Engineering Mechanics: Statics");
    assert.equal(contentCheck.chapterList.length, 3);
    assert.equal(contentCheck.chapterList[1].title, "Chapter 2: Equilibrium of a Particle");

    // Corrupted storage recovery
    storage.set("study2earn-admin-data", "corrupted-json-data{{");
    const recovered = readAdminData();
    assert.ok(recovered.users.length > 0, "Recovers to defaults on JSON corruption");

    clearAdminData();
  });

  test("Category store: read, write, slugify, badge classes, and reset", () => {
    storage.clear();

    const initialCategories = readCategories();
    assert.equal(initialCategories.length, DEFAULT_CATEGORIES.length);

    // slugify helper
    assert.equal(slugifyCategory("Law & Constitutional Studies"), "cat-law-constitutional-studies");
    assert.equal(slugifyCategory("Natural Science"), "cat-natural-science");

    // Add new category via writeCategories
    const newCat = {
      id: slugifyCategory("Law & Governance"),
      name: "Law & Governance",
      color: "indigo",
      description: "Ethiopian legal framework and governance",
    };
    writeCategories([...initialCategories, newCat]);

    let cats = readCategories();
    assert.equal(cats.length, initialCategories.length + 1);
    const added = cats.find((c) => c.id === newCat.id);
    assert.ok(added);
    assert.equal(added.name, "Law & Governance");
    assert.equal(added.color, "indigo");

    // Badge class and color key helpers
    const badge = categoryBadgeClass("Law & Governance", cats);
    assert.ok(badge && badge.includes("indigo"), "Badge class has indigo style");

    const colorKey = categoryColorKey("Law & Governance", cats);
    assert.equal(colorKey, "indigo");

    const unknownBadge = categoryBadgeClass("Non-Existent Category", cats);
    assert.ok(unknownBadge && unknownBadge.includes("slate"), "Unknown falls back to slate");

    // Reset categories restores default
    resetCategories();
    assert.equal(readCategories().length, DEFAULT_CATEGORIES.length);
  });

  // ─── Suite 12: Integrations Store & AI Provider Settings ──────────────────
  suite("Integrations Store & AI Provider Settings");

  test("Integrations store: defaults, updates, and provider settings", () => {
    storage.clear();

    const config = readIntegrations();
    assert.equal(config.googleAdsense.enabled, false);
    assert.equal(config.aiStudy.enabled, true);
    assert.equal(config.aiStudy.provider, "gemini");

    // Switch provider to DeepSeek
    writeIntegrations({
      aiStudy: {
        ...config.aiStudy,
        provider: "deepseek",
        deepseekModel: "deepseek-reasoner",
      },
    });

    const updated = readIntegrations();
    assert.equal(updated.aiStudy.provider, "deepseek");
    assert.equal(updated.aiStudy.deepseekModel, "deepseek-reasoner");

    // Configure Google AdSense publisher ID and test validation helper
    const pubId = "ca-pub-1234567890123456";
    assert.equal(isValidAdsensePublisherId(pubId), true);
    assert.equal(isValidAdsensePublisherId("invalid-id"), false);
    assert.equal(isValidAdsensePublisherId("ca-pub-123"), false, "Too short");

    writeIntegrations({
      ...updated,
      googleAdsense: {
        publisherId: pubId,
        enabled: true,
      },
    });

    const adsConfig = readIntegrations();
    assert.equal(adsConfig.googleAdsense.publisherId, pubId);
    assert.equal(adsConfig.googleAdsense.enabled, true);

    // Reset integrations
    writeIntegrations(DEFAULT_INTEGRATIONS);
    assert.equal(readIntegrations().googleAdsense.enabled, false);
    assert.equal(readIntegrations().aiStudy.provider, "gemini");
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Suite 13: Profile Frames Store & Catalog
  // ──────────────────────────────────────────────────────────────────────────
  suite("Profile Frames Store & Catalog");

  test("13.1 Profile Frames catalog metadata and rarities are valid", () => {
    assert.ok(PROFILE_FRAMES.length >= 16, "Must have at least 16 profile frames");
    assert.equal(RARITY_ORDER.length, 6, "Must have 6 rarities");

    for (const frame of PROFILE_FRAMES) {
      assert.ok(frame.id, "Frame must have id");
      assert.ok(frame.name, "Frame must have name");
      assert.ok(RARITY_ORDER.includes(frame.rarity), `Invalid rarity ${frame.rarity}`);
      assert.ok(RARITY_META[frame.rarity], `Missing rarity meta for ${frame.rarity}`);

      if (frame.type === "xp") {
        assert.ok(
          typeof frame.price === "number" && frame.price > 0,
          "XP frame must have positive price",
        );
      } else {
        assert.equal(frame.type, "achievement");
        assert.ok(
          frame.requirement && frame.requirement.label,
          "Achievement frame must have requirement label",
        );
      }
    }

    // SSR frame check
    const ssr = getFramesByRarity("SSR");
    assert.ok(ssr.length >= 1, "Must have at least one SSR frame");
    assert.equal(ssr[0].name, "XP Legend");
    assert.equal(ssr[0].price, 700_000);

    // Helper lookup
    const found = getFrameById("xp-legend");
    assert.ok(found);
    assert.equal(found.rarity, "SSR");
  });

  test("13.2 Profile Frames store lifecycle (unlock, equip, unequip, idempotency)", () => {
    const testUserId = "STU-FRAME-TEST-99";
    storage.delete("study2earn-frames");

    // Initially empty
    let frames = readFrames(testUserId);
    assert.deepEqual(frames.owned, []);
    assert.equal(frames.equipped, null);

    // Unlock a frame
    unlockFrame(testUserId, "new-learner");
    frames = readFrames(testUserId);
    assert.ok(frames.owned.includes("new-learner"));
    assert.equal(frames.equipped, "new-learner", "Unlocking should equip immediately");

    // Idempotent unlock
    unlockFrame(testUserId, "new-learner");
    frames = readFrames(testUserId);
    assert.equal(frames.owned.filter((id) => id === "new-learner").length, 1);

    // Unlock a second frame
    unlockFrame(testUserId, "xp-legend");
    frames = readFrames(testUserId);
    assert.equal(frames.owned.length, 2);
    assert.equal(frames.equipped, "xp-legend");

    // Switch back to first frame
    equipFrame(testUserId, "new-learner");
    frames = readFrames(testUserId);
    assert.equal(frames.equipped, "new-learner");

    // Cannot equip unowned frame
    equipFrame(testUserId, "unowned-frame-id");
    frames = readFrames(testUserId);
    assert.equal(frames.equipped, "new-learner", "Should not equip unowned frame");

    // Unequip (pass null)
    equipFrame(testUserId, null);
    frames = readFrames(testUserId);
    assert.equal(frames.equipped, null);

    // Cleanup
    storage.delete("study2earn-frames");
  });

  // ─── Suite 14: Dynamic Profile Synchronization & Leaderboard Propagation ─
  suite("Dynamic Profile Synchronization & Leaderboard Propagation");

  test("14.1 User profile updates propagate seamlessly into weekly, monthly, and yearly leaderboards", () => {
    const studentUser = {
      id: "STU-8842",
      name: "Solomon Tadesse",
      email: "solomon@aau.edu.et",
      university: "Addis Ababa Science & Technology University",
      department: "Software Engineering",
      role: "student",
      xp: 3200,
      avatarUrl: "local:img-profile-test-1",
    };

    // Weekly board check
    const weekly = getEffectiveLeaderboard("weekly", studentUser, 3200);
    const myWeekly = weekly.find((s) => s.isYou);
    assert.ok(myWeekly, "Weekly leaderboard must contain the user with isYou: true");
    assert.equal(myWeekly.name, "Solomon Tadesse");
    assert.equal(myWeekly.uni, "Addis Ababa Science & Technology University");
    assert.equal(myWeekly.department, "Software Engineering");
    assert.equal(myWeekly.avatarUrl, "local:img-profile-test-1");
    assert.equal(myWeekly.rank, 7, "User with 3200 XP should be rank 7 (between 3310 and 3120 XP)");

    // Test climbing to #1 with 5000 XP
    const topBoard = getEffectiveLeaderboard("weekly", studentUser, 5000);
    const topUser = topBoard.find((s) => s.isYou);
    assert.equal(topUser.rank, 1, "User with 5000 XP should dynamically climb to rank 1");

    // Monthly board check
    const monthly = getEffectiveLeaderboard("monthly", studentUser, 3200);
    const myMonthly = monthly.find((s) => s.isYou);
    assert.ok(myMonthly, "Monthly leaderboard must contain the user with isYou: true");
    assert.equal(myMonthly.name, "Solomon Tadesse");
    assert.equal(myMonthly.uni, "Addis Ababa Science & Technology University");
    assert.equal(myMonthly.department, "Software Engineering");

    // Yearly board check
    const yearly = getEffectiveLeaderboard("yearly", studentUser, 3200);
    const myYearly = yearly.find((s) => s.isYou);
    assert.ok(myYearly, "Yearly leaderboard must contain the user with isYou: true");
    assert.equal(myYearly.name, "Solomon Tadesse");
  });

  test("14.2 University drill-down dynamically reallocates student when university affiliation changes", () => {
    const updatedUser = {
      id: "STU-8842",
      name: "Bethlehem Haile",
      email: "bethlehem@astu.edu.et",
      university: "Adama Science and Technology University",
      department: "Biomedical Engineering",
      role: "student",
      xp: 4100,
      avatarUrl: "local:img-profile-test-2",
    };

    // User is now under ASTU
    const astuStudents = getEffectiveUniversityStudents(
      "Adama Science and Technology University",
      updatedUser,
      4100,
    );
    const myAstu = astuStudents.find((s) => s.isYou);
    assert.ok(myAstu, "Student must be present under ASTU drilldown");
    assert.equal(myAstu.name, "Bethlehem Haile");
    assert.equal(myAstu.department, "Biomedical Engineering");
    assert.equal(myAstu.avatarUrl, "local:img-profile-test-2");
    assert.equal(myAstu.rank, 1, "With 4100 XP, student should be #1 at ASTU");

    // User must NOT remain under old university (AAU)
    const aauStudents = getEffectiveUniversityStudents(
      "Addis Ababa University",
      updatedUser,
      4100,
    );
    const oldEntry = aauStudents.find((s) => s.name === "Bethlehem Haile" || s.id === updatedUser.id);
    assert.equal(oldEntry, undefined, "Student must no longer appear under old university list");
  });

  test("14.3 getUserNationalRank reflects dynamic student rank across the platform", () => {
    const userHighXp = {
      id: "STU-8842",
      name: "Winner Student",
      university: "Hawassa University",
      xp: 9999,
    };
    const rankInfo = getUserNationalRank(userHighXp, 9999, "weekly");
    assert.equal(rankInfo.rank, 1, "9999 XP student must hold rank 1 nationally");
    assert.ok(rankInfo.entry, "rankInfo.entry must be defined");
    assert.equal(rankInfo.entry.name, "Winner Student");
  });

  test("14.4 updateUser persists to auth store, broadcasts profile-updated, and syncs to admin store", () => {
    storage.clear();
    writeAuth({
      loggedIn: true,
      user: {
        id: "STU-8842",
        name: "Old Name",
        email: "demo@aau.edu.et",
        university: "Addis Ababa University",
        role: "student",
      },
    });

    // Seed admin store
    writeAdminData({
      users: [
        {
          id: "STU-8842",
          name: "Old Name",
          email: "demo@aau.edu.et",
          university: "Addis Ababa University",
          program: "General",
          role: "student",
          status: "active",
          joinedAt: "2024-01-01",
        },
      ],
      courses: [],
      materials: [],
      quizzes: [],
      withdrawalRequests: [],
      auditLogs: [],
      systemAnnouncements: [],
    });

    // Update profile via updateUser
    updateUser({
      name: "Updated Solomon",
      university: "Jimma University",
      department: "Civil Engineering",
      bio: "Aspiring structural engineer",
    });

    // Check auth session
    const session = readAuth();
    assert.equal(session.user.name, "Updated Solomon");
    assert.equal(session.user.university, "Jimma University");
    assert.equal(session.user.department, "Civil Engineering");
    assert.equal(session.user.bio, "Aspiring structural engineer");

    // Check admin store synchronization
    const adminData = readAdminData();
    const adminUser = adminData.users.find((u) => u.id === "STU-8842");
    assert.ok(adminUser, "Admin store user row exists");
    assert.equal(adminUser.name, "Updated Solomon");
    assert.equal(adminUser.university, "Jimma University");
    assert.equal(adminUser.program, "Civil Engineering");
  });

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log("\n\x1b[1m\x1b[32m=====================================================\x1b[0m");
  console.log(
    `\x1b[1m\x1b[32m  All ${totalSuites} suites and ${passedTests}/${totalTests} tests PASSED! 🎉\x1b[0m`,
  );
  console.log("\x1b[1m\x1b[32m=====================================================\x1b[0m\n");
}

runAllTests();
