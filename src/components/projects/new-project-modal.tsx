"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { INDUSTRY_OPTIONS } from "@/types/coa";
import {
  validateForm,
  isFormValid,
  projectValidationRules,
  ValidationErrors,
} from "@/lib/validation";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const router = useRouter();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    industry: "general",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = useCallback((): boolean => {
    const newErrors = validateForm(formData, projectValidationRules);
    setErrors(newErrors);
    return isFormValid(newErrors);
  }, [formData]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    // Validate on blur for immediate feedback
    const newErrors = validateForm(formData, projectValidationRules);
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create project");
      }

      const project = await response.json();

      addToast({
        title: "Project Created",
        message: `${formData.name} has been created successfully`,
        variant: "success",
      });

      onClose();
      router.push(`/projects/${project.id}/upload`);
    } catch (err) {
      console.error("Error creating project:", err);
      addToast({
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to create project",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", businessName: "", industry: "general" });
    setErrors({});
    setTouched(new Set());
    onClose();
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>New Client Onboarding</ModalTitle>
          <ModalDescription>
            Create a new project to start organizing your client&apos;s documents
          </ModalDescription>
        </ModalHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            label="Project Name"
            placeholder="e.g., 2024 Year-End Cleanup"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur={() => handleBlur("name")}
            error={touched.has("name") ? errors.name : undefined}
            required
          />

          <Input
            label="Business Name"
            placeholder="e.g., Acme Corporation"
            value={formData.businessName}
            onChange={(e) =>
              setFormData({ ...formData, businessName: e.target.value })
            }
            onBlur={() => handleBlur("businessName")}
            error={touched.has("businessName") ? errors.businessName : undefined}
            required
          />

          <Select
            label="Industry"
            value={formData.industry}
            onChange={(e) =>
              setFormData({ ...formData, industry: e.target.value })
            }
            options={INDUSTRY_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Project
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
