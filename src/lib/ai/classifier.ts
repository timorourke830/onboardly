import Anthropic from "@anthropic-ai/sdk";
import { DOCUMENT_CLASSIFICATION_PROMPT, buildSpreadsheetPrompt } from "./prompts";
import type { ClassificationResult, DocumentCategory } from "@/types/document";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-20250514";

const DEFAULT_RESULT: ClassificationResult = {
  category: "other",
  confidence: 0.1,
  metadata: {},
  reasoning: "Could not classify document",
};

/**
 * Classify a document using Claude's vision capability
 */
export async function classifyDocument(
  fileUrl: string,
  fileType: string
): Promise<ClassificationResult> {
  try {
    // Handle spreadsheets differently - they need text extraction first
    if (isSpreadsheet(fileType)) {
      return await classifySpreadsheet(fileUrl);
    }

    // For images and PDFs, use vision
    return await classifyWithVision(fileUrl, fileType);
  } catch (error) {
    console.error("Classification error:", error);
    return {
      ...DEFAULT_RESULT,
      reasoning: `Classification failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Check if the file is a spreadsheet
 */
function isSpreadsheet(fileType: string): boolean {
  return (
    fileType === "text/csv" ||
    fileType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileType === "application/vnd.ms-excel"
  );
}

/**
 * Get the media type for Claude's vision API (images only)
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

/**
 * Check if the file is a PDF
 */
function isPDF(fileType: string): boolean {
  return fileType === "application/pdf";
}

/**
 * Classify an image or PDF using Claude's vision capability
 */
async function classifyWithVision(
  fileUrl: string,
  fileType: string
): Promise<ClassificationResult> {
  // Fetch the file and convert to base64
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Build content based on file type
  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  if (isPDF(fileType)) {
    // Use document type for PDFs
    contentBlocks.push({
      type: "document",
      source: {
        type: "base64",
        media_type: "application/pdf",
        data: base64,
      },
    });
  } else {
    // Use image type for images
    const mediaType = getImageMediaType(fileType);
    contentBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: base64,
      },
    });
  }

  contentBlocks.push({
    type: "text",
    text: DOCUMENT_CLASSIFICATION_PROMPT,
  });

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });

  return parseClassificationResponse(message);
}

/**
 * Classify a spreadsheet by extracting headers and sample data
 */
async function classifySpreadsheet(fileUrl: string): Promise<ClassificationResult> {
  // Fetch the file
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.statusText}`);
  }

  const text = await response.text();

  // Parse CSV (simple implementation)
  const lines = text.split("\n").filter((line) => line.trim());
  if (lines.length === 0) {
    return {
      ...DEFAULT_RESULT,
      reasoning: "Empty spreadsheet",
    };
  }

  const headers = parseCSVLine(lines[0]);
  const sampleData = lines.slice(1, 6).map(parseCSVLine);

  const prompt = buildSpreadsheetPrompt(headers, sampleData);

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return parseClassificationResponse(message);
}

/**
 * Parse a CSV line (simple implementation)
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse Claude's response into a ClassificationResult
 */
function parseClassificationResponse(
  message: Anthropic.Message
): ClassificationResult {
  const content = message.content[0];

  if (content.type !== "text") {
    return {
      ...DEFAULT_RESULT,
      reasoning: "Unexpected response format",
    };
  }

  try {
    // Extract JSON from the response (handle potential markdown code blocks)
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

    // Validate and normalize the response
    const category = validateCategory(parsed.category);
    const confidence = normalizeConfidence(parsed.confidence);

    return {
      category,
      confidence,
      year: parsed.year || null,
      subcategory: parsed.subcategory || null,
      metadata: parsed.metadata || {},
      reasoning: parsed.reasoning || "No reasoning provided",
    };
  } catch (error) {
    console.error("Failed to parse classification response:", error);
    console.error("Raw response:", content.text);

    return {
      ...DEFAULT_RESULT,
      reasoning: `Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Validate and normalize category
 */
function validateCategory(category: string): DocumentCategory {
  const validCategories: DocumentCategory[] = [
    "bank_statement",
    "receipt",
    "invoice",
    "tax_document",
    "payroll",
    "contract",
    "other",
  ];

  const normalized = category?.toLowerCase().replace(/\s+/g, "_");

  if (validCategories.includes(normalized as DocumentCategory)) {
    return normalized as DocumentCategory;
  }

  return "other";
}

/**
 * Normalize confidence to 0-1 range
 */
function normalizeConfidence(confidence: number | undefined): number {
  if (typeof confidence !== "number" || isNaN(confidence)) {
    return 0.5;
  }

  // If confidence is given as percentage, convert to decimal
  if (confidence > 1) {
    confidence = confidence / 100;
  }

  return Math.max(0, Math.min(1, confidence));
}
