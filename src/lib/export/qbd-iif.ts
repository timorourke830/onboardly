import { Account, AccountType, AccountDetailType } from "@/types/coa";
import { Transaction } from "@/types/transaction";

/**
 * QuickBooks Desktop IIF Account Type Codes
 * Reference: https://quickbooks.intuit.com/learn-support/en-us/import-or-export-data-files/reference-guide-for-import-files/
 */
type QBDAccountType =
  | "BANK"      // Bank account
  | "AR"        // Accounts Receivable
  | "OCASSET"   // Other Current Asset
  | "FIXASSET"  // Fixed Asset
  | "OASSET"    // Other Asset
  | "AP"        // Accounts Payable
  | "CCARD"     // Credit Card
  | "OCLIAB"    // Other Current Liability
  | "LTLIAB"    // Long Term Liability
  | "EQUITY"    // Equity
  | "INC"       // Income
  | "COGS"      // Cost of Goods Sold
  | "EXP"       // Expense
  | "EXINC"     // Other Income
  | "EXEXP";    // Other Expense

/**
 * Maps account detail types to QuickBooks Desktop IIF account types
 */
const QBD_TYPE_MAPPING: Record<AccountDetailType, QBDAccountType> = {
  // Asset types
  Cash: "BANK",
  Bank: "BANK",
  "Accounts Receivable": "AR",
  Inventory: "OCASSET",
  "Other Current Asset": "OCASSET",
  "Fixed Asset": "FIXASSET",
  // Liability types
  "Accounts Payable": "AP",
  "Credit Card": "CCARD",
  "Other Current Liability": "OCLIAB",
  "Long-term Liability": "LTLIAB",
  // Equity types
  "Owner's Equity": "EQUITY",
  "Retained Earnings": "EQUITY",
  "Partner's Equity": "EQUITY",
  // Income types
  Sales: "INC",
  Service: "INC",
  "Other Income": "EXINC",
  Discount: "INC",
  // Expense types
  "Cost of Goods Sold": "COGS",
  Payroll: "EXP",
  "Rent or Lease": "EXP",
  Utilities: "EXP",
  Insurance: "EXP",
  Advertising: "EXP",
  "Bank Charges": "EXP",
  Depreciation: "EXP",
  Interest: "EXP",
  "Legal & Professional": "EXP",
  "Office/General Administrative": "EXP",
  "Repair & Maintenance": "EXP",
  Supplies: "EXP",
  "Taxes Paid": "EXP",
  Travel: "EXP",
  "Travel Meals": "EXP",
  Auto: "EXP",
  "Dues & Subscriptions": "EXP",
  Training: "EXP",
  Shipping: "EXP",
  "Other Miscellaneous": "EXP",
};

/**
 * Fallback type mapping based on account type
 */
const QBD_FALLBACK_TYPE: Record<AccountType, QBDAccountType> = {
  Asset: "OCASSET",
  Liability: "OCLIAB",
  Equity: "EQUITY",
  Income: "INC",
  Expense: "EXP",
};

/**
 * Escapes a value for IIF format (handles tabs and special characters)
 */
function escapeIIF(value: string): string {
  if (!value) return "";
  // IIF uses tab-delimited format, so we need to remove tabs and newlines
  return value.replace(/[\t\r\n]/g, " ").trim();
}

/**
 * Generates a QuickBooks Desktop compatible IIF file from accounts
 *
 * IIF Format for accounts:
 * !ACCNT - Header row defining columns
 * ACCNT - Data row for each account
 *
 * Column order: NAME, ACCNTTYPE, DESC, ACCNUM, EXTRA (optional)
 */
export function generateQBDIIF(accounts: Account[]): string {
  const lines: string[] = [];

  // IIF header row - defines the columns for account records
  // Format: !ACCNT<tab>NAME<tab>ACCNTTYPE<tab>DESC<tab>ACCNUM
  lines.push("!ACCNT\tNAME\tACCNTTYPE\tDESC\tACCNUM");

  // Add each account as a data row
  for (const account of accounts) {
    const qbdType = QBD_TYPE_MAPPING[account.detailType] || QBD_FALLBACK_TYPE[account.type];

    // Format: ACCNT<tab>name<tab>type<tab>description<tab>number
    const row = [
      "ACCNT",
      escapeIIF(account.name),
      qbdType,
      escapeIIF(account.description),
      escapeIIF(account.number),
    ].join("\t");

    lines.push(row);
  }

  // IIF files use Windows line endings (CRLF)
  return lines.join("\r\n");
}

/**
 * Get the content type for QBD IIF files
 */
export function getQBDContentType(): string {
  return "text/plain;charset=utf-8";
}

/**
 * Generate a filename for QBD export
 */
export function getQBDFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_QBD_ChartOfAccounts_${date}.iif`;
}

/**
 * Generates a QuickBooks Desktop compatible IIF file for General Journal transactions
 *
 * IIF Format for transactions (TRNS/SPL):
 * !TRNS - Header row for transaction lines
 * !SPL - Header row for split lines
 * !ENDTRNS - End of transaction marker
 */
export function generateQBDTransactionsIIF(transactions: Transaction[]): string {
  const lines: string[] = [];

  // IIF header rows for general journal entries
  lines.push("!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO");
  lines.push("!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO");
  lines.push("!ENDTRNS");

  // Group transactions by date for journal entries
  for (const transaction of transactions) {
    // Use reviewed account if available, otherwise suggested
    const accountName = transaction.reviewedAccountName || transaction.suggestedAccountName || "Uncategorized";

    // Format date as MM/DD/YYYY for QBD
    const dateParts = transaction.date.split("-");
    const qbdDate = `${dateParts[1]}/${dateParts[2]}/${dateParts[0]}`;

    // For debits, amount is positive (expense/asset increase)
    // For credits, amount is negative (income/liability increase)
    const amount = transaction.type === "debit" ? transaction.amount : -transaction.amount;

    // Transaction line (TRNS)
    lines.push([
      "TRNS",
      "GENERAL JOURNAL",
      qbdDate,
      escapeIIF(accountName),
      escapeIIF(transaction.vendor || ""),
      amount.toFixed(2),
      escapeIIF(transaction.description),
    ].join("\t"));

    // Split line (SPL) - the offsetting entry (typically goes to a suspense or clearing account)
    // In a real scenario, you'd want to properly balance the journal entries
    lines.push([
      "SPL",
      "GENERAL JOURNAL",
      qbdDate,
      "Opening Balance Equity", // Default offset account
      "",
      (-amount).toFixed(2),
      escapeIIF(transaction.description),
    ].join("\t"));

    lines.push("ENDTRNS");
  }

  return lines.join("\r\n");
}

/**
 * Generate a filename for QBD transactions export
 */
export function getQBDTransactionsFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_QBD_Transactions_${date}.iif`;
}
