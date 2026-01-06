import { Account, AccountType, AccountDetailType } from "@/types/coa";
import { Transaction } from "@/types/transaction";

/**
 * Xero Account Type Codes
 * Reference: https://central.xero.com/s/article/Import-a-chart-of-accounts
 */
type XeroAccountType =
  | "BANK"         // Bank account
  | "CURRENT"      // Current Asset
  | "FIXED"        // Fixed Asset
  | "INVENTORY"    // Inventory Asset
  | "NONCURRENT"   // Non-current Asset
  | "PREPAYMENT"   // Prepayment
  | "CURRLIAB"     // Current Liability
  | "LIABILITY"    // Liability
  | "TERMLIAB"     // Non-current Liability
  | "EQUITY"       // Equity
  | "REVENUE"      // Revenue
  | "OTHERINCOME"  // Other Income
  | "DIRECTCOSTS"  // Direct Costs
  | "EXPENSE"      // Expense
  | "OVERHEADS";   // Overhead

/**
 * Maps account detail types to Xero account types
 */
const XERO_TYPE_MAPPING: Record<AccountDetailType, XeroAccountType> = {
  // Asset types
  Cash: "BANK",
  Bank: "BANK",
  "Accounts Receivable": "CURRENT",
  Inventory: "INVENTORY",
  "Other Current Asset": "CURRENT",
  "Fixed Asset": "FIXED",
  // Liability types
  "Accounts Payable": "CURRLIAB",
  "Credit Card": "CURRLIAB",
  "Other Current Liability": "CURRLIAB",
  "Long-term Liability": "TERMLIAB",
  // Equity types
  "Owner's Equity": "EQUITY",
  "Retained Earnings": "EQUITY",
  "Partner's Equity": "EQUITY",
  // Income types
  Sales: "REVENUE",
  Service: "REVENUE",
  "Other Income": "OTHERINCOME",
  Discount: "REVENUE",
  // Expense types
  "Cost of Goods Sold": "DIRECTCOSTS",
  Payroll: "EXPENSE",
  "Rent or Lease": "OVERHEADS",
  Utilities: "OVERHEADS",
  Insurance: "OVERHEADS",
  Advertising: "EXPENSE",
  "Bank Charges": "EXPENSE",
  Depreciation: "EXPENSE",
  Interest: "EXPENSE",
  "Legal & Professional": "EXPENSE",
  "Office/General Administrative": "OVERHEADS",
  "Repair & Maintenance": "EXPENSE",
  Supplies: "EXPENSE",
  "Taxes Paid": "EXPENSE",
  Travel: "EXPENSE",
  "Travel Meals": "EXPENSE",
  Auto: "EXPENSE",
  "Dues & Subscriptions": "EXPENSE",
  Training: "EXPENSE",
  Shipping: "DIRECTCOSTS",
  "Other Miscellaneous": "EXPENSE",
};

/**
 * Fallback type mapping based on account type
 */
const XERO_FALLBACK_TYPE: Record<AccountType, XeroAccountType> = {
  Asset: "CURRENT",
  Liability: "CURRLIAB",
  Equity: "EQUITY",
  Income: "REVENUE",
  Expense: "EXPENSE",
};

/**
 * Default tax codes for Xero by account type
 * These are US defaults - adjust for other regions
 */
const XERO_TAX_CODE: Record<XeroAccountType, string> = {
  BANK: "",
  CURRENT: "",
  FIXED: "",
  INVENTORY: "",
  NONCURRENT: "",
  PREPAYMENT: "",
  CURRLIAB: "",
  LIABILITY: "",
  TERMLIAB: "",
  EQUITY: "",
  REVENUE: "TAX001", // Output Tax
  OTHERINCOME: "TAX001",
  DIRECTCOSTS: "TAX002", // Input Tax
  EXPENSE: "TAX002",
  OVERHEADS: "TAX002",
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
 * Generates a Xero compatible CSV file from accounts
 *
 * Xero CSV Format:
 * *Code - Account code (required)
 * *Name - Account name (required)
 * *Type - Account type (required)
 * Description - Account description
 * Tax Code - Default tax code for transactions
 */
export function generateXeroCSV(accounts: Account[]): string {
  // Xero CSV header row (asterisk indicates required fields)
  const headers = ["*Code", "*Name", "*Type", "Description", "Tax Code"];

  const rows: string[][] = [];

  // Add header row
  rows.push(headers);

  // Add data rows
  for (const account of accounts) {
    const xeroType = XERO_TYPE_MAPPING[account.detailType] || XERO_FALLBACK_TYPE[account.type];
    const taxCode = XERO_TAX_CODE[xeroType] || "";

    rows.push([
      escapeCSV(account.number),
      escapeCSV(account.name),
      xeroType,
      escapeCSV(account.description),
      taxCode,
    ]);
  }

  // Join rows into CSV format
  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Get the content type for Xero CSV files
 */
export function getXeroContentType(): string {
  return "text/csv;charset=utf-8";
}

/**
 * Generate a filename for Xero export
 */
export function getXeroFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_Xero_ChartOfAccounts_${date}.csv`;
}

/**
 * Generates a Xero compatible CSV file for bank transactions
 *
 * Xero Bank Statement CSV Format:
 * *Date - Transaction date (required)
 * *Amount - Transaction amount (required, negative for debits)
 * Payee - Vendor/payee name
 * Description - Transaction description
 * Reference - Reference number
 * Cheque Number - Check number if applicable
 */
export function generateXeroTransactionsCSV(transactions: Transaction[]): string {
  const headers = ["*Date", "*Amount", "Payee", "Description", "Reference", "Account Code"];

  const rows: string[][] = [];
  rows.push(headers);

  for (const transaction of transactions) {
    // Use reviewed account if available, otherwise suggested
    const accountCode = transaction.reviewedAccountNumber || transaction.suggestedAccountNumber || "";

    // For Xero bank import, spending (debits) are negative, income (credits) are positive
    const amount = transaction.type === "debit" ? -transaction.amount : transaction.amount;

    // Format date as DD/MM/YYYY for Xero
    const dateParts = transaction.date.split("-");
    const xeroDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

    rows.push([
      xeroDate,
      amount.toFixed(2),
      escapeCSV(transaction.vendor || ""),
      escapeCSV(transaction.description),
      escapeCSV(transaction.id.slice(-8)), // Use last 8 chars of ID as reference
      escapeCSV(accountCode),
    ]);
  }

  return rows.map((row) => row.join(",")).join("\r\n");
}

/**
 * Generate a filename for Xero transactions export
 */
export function getXeroTransactionsFilename(projectName: string): string {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const date = new Date().toISOString().split("T")[0];
  return `${sanitizedName}_Xero_Transactions_${date}.csv`;
}
