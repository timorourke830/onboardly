import { cn } from "@/lib/utils";
import {
  type DocumentCategory,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/types/document";

interface CategoryBadgeProps {
  category: DocumentCategory;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CategoryBadge({
  category,
  showLabel = true,
  size = "md",
  className,
}: CategoryBadgeProps) {
  const colors = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category];

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        colors.bg,
        colors.text,
        sizeStyles[size],
        className
      )}
    >
      {showLabel ? label : category.replace("_", " ")}
    </span>
  );
}
