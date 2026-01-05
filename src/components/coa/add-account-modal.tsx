"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Account,
  AccountType,
  AccountDetailType,
  ACCOUNT_TYPE_OPTIONS,
  DETAIL_TYPES_BY_ACCOUNT_TYPE,
} from "@/types/coa";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (account: Omit<Account, "id">) => void;
  existingNumbers: string[];
}

const getNextAccountNumber = (type: AccountType, existingNumbers: string[]): string => {
  const typePrefix: Record<AccountType, string> = {
    Asset: "1",
    Liability: "2",
    Equity: "3",
    Income: "4",
    Expense: "6",
  };

  const prefix = typePrefix[type];
  const typeNumbers = existingNumbers
    .filter((n) => n.startsWith(prefix))
    .map((n) => parseInt(n, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => b - a);

  if (typeNumbers.length === 0) {
    return `${prefix}000`;
  }

  // Find the highest number and increment by 10
  const highest = typeNumbers[0];
  const next = highest + 10;

  // Round to nearest 10
  return String(Math.ceil(next / 10) * 10);
};

export function AddAccountModal({
  isOpen,
  onClose,
  onAdd,
  existingNumbers,
}: AddAccountModalProps) {
  const [formData, setFormData] = useState<{
    number: string;
    name: string;
    type: AccountType;
    detailType: AccountDetailType;
    description: string;
  }>({
    number: "",
    name: "",
    type: "Expense",
    detailType: "Other Miscellaneous",
    description: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update account number when type changes
  useEffect(() => {
    if (isOpen) {
      const suggestedNumber = getNextAccountNumber(formData.type, existingNumbers);
      setFormData((prev) => ({ ...prev, number: suggestedNumber }));
    }
  }, [formData.type, isOpen, existingNumbers]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaultType: AccountType = "Expense";
      setFormData({
        number: getNextAccountNumber(defaultType, existingNumbers),
        name: "",
        type: defaultType,
        detailType: "Other Miscellaneous",
        description: "",
      });
      setErrors({});
    }
  }, [isOpen, existingNumbers]);

  const handleTypeChange = (newType: AccountType) => {
    const detailTypes = DETAIL_TYPES_BY_ACCOUNT_TYPE[newType];
    setFormData({
      ...formData,
      type: newType,
      detailType: detailTypes[0],
      number: getNextAccountNumber(newType, existingNumbers),
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.number.trim()) {
      newErrors.number = "Account number is required";
    } else if (existingNumbers.includes(formData.number)) {
      newErrors.number = "Account number already exists";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Account name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onAdd({
        number: formData.number,
        name: formData.name,
        type: formData.type,
        detailType: formData.detailType,
        description: formData.description,
        isCustom: true,
      });
      onClose();
    }
  };

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Add New Account</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Account Number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              error={errors.number}
              placeholder="e.g., 6100"
            />

            <Select
              label="Account Type"
              value={formData.type}
              onChange={(e) => handleTypeChange(e.target.value as AccountType)}
              options={ACCOUNT_TYPE_OPTIONS}
            />
          </div>

          <Input
            label="Account Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={errors.name}
            placeholder="e.g., Marketing Expense"
          />

          <Select
            label="Detail Type"
            value={formData.detailType}
            onChange={(e) =>
              setFormData({
                ...formData,
                detailType: e.target.value as AccountDetailType,
              })
            }
            options={DETAIL_TYPES_BY_ACCOUNT_TYPE[formData.type].map((dt) => ({
              value: dt,
              label: dt,
            }))}
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Brief description of this account"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add Account</Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
