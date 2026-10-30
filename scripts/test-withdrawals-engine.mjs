import assert from "node:assert/strict";

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

import { readWithdrawals, writeWithdrawals } from "../src/lib/withdrawal-store.ts";
import {
  defaultWithdrawals,
  etbToXp,
  usdtToXp,
  xpToEtb,
  xpToUsdt,
} from "../src/lib/withdrawal-data.ts";
import { generateDemoTxReference } from "../src/lib/withdrawal-export.ts";

console.log("=== Testing Enterprise Withdrawal & Treasury Engine ===");

// 1. Math conversions
assert.equal(xpToEtb(800), 100, "800 XP = 100 ETB");
assert.equal(etbToXp(100), 800, "100 ETB = 800 XP");
assert.equal(xpToUsdt(1080), 1, "1080 XP = 1 USDT");
assert.equal(usdtToXp(1), 1080, "1 USDT = 1080 XP");
console.log("✓ Financial rate conversions verified");

// 2. Initial state & persistence
const initial = readWithdrawals();
assert.ok(Array.isArray(initial), "Withdrawals list is an array");
assert.ok(initial.length >= 4, "Initial withdrawals has seed data");
console.log(`✓ Read ${initial.length} initial withdrawal requests`);

// 3. Status update with FT reference tracking
const testRequest = {
  id: "WD-9999",
  userId: "STU-8842",
  userName: "Abebe Balcha",
  university: "Addis Ababa University",
  method: "bank",
  bankId: "cbe",
  bankName: "Commercial Bank of Ethiopia",
  accountNumber: "100029384756",
  accountName: "Abebe Balcha",
  amountEtb: 300,
  xpDeducted: 2400,
  status: "pending",
  requestedAt: "Oct 13, 2026 · 10:00 PM",
};

writeWithdrawals([testRequest, ...initial]);

let updated = readWithdrawals();
const created = updated.find((r) => r.id === "WD-9999");
assert.ok(created, "Created test withdrawal request exists");
assert.equal(created.status, "pending");

// Simulate Admin Approval
const approved = updated.map((r) => (r.id === "WD-9999" ? { ...r, status: "approved" } : r));
writeWithdrawals(approved);
updated = readWithdrawals();
assert.equal(updated.find((r) => r.id === "WD-9999")?.status, "approved", "Status transitioned to approved");

// Simulate Admin Settlement & Payment with FT Ref
const ftRef = generateDemoTxReference("bank");
assert.ok(ftRef.startsWith("FT26"), "Generated authentic Ethiopian CBE FT reference");

const paid = updated.map((r) =>
  r.id === "WD-9999"
    ? {
        ...r,
        status: "paid",
        transactionReference: ftRef,
        adminNote: "Settled via CBE Direct Gateway",
        processedAt: "Oct 13, 2026 · 10:15 PM",
      }
    : r,
);
writeWithdrawals(paid);

updated = readWithdrawals();
const finalPaid = updated.find((r) => r.id === "WD-9999");
assert.equal(finalPaid?.status, "paid", "Status transitioned to paid");
assert.equal(finalPaid?.transactionReference, ftRef, "Transaction reference recorded on request");
assert.equal(finalPaid?.adminNote, "Settled via CBE Direct Gateway");
console.log(`✓ Full lifecycle with Bank Reference (${ftRef}) verified`);

// 4. Batch Operations simulation
const batchIds = ["WD-1001", "WD-1002"];
const batchRef = "BATCH-CBE-2026-10-13";
const batchPaid = updated.map((r) =>
  batchIds.includes(r.id)
    ? {
        ...r,
        status: "paid",
        transactionReference: batchRef,
      }
    : r,
);
writeWithdrawals(batchPaid);

updated = readWithdrawals();
for (const id of batchIds) {
  const req = updated.find((r) => r.id === id);
  assert.equal(req?.status, "paid", `${id} marked paid in bulk`);
  assert.equal(req?.transactionReference, batchRef, `${id} contains batch reference`);
}
console.log("✓ Bulk payout settlement verified");

// 5. Test Live HTTP endpoint
const res = await fetch("http://localhost:3002/admin");
assert.equal(res.status, 200, "http://localhost:3002/admin responds with 200 OK");
const html = await res.text();
assert.ok(html.includes("<!DOCTYPE html>"), "Admin page serves valid HTML");
console.log("✓ Live HTTP /admin endpoint responds with 200 OK");

console.log("\nAll Withdrawal Engine tests PASSED! 🎉");
