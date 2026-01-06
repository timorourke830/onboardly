import Anthropic from "@anthropic-ai/sdk";
import { Transaction } from "@/types/transaction";
import { Account } from "@/types/coa";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

const MAPPING_PROMPT = `You are an expert bookkeeper. Map each transaction to the most appropriate account from the Chart of Accounts provided.

For each transaction, consider:
1. The transaction description and vendor name
2. Whether it's a debit (expense/asset) or credit (income/liability)
3. The nature of the business expense or income

Common mappings:
- Restaurant/food purchases → Meals & Entertainment or Cost of Goods Sold (if inventory)
- Office supplies → Office Supplies or Office/General Administrative
- Software/subscriptions → Dues & Subscriptions or Software
- Bank fees → Bank Charges
- Payroll → Payroll expenses
- Rent payments → Rent or Lease
- Utility payments → Utilities
- Insurance → Insurance
- Professional services → Legal & Professional
- Advertising/marketing → Advertising or Marketing
- Equipment purchases → Equipment (Fixed Asset) or Supplies
- Vehicle/gas → Auto
- Travel expenses → Travel
- Deposits/revenue → Appropriate Income account

Respond in JSON format with an array matching the input transactions:
{
  "mappings": [
    {
      "transactionIndex": 0,
      "accountNumber": "5100",
      "accountName": "Office Supplies",
      "confidence": 0.85,
      "reasoning": "Brief explanation"
    }
  ]
}

Be conservative with confidence scores:
- 0.9+ = Very clear match (e.g., "PAYROLL" → Payroll)
- 0.7-0.9 = Good match based on description
- 0.5-0.7 = Reasonable guess
- Below 0.5 = Uncertain, needs review`;

/**
 * Map transactions to Chart of Accounts using Claude AI
 */
export async function mapTransactionsToAccounts(
  transactions: Transaction[],
  chartOfAccounts: Account[]
): Promise<Transaction[]> {
  if (transactions.length === 0) {
    return transactions;
  }

  console.log(`[Transaction Mapper] Mapping ${transactions.length} transactions to ${chartOfAccounts.length} accounts`);

  // Process in batches to avoid token limits
  const BATCH_SIZE = 50;
  const mappedTransactions: Transaction[] = [];

  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const batchMapped = await mapBatch(batch, chartOfAccounts, i);
    mappedTransactions.push(...batchMapped);
  }

  return mappedTransactions;
}

/**
 * Map a batch of transactions
 */
async function mapBatch(
  transactions: Transaction[],
  chartOfAccounts: Account[],
  startIndex: number
): Promise<Transaction[]> {
  // Prepare simplified transaction data for Claude
  const transactionSummary = transactions.map((t, idx) => ({
    index: startIndex + idx,
    date: t.date,
    description: t.description,
    amount: t.amount,
    type: t.type,
    vendor: t.vendor,
    category: t.category,
  }));

  // Prepare simplified CoA for Claude
  const coaSummary = chartOfAccounts.map((a) => ({
    number: a.number,
    name: a.name,
    type: a.type,
    detailType: a.detailType,
  }));

  const userMessage = `Chart of Accounts:
${JSON.stringify(coaSummary, null, 2)}

Transactions to map:
${JSON.stringify(transactionSummary, null, 2)}

Map each transaction to the most appropriate account.`;

  try {
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: MAPPING_PROMPT },
            { type: "text", text: userMessage },
          ],
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      console.error("[Transaction Mapper] Unexpected response format");
      return transactions;
    }

    // Parse response
    let jsonStr = content.text.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const parsed = JSON.parse(jsonStr.trim());
    const mappings = parsed.mappings || [];

    // Apply mappings to transactions
    return transactions.map((transaction, idx) => {
      const mapping = mappings.find(
        (m: { transactionIndex: number }) => m.transactionIndex === startIndex + idx
      );

      if (mapping) {
        return {
          ...transaction,
          suggestedAccountNumber: mapping.accountNumber,
          suggestedAccountName: mapping.accountName,
          confidence: mapping.confidence || 0.5,
        };
      }

      return transaction;
    });
  } catch (error) {
    console.error("[Transaction Mapper] Error mapping batch:", error);
    return transactions;
  }
}

/**
 * Re-map a single transaction after user edits
 */
export async function remapSingleTransaction(
  transaction: Transaction,
  chartOfAccounts: Account[]
): Promise<Transaction> {
  const result = await mapBatch([transaction], chartOfAccounts, 0);
  return result[0];
}
