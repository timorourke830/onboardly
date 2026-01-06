// Report Types for Client Onboarding Report

export interface DateRange {
  start: string;
  end: string;
}

export interface MonthCoverage {
  year: number;
  month: number; // 1-12
  hasDocuments: boolean;
}

export interface DocumentCategoryInfo {
  category: string;
  label: string;
  count: number;
  dateRange?: DateRange;
  documents: {
    id: string;
    name: string;
    uploadedAt: string;
    year?: number | null;
  }[];
}

export interface MissingDocument {
  category: string;
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
  missingMonths?: string[]; // e.g., ["Jan 2024", "Feb 2024"]
}

export interface DocumentCoverageReport {
  documentsReceived: DocumentCategoryInfo[];
  documentsMissing: MissingDocument[];
  totalDocuments: number;
  dateRangeCoverage: {
    earliest: string | null;
    latest: string | null;
    gaps: string[]; // Missing months
    monthsCovered: number;
    monthsExpected: number;
  };
  completenessScore: number; // 0-100
}

export interface AccountSummary {
  accountNumber: string;
  accountName: string;
  accountType: string;
  transactionCount: number;
  totalAmount: number;
}

export interface VendorSummary {
  vendor: string;
  transactionCount: number;
  totalAmount: number;
}

export interface LargeTransaction {
  id: string;
  date: string;
  description: string;
  vendor: string | null;
  amount: number;
  type: "debit" | "credit";
  accountName: string | null;
}

export interface TransactionSummary {
  totalTransactions: number;
  dateRange: DateRange | null;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionsByAccount: AccountSummary[];
  topVendors: VendorSummary[];
  averageTransactionSize: number;
  largestTransactions: LargeTransaction[];
  incomeTransactionCount: number;
  expenseTransactionCount: number;
}

export interface ChartOfAccountsSummary {
  totalAccounts: number;
  accountsByType: {
    type: string;
    count: number;
  }[];
  industry: string;
  customAccounts: number; // Accounts added beyond template
}

export interface ReportRecommendation {
  priority: "high" | "medium" | "low";
  category: "documents" | "transactions" | "accounts" | "general";
  title: string;
  description: string;
  actionItem?: string;
}

export interface ClientInfo {
  businessName: string;
  projectName: string;
  industry: string;
  projectCreatedAt: string;
  reportGeneratedAt: string;
}

export interface OnboardingReport {
  clientInfo: ClientInfo;
  documentCoverage: DocumentCoverageReport;
  transactionSummary: TransactionSummary;
  chartOfAccounts: ChartOfAccountsSummary;
  recommendations: ReportRecommendation[];
  overallCompletenessScore: number; // 0-100
  status: "incomplete" | "needs-review" | "ready";
}

export interface PDFGenerationOptions {
  includeTransactionDetails?: boolean;
  includeRecommendations?: boolean;
  brandColor?: string;
}
