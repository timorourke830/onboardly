"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
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

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; businessName: string; industry: string }) => void;
  project: {
    name: string;
    businessName: string;
    industry: string;
  } | null;
}

export function EditProjectModal({
  isOpen,
  onClose,
  onSave,
  project,
}: EditProjectModalProps) {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    industry: "general",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name,
        businessName: project.businessName,
        industry: project.industry,
      });
      setErrors({});
      setTouched(new Set());
    }
  }, [project, isOpen]);

  const validate = useCallback((): boolean => {
    const newErrors = validateForm(formData, projectValidationRules);
    setErrors(newErrors);
    return isFormValid(newErrors);
  }, [formData]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => new Set(prev).add(field));
    const newErrors = validateForm(formData, projectValidationRules);
    setErrors(newErrors);
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSave(formData);
      addToast({
        title: "Project Updated",
        message: "Project details have been saved",
        variant: "success",
      });
      onClose();
    } catch (err) {
      addToast({
        title: "Error",
        message: "Failed to update project",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Edit Project Details</ModalTitle>
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
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
