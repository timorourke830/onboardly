"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
}

export function DeleteProjectModal({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: DeleteProjectModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onClose();
  };

  const isConfirmValid = confirmText.toLowerCase() === "delete";

  return (
    <Modal open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <ModalTitle>Delete Project</ModalTitle>
              <ModalDescription>
                This action cannot be undone
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <div className="mt-4 space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-800">
              You are about to delete{" "}
              <span className="font-semibold">{projectName}</span>. This will
              permanently remove:
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>All uploaded documents</li>
              <li>Document classifications</li>
              <li>Chart of Accounts</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type &quot;delete&quot; to confirm
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="delete"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              isLoading={isDeleting}
            >
              Delete Project
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
