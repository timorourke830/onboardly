export const DOCUMENT_CLASSIFICATION_PROMPT = `You are an expert document classifier for bookkeeping and accounting purposes. Analyze the provided document and classify it into one of the following categories:

## Categories

1. **bank_statement** - Bank account statements, credit card statements, account summaries
2. **receipt** - Purchase receipts, expense receipts, payment confirmations
3. **invoice** - Sales invoices, purchase invoices, bills from vendors
4. **tax_document** - W-2s, 1099s, tax returns, EIN letters, state tax forms
5. **payroll** - Pay stubs, payroll reports, employee payment records
6. **contract** - Service agreements, leases, vendor contracts, employment contracts
7. **other** - Documents that don't fit the above categories

## Instructions

1. Carefully examine the document content, layout, and any visible text
2. Identify key indicators like headers, logos, formatting patterns
3. Extract relevant metadata when visible
4. Determine the most likely year the document relates to
5. Provide a confidence score from 0 to 1 (1 being absolutely certain)

## Response Format

Respond with ONLY a valid JSON object (no markdown, no explanation outside JSON):

{
  "category": "one of: bank_statement, receipt, invoice, tax_document, payroll, contract, other",
  "confidence": 0.95,
  "year": 2024,
  "subcategory": "optional - e.g., 'checking account', 'office supplies', 'Q1'",
  "metadata": {
    "vendor": "Company or bank name if visible",
    "amount": 1234.56,
    "currency": "USD",
    "date": "2024-01-15",
    "accountNumber": "last 4 digits if visible, e.g., '****1234'",
    "invoiceNumber": "invoice number if applicable",
    "description": "brief description of document content"
  },
  "reasoning": "Brief explanation of why you chose this category"
}

## Important Notes

- If you cannot determine the year, omit the "year" field or set to null
- Only include metadata fields that you can actually see/extract from the document
- For amounts, use numeric values without currency symbols
- For dates, use ISO format (YYYY-MM-DD) when possible
- If confidence is below 0.5, consider using "other" category
- For poor quality or unreadable documents, use "other" with low confidence

Now analyze the document and provide your classification:`;

export const SPREADSHEET_CLASSIFICATION_PROMPT = `You are an expert document classifier for bookkeeping and accounting purposes. I will provide you with the contents of a spreadsheet file (headers and sample data). Classify this spreadsheet into one of the following categories:

## Categories

1. **bank_statement** - Bank transaction exports, account activity reports
2. **receipt** - Expense logs, receipt compilations
3. **invoice** - Invoice lists, billing records
4. **tax_document** - Tax calculations, tax form data
5. **payroll** - Employee payment records, salary data, timesheets
6. **contract** - Contract tracking sheets (rare for spreadsheets)
7. **other** - General data that doesn't fit above categories

## Spreadsheet Content

Headers: {headers}

Sample Data (first few rows):
{sampleData}

## Response Format

Respond with ONLY a valid JSON object:

{
  "category": "one of the categories above",
  "confidence": 0.85,
  "year": 2024,
  "subcategory": "e.g., 'transaction export', 'expense report'",
  "metadata": {
    "description": "what this spreadsheet appears to contain",
    "rowCount": "approximate if known",
    "dateRange": "if dates are visible"
  },
  "reasoning": "Brief explanation of classification"
}`;

export const buildSpreadsheetPrompt = (headers: string[], sampleData: string[][]): string => {
  const headersStr = headers.join(", ");
  const sampleDataStr = sampleData
    .slice(0, 5)
    .map((row) => row.join(" | "))
    .join("\n");

  return SPREADSHEET_CLASSIFICATION_PROMPT
    .replace("{headers}", headersStr)
    .replace("{sampleData}", sampleDataStr);
};
