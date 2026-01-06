// Transaction Summary Analysis
// Summarizes extracted transactions for reporting

import {
  TransactionSummary,
  AccountSummary,
  VendorSummary,
  LargeTransaction,
  DateRange,
} from "@/types/report";
import { Transaction } from "@/types/transaction";

interface TransactionInput {
  id: string;
  date: string | Date;
  description: string;
  amount: number;
  type: "debit" | "credit" | string;
  vendor?: string | null;
  suggestedAccountNumber?: string | null;
  suggestedAccountName?: string | null;
  reviewedAccountNumber?: string | null;
  reviewedAccountName?: string | null;
}

// Summarize transactions for reporting
export function summarizeTransactions(
  transactions: TransactionInput[]
): TransactionSummary {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      dateRange: null,
      totalIncome: 0,
      totalExpenses: 0,
      netAmount: 0,
      transactionsByAccount: [],
      topVendors: [],
      averageTransactionSize: 0,
      largestTransactions: [],
      incomeTransactionCount: 0,
      expenseTransactionCount: 0,
    };
  }

  // Calculate date range
  const dates = transactions
    .map((t) => new Date(t.date))
    .filter((d) => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const dateRange: DateRange | null = dates.length > 0
    ? {
        start: dates[0].toISOString().split("T")[0],
        end: dates[dates.length - 1].toISOString().split("T")[0],
      }
    : null;

  // Calculate totals
  let totalIncome = 0;
  let totalExpenses = 0;
  let incomeTransactionCount = 0;
  let expenseTransactionCount = 0;

  for (const t of transactions) {
    if (t.type === "credit") {
      totalIncome += t.amount;
      incomeTransactionCount++;
    } else {
      totalExpenses += t.amount;
      expenseTransactionCount++;
    }
  }

  const netAmount = totalIncome - totalExpenses;
  const averageTransactionSize = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
    : 0;

  // Group by account
  const accountMap = new Map<string, {
    accountNumber: string;
    accountName: string;
    accountType: string;
    total: number;
    count: number;
  }>();

  for (const t of transactions) {
    const accountNumber = t.reviewedAccountNumber || t.suggestedAccountNumber || "unassigned";
    const accountName = t.reviewedAccountName || t.suggestedAccountName || "Unassigned";

    // Determine account type from number or name
    let accountType = "Expense";
    if (accountNumber.startsWith("1")) accountType = "Asset";
    else if (accountNumber.startsWith("2")) accountType = "Liability";
    else if (accountNumber.startsWith("3")) accountType = "Equity";
    else if (accountNumber.startsWith("4")) accountType = "Income";
    else if (accountNumber.startsWith("5") || accountNumber.startsWith("6")) accountType = "Expense";

    const key = accountNumber;
    const existing = accountMap.get(key);

    if (existing) {
      existing.total += t.type === "debit" ? -t.amount : t.amount;
      existing.count++;
    } else {
      accountMap.set(key, {
        accountNumber,
        accountName,
        accountType,
        total: t.type === "debit" ? -t.amount : t.amount,
        count: 1,
      });
    }
  }

  const transactionsByAccount: AccountSummary[] = Array.from(accountMap.values())
    .map((a) => ({
      accountNumber: a.accountNumber,
      accountName: a.accountName,
      accountType: a.accountType,
      transactionCount: a.count,
      totalAmount: a.total,
    }))
    .sort((a, b) => Math.abs(b.totalAmount) - Math.abs(a.totalAmount));

  // Group by vendor
  const vendorMap = new Map<string, { count: number; total: number }>();

  for (const t of transactions) {
    const vendor = t.vendor || "Unknown";
    const existing = vendorMap.get(vendor);

    if (existing) {
      existing.count++;
      existing.total += t.amount;
    } else {
      vendorMap.set(vendor, { count: 1, total: t.amount });
    }
  }

  const topVendors: VendorSummary[] = Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      transactionCount: data.count,
      totalAmount: data.total,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  // Get largest transactions
  const largestTransactions: LargeTransaction[] = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((t) => ({
      id: t.id,
      date: typeof t.date === "string" ? t.date : t.date.toISOString().split("T")[0],
      description: t.description,
      vendor: t.vendor || null,
      amount: t.amount,
      type: t.type as "debit" | "credit",
      accountName: t.reviewedAccountName || t.suggestedAccountName || null,
    }));

  return {
    totalTransactions: transactions.length,
    dateRange,
    totalIncome,
    totalExpenses,
    netAmount,
    transactionsByAccount,
    topVendors,
    averageTransactionSize,
    largestTransactions,
    incomeTransactionCount,
    expenseTransactionCount,
  };
}

// Get transaction statistics by month
export function getMonthlyBreakdown(
  transactions: TransactionInput[]
): {
  month: string;
  income: number;
  expenses: number;
  transactionCount: number;
}[] {
  const monthlyMap = new Map<string, {
    income: number;
    expenses: number;
    count: number;
  }>();

  for (const t of transactions) {
    const date = new Date(t.date);
    if (isNaN(date.getTime())) continue;

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const existing = monthlyMap.get(key);

    if (existing) {
      if (t.type === "credit") {
        existing.income += t.amount;
      } else {
        existing.expenses += t.amount;
      }
      existing.count++;
    } else {
      monthlyMap.set(key, {
        income: t.type === "credit" ? t.amount : 0,
        expenses: t.type === "debit" ? t.amount : 0,
        count: 1,
      });
    }
  }

  return Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      income: data.income,
      expenses: data.expenses,
      transactionCount: data.count,
    }));
}

// Identify potential issues in transactions
export function identifyTransactionIssues(
  transactions: TransactionInput[]
): {
  issue: string;
  severity: "warning" | "info";
  count: number;
}[] {
  const issues: { issue: string; severity: "warning" | "info"; count: number }[] = [];

  // Check for unassigned accounts
  const unassigned = transactions.filter(
    (t) => !t.reviewedAccountNumber && !t.suggestedAccountNumber
  );
  if (unassigned.length > 0) {
    issues.push({
      issue: "Transactions without account mapping",
      severity: "warning",
      count: unassigned.length,
    });
  }

  // Check for missing vendors
  const noVendor = transactions.filter((t) => !t.vendor);
  if (noVendor.length > 0) {
    issues.push({
      issue: "Transactions without vendor information",
      severity: "info",
      count: noVendor.length,
    });
  }

  // Check for large transactions
  const amounts = transactions.map((t) => t.amount);
  const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const largeThreshold = avgAmount * 5;
  const unusuallyLarge = transactions.filter((t) => t.amount > largeThreshold);
  if (unusuallyLarge.length > 0) {
    issues.push({
      issue: "Unusually large transactions (5x average)",
      severity: "info",
      count: unusuallyLarge.length,
    });
  }

  // Check for duplicate amounts on same date
  const dateAmountMap = new Map<string, number>();
  let duplicateCount = 0;
  for (const t of transactions) {
    const key = `${t.date}-${t.amount}-${t.type}`;
    const count = dateAmountMap.get(key) || 0;
    if (count > 0) duplicateCount++;
    dateAmountMap.set(key, count + 1);
  }
  if (duplicateCount > 0) {
    issues.push({
      issue: "Potential duplicate transactions (same date/amount)",
      severity: "warning",
      count: duplicateCount,
    });
  }

  return issues;
}
