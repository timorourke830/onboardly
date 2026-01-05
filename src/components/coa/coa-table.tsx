"use client";

import { useState, useMemo } from "react";
import { Search, Download, Plus, Filter, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CoARow } from "./coa-row";
import { Account, AccountType, ACCOUNT_TYPE_OPTIONS, ExportFormat, EXPORT_FORMAT_OPTIONS } from "@/types/coa";
import { cn } from "@/lib/utils";

interface CoATableProps {
  accounts: Account[];
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (accountNumber: string) => void;
  onAddAccount: () => void;
  onExport: (format: ExportFormat) => void;
  isExporting?: boolean;
}

type GroupBy = "none" | "type";

export function CoATable({
  accounts,
  onUpdateAccount,
  onDeleteAccount,
  onAddAccount,
  onExport,
  isExporting = false,
}: CoATableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<AccountType | "all">("all");
  const [groupBy, setGroupBy] = useState<GroupBy>("type");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Asset", "Liability", "Equity", "Income", "Expense"])
  );
  const [showExportMenu, setShowExportMenu] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesSearch =
        searchTerm === "" ||
        account.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === "all" || account.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, filterType]);

  const groupedAccounts = useMemo(() => {
    if (groupBy === "none") {
      return { All: filteredAccounts };
    }

    const groups: Record<string, Account[]> = {
      Asset: [],
      Liability: [],
      Equity: [],
      Income: [],
      Expense: [],
    };

    filteredAccounts.forEach((account) => {
      if (groups[account.type]) {
        groups[account.type].push(account);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }, [filteredAccounts, groupBy]);

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setShowExportMenu(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Type filter */}
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as AccountType | "all")}
            options={[
              { value: "all", label: "All Types" },
              ...ACCOUNT_TYPE_OPTIONS,
            ]}
            className="w-40"
          />

          {/* Group by */}
          <Select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            options={[
              { value: "type", label: "Group by Type" },
              { value: "none", label: "No Grouping" },
            ]}
            className="w-40"
          />
        </div>

        <div className="flex gap-2">
          {/* Add Account */}
          <Button variant="outline" onClick={onAddAccount}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>

          {/* Export */}
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              isLoading={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  {EXPORT_FORMAT_OPTIONS.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => handleExport(format.value)}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <div className="font-medium">{format.label}</div>
                      <div className="text-xs text-gray-500">{format.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account count */}
      <div className="text-sm text-gray-500">
        Showing {filteredAccounts.length} of {accounts.length} accounts
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Number
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                  Detail Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Object.entries(groupedAccounts).map(([group, groupAccounts]) => (
                <GroupSection
                  key={group}
                  group={group}
                  accounts={groupAccounts}
                  isExpanded={expandedGroups.has(group)}
                  onToggle={() => toggleGroup(group)}
                  onUpdateAccount={onUpdateAccount}
                  onDeleteAccount={onDeleteAccount}
                  showGroupHeader={groupBy !== "none"}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAccounts.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No accounts match your search criteria
        </div>
      )}
    </div>
  );
}

interface GroupSectionProps {
  group: string;
  accounts: Account[];
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateAccount: (account: Account) => void;
  onDeleteAccount: (accountNumber: string) => void;
  showGroupHeader: boolean;
}

function GroupSection({
  group,
  accounts,
  isExpanded,
  onToggle,
  onUpdateAccount,
  onDeleteAccount,
  showGroupHeader,
}: GroupSectionProps) {
  const typeColors: Record<string, string> = {
    Asset: "bg-blue-100 text-blue-800",
    Liability: "bg-red-100 text-red-800",
    Equity: "bg-purple-100 text-purple-800",
    Income: "bg-green-100 text-green-800",
    Expense: "bg-orange-100 text-orange-800",
    All: "bg-gray-100 text-gray-800",
  };

  return (
    <>
      {showGroupHeader && (
        <tr
          className="bg-gray-100 cursor-pointer hover:bg-gray-200"
          onClick={onToggle}
        >
          <td colSpan={6} className="px-4 py-2">
            <div className="flex items-center gap-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  typeColors[group] || typeColors.All
                )}
              >
                {group}
              </span>
              <span className="text-sm text-gray-500">
                ({accounts.length} accounts)
              </span>
            </div>
          </td>
        </tr>
      )}
      {(isExpanded || !showGroupHeader) &&
        accounts.map((account) => (
          <CoARow
            key={account.id || account.number}
            account={account}
            onUpdate={onUpdateAccount}
            onDelete={onDeleteAccount}
          />
        ))}
    </>
  );
}
