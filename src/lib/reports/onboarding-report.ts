// Onboarding Report Generator
// Compiles all data into a structured report

import {
  OnboardingReport,
  ClientInfo,
  ChartOfAccountsSummary,
  ReportRecommendation,
} from "@/types/report";
import { analyzeDocumentCoverage, getIndustryRecommendations } from "@/lib/analysis/document-checklist";
import { summarizeTransactions, identifyTransactionIssues } from "@/lib/analysis/transaction-summary";
import { DocumentCategory } from "@/types/document";

interface DocumentInput {
  id: string;
  fileName: string;
  category: DocumentCategory;
  subcategory?: string | null;
  year?: number | null;
  createdAt: Date | string;
  metadata?: Record<string, unknown> | null;
}

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

interface AccountInput {
  number: string;
  name: string;
  type: string;
  subtype?: string;
  description?: string;
}

interface ProjectInput {
  id: string;
  name: string;
  businessName: string;
  industry: string;
  createdAt: Date | string;
}

interface ChartOfAccountsInput {
  id: string;
  industry: string;
  accounts: AccountInput[];
}

// Generate the complete onboarding report
export function generateOnboardingReport(
  project: ProjectInput,
  documents: DocumentInput[],
  transactions: TransactionInput[],
  coa: ChartOfAccountsInput | null
): OnboardingReport {
  const now = new Date().toISOString();

  // Build client info
  const clientInfo: ClientInfo = {
    businessName: project.businessName,
    projectName: project.name,
    industry: project.industry,
    projectCreatedAt: typeof project.createdAt === "string"
      ? project.createdAt
      : project.createdAt.toISOString(),
    reportGeneratedAt: now,
  };

  // Analyze document coverage
  const documentCoverage = analyzeDocumentCoverage(documents, project.industry);

  // Summarize transactions
  const transactionSummary = summarizeTransactions(transactions);

  // Analyze chart of accounts
  const chartOfAccounts = analyzeChartOfAccounts(coa, project.industry);

  // Generate recommendations
  const recommendations = generateRecommendations(
    documentCoverage,
    transactionSummary,
    chartOfAccounts,
    project.industry,
    transactions
  );

  // Calculate overall completeness score
  const overallCompletenessScore = calculateOverallScore(
    documentCoverage.completenessScore,
    transactionSummary.totalTransactions,
    chartOfAccounts.totalAccounts,
    recommendations
  );

  // Determine status
  let status: "incomplete" | "needs-review" | "ready";
  if (overallCompletenessScore < 50) {
    status = "incomplete";
  } else if (overallCompletenessScore < 80) {
    status = "needs-review";
  } else {
    status = "ready";
  }

  return {
    clientInfo,
    documentCoverage,
    transactionSummary,
    chartOfAccounts,
    recommendations,
    overallCompletenessScore,
    status,
  };
}

// Analyze chart of accounts
function analyzeChartOfAccounts(
  coa: ChartOfAccountsInput | null,
  industry: string
): ChartOfAccountsSummary {
  if (!coa || !coa.accounts || coa.accounts.length === 0) {
    return {
      totalAccounts: 0,
      accountsByType: [],
      industry,
      customAccounts: 0,
    };
  }

  // Count by type
  const typeMap = new Map<string, number>();
  for (const account of coa.accounts) {
    const type = account.type || "Other";
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  }

  const accountsByType = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Estimate custom accounts (accounts not in standard templates typically have numbers > 7000 or unusual patterns)
  // This is a rough estimate since we don't have the template to compare
  const customAccounts = coa.accounts.filter((a) => {
    const num = parseInt(a.number);
    return num >= 7000 || isNaN(num);
  }).length;

  return {
    totalAccounts: coa.accounts.length,
    accountsByType,
    industry: coa.industry || industry,
    customAccounts,
  };
}

// Generate recommendations based on analysis
function generateRecommendations(
  documentCoverage: ReturnType<typeof analyzeDocumentCoverage>,
  transactionSummary: ReturnType<typeof summarizeTransactions>,
  chartOfAccounts: ChartOfAccountsSummary,
  industry: string,
  transactions: TransactionInput[]
): ReportRecommendation[] {
  const recommendations: ReportRecommendation[] = [];

  // Document recommendations
  for (const missing of documentCoverage.documentsMissing) {
    if (missing.priority === "high") {
      recommendations.push({
        priority: "high",
        category: "documents",
        title: `Obtain ${missing.label}`,
        description: missing.reason,
        actionItem: missing.missingMonths
          ? `Request ${missing.label} for: ${missing.missingMonths.slice(0, 3).join(", ")}${missing.missingMonths.length > 3 ? ` and ${missing.missingMonths.length - 3} more months` : ""}`
          : `Request ${missing.label} from the client`,
      });
    }
  }

  // Gap coverage recommendation
  if (documentCoverage.dateRangeCoverage.gaps.length > 3) {
    recommendations.push({
      priority: "high",
      category: "documents",
      title: "Address Statement Coverage Gaps",
      description: `There are ${documentCoverage.dateRangeCoverage.gaps.length} months without bank or credit card statements. Complete records are essential for accurate financial reporting.`,
      actionItem: "Request statements for all missing months to ensure complete financial records",
    });
  }

  // Transaction recommendations
  const transactionIssues = identifyTransactionIssues(transactions);
  for (const issue of transactionIssues) {
    if (issue.severity === "warning") {
      recommendations.push({
        priority: "medium",
        category: "transactions",
        title: issue.issue,
        description: `Found ${issue.count} transaction(s) that need attention.`,
        actionItem: "Review flagged transactions and make corrections as needed",
      });
    }
  }

  // No transactions extracted
  if (transactionSummary.totalTransactions === 0 && documentCoverage.totalDocuments > 0) {
    recommendations.push({
      priority: "high",
      category: "transactions",
      title: "Extract Transactions from Documents",
      description: "Documents have been uploaded but transactions have not been extracted yet.",
      actionItem: "Go to the Transactions page and run the extraction process",
    });
  }

  // Low account mapping
  if (transactionSummary.totalTransactions > 0) {
    const unmapped = transactionSummary.transactionsByAccount.find(
      (a) => a.accountNumber === "unassigned"
    );
    if (unmapped && unmapped.transactionCount > transactionSummary.totalTransactions * 0.2) {
      recommendations.push({
        priority: "medium",
        category: "transactions",
        title: "Review Account Mappings",
        description: `${unmapped.transactionCount} transactions (${Math.round(unmapped.transactionCount / transactionSummary.totalTransactions * 100)}%) are not mapped to accounts.`,
        actionItem: "Review and assign appropriate accounts to unmapped transactions",
      });
    }
  }

  // Chart of accounts recommendations
  if (chartOfAccounts.totalAccounts === 0) {
    recommendations.push({
      priority: "high",
      category: "accounts",
      title: "Generate Chart of Accounts",
      description: "No chart of accounts has been created for this client yet.",
      actionItem: "Go to the Chart of Accounts page to generate or import an account structure",
    });
  }

  // Industry-specific recommendations
  const industryDocs = getIndustryRecommendations(industry);
  if (industryDocs.length > 0 && recommendations.length < 6) {
    recommendations.push({
      priority: "low",
      category: "documents",
      title: `Consider ${industry.replace("-", " ")} Specific Documents`,
      description: `For ${industry.replace("-", " ")} businesses, you may also want to collect: ${industryDocs.slice(0, 3).join(", ")}.`,
      actionItem: "Request any applicable industry-specific documents from the client",
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations.slice(0, 8); // Limit to 8 recommendations
}

// Calculate overall completeness score
function calculateOverallScore(
  documentScore: number,
  transactionCount: number,
  accountCount: number,
  recommendations: ReportRecommendation[]
): number {
  // Weights
  const documentWeight = 40;
  const transactionWeight = 30;
  const accountWeight = 20;
  const recommendationWeight = 10;

  let score = 0;

  // Document score (already 0-100)
  score += (documentScore / 100) * documentWeight;

  // Transaction score - based on whether transactions exist and are reasonable
  if (transactionCount > 0) {
    score += transactionWeight; // Full points if any transactions
  }

  // Account score - based on whether CoA exists
  if (accountCount > 0) {
    score += accountWeight; // Full points if CoA exists
  }

  // Recommendation penalty - fewer high-priority items = better
  const highPriorityCount = recommendations.filter((r) => r.priority === "high").length;
  if (highPriorityCount === 0) {
    score += recommendationWeight;
  } else if (highPriorityCount <= 2) {
    score += recommendationWeight * 0.5;
  }
  // No points if more than 2 high-priority recommendations

  return Math.round(Math.min(100, Math.max(0, score)));
}

// Get status label and color
export function getStatusInfo(status: "incomplete" | "needs-review" | "ready"): {
  label: string;
  color: string;
  description: string;
} {
  switch (status) {
    case "incomplete":
      return {
        label: "Incomplete",
        color: "red",
        description: "Critical documents or data are missing. Additional information needed from the client.",
      };
    case "needs-review":
      return {
        label: "Needs Review",
        color: "yellow",
        description: "Most data is present but some items need attention before finalizing.",
      };
    case "ready":
      return {
        label: "Ready",
        color: "green",
        description: "All critical data is present. Ready to finalize and export.",
      };
  }
}
