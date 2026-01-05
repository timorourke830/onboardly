import { cn } from "@/lib/utils";

interface ProgressBarProps {
  progress: number;
  className?: string;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "success" | "error";
}

export function ProgressBar({
  progress,
  className,
  showPercentage = false,
  size = "md",
  variant = "default",
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeStyles = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const variantStyles = {
    default: "bg-blue-600",
    success: "bg-green-600",
    error: "bg-red-600",
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantStyles[variant]
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showPercentage && (
        <p className="mt-1 text-xs text-gray-500 text-right">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
}
