// Document Checklist Analysis
// Analyzes uploaded documents against expected requirements

import {
  DocumentCoverageReport,
  DocumentCategoryInfo,
  MissingDocument,
  MonthCoverage,
} from "@/types/report";
import { CATEGORY_LABELS, DocumentCategory } from "@/types/document";

interface DocumentInput {
  id: string;
  fileName: string;
  category: DocumentCategory;
  subcategory?: string | null;
  year?: number | null;
  createdAt: Date | string;
  metadata?: Record<string, unknown> | null;
}

// Define required documents for all businesses
const REQUIRED_DOCUMENTS: {
  category: DocumentCategory;
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
  requiresMonthCoverage: boolean;
  monthsRequired: number; // How many months to look for
}[] = [
  {
    category: "bank_statement",
    label: "Bank Statements",
    reason: "Bank statements are essential for reconciling cash transactions and verifying income/expenses. Missing statements create gaps in the financial record.",
    priority: "high",
    requiresMonthCoverage: true,
    monthsRequired: 12,
  },
  {
    category: "credit_card",
    label: "Credit Card Statements",
    reason: "Credit card statements capture business expenses that may not appear in bank records. Missing statements can lead to understated expenses.",
    priority: "high",
    requiresMonthCoverage: true,
    monthsRequired: 12,
  },
  {
    category: "payroll",
    label: "Payroll Records / Pay Stubs",
    reason: "Payroll records are needed to verify wage expenses, tax withholdings, and compliance with employment tax requirements.",
    priority: "medium",
    requiresMonthCoverage: false,
    monthsRequired: 0,
  },
  {
    category: "invoice",
    label: "Vendor Invoices",
    reason: "Vendor invoices provide documentation for expense deductions and help verify accounts payable balances.",
    priority: "medium",
    requiresMonthCoverage: false,
    monthsRequired: 0,
  },
  {
    category: "tax_document",
    label: "Prior Year Tax Return",
    reason: "The prior year tax return (1040 Schedule C, 1120, 1120S, or 1065) establishes the starting point for the current year and ensures consistency in accounting methods.",
    priority: "high",
    requiresMonthCoverage: false,
    monthsRequired: 0,
  },
];

// Get all months in a range
function getMonthsInRange(startDate: Date, endDate: Date): MonthCoverage[] {
  const months: MonthCoverage[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    months.push({
      year: current.getFullYear(),
      month: current.getMonth() + 1,
      hasDocuments: false,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
}

// Format month for display
function formatMonth(year: number, month: number): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// Parse date from various formats
function parseDocumentDate(doc: DocumentInput): Date | null {
  // Try to get date from metadata
  if (doc.metadata) {
    const metadata = doc.metadata as Record<string, unknown>;
    if (metadata.date && typeof metadata.date === "string") {
      const parsed = new Date(metadata.date);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    if (metadata.statementDate && typeof metadata.statementDate === "string") {
      const parsed = new Date(metadata.statementDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
  }

  // Use year if available
  if (doc.year) {
    return new Date(doc.year, 0, 1); // January of that year
  }

  // Fall back to upload date
  const uploadDate = typeof doc.createdAt === "string"
    ? new Date(doc.createdAt)
    : doc.createdAt;
  return uploadDate;
}

// Analyze document coverage
export function analyzeDocumentCoverage(
  documents: DocumentInput[],
  industry: string
): DocumentCoverageReport {
  // Group documents by category
  const docsByCategory = new Map<DocumentCategory, DocumentInput[]>();

  for (const doc of documents) {
    const category = doc.category as DocumentCategory;
    if (!docsByCategory.has(category)) {
      docsByCategory.set(category, []);
    }
    docsByCategory.get(category)!.push(doc);
  }

  // Build documents received list
  const documentsReceived: DocumentCategoryInfo[] = [];

  for (const [category, docs] of docsByCategory) {
    // Get date range for this category
    const dates = docs
      .map(parseDocumentDate)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    const dateRange = dates.length > 0
      ? {
          start: dates[0].toISOString().split("T")[0],
          end: dates[dates.length - 1].toISOString().split("T")[0],
        }
      : undefined;

    documentsReceived.push({
      category,
      label: CATEGORY_LABELS[category] || category,
      count: docs.length,
      dateRange,
      documents: docs.map((d) => ({
        id: d.id,
        name: d.fileName,
        uploadedAt: typeof d.createdAt === "string"
          ? d.createdAt
          : d.createdAt.toISOString(),
        year: d.year,
      })),
    });
  }

  // Sort by count descending
  documentsReceived.sort((a, b) => b.count - a.count);

  // Identify missing documents
  const documentsMissing: MissingDocument[] = [];

  // Calculate date range for monthly coverage analysis
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const expectedMonths = getMonthsInRange(twelveMonthsAgo, now);

  for (const required of REQUIRED_DOCUMENTS) {
    const categoryDocs = docsByCategory.get(required.category) || [];

    if (categoryDocs.length === 0) {
      // Category is completely missing
      documentsMissing.push({
        category: required.category,
        label: required.label,
        reason: required.reason,
        priority: required.priority,
        missingMonths: required.requiresMonthCoverage
          ? expectedMonths.map((m) => formatMonth(m.year, m.month))
          : undefined,
      });
    } else if (required.requiresMonthCoverage) {
      // Check for missing months
      const coveredMonths = new Set<string>();

      for (const doc of categoryDocs) {
        const date = parseDocumentDate(doc);
        if (date) {
          // Mark the month as covered
          const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          coveredMonths.add(key);
        }
      }

      // Find missing months
      const missingMonths: string[] = [];
      for (const month of expectedMonths) {
        const key = `${month.year}-${month.month}`;
        if (!coveredMonths.has(key)) {
          missingMonths.push(formatMonth(month.year, month.month));
        }
      }

      if (missingMonths.length > 0) {
        documentsMissing.push({
          category: required.category,
          label: required.label,
          reason: `${required.label} are missing for some months. Complete records are needed for accurate financial statements.`,
          priority: missingMonths.length > 6 ? "high" : "medium",
          missingMonths,
        });
      }
    }
  }

  // Sort missing by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  documentsMissing.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Calculate overall date range coverage
  const allDates = documents
    .map(parseDocumentDate)
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const earliest = allDates.length > 0 ? allDates[0].toISOString().split("T")[0] : null;
  const latest = allDates.length > 0 ? allDates[allDates.length - 1].toISOString().split("T")[0] : null;

  // Calculate gaps in bank statement coverage
  const bankDocs = docsByCategory.get("bank_statement") || [];
  const creditDocs = docsByCategory.get("credit_card") || [];
  const financialDocs = [...bankDocs, ...creditDocs];

  const coveredMonthsSet = new Set<string>();
  for (const doc of financialDocs) {
    const date = parseDocumentDate(doc);
    if (date) {
      coveredMonthsSet.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    }
  }

  const gaps: string[] = [];
  for (const month of expectedMonths) {
    const key = `${month.year}-${month.month}`;
    if (!coveredMonthsSet.has(key)) {
      gaps.push(formatMonth(month.year, month.month));
    }
  }

  // Calculate completeness score
  let score = 0;
  const weights = {
    bank_statement: 25,
    credit_card: 20,
    payroll: 15,
    invoice: 15,
    tax_document: 20,
    receipt: 5,
  };

  for (const [category, weight] of Object.entries(weights)) {
    const docs = docsByCategory.get(category as DocumentCategory) || [];
    if (docs.length > 0) {
      // For monthly categories, check coverage percentage
      if (category === "bank_statement" || category === "credit_card") {
        const monthsCovered = new Set<string>();
        for (const doc of docs) {
          const date = parseDocumentDate(doc);
          if (date) {
            monthsCovered.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
          }
        }
        const coverageRatio = Math.min(1, monthsCovered.size / 12);
        score += weight * coverageRatio;
      } else {
        // For other categories, just check if present
        score += weight;
      }
    }
  }

  // Round score
  const completenessScore = Math.round(Math.min(100, score));

  return {
    documentsReceived,
    documentsMissing,
    totalDocuments: documents.length,
    dateRangeCoverage: {
      earliest,
      latest,
      gaps,
      monthsCovered: 12 - gaps.length,
      monthsExpected: 12,
    },
    completenessScore,
  };
}

// Get industry-specific document recommendations
export function getIndustryRecommendations(industry: string): string[] {
  const recommendations: Record<string, string[]> = {
    "e-commerce": [
      "Sales platform reports (Shopify, Amazon Seller Central, etc.)",
      "Payment processor statements (Stripe, PayPal, Square)",
      "Shipping cost summaries",
      "Inventory purchase invoices",
    ],
    "restaurant": [
      "POS system reports",
      "Food vendor invoices",
      "Liquor license and permits",
      "Health inspection records",
    ],
    "construction": [
      "Project contracts and change orders",
      "Subcontractor 1099s",
      "Equipment purchase/lease agreements",
      "Workers comp and liability insurance",
    ],
    "professional-services": [
      "Client contracts and engagement letters",
      "Professional liability insurance",
      "Continuing education receipts",
      "Professional license documentation",
    ],
    "healthcare": [
      "Insurance reimbursement statements",
      "Medical supply invoices",
      "HIPAA compliance documentation",
      "Professional license documentation",
    ],
    "real-estate": [
      "Rental agreements and leases",
      "Property management statements",
      "1099 forms from tenants",
      "Property tax statements",
      "Mortgage statements",
    ],
    "retail": [
      "POS system reports",
      "Inventory purchase invoices",
      "Sales tax returns",
      "Supplier agreements",
    ],
    "technology": [
      "Software subscription invoices",
      "Cloud hosting bills",
      "Client contracts",
      "Contractor agreements and 1099s",
    ],
  };

  return recommendations[industry] || [];
}
