/**
 * Withdrawal Data Export & Batch Generation Utilities
 * Generates accounting-grade CSV reports and CBE Birr / Bank Batch transfer files.
 */

import type { WithdrawalRequest } from "@/lib/withdrawal-data";

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Downloads a comprehensive CSV spreadsheet with all financial and audit fields.
 */
export function downloadWithdrawalsCsv(
  requests: WithdrawalRequest[],
  filenamePrefix = "study2earn_withdrawals",
): void {
  if (typeof window === "undefined") return;

  const headers = [
    "Request ID",
    "Student Name",
    "Student ID",
    "University",
    "Payment Method",
    "Bank / Network",
    "Account Number / Binance UID",
    "Account Holder Name",
    "Amount (ETB)",
    "Amount (USDT)",
    "XP Deducted",
    "Status",
    "Transaction Reference / FT",
    "Requested At",
    "Processed At",
    "Admin Note",
  ];

  const rows = requests.map((r) => [
    r.id,
    r.userName,
    r.userId,
    r.university,
    r.method === "usdt" ? "USDT (Binance Pay)" : "Bank Transfer",
    r.method === "usdt" ? "Binance" : r.bankName ?? r.bankId ?? "—",
    r.method === "usdt" ? r.binanceUid ?? "—" : r.accountNumber ?? "—",
    r.method === "usdt" ? "Binance Account" : r.accountName ?? "—",
    r.amountEtb,
    r.amountUsdt ?? "—",
    r.xpDeducted,
    r.status.toUpperCase(),
    r.transactionReference ?? "—",
    r.requestedAt,
    r.processedAt ?? "—",
    r.adminNote ?? "—",
  ]);

  const csvContent =
    "\uFEFF" + // UTF-8 BOM for Excel compatibility
    [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join(
      "\r\n",
    );

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${filenamePrefix}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a CBE / Telebirr compatible bulk batch transfer file.
 * Format: Account_Number,Amount_ETB,Receiver_Name,Reference
 */
export function downloadBankBatchFile(
  requests: WithdrawalRequest[],
  batchName = "cbe_batch_disbursements",
): void {
  if (typeof window === "undefined") return;

  const bankRequests = requests.filter((r) => r.method === "bank");
  const headers = ["Account_Number", "Amount_ETB", "Receiver_Name", "Request_ID", "Bank_Name"];

  const rows = bankRequests.map((r) => [
    r.accountNumber?.replace(/\*/g, "") ?? "",
    r.amountEtb,
    r.accountName ?? r.userName,
    r.id,
    r.bankName ?? "CBE",
  ]);

  const csvContent =
    "\uFEFF" +
    [headers.map(escapeCsvCell).join(","), ...rows.map((row) => row.map(escapeCsvCell).join(","))].join(
      "\r\n",
    );

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${batchName}_${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates an authentic Ethiopian banking FT reference (or Binance Internal TxID) for test / quick settlement.
 */
export function generateDemoTxReference(method: "bank" | "usdt" = "bank"): string {
  if (method === "usdt") {
    return `BINANCE-${Math.floor(100000000 + Math.random() * 900000000)}`;
  }
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `FT26${randomSuffix}`;
}
