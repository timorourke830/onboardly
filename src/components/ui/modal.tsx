"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ModalContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ModalContext = React.createContext<ModalContextValue | undefined>(
  undefined
);

function useModal() {
  const context = React.useContext(ModalContext);
  if (!context) {
    throw new Error("Modal components must be used within a Modal");
  }
  return context;
}

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Modal({ open, onOpenChange, children }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <ModalContext.Provider value={{ open, onOpenChange }}>
      {children}
    </ModalContext.Provider>
  );
}

const ModalOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { onOpenChange } = useModal();

  return (
    <div
      ref={ref}
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
        "animate-in fade-in-0",
        className
      )}
      onClick={() => onOpenChange(false)}
      aria-hidden="true"
      {...props}
    />
  );
});
ModalOverlay.displayName = "ModalOverlay";

const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { onOpenChange } = useModal();

  return (
    <>
      <ModalOverlay />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-lg rounded-lg bg-white p-6 shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </>
  );
});
ModalContent.displayName = "ModalContent";

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

export {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
};
