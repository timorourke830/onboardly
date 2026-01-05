import Anthropic from "@anthropic-ai/sdk";
import {
  Account,
  AccountSuggestion,
  ChartOfAccountsTemplate,
  CoAGenerationResult,
  IndustryType,
} from "@/types/coa";
import { ClassifiedDocument } from "@/types/document";

// Import templates
import generalTemplate from "@/data/coa-templates/general.json";
import restaurantTemplate from "@/data/coa-templates/restaurant.json";
import contractorTemplate from "@/data/coa-templates/contractor.json";
import professionalServicesTemplate from "@/data/coa-templates/professional-services.json";
import retailTemplate from "@/data/coa-templates/retail.json";

const TEMPLATES: Record<IndustryType, ChartOfAccountsTemplate> = {
  general: generalTemplate as ChartOfAccountsTemplate,
  restaurant: restaurantTemplate as ChartOfAccountsTemplate,
  contractor: contractorTemplate as ChartOfAccountsTemplate,
  "professional-services": professionalServicesTemplate as ChartOfAccountsTemplate,
  retail: retailTemplate as ChartOfAccountsTemplate,
};

const COA_SUGGESTION_PROMPT = `You are an expert bookkeeper helping to create a Chart of Accounts for a new client.

Based on the classified documents provided, suggest additional accounts that might be needed but are not in the base template.

For each suggestion, provide:
1. The account number (following the existing numbering scheme)
2. The account name
3. The account type (Asset, Liability, Equity, Income, or Expense)
4. The detail type (matching QuickBooks conventions)
5. A brief description
6. Why you're suggesting this account based on the documents
7. Your confidence level (0-1)

Rules:
- Only suggest accounts that are clearly needed based on the documents
- Don't duplicate accounts already in the template
- Follow the numbering convention (1xxx for Assets, 2xxx for Liabilities, 3xxx for Equity, 4xxx for Income, 5xxx-7xxx for Expenses)
- Keep suggestions practical and relevant to the business type
- Maximum 10 suggestions

Respond in JSON format:
{
  "suggestions": [
    {
      "account": {
        "number": "string",
        "name": "string",
        "type": "Asset|Liability|Equity|Income|Expense",
        "detailType": "string",
        "description": "string"
      },
      "reason": "string",
      "confidence": number
    }
  ]
}`;

/**
 * Load the template for a given industry
 */
export function loadTemplate(industry: IndustryType): ChartOfAccountsTemplate {
  console.log("[CoA Generator] Loading template for industry:", industry);
  const template = TEMPLATES[industry];
  if (!template) {
    console.error("[CoA Generator] Unknown industry type:", industry);
    console.error("[CoA Generator] Available templates:", Object.keys(TEMPLATES));
    throw new Error(`Unknown industry type: ${industry}`);
  }
  console.log("[CoA Generator] Template loaded:", template.name, "with", template.accounts?.length, "accounts");
  return template;
}

/**
 * Generate a Chart of Accounts based on industry and classified documents
 */
export async function generateChartOfAccounts(
  industry: IndustryType,
  classifiedDocuments?: ClassifiedDocument[]
): Promise<CoAGenerationResult> {
  const template = loadTemplate(industry);
  const baseAccounts: Account[] = template.accounts.map((acc, index) => ({
    ...acc,
    id: `base-${index}`,
    isCustom: false,
  }));

  // If no documents provided, return just the template
  if (!classifiedDocuments || classifiedDocuments.length === 0) {
    return {
      baseAccounts,
      suggestedAccounts: [],
      industry,
      generatedAt: new Date().toISOString(),
    };
  }

  // Use AI to suggest additional accounts based on documents
  const suggestions = await suggestAccountsFromDocuments(
    template,
    classifiedDocuments
  );

  return {
    baseAccounts,
    suggestedAccounts: suggestions,
    industry,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Use Claude to suggest additional accounts based on classified documents
 */
async function suggestAccountsFromDocuments(
  template: ChartOfAccountsTemplate,
  documents: ClassifiedDocument[]
): Promise<AccountSuggestion[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Prepare document summary for the AI
  const documentSummary = documents.map((doc) => ({
    category: doc.category,
    subcategory: doc.subcategory,
    metadata: doc.metadata,
    year: doc.year,
  }));

  // Prepare existing accounts list
  const existingAccounts = template.accounts.map((acc) => ({
    number: acc.number,
    name: acc.name,
    type: acc.type,
  }));

  const userMessage = `Industry: ${template.name}
Industry Description: ${template.description}

Existing Accounts in Template:
${JSON.stringify(existingAccounts, null, 2)}

Classified Documents Summary:
${JSON.stringify(documentSummary, null, 2)}

Based on these documents, suggest additional accounts that might be needed for this client.`;

  try {
    const response = await anthropic.messages.create({
      model: process.env.LLM_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: COA_SUGGESTION_PROMPT },
            { type: "text", text: userMessage },
          ],
        },
      ],
    });

    // Extract the text content
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("No text content in response");
      return [];
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and transform suggestions
    const suggestions: AccountSuggestion[] = (parsed.suggestions || [])
      .filter((s: any) => s.account && s.reason && typeof s.confidence === "number")
      .map((s: any, index: number) => ({
        account: {
          id: `suggestion-${index}`,
          number: s.account.number,
          name: s.account.name,
          type: s.account.type,
          detailType: s.account.detailType,
          description: s.account.description,
          isCustom: true,
        },
        reason: s.reason,
        confidence: Math.min(1, Math.max(0, s.confidence)),
      }));

    return suggestions;
  } catch (error) {
    console.error("Error generating account suggestions:", error);
    return [];
  }
}

/**
 * Export Chart of Accounts to QuickBooks Online CSV format
 */
export function exportToQBO(accounts: Account[]): string {
  const headers = ["Account Type", "Detail Type", "Name", "Description", "Number"];
  const rows = accounts.map((acc) => [
    acc.type,
    acc.detailType,
    acc.name,
    acc.description,
    acc.number,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
}

/**
 * Export Chart of Accounts to QuickBooks Desktop IIF format
 */
export function exportToQBD(accounts: Account[]): string {
  const lines: string[] = [];

  // IIF header
  lines.push("!ACCNT\tNAME\tACCNTTYPE\tDESC\tACCNUM");

  // Map account types to QBD format
  const typeMapping: Record<string, string> = {
    Asset: "BANK",
    Liability: "OCLIAB",
    Equity: "EQUITY",
    Income: "INC",
    Expense: "EXP",
  };

  // Add accounts
  for (const acc of accounts) {
    const qbdType = typeMapping[acc.type] || "EXP";
    lines.push(`ACCNT\t${acc.name}\t${qbdType}\t${acc.description}\t${acc.number}`);
  }

  return lines.join("\n");
}

/**
 * Export Chart of Accounts to Xero CSV format
 */
export function exportToXero(accounts: Account[]): string {
  const headers = ["*Code", "*Name", "*Type", "Description"];

  // Map account types to Xero format
  const typeMapping: Record<string, string> = {
    Asset: "CURRENT",
    Liability: "CURRLIAB",
    Equity: "EQUITY",
    Income: "REVENUE",
    Expense: "EXPENSE",
  };

  const rows = accounts.map((acc) => [
    acc.number,
    acc.name,
    typeMapping[acc.type] || "EXPENSE",
    acc.description,
  ]);

  return [headers, ...rows].map((row) => row.map(escapeCSV).join(",")).join("\n");
}

/**
 * Escape a value for CSV format
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
