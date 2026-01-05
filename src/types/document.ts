export const DOCUMENT_CATEGORIES = [
  "bank_statement",
  "receipt",
  "invoice",
  "tax_document",
  "payroll",
  "contract",
  "other",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface DocumentMetadata {
  vendor?: string;
  amount?: number;
  currency?: string;
  date?: string;
  accountNumber?: string;
  invoiceNumber?: string;
  taxYear?: number;
  employeeName?: string;
  description?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface ClassificationResult {
  category: DocumentCategory;
  confidence: number;
  year?: number;
  subcategory?: string;
  metadata: DocumentMetadata;
  reasoning: string;
}

export interface DocumentWithClassification {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  subcategory?: string | null;
  confidence: number;
  year?: number | null;
  isReviewed: boolean;
  metadata?: DocumentMetadata | null;
  createdAt: Date;
  updatedAt: Date;
}

export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  bank_statement: "Bank Statement",
  receipt: "Receipt",
  invoice: "Invoice",
  tax_document: "Tax Document",
  payroll: "Payroll",
  contract: "Contract",
  other: "Other",
};

export const CATEGORY_COLORS: Record<DocumentCategory, { bg: string; text: string; border: string }> = {
  bank_statement: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
  receipt: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
  invoice: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
  tax_document: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
  payroll: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
  contract: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
  other: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" },
};

// Used for CoA generation suggestions
export interface ClassifiedDocument {
  category: DocumentCategory;
  subcategory?: string;
  metadata?: DocumentMetadata;
  year?: number;
}
