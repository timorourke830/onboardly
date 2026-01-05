"use client";

import { useState } from "react";
import { AlertTriangle, Save, Loader2 } from "lucide-react";
import { DocumentGrid } from "./document-grid";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import {
  type DocumentCategory,
  DOCUMENT_CATEGORIES,
  CATEGORY_LABELS,
} from "@/types/document";

interface Document {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  confidence: number;
  year?: number | null;
  isReviewed: boolean;
}

interface ClassificationReviewProps {
  documents: Document[];
  projectId: string;
  onSave: (updates: { id: string; category: DocumentCategory }[]) => Promise<void>;
}

interface MissingDocument {
  category: DocumentCategory;
  year?: number;
  message: string;
}

export function ClassificationReview({
  documents,
  projectId,
  onSave,
}: ClassificationReviewProps) {
  const { addToast } = useToast();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, DocumentCategory>
  >(new Map());
  const [isSaving, setIsSaving] = useState(false);

  // Detect missing documents
  const missingDocuments = detectMissingDocuments(documents);

  // Get current year for context
  const currentYear = new Date().getFullYear();

  // Apply pending changes to documents for display
  const displayDocuments = documents.map((doc) => ({
    ...doc,
    category: pendingChanges.get(doc.id) || doc.category,
  }));

  const handleCategoryChange = (documentId: string, newCategory: DocumentCategory) => {
    setPendingChanges((prev) => {
      const next = new Map(prev);
      next.set(documentId, newCategory);
      return next;
    });
  };

  const handleSave = async () => {
    if (pendingChanges.size === 0) {
      addToast({ message: "No changes to save", variant: "info" });
      return;
    }

    setIsSaving(true);
    try {
      const updates = Array.from(pendingChanges.entries()).map(([id, category]) => ({
        id,
        category,
      }));
      await onSave(updates);
      setPendingChanges(new Map());
      addToast({ message: "Changes saved successfully", variant: "success" });
    } catch (error) {
      addToast({ message: "Failed to save changes", variant: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions = DOCUMENT_CATEGORIES.map((cat) => ({
    value: cat,
    label: CATEGORY_LABELS[cat],
  }));

  return (
    <div className="space-y-6">
      {/* Missing Documents Alert */}
      {missingDocuments.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-800">
                Potentially Missing Documents
              </h3>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                {missingDocuments.map((missing, index) => (
                  <li key={index}>{missing.message}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Pending Changes Banner */}
      {pendingChanges.size > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-4">
          <span className="text-sm text-blue-800">
            {pendingChanges.size} unsaved change{pendingChanges.size !== 1 && "s"}
          </span>
          <Button onClick={handleSave} isLoading={isSaving} size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      )}

      {/* Document Grid */}
      <DocumentGrid
        documents={displayDocuments}
        groupByCategory
        onDocumentClick={setSelectedDocument}
      />

      {/* Document Detail Modal */}
      <Modal
        open={!!selectedDocument}
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        {selectedDocument && (
          <ModalContent className="max-w-lg">
            <ModalHeader>
              <ModalTitle className="truncate pr-8">
                {selectedDocument.fileName}
              </ModalTitle>
              <ModalDescription>
                Review and adjust the classification if needed
              </ModalDescription>
            </ModalHeader>

            <div className="space-y-4 py-4">
              {/* Preview */}
              <div className="aspect-video rounded-lg bg-gray-100 overflow-hidden">
                {selectedDocument.fileType.startsWith("image/") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedDocument.fileUrl}
                    alt={selectedDocument.fileName}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <iframe
                    src={selectedDocument.fileUrl}
                    className="h-full w-full"
                    title={selectedDocument.fileName}
                  />
                )}
              </div>

              {/* Category Selector */}
              <Select
                label="Category"
                options={categoryOptions}
                value={
                  pendingChanges.get(selectedDocument.id) ||
                  selectedDocument.category
                }
                onChange={(e) =>
                  handleCategoryChange(
                    selectedDocument.id,
                    e.target.value as DocumentCategory
                  )
                }
              />

              {/* Confidence */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  AI Confidence
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        selectedDocument.confidence >= 0.8
                          ? "bg-green-500"
                          : selectedDocument.confidence >= 0.5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${selectedDocument.confidence * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.round(selectedDocument.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Year */}
              {selectedDocument.year && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Detected Year
                  </label>
                  <p className="mt-1 text-gray-900">{selectedDocument.year}</p>
                </div>
              )}
            </div>

            <ModalFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </Button>
              <a
                href={selectedDocument.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline">Open Original</Button>
              </a>
            </ModalFooter>
          </ModalContent>
        )}
      </Modal>
    </div>
  );
}

/**
 * Detect potentially missing documents based on common patterns
 */
function detectMissingDocuments(documents: Document[]): MissingDocument[] {
  const missing: MissingDocument[] = [];
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  // Check for common document types
  const categories = documents.reduce(
    (acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const years = documents
    .filter((doc) => doc.year)
    .map((doc) => doc.year as number);
  const uniqueYears = [...new Set(years)].sort();

  // Check for missing bank statements
  if (!categories.bank_statement) {
    missing.push({
      category: "bank_statement",
      message: "No bank statements found. Consider uploading recent bank statements.",
    });
  }

  // Check for missing tax documents for last year
  const hasTaxDocForLastYear = documents.some(
    (doc) => doc.category === "tax_document" && doc.year === lastYear
  );
  if (!hasTaxDocForLastYear && categories.tax_document) {
    missing.push({
      category: "tax_document",
      year: lastYear,
      message: `No tax documents found for ${lastYear}.`,
    });
  }

  // Check for gaps in years if we have documents from multiple years
  if (uniqueYears.length >= 2) {
    const minYear = Math.min(...uniqueYears);
    const maxYear = Math.max(...uniqueYears);
    for (let year = minYear; year <= maxYear; year++) {
      if (!uniqueYears.includes(year)) {
        missing.push({
          category: "bank_statement",
          year,
          message: `No documents found for ${year}. There may be a gap in records.`,
        });
      }
    }
  }

  return missing;
}
