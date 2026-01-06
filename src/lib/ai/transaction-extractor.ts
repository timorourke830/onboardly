import Anthropic from "@anthropic-ai/sdk";
import { Transaction, TransactionExtractionResult } from "@/types/transaction";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 2;
const MAX_TOKENS = 8192; // Increased for larger documents

const TRANSACTION_EXTRACTION_PROMPT = `You are an expert financial document analyzer. Extract all individual transactions from this document.

For each transaction, identify:
1. Date (in YYYY-MM-DD format)
2. Description (the transaction description/memo)
3. Amount (as a positive number)
4. Type: "debit" (money going out/expenses/withdrawals) or "credit" (money coming in/deposits/payments received)
5. Vendor/Payee name if identifiable (null if not clear)

Important rules:
- Extract EVERY transaction you can find
- For bank statements: withdrawals, checks, fees are debits; deposits are credits
- For credit card statements: purchases are debits; payments/credits are credits
- For receipts: the total amount is typically a debit (expense)
- Dates should be converted to YYYY-MM-DD format
- Amounts should be positive numbers (the type field indicates direction)
- Be thorough - don't skip any transactions

Respond in JSON format only:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "debit" | "credit",
      "vendor": "string or null"
    }
  ],
  "documentType": "bank_statement" | "credit_card_statement" | "receipt" | "invoice" | "other",
  "totalTransactions": number,
  "errors": ["any issues encountered"]
}`;

const SPREADSHEET_EXTRACTION_PROMPT = `You are an expert financial document analyzer. This is transaction data from a spreadsheet.

Analyze the headers and data to identify transactions. Extract:
1. Date (convert to YYYY-MM-DD format)
2. Description
3. Amount (as a positive number)
4. Type: "debit" or "credit" based on column names or amount signs
5. Vendor if identifiable

Common patterns:
- Negative amounts or "Debit" columns = debit transactions
- Positive amounts or "Credit" columns = credit transactions
- Look for columns like: Date, Description, Amount, Debit, Credit, Withdrawal, Deposit, Payee, Vendor

Respond in JSON format only:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "string",
      "amount": number,
      "type": "debit" | "credit",
      "vendor": "string or null"
    }
  ],
  "totalTransactions": number,
  "errors": ["any issues encountered"]
}`;

/**
 * Extract transactions from a document using Claude AI
 */
export async function extractTransactionsFromDocument(
  documentId: string,
  documentName: string,
  fileUrl: string,
  fileType: string,
  category: string
): Promise<TransactionExtractionResult> {
  console.log(`[Transaction Extractor] Processing: ${documentName} (${fileType})`);

  try {
    // Determine extraction method based on file type
    if (isSpreadsheet(fileType)) {
      return await extractFromSpreadsheet(documentId, documentName, fileUrl, category);
    } else if (isPDF(fileType)) {
      return await extractFromPDF(documentId, documentName, fileUrl, category);
    } else if (isImage(fileType)) {
      return await extractFromImage(documentId, documentName, fileUrl, fileType, category);
    } else {
      return {
        transactions: [],
        documentId,
        documentName,
        extractionMethod: "unknown",
        errors: [`Unsupported file type: ${fileType}`],
      };
    }
  } catch (error) {
    console.error(`[Transaction Extractor] Error processing ${documentName}:`, error);
    return {
      transactions: [],
      documentId,
      documentName,
      extractionMethod: "unknown",
      errors: [error instanceof Error ? error.message : "Unknown error"],
    };
  }
}

function isSpreadsheet(fileType: string): boolean {
  return (
    fileType === "text/csv" ||
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  );
}

function isPDF(fileType: string): boolean {
  return fileType === "application/pdf";
}

function isImage(fileType: string): boolean {
  return fileType.startsWith("image/");
}

/**
 * Extract transactions from a PDF document with retry logic
 */
async function extractFromPDF(
  documentId: string,
  documentName: string,
  fileUrl: string,
  category: string
): Promise<TransactionExtractionResult> {
  // Fetch the PDF and convert to base64
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Check file size - if too large, warn about potential issues
  const fileSizeKB = arrayBuffer.byteLength / 1024;
  console.log(`[Transaction Extractor] PDF size: ${fileSizeKB.toFixed(1)} KB`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`[Transaction Extractor] Retry attempt ${attempt} for ${documentName}`);
      }

      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: base64,
                },
              },
              {
                type: "text",
                text: attempt === 0
                  ? TRANSACTION_EXTRACTION_PROMPT
                  : TRANSACTION_EXTRACTION_PROMPT + "\n\nIMPORTANT: Keep your response concise. If there are many transactions, summarize similar ones. Ensure your JSON is complete and valid.",
              },
            ],
          },
        ],
      });

      const result = parseExtractionResponse(message, documentId, documentName, "pdf", category);

      // If we got transactions or no parse errors, return
      if (result.transactions.length > 0 || !result.errors.some(e => e.includes("Failed to parse"))) {
        return result;
      }

      // If we had a parse error, save it and retry
      lastError = new Error(result.errors.join("; "));
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[Transaction Extractor] Attempt ${attempt + 1} failed:`, lastError.message);
    }
  }

  // All retries exhausted
  return {
    transactions: [],
    documentId,
    documentName,
    extractionMethod: "pdf",
    errors: [lastError?.message || "Failed after all retries"],
  };
}

/**
 * Extract transactions from an image (receipt, statement photo, etc.)
 */
async function extractFromImage(
  documentId: string,
  documentName: string,
  fileUrl: string,
  fileType: string,
  category: string
): Promise<TransactionExtractionResult> {
  // Fetch the image and convert to base64
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  const mediaType = getImageMediaType(fileType);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64,
            },
          },
          {
            type: "text",
            text: TRANSACTION_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  return parseExtractionResponse(message, documentId, documentName, "image", category);
}

/**
 * Extract transactions from a spreadsheet (CSV, XLSX)
 */
async function extractFromSpreadsheet(
  documentId: string,
  documentName: string,
  fileUrl: string,
  category: string
): Promise<TransactionExtractionResult> {
  // Fetch the spreadsheet
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch spreadsheet: ${response.statusText}`);
  }

  const text = await response.text();

  // Parse CSV to get structured data
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return {
      transactions: [],
      documentId,
      documentName,
      extractionMethod: "spreadsheet",
      errors: ["Empty spreadsheet"],
    };
  }

  // Take headers and sample data for Claude to analyze
  const sampleData = lines.slice(0, Math.min(100, lines.length)).join("\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    messages: [
      {
        role: "user",
        content: `${SPREADSHEET_EXTRACTION_PROMPT}\n\nSpreadsheet data:\n${sampleData}`,
      },
    ],
  });

  return parseExtractionResponse(message, documentId, documentName, "spreadsheet", category);
}

/**
 * Attempt to repair truncated or malformed JSON
 */
function tryRepairJSON(jsonStr: string): string | null {
  // Try to find the transactions array and extract valid entries
  const transactionsMatch = jsonStr.match(/"transactions"\s*:\s*\[/);
  if (!transactionsMatch) {
    return null;
  }

  const startIndex = transactionsMatch.index! + transactionsMatch[0].length;

  // Find all complete transaction objects
  const validTransactions: string[] = [];
  let depth = 0;
  let currentObj = "";
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      currentObj += char;
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      currentObj += char;
      escapeNext = true;
      continue;
    }

    if (char === '"' && !escapeNext) {
      inString = !inString;
    }

    if (!inString) {
      if (char === "{") {
        depth++;
      } else if (char === "}") {
        depth--;
        if (depth === 0) {
          currentObj += char;
          // Validate this transaction object
          try {
            const parsed = JSON.parse(currentObj);
            if (parsed.date && parsed.description && typeof parsed.amount !== "undefined") {
              validTransactions.push(currentObj);
            }
          } catch {
            // Skip invalid object
          }
          currentObj = "";
          continue;
        }
      } else if (char === "]" && depth === 0) {
        // End of transactions array
        break;
      }
    }

    if (depth > 0) {
      currentObj += char;
    }
  }

  if (validTransactions.length > 0) {
    return JSON.stringify({
      transactions: validTransactions.map(t => JSON.parse(t)),
      totalTransactions: validTransactions.length,
      errors: ["Response was truncated - partial extraction performed"],
    });
  }

  return null;
}

/**
 * Parse Claude's response into TransactionExtractionResult
 */
function parseExtractionResponse(
  message: Anthropic.Message,
  documentId: string,
  documentName: string,
  extractionMethod: "pdf" | "image" | "spreadsheet",
  category: string
): TransactionExtractionResult {
  const content = message.content[0];

  if (content.type !== "text") {
    return {
      transactions: [],
      documentId,
      documentName,
      extractionMethod,
      errors: ["Unexpected response format"],
    };
  }

  // Log stop reason for debugging
  if (message.stop_reason !== "end_turn") {
    console.warn(`[Transaction Extractor] Response stop reason: ${message.stop_reason}`);
  }

  try {
    // Extract JSON from response
    let jsonStr = content.text.trim();

    // Log response length for debugging
    console.log(`[Transaction Extractor] Response length: ${jsonStr.length} chars`);

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    jsonStr = jsonStr.trim();

    let parsed: { transactions?: unknown[]; errors?: string[] };

    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseError) {
      // Try to repair truncated JSON
      console.warn(`[Transaction Extractor] Initial parse failed, attempting repair...`);
      console.warn(`[Transaction Extractor] Parse error: ${parseError instanceof Error ? parseError.message : parseError}`);

      // Log a sample of the problematic area
      if (parseError instanceof SyntaxError) {
        const match = parseError.message.match(/position (\d+)/);
        if (match) {
          const pos = parseInt(match[1]);
          console.warn(`[Transaction Extractor] Context around error position ${pos}:`);
          console.warn(jsonStr.slice(Math.max(0, pos - 100), pos + 100));
        }
      }

      const repaired = tryRepairJSON(jsonStr);
      if (repaired) {
        parsed = JSON.parse(repaired);
        console.log(`[Transaction Extractor] Successfully repaired JSON, extracted ${(parsed.transactions || []).length} transactions`);
      } else {
        // Last resort: try to find any valid JSON object
        const jsonMatch = jsonStr.match(/\{[\s\S]*"transactions"[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            throw parseError; // Re-throw original error
          }
        } else {
          throw parseError;
        }
      }
    }

    // Transform to our Transaction type
    const transactions: Transaction[] = (parsed.transactions || []).map(
      (t: unknown, index: number) => {
        const tx = t as {
          date?: string;
          description?: string;
          amount?: number;
          type?: string;
          vendor?: string | null;
        };
        return {
          id: `${documentId}-${index}`,
          date: tx.date || new Date().toISOString().split("T")[0],
          description: tx.description || "Unknown transaction",
          amount: Math.abs(tx.amount || 0), // Ensure positive
          type: tx.type === "credit" ? "credit" as const : "debit" as const,
          vendor: tx.vendor || null,
          documentId,
          documentName,
          suggestedAccountNumber: null,
          suggestedAccountName: null,
          confidence: 0,
          isReviewed: false,
          category,
        };
      }
    );

    console.log(`[Transaction Extractor] Successfully parsed ${transactions.length} transactions from ${documentName}`);

    return {
      transactions,
      documentId,
      documentName,
      extractionMethod,
      errors: (parsed.errors as string[]) || [],
    };
  } catch (error) {
    console.error("[Transaction Extractor] Failed to parse response:", error);
    // Log truncated raw response for debugging (first and last 500 chars)
    const rawText = content.text;
    if (rawText.length > 1000) {
      console.error("[Transaction Extractor] Raw response (truncated):");
      console.error("START:", rawText.slice(0, 500));
      console.error("...");
      console.error("END:", rawText.slice(-500));
    } else {
      console.error("[Transaction Extractor] Raw response:", rawText);
    }

    return {
      transactions: [],
      documentId,
      documentName,
      extractionMethod,
      errors: [`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`],
    };
  }
}

/**
 * Get media type for image
 */
function getImageMediaType(fileType: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const typeMap: Record<string, "image/jpeg" | "image/png" | "image/gif" | "image/webp"> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/gif": "image/gif",
    "image/webp": "image/webp",
  };

  return typeMap[fileType] || "image/jpeg";
}
