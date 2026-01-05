// Chart of Accounts Types

export type AccountType =
  | "Asset"
  | "Liability"
  | "Equity"
  | "Income"
  | "Expense";

export type AccountDetailType =
  // Asset detail types
  | "Cash"
  | "Bank"
  | "Accounts Receivable"
  | "Inventory"
  | "Other Current Asset"
  | "Fixed Asset"
  // Liability detail types
  | "Accounts Payable"
  | "Credit Card"
  | "Other Current Liability"
  | "Long-term Liability"
  // Equity detail types
  | "Owner's Equity"
  | "Retained Earnings"
  | "Partner's Equity"
  // Income detail types
  | "Sales"
  | "Service"
  | "Other Income"
  | "Discount"
  // Expense detail types
  | "Cost of Goods Sold"
  | "Payroll"
  | "Rent or Lease"
  | "Utilities"
  | "Insurance"
  | "Advertising"
  | "Bank Charges"
  | "Depreciation"
  | "Interest"
  | "Legal & Professional"
  | "Office/General Administrative"
  | "Repair & Maintenance"
  | "Supplies"
  | "Taxes Paid"
  | "Travel"
  | "Travel Meals"
  | "Auto"
  | "Dues & Subscriptions"
  | "Training"
  | "Shipping"
  | "Other Miscellaneous";

export interface Account {
  id?: string;
  number: string;
  name: string;
  type: AccountType;
  detailType: AccountDetailType;
  description: string;
  isCustom?: boolean;
  parentAccountNumber?: string;
}

export interface ChartOfAccountsTemplate {
  name: string;
  description: string;
  accounts: Account[];
}

export type IndustryType =
  | "general"
  | "restaurant"
  | "contractor"
  | "professional-services"
  | "retail";

export const INDUSTRY_OPTIONS: { value: IndustryType; label: string; description: string }[] = [
  {
    value: "general",
    label: "General Business",
    description: "Standard chart of accounts suitable for most small businesses",
  },
  {
    value: "restaurant",
    label: "Restaurant / Food Service",
    description: "Optimized for restaurants, cafes, and food service businesses",
  },
  {
    value: "contractor",
    label: "Contractor / Construction",
    description: "For contractors, construction, and trades businesses",
  },
  {
    value: "professional-services",
    label: "Professional Services",
    description: "For consultants, agencies, law firms, and service providers",
  },
  {
    value: "retail",
    label: "Retail / E-commerce",
    description: "For retail stores and e-commerce businesses",
  },
];

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: "Asset", label: "Asset" },
  { value: "Liability", label: "Liability" },
  { value: "Equity", label: "Equity" },
  { value: "Income", label: "Income" },
  { value: "Expense", label: "Expense" },
];

export const DETAIL_TYPES_BY_ACCOUNT_TYPE: Record<AccountType, AccountDetailType[]> = {
  Asset: [
    "Cash",
    "Bank",
    "Accounts Receivable",
    "Inventory",
    "Other Current Asset",
    "Fixed Asset",
  ],
  Liability: [
    "Accounts Payable",
    "Credit Card",
    "Other Current Liability",
    "Long-term Liability",
  ],
  Equity: [
    "Owner's Equity",
    "Retained Earnings",
    "Partner's Equity",
  ],
  Income: [
    "Sales",
    "Service",
    "Other Income",
    "Discount",
  ],
  Expense: [
    "Cost of Goods Sold",
    "Payroll",
    "Rent or Lease",
    "Utilities",
    "Insurance",
    "Advertising",
    "Bank Charges",
    "Depreciation",
    "Interest",
    "Legal & Professional",
    "Office/General Administrative",
    "Repair & Maintenance",
    "Supplies",
    "Taxes Paid",
    "Travel",
    "Travel Meals",
    "Auto",
    "Dues & Subscriptions",
    "Training",
    "Shipping",
    "Other Miscellaneous",
  ],
};

// Export formats
export type ExportFormat = "qbo" | "qbd" | "xero";

export const EXPORT_FORMAT_OPTIONS: { value: ExportFormat; label: string; description: string }[] = [
  {
    value: "qbo",
    label: "QuickBooks Online",
    description: "CSV format compatible with QuickBooks Online import",
  },
  {
    value: "qbd",
    label: "QuickBooks Desktop",
    description: "IIF format for QuickBooks Desktop import",
  },
  {
    value: "xero",
    label: "Xero",
    description: "CSV format compatible with Xero import",
  },
];

// AI suggestion types
export interface AccountSuggestion {
  account: Account;
  reason: string;
  confidence: number;
}

export interface CoAGenerationResult {
  baseAccounts: Account[];
  suggestedAccounts: AccountSuggestion[];
  industry: IndustryType;
  generatedAt: string;
}
