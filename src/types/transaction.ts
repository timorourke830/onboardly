// Transaction Types for extracted financial data

export type TransactionType = "debit" | "credit";

export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  amount: number;
  type: TransactionType;
  vendor: string | null;
  documentId: string;
  documentName?: string;
  suggestedAccountNumber: string | null;
  suggestedAccountName: string | null;
  confidence: number;
  isReviewed: boolean;
  reviewedAccountNumber?: string | null;
  reviewedAccountName?: string | null;
  category?: string; // Source document category (bank_statement, receipt, etc.)
}

export interface TransactionExtractionResult {
  transactions: Transaction[];
  documentId: string;
  documentName: string;
  extractionMethod: "pdf" | "image" | "spreadsheet" | "unknown";
  pageCount?: number;
  errors: string[];
}

export interface AccountSummary {
  accountNumber: string;
  accountName: string;
  totalDebits: number;
  totalCredits: number;
  netAmount: number;
  transactionCount: number;
}

export interface ExportOptions {
  includeCoA: boolean;
  includeTransactions: boolean;
  includeSummary: boolean;
  format: "qbo" | "qbd" | "xero";
}

export interface ProjectExportResult {
  coaFile?: {
    filename: string;
    content: string;
    contentType: string;
  };
  transactionsFile?: {
    filename: string;
    content: string;
    contentType: string;
  };
  summaryFile?: {
    filename: string;
    content: string;
    contentType: string;
  };
}
