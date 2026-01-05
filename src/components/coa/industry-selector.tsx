"use client";

import { useState } from "react";
import { Building2, Utensils, Hammer, Briefcase, ShoppingCart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IndustryType, INDUSTRY_OPTIONS } from "@/types/coa";
import { cn } from "@/lib/utils";

interface IndustrySelectorProps {
  selectedIndustry: IndustryType | null;
  onSelect: (industry: IndustryType) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

const INDUSTRY_ICONS: Record<IndustryType, React.ElementType> = {
  general: Building2,
  restaurant: Utensils,
  contractor: Hammer,
  "professional-services": Briefcase,
  retail: ShoppingCart,
};

export function IndustrySelector({
  selectedIndustry,
  onSelect,
  onGenerate,
  isGenerating = false,
}: IndustrySelectorProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Select Industry Type
        </h3>
        <p className="text-sm text-gray-500">
          Choose the industry that best matches your client&apos;s business. This will
          determine the starting template for the Chart of Accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {INDUSTRY_OPTIONS.map((industry) => {
          const Icon = INDUSTRY_ICONS[industry.value];
          const isSelected = selectedIndustry === industry.value;

          return (
            <button
              key={industry.value}
              onClick={() => onSelect(industry.value)}
              className={cn(
                "relative flex flex-col items-start p-4 rounded-lg border-2 transition-all text-left",
                isSelected
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
              )}
            >
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                </div>
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  isSelected ? "bg-indigo-100" : "bg-gray-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-indigo-600" : "text-gray-600"
                  )}
                />
              </div>
              <h4 className="mt-3 font-medium text-gray-900">{industry.label}</h4>
              <p className="mt-1 text-sm text-gray-500">{industry.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={onGenerate}
          disabled={!selectedIndustry || isGenerating}
          isLoading={isGenerating}
        >
          Generate Chart of Accounts
        </Button>
      </div>
    </div>
  );
}
