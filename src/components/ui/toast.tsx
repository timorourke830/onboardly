"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      variant: "info",
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, newToast.duration);
    }
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

const variantStyles: Record<ToastVariant, string> = {
  success: "bg-green-50 border-green-200 text-green-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

const variantIcons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const variant = toast.variant || "info";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 shadow-lg",
        "min-w-[300px] max-w-[400px]",
        "animate-in slide-in-from-right-full",
        variantStyles[variant]
      )}
      role="alert"
      aria-live="polite"
    >
      <span className="flex-shrink-0" aria-hidden="true">
        {variantIcons[variant]}
      </span>
      <div className="flex-1 space-y-1">
        {toast.title && (
          <p className="font-medium text-sm">{toast.title}</p>
        )}
        <p className="text-sm opacity-90">{toast.message}</p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { ToastContainer, ToastItem };
