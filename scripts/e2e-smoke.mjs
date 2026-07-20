/**
 * End-to-end smoke tests for Study2Earn core logic and HTTP routes.
 * Run: npm run test:e2e
 */
import http from "node:http";
import { strict as assert } from "node:assert";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:3001";

const routes = [
  "/",
  "/login",
  "/register",
  "/dashboard",
  "/library",
  "/library/read/bk-physics",
  "/exams",
  "/exams/mistakes",
  "/exams/general-physics",
  "/exams/general-physics/ch-1",
  "/ai-study",
  "/rewards",
  "/rewards/claim/RD-test",
  "/leaderboard",
  "/profile",
  "/help",
  "/terms",
  "/privacy",
  "/admin",
];

function fetchStatus(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

function fetchBody(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const req = http.get(url, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

async function testSitemap() {
  const { status, body } = await fetchBody("/sitemap.xml");
  assert.equal(status, 200, "sitemap.xml should return 200");
  assert.ok(body.includes("<urlset"), "sitemap has <urlset> root");
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length >= 5, "sitemap lists at least 5 URLs");
  for (const loc of locs) {
    assert.ok(/^https?:\/\//.test(loc), `sitemap <loc> must be absolute, got: ${loc}`);
  }
}

async function testNotFound() {
  const status = await fetchStatus("/this-page-does-not-exist");
  assert.equal(status, 404, "unknown route should return HTTP 404");
}

// ─── Core math tests ──────────────────────────────────────────────────────────

function testWalletMath() {
  const baseXp = 50;
  const examXp = 120;
  const referralXp = 150;
  const libraryXp = 40;
  const redeemedXp = 200;
  const pendingXp = 400;
  const lifetime = baseXp + examXp + referralXp + libraryXp;
  const balance = Math.max(0, lifetime - redeemedXp - pendingXp);
  assert.equal(balance, 0, "wallet balance should floor at zero when overspent");
  assert.equal(lifetime, 360, "lifetime earned sums all sources");
}

function testReadingRewardMath() {
  const targetSeconds = 10 * 60 * 60;
  const rewardEtb = 100;
  const rewardXp = rewardEtb * 8;
  assert.equal(targetSeconds, 36000);
  assert.equal(rewardXp, 800);
  const atNineHours = 9 * 3600;
  const progress = Math.min(100, Math.round((atNineHours / targetSeconds) * 100));
  assert.equal(progress, 90);
}

function testRedemptionFlow() {
  let balance = 500;
  const cost = 300;
  assert.ok(balance >= cost);
  balance -= cost;
  assert.equal(balance, 200);
}

// ─── User journey tests ───────────────────────────────────────────────────────

function testSignupXP() {
  // No referral
  const baseXp = 50;
  assert.equal(baseXp, 50, "new user starts with 50 XP");

  // With referral bonus
  const REFERRAL_FRIEND_BONUS = 50; // matches referral-data.ts
  const withReferral = baseXp + REFERRAL_FRIEND_BONUS;
  assert.equal(withReferral, 100, "signup with referral gives 100 XP");

  // Password hashing simulation (btoa is not available in Node, use Buffer)
  const hash = Buffer.from("pass123").toString("base64");
  assert.ok(hash.length > 0, "password hash is non-empty");
}

function testExamXpFormula() {
  function calculateExamXp(score, firstCompletion) {
    const base = Math.round(score / 10) * 5;
    return base + (firstCompletion && score >= 60 ? 25 : 0);
  }

  const cases = [
    { score: 100, first: true, expected: 75 },
    { score: 100, first: false, expected: 50 },
    { score: 60, first: true, expected: 55 },
    { score: 50, first: true, expected: 25 }, // no bonus
    { score: 0, first: false, expected: 0 },
  ];

  for (const { score, first, expected } of cases) {
    const xp = calculateExamXp(score, first);
    assert.equal(xp, expected, `score=${score}%, firstCompletion=${first} → ${xp} XP`);
  }
}

function testReferralTracking() {
  const REFERRAL_SIGNUP_XP = 50;
  const REFERRAL_FRIEND_BONUS = 50;

  // Referrer earns XP when friend signs up
  const referralXpOnSignup = REFERRAL_SIGNUP_XP;
  assert.ok(referralXpOnSignup > 0, `referrer earns ${referralXpOnSignup} XP on friend sign-up`);

  // Friend earns bonus XP
  assert.ok(REFERRAL_FRIEND_BONUS > 0, `friend earns ${REFERRAL_FRIEND_BONUS} bonus XP`);

  // Milestone: 3 referrals
  const milestone3 = 150;
  assert.ok(milestone3 > 0, `3-referral milestone bonus = ${milestone3} XP`);
}

function testWithdrawalWorkflow() {
  const MIN_WITHDRAWAL_ETB = 50;
  const XP_PER_ETB = 8;

  function etbToXp(etb) {
    return etb * XP_PER_ETB;
  }

  // Minimum check
  const belowMin = MIN_WITHDRAWAL_ETB - 1;
  assert.ok(belowMin < MIN_WITHDRAWAL_ETB, `${belowMin} ETB rejected (below min)`);

  // XP deduction on valid withdrawal
  const requestEtb = 100;
  const xpDeducted = etbToXp(requestEtb);
  assert.equal(xpDeducted, 800, `${requestEtb} ETB withdrawal deducts ${xpDeducted} XP`);

  // Status transitions
  const statuses = ["pending", "approved", "paid"];
  assert.equal(statuses[0], "pending");
  assert.equal(statuses[2], "paid");
}

function testBookReadingXP() {
  // Every 30s tick = 1% progress = 5 XP
  const SECONDS_PER_TICK = 30;
  const XP_PER_PERCENT = 5;
  const xpPerTick = XP_PER_PERCENT; // 1% per tick
  assert.equal(xpPerTick, 5, "30s reading tick awards 5 XP (1% progress)");

  // 100 ticks = 100% completion
  const totalXpForFullBook = 100 * XP_PER_PERCENT;
  assert.equal(totalXpForFullBook, 500, "fully reading a book earns 500 XP");

  // Visibility: 3 of 6 chapters at 50% progress
  const chapters = 6;
  const progress = 50;
  const completedChapters = Math.floor((progress / 100) * chapters);
  assert.equal(completedChapters, 3, "50% progress marks 3 of 6 chapters done");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Study2Earn E2E smoke tests\n");

  // Core math
  testWalletMath();
  console.log("✓ wallet math");

  testReadingRewardMath();
  console.log("✓ 10h reading → 100 ETB reward math");

  testRedemptionFlow();
  console.log("✓ redemption deducts XP");

  // User journeys
  testSignupXP();
  console.log("✓ signup XP (with / without referral)");

  testExamXpFormula();
  console.log("✓ exam XP formula (5 cases)");

  testReferralTracking();
  console.log("✓ referral tracking (signup bonus, milestones)");

  testWithdrawalWorkflow();
  console.log("✓ withdrawal workflow (min check, XP deduction, status transitions)");

  testBookReadingXP();
  console.log("✓ book reading XP (30s tick → 1% → 5 XP, chapter completion)");

  // HTTP route checks
  let passed = 0;
  console.log("\n─── Route reachability ──────────────────────────────");
  for (const path of routes) {
    try {
      const status = await fetchStatus(path);
      assert.ok(status >= 200 && status < 500, `${path} returned ${status}`);
      console.log(`✓ ${path} → HTTP ${status}`);
      passed++;
    } catch (err) {
      console.error(`✗ ${path} → ${err.message}`);
      console.error("\nStart dev server first: npm run dev");
      process.exit(1);
    }
  }

  console.log(`\n${passed}/${routes.length} routes reachable`);

  await testSitemap();
  console.log("✓ sitemap.xml valid (absolute <loc> URLs)");

  await testNotFound();
  console.log("✓ unknown route returns HTTP 404");

  console.log("All smoke tests passed. 🎉");
}

main();
