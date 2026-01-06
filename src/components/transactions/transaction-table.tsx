"use client";

import { useState, useMemo } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  FileText,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/coa";

interface TransactionTableProps {
  transactions: Transaction[];
  accounts: Account[];
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onMarkReviewed?: (id: string, reviewed: boolean) => void;
}

type SortField = "date" | "description" | "amount" | "vendor" | "account" | "confidence";
type SortDirection = "asc" | "desc";

export function TransactionTable({
  transactions,
  accounts,
  onUpdateTransaction,
  onMarkReviewed,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "description":
          comparison = a.description.localeCompare(b.description);
          break;
        case "amount":
          comparison = a.amount - b.amount;
          break;
        case "vendor":
          comparison = (a.vendor || "").localeCompare(b.vendor || "");
          break;
        case "account":
          comparison = (a.suggestedAccountName || "").localeCompare(
            b.suggestedAccountName || ""
          );
          break;
        case "confidence":
          comparison = a.confidence - b.confidence;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [transactions, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const formatAmount = (amount: number, type: "debit" | "credit") => {
    const formatted = amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    return type === "debit" ? `-${formatted}` : formatted;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600 bg-green-50";
    if (confidence >= 0.5) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const handleAccountChange = (transactionId: string, accountNumber: string) => {
    const account = accounts.find((a) => a.number === accountNumber);
    if (account && onUpdateTransaction) {
      onUpdateTransaction(transactionId, {
        reviewedAccountNumber: accountNumber,
        reviewedAccountName: account.name,
        isReviewed: true,
      });
    }
    setEditingAccount(null);
  };

  const SortHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
    >
      {children}
      {sortField === field ? (
        sortDirection === "asc" ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500">
          Extract transactions from your documents to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="date">Date</SortHeader>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="description">Description</SortHeader>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="vendor">Vendor</SortHeader>
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="amount">Amount</SortHeader>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="account">Account</SortHeader>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              <SortHeader field="confidence">Confidence</SortHeader>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedTransactions.map((transaction) => {
            const isExpanded = expandedRow === transaction.id;
            const isEditing = editingAccount === transaction.id;
            const displayAccount =
              transaction.reviewedAccountName ||
              transaction.suggestedAccountName ||
              "Unassigned";
            const displayAccountNumber =
              transaction.reviewedAccountNumber ||
              transaction.suggestedAccountNumber ||
              "";

            return (
              <tr
                key={transaction.id}
                className={cn(
                  "hover:bg-gray-50 transition-colors",
                  transaction.isReviewed && "bg-green-50/30"
                )}
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {new Date(transaction.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                  <button
                    onClick={() =>
                      setExpandedRow(isExpanded ? null : transaction.id)
                    }
                    className="text-left hover:text-indigo-600"
                    title={transaction.description}
                  >
                    {transaction.description.length > 40
                      ? `${transaction.description.slice(0, 40)}...`
                      : transaction.description}
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                  {transaction.vendor || "-"}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 whitespace-nowrap text-sm text-right font-medium",
                    transaction.type === "debit"
                      ? "text-red-600"
                      : "text-green-600"
                  )}
                >
                  {formatAmount(transaction.amount, transaction.type)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {isEditing ? (
                    <select
                      className="w-full text-sm border rounded px-2 py-1"
                      value={displayAccountNumber}
                      onChange={(e) =>
                        handleAccountChange(transaction.id, e.target.value)
                      }
                      onBlur={() => setEditingAccount(null)}
                      autoFocus
                    >
                      <option value="">Select account...</option>
                      {accounts.map((account) => (
                        <option key={account.number} value={account.number}>
                          {account.number} - {account.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <button
                      onClick={() => setEditingAccount(transaction.id)}
                      className="text-left hover:text-indigo-600"
                    >
                      {displayAccountNumber && (
                        <span className="text-gray-400 mr-1">
                          {displayAccountNumber}
                        </span>
                      )}
                      {displayAccount}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                      getConfidenceColor(transaction.confidence)
                    )}
                  >
                    {Math.round(transaction.confidence * 100)}%
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-center">
                  {transaction.isReviewed ? (
                    <span className="inline-flex items-center text-green-600">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => onMarkReviewed?.(transaction.id, true)}
                      className="text-gray-400 hover:text-green-600"
                      title="Mark as reviewed"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary row */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500">
            {transactions.length} transactions
          </span>
          <div className="flex gap-6">
            <span className="text-red-600">
              Debits:{" "}
              {transactions
                .filter((t) => t.type === "debit")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
            <span className="text-green-600">
              Credits:{" "}
              {transactions
                .filter((t) => t.type === "credit")
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString("en-US", { style: "currency", currency: "USD" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
