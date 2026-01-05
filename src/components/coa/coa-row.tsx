"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Account,
  AccountType,
  ACCOUNT_TYPE_OPTIONS,
  DETAIL_TYPES_BY_ACCOUNT_TYPE,
} from "@/types/coa";
import { cn } from "@/lib/utils";

interface CoARowProps {
  account: Account;
  onUpdate: (account: Account) => void;
  onDelete: (accountNumber: string) => void;
  isEditable?: boolean;
}

export function CoARow({
  account,
  onUpdate,
  onDelete,
  isEditable = true,
}: CoARowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAccount, setEditedAccount] = useState<Account>(account);

  const handleSave = () => {
    onUpdate(editedAccount);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAccount(account);
    setIsEditing(false);
  };

  const handleTypeChange = (newType: AccountType) => {
    const detailTypes = DETAIL_TYPES_BY_ACCOUNT_TYPE[newType];
    setEditedAccount({
      ...editedAccount,
      type: newType,
      detailType: detailTypes[0], // Reset to first detail type for new type
    });
  };

  if (isEditing) {
    return (
      <tr className="bg-indigo-50">
        <td className="px-4 py-2">
          <Input
            value={editedAccount.number}
            onChange={(e) =>
              setEditedAccount({ ...editedAccount, number: e.target.value })
            }
            className="w-20"
          />
        </td>
        <td className="px-4 py-2">
          <Input
            value={editedAccount.name}
            onChange={(e) =>
              setEditedAccount({ ...editedAccount, name: e.target.value })
            }
          />
        </td>
        <td className="px-4 py-2">
          <Select
            value={editedAccount.type}
            onChange={(e) => handleTypeChange(e.target.value as AccountType)}
            options={ACCOUNT_TYPE_OPTIONS}
          />
        </td>
        <td className="px-4 py-2">
          <Select
            value={editedAccount.detailType}
            onChange={(e) =>
              setEditedAccount({
                ...editedAccount,
                detailType: e.target.value as Account["detailType"],
              })
            }
            options={DETAIL_TYPES_BY_ACCOUNT_TYPE[editedAccount.type].map(
              (dt) => ({ value: dt, label: dt })
            )}
          />
        </td>
        <td className="px-4 py-2">
          <Input
            value={editedAccount.description}
            onChange={(e) =>
              setEditedAccount({ ...editedAccount, description: e.target.value })
            }
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={cn(
        "hover:bg-gray-50",
        account.isCustom && "bg-green-50"
      )}
    >
      <td className="px-4 py-3 text-sm font-mono text-gray-600">
        {account.number}
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="flex items-center gap-2">
          {account.name}
          {account.isCustom && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              <Sparkles className="mr-1 h-3 w-3" />
              Custom
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{account.type}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{account.detailType}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{account.description}</td>
      <td className="px-4 py-3 text-sm">
        {isEditable && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
              title="Edit account"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(account.number)}
              className="text-gray-400 hover:text-red-600 transition-colors"
              title="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
