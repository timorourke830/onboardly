"use client";

import { useState } from "react";
import { DocumentCard } from "./document-card";
import { CategoryBadge } from "./category-badge";
import { Select } from "@/components/ui/select";
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

interface DocumentGridProps {
  documents: Document[];
  groupByCategory?: boolean;
  onDocumentClick?: (document: Document) => void;
}

export function DocumentGrid({
  documents,
  groupByCategory = true,
  onDocumentClick,
}: DocumentGridProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const filteredDocuments =
    filterCategory === "all"
      ? documents
      : documents.filter((doc) => doc.category === filterCategory);

  // Group documents by category
  const groupedDocuments = groupByCategory
    ? DOCUMENT_CATEGORIES.reduce(
        (acc, category) => {
          const categoryDocs = filteredDocuments.filter(
            (doc) => doc.category === category
          );
          if (categoryDocs.length > 0) {
            acc[category] = categoryDocs;
          }
          return acc;
        },
        {} as Record<DocumentCategory, Document[]>
      )
    : null;

  const filterOptions = [
    { value: "all", label: "All Categories" },
    ...DOCUMENT_CATEGORIES.map((cat) => ({
      value: cat,
      label: CATEGORY_LABELS[cat],
    })),
  ];

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No documents found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center gap-4">
        <div className="w-48">
          <Select
            options={filterOptions}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            placeholder="Filter by category"
          />
        </div>
        <span className="text-sm text-gray-500">
          Showing {filteredDocuments.length} of {documents.length} documents
        </span>
      </div>

      {/* Grid */}
      {groupByCategory && groupedDocuments ? (
        Object.entries(groupedDocuments).map(([category, docs]) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={category as DocumentCategory} />
              <span className="text-sm text-gray-500">
                {docs.length} document{docs.length !== 1 && "s"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {docs.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  {...doc}
                  onClick={() => onDocumentClick?.(doc)}
                />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              {...doc}
              onClick={() => onDocumentClick?.(doc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
