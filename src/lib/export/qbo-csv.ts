import { Account, AccountType, AccountDetailType } from "@/types/coa";
import { Transaction } from "@/types/transaction";

/**
 * Maps account detail types to QuickBooks Online account types
 */
const QBO_TYPE_MAPPING: Record<AccountDetailType, string> = {
  // Asset types
  Cash: "Bank",
  Bank: "Bank",
  "Accounts Receivable": "Accounts Receivable",
  Inventory: "Other Current Asset",
  "Other Current Asset": "Other Current Asset",
  "Fixed Asset": "Fixed Asset",
  // Liability types
  "Accounts Payable": "Accounts Payable",
  "Credit Card": "Credit Card",
  "Other Current Liability": "Other Current Liability",
  "Long-term Liability": "Long Term Liability",
  // Equity types
  "Owner's Equity": "Equity",
  "Retained Earnings": "Equity",
  "Partner's Equity": "Equity",
  // Income types
  Sales: "Income",
  Service: "Income",
  "Other Income": "Other Income",
  Discount: "Income",
  // Expense types
  "Cost of Goods Sold": "Cost of Goods Sold",
  Payroll: "Expense",
  "Rent or Lease": "Expense",
  Utilities: "Expense",
  Insurance: "Expense",
  Advertising: "Expense",
  "Bank Charges": "Expense",
  Depreciation: "Expense",
  Interest: "Expense",
  "Legal & Professional": "Expense",
  "Office/General Administrative": "Expense",
  "Repair & Maintenance": "Expense",
  Supplies: "Expense",
  "Taxes Paid": "Expense",
  Travel: "Expense",
  "Travel Meals": "Expense",
  Auto: "Expense",
  "Dues & Subscriptions": "Expense",
  Training: "Expense",
  Shipping: "Expense",
  "Other Miscellaneous": "Expense",
};

/**
 * Fallback type mapping based on account type
 */
const QBO_FALLBACK_TYPE: Record<AccountType, string> = {
  Asset: "Other Current Asset",
  Liability: "Other Current Liability",
  Equity: "Equity",
  Income: "Income",
  Expense: "Expense",
};

/**
 * Escapes a value for CSV format (handles commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generates a QuickBooks Online compatible CSV file from accounts
 */
export function generateQBOCSV(accounts: Account[]): string {
  // QBO CSV header row
  const headers = ["Account Name", "Type", "Detail Type", "Description", "Account Number"];

  const rows: string[][] = [];

  // Add header row
  rows.push(headers);

  // Add data rows
  for (const account of accounts) {
    const qboType = QBO_TYPE_MAPPING[account.detailType] || QBO_FALLBACK_TYPE[account.type];

    rows.push([
      escapeCSV(account.name),
      escapeCSV(qboType),
      escapeCSV(account.detailType),
      escapeCSV(account.description),
      escapeCSV(account.number),
    ]);
  }

  // Join rows into CSV format
  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Get the content type for QBO CSV files
 */
export function getQBOContentType(): string {
  return "text/csv;charset=utf-8";
}

/**
 * Generate a filename for QBO export
 */
export function getQBOFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_QBO_ChartOfAccounts_${date}.csv`;
}

/**
 * Generates a QuickBooks Online compatible CSV file for transactions
 * Format suitable for bank transaction import
 */
export function generateQBOTransactionsCSV(transactions: Transaction[]): string {
  // QBO Bank Transaction Import format
  const headers = ["Date", "Description", "Amount", "Account", "Payee/Vendor", "Type"];

  const rows: string[][] = [];
  rows.push(headers);

  for (const transaction of transactions) {
    // Use reviewed account if available, otherwise suggested
    const accountNumber = transaction.reviewedAccountNumber || transaction.suggestedAccountNumber || "";
    const accountName = transaction.reviewedAccountName || transaction.suggestedAccountName || "";
    const account = accountName ? `${accountNumber} - ${accountName}` : accountNumber;

    // For QBO, debits are negative, credits are positive
    const amount = transaction.type === "debit" ? -transaction.amount : transaction.amount;

    rows.push([
      escapeCSV(transaction.date),
      escapeCSV(transaction.description),
      amount.toFixed(2),
      escapeCSV(account),
      escapeCSV(transaction.vendor || ""),
      escapeCSV(transaction.type === "debit" ? "Expense" : "Deposit"),
    ]);
  }

  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Generate a filename for QBO transactions export
 */
export function getQBOTransactionsFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_QBO_Transactions_${date}.csv`;
}
