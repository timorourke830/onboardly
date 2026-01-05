"use client";

import { Sparkles, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AccountSuggestion } from "@/types/coa";
import { cn } from "@/lib/utils";

interface SuggestionsPanelProps {
  suggestions: AccountSuggestion[];
  onAccept: (index: number) => void;
  onReject: (index: number) => void;
}

export function SuggestionsPanel({
  suggestions,
  onAccept,
  onReject,
}: SuggestionsPanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
          <Sparkles className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-900">
            AI Suggested Accounts
          </h3>
          <p className="text-xs text-gray-500">
            Based on your uploaded documents, we recommend adding these accounts
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {suggestions.map((suggestion, index) => (
          <SuggestionCard
            key={index}
            suggestion={suggestion}
            isExpanded={expandedIndex === index}
            onToggle={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            onAccept={() => onAccept(index)}
            onReject={() => onReject(index)}
          />
        ))}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AccountSuggestion;
  isExpanded: boolean;
  onToggle: () => void;
  onAccept: () => void;
  onReject: () => void;
}

function SuggestionCard({
  suggestion,
  isExpanded,
  onToggle,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  const confidencePercent = Math.round(suggestion.confidence * 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <button
          className="flex items-center gap-3 flex-1 text-left"
          onClick={onToggle}
        >
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-500">
                {suggestion.account.number}
              </span>
              <span className="text-sm font-medium text-gray-900">
                {suggestion.account.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-500">
                {suggestion.account.type}
              </span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500">
                {suggestion.account.detailType}
              </span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2 ml-4">
          <div
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              confidencePercent >= 80
                ? "bg-green-100 text-green-700"
                : confidencePercent >= 60
                ? "bg-yellow-100 text-yellow-700"
                : "bg-gray-100 text-gray-700"
            )}
          >
            {confidencePercent}%
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            title="Accept suggestion"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Reject suggestion"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-gray-100">
          <div className="ml-7 space-y-2">
            <div>
              <span className="text-xs font-medium text-gray-500">
                Description:{" "}
              </span>
              <span className="text-xs text-gray-700">
                {suggestion.account.description}
              </span>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-500">
                Why suggested:{" "}
              </span>
              <span className="text-xs text-gray-700">{suggestion.reason}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
