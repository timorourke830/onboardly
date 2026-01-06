import { Transaction, AccountSummary } from "@/types/transaction";

/**
 * Escapes a value for CSV format
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generate account summary from transactions
 */
export function generateAccountSummary(transactions: Transaction[]): AccountSummary[] {
  const summaryMap = new Map<string, AccountSummary>();

  for (const transaction of transactions) {
    // Use reviewed account if available, otherwise suggested
    const accountNumber = transaction.reviewedAccountNumber || transaction.suggestedAccountNumber || "Uncategorized";
    const accountName = transaction.reviewedAccountName || transaction.suggestedAccountName || "Uncategorized";
    const key = accountNumber;

    const existing = summaryMap.get(key);

    if (existing) {
      if (transaction.type === "debit") {
        existing.totalDebits += transaction.amount;
      } else {
        existing.totalCredits += transaction.amount;
      }
      existing.netAmount = existing.totalCredits - existing.totalDebits;
      existing.transactionCount++;
    } else {
      summaryMap.set(key, {
        accountNumber,
        accountName,
        totalDebits: transaction.type === "debit" ? transaction.amount : 0,
        totalCredits: transaction.type === "credit" ? transaction.amount : 0,
        netAmount: transaction.type === "credit" ? transaction.amount : -transaction.amount,
        transactionCount: 1,
      });
    }
  }

  // Sort by account number
  return Array.from(summaryMap.values()).sort((a, b) =>
    a.accountNumber.localeCompare(b.accountNumber)
  );
}

/**
 * Generate a summary CSV file
 */
export function generateSummaryCSV(transactions: Transaction[]): string {
  const summary = generateAccountSummary(transactions);

  const headers = [
    "Account Number",
    "Account Name",
    "Total Debits",
    "Total Credits",
    "Net Amount",
    "Transaction Count",
  ];

  const rows: string[][] = [];
  rows.push(headers);

  // Add data rows
  for (const item of summary) {
    rows.push([
      escapeCSV(item.accountNumber),
      escapeCSV(item.accountName),
      item.totalDebits.toFixed(2),
      item.totalCredits.toFixed(2),
      item.netAmount.toFixed(2),
      item.transactionCount.toString(),
    ]);
  }

  // Add totals row
  const totals = summary.reduce(
    (acc, item) => ({
      totalDebits: acc.totalDebits + item.totalDebits,
      totalCredits: acc.totalCredits + item.totalCredits,
      netAmount: acc.netAmount + item.netAmount,
      transactionCount: acc.transactionCount + item.transactionCount,
    }),
    { totalDebits: 0, totalCredits: 0, netAmount: 0, transactionCount: 0 }
  );

  rows.push([]); // Empty row
  rows.push([
    "TOTALS",
    "",
    totals.totalDebits.toFixed(2),
    totals.totalCredits.toFixed(2),
    totals.netAmount.toFixed(2),
    totals.transactionCount.toString(),
  ]);

  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Generate a filename for summary export
 */
export function getSummaryFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_AccountSummary_${date}.csv`;
}
