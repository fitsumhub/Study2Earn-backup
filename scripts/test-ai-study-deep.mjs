import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import assert from "node:assert/strict";

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const CDP_PORT = 9224;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.callbacks = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
          else resolve(data.result);
        } else if (data.method && this.eventListeners.has(data.method)) {
          for (const handler of this.eventListeners.get(data.method)) {
            handler(data.params);
          }
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(handler);
  }

  close() {
    if (this.ws) this.ws.close();
  }

  async eval(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(
        `Eval error: ${res.exceptionDetails.text} (${JSON.stringify(res.exceptionDetails.exception)})`,
      );
    }
    return res.result?.value;
  }
}

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const tabs = await res.json();
      const pageTarget = tabs.find(
        (t) =>
          t.type === "page" &&
          !t.url.startsWith("chrome-extension://") &&
          t.webSocketDebuggerUrl,
      );
      if (pageTarget) return pageTarget.webSocketDebuggerUrl;
    } catch {}
    await wait(300);
  }
  throw new Error("Could not connect to Chrome debugging port");
}

async function run() {
  console.log("============================================================");
  console.log("   AI Study Hub (/ai-study) Deep Runtime & UI Verification");
  console.log("============================================================");

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "s2e-aistudy-test-"));
  const chromeProc = spawn(
    CHROME_PATH,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      "--headless=new",
      "--disable-extensions",
      "--disable-gpu",
      "--window-size=1440,960",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${tmpDir}`,
      `${BASE_URL}/ai-study`,
    ],
    { stdio: "ignore" },
  );

  let cdp;
  const consoleErrors = [];

  try {
    const wsUrl = await getWsUrl();
    console.log(`[CDP] Connected to Chrome DevTools endpoint.`);

    cdp = new CdpClient(wsUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    cdp.on("Runtime.consoleAPICalled", (params) => {
      if (params.type === "error") {
        consoleErrors.push(params.args?.map((a) => a.value || a.description).join(" "));
      }
    });

    // ─── TEST 1: Greeting for Logged In User "Abebe Balcha" ─────────────
    console.log("\n[TEST 1] Testing User Session & Personalized Header Greeting...");
    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study` });
    await wait(1500);

    await cdp.eval(`
      localStorage.setItem("study2earn-auth", JSON.stringify({
        loggedIn: true,
        user: {
          id: "STU-8842",
          name: "Abebe Balcha",
          email: "aplusethiopia1@gmail.com",
          university: "Addis Ababa University",
          department: "Computer Science",
          xp: 1240,
          role: "student"
        }
      }));
    `);

    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study` });
    await wait(2000);

    const greetingUser = await cdp.eval(`document.querySelector('h1')?.textContent || ''`);
    console.log(`  Header Greeting: "${greetingUser.trim()}"`);
    assert.ok(
      greetingUser.includes("Hey Abebe"),
      `Expected 'Hey Abebe', but got: '${greetingUser}'`
    );
    assert.ok(
      !greetingUser.includes("Hey Aplus"),
      `Heading must NOT say 'Hey Aplus'`
    );
    console.log("  ✓ Correctly displays: 'Hey Abebe, what do you wanna master?'");

    // ─── TEST 2: Greeting for Student "Selamawit Tadesse" ────────────────
    console.log("\n[TEST 2] Testing Greeting for Student 'Selamawit Tadesse'...");
    await cdp.eval(`
      localStorage.setItem("study2earn-auth", JSON.stringify({
        loggedIn: true,
        user: {
          id: "STU-1002",
          name: "Selamawit Tadesse",
          email: "selamawit@aau.edu.et",
          university: "Addis Ababa University",
          xp: 4500
        }
      }));
    `);

    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study` });
    await wait(1500);

    const greetingSelamawit = await cdp.eval(`document.querySelector('h1')?.textContent || ''`);
    console.log(`  Header Greeting: "${greetingSelamawit.trim()}"`);
    assert.ok(
      greetingSelamawit.includes("Hey Selamawit"),
      `Expected 'Hey Selamawit', but got: '${greetingSelamawit}'`
    );
    console.log("  ✓ Correctly displays: 'Hey Selamawit, what do you wanna master?'");

    // ─── TEST 3: Unauthenticated Visitor Greeting ────────────────────────
    console.log("\n[TEST 3] Testing Unauthenticated / Guest Greeting...");
    await cdp.eval(`
      localStorage.setItem("study2earn-auth", JSON.stringify({
        loggedIn: false,
        user: null
      }));
    `);

    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study` });
    await wait(1500);

    const greetingGuest = await cdp.eval(`document.querySelector('h1')?.textContent || ''`);
    console.log(`  Guest Greeting: "${greetingGuest.trim()}"`);
    assert.ok(
      greetingGuest.includes("Hey Scholar"),
      `Expected 'Hey Scholar', but got: '${greetingGuest}'`
    );
    assert.ok(
      !greetingGuest.includes("Hey Aplus"),
      `Heading must NEVER say 'Hey Aplus' for guest`
    );
    console.log("  ✓ Unauthenticated visitor correctly greeted: 'Hey Scholar, what do you wanna master?'");

    // ─── TEST 4: Study Set Deep-Linking & Detail Workspace ───────────────
    console.log("\n[TEST 4] Testing Study Set Deep Linking & Detail Workspace...");
    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study?set=set-net-3021&tab=notes` });
    await wait(2000);

    const pageText = await cdp.eval(`document.body.innerText`);
    assert.ok(
      pageText.includes("Network Design Requirements"),
      "Network Design Requirements set should be rendered"
    );
    assert.ok(
      pageText.includes("Executive Overview") || pageText.includes("Summarize Notes"),
      "Summarize Notes should be displayed"
    );
    console.log("  ✓ Deep linking into set 'set-net-3021' and 'notes' tab works seamlessly");

    // ─── TEST 5: Tab Transitions within Study Set ────────────────────────
    console.log("\n[TEST 5] Testing Study Set Workspace Tab Transitions...");
    const tabsToTest = ["Overview", "Flashcards", "Quiz", "Cheat Sheet", "Written Test", "Fill Blanks"];
    for (const tab of tabsToTest) {
      const switched = await cdp.eval(`
        (() => {
          const buttons = [...document.querySelectorAll('button')];
          const btn = buttons.find(b => b.textContent.trim().startsWith("${tab}"));
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        })()
      `);
      await wait(300);
      assert.ok(switched, `Failed to switch to tab '${tab}'`);
      console.log(`  ✓ Tab '${tab}' switched successfully`);
    }

    // ─── TEST 6: Non-Existent Set URL Parameter Resilience ───────────────
    console.log("\n[TEST 6] Testing Invalid Set ID Handling...");
    await cdp.send("Page.navigate", { url: `${BASE_URL}/ai-study?set=invalid-id-xyz` });
    await wait(1500);

    const currentUrl = await cdp.eval(`window.location.href`);
    console.log(`  Cleaned URL after invalid set access: ${currentUrl}`);
    assert.ok(
      !currentUrl.includes("invalid-id-xyz"),
      "URL should have invalid set ID parameter stripped"
    );
    console.log("  ✓ Invalid set ID parameter cleaned up gracefully without crashing");

    console.log("\n============================================================");
    console.log("   ALL AI STUDY SECTION TESTS PASSED PERFECTLY! 🎉");
    console.log("============================================================\n");
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill("SIGKILL");
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
