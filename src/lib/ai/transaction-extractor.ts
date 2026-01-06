import Anthropic from "@anthropic-ai/sdk";
import { Transaction, TransactionExtractionResult } from "@/types/transaction";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

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
 * Extract transactions from a PDF document
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

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
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
            text: TRANSACTION_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  return parseExtractionResponse(message, documentId, documentName, "pdf", category);
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
    max_tokens: 4096,
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
  const headers = lines[0];
  const sampleData = lines.slice(0, Math.min(100, lines.length)).join("\n");

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
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

  try {
    // Extract JSON from response
    let jsonStr = content.text.trim();

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
    const parsed = JSON.parse(jsonStr);

    // Transform to our Transaction type
    const transactions: Transaction[] = (parsed.transactions || []).map(
      (t: {
        date: string;
        description: string;
        amount: number;
        type: string;
        vendor: string | null;
      }, index: number) => ({
        id: `${documentId}-${index}`,
        date: t.date,
        description: t.description,
        amount: Math.abs(t.amount), // Ensure positive
        type: t.type === "credit" ? "credit" : "debit",
        vendor: t.vendor || null,
        documentId,
        documentName,
        suggestedAccountNumber: null,
        suggestedAccountName: null,
        confidence: 0,
        isReviewed: false,
        category,
      })
    );

    return {
      transactions,
      documentId,
      documentName,
      extractionMethod,
      errors: parsed.errors || [],
    };
  } catch (error) {
    console.error("[Transaction Extractor] Failed to parse response:", error);
    console.error("[Transaction Extractor] Raw response:", content.text);

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
