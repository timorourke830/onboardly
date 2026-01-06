// AI Report Insights Generator
// Uses Claude to generate personalized recommendations based on report data

import Anthropic from "@anthropic-ai/sdk";
import { OnboardingReport, ReportRecommendation } from "@/types/report";

const anthropic = new Anthropic();

interface AIInsight {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: "documents" | "transactions" | "accounts" | "general";
  actionItem?: string;
}

// Generate AI-powered insights for the report
export async function generateReportInsights(
  report: OnboardingReport
): Promise<ReportRecommendation[]> {
  try {
    // Build context for Claude
    const context = buildReportContext(report);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `You are a senior bookkeeper analyzing a client onboarding report. Based on the data below, provide 3-5 specific, actionable recommendations to help complete the onboarding process.

${context}

Respond with a JSON array of recommendations. Each recommendation should have:
- title: Short title (max 10 words)
- description: Detailed explanation (1-2 sentences)
- priority: "high", "medium", or "low"
- category: "documents", "transactions", "accounts", or "general"
- actionItem: Specific action to take (optional)

Focus on:
1. Critical missing documents that would prevent accurate bookkeeping
2. Priority order for obtaining missing items
3. Specific questions to ask the client about gaps
4. Any anomalies or concerns in the financial data

Return ONLY valid JSON array, no other text.`,
        },
      ],
    });

    // Parse the response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      console.error("No text response from Claude");
      return [];
    }

    // Extract JSON from response (handle potential markdown code blocks)
    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    const insights: AIInsight[] = JSON.parse(jsonStr);

    // Convert to ReportRecommendation format
    return insights.map((insight) => ({
      priority: insight.priority,
      category: insight.category,
      title: insight.title,
      description: insight.description,
      actionItem: insight.actionItem,
    }));
  } catch (error) {
    console.error("Error generating AI insights:", error);
    // Return empty array on error - the report will still work with built-in recommendations
    return [];
  }
}

// Build context string for Claude
function buildReportContext(report: OnboardingReport): string {
  const sections: string[] = [];

  // Client info
  sections.push(`## Client Information
- Business: ${report.clientInfo.businessName}
- Industry: ${report.clientInfo.industry}
- Project started: ${report.clientInfo.projectCreatedAt}
- Overall completeness: ${report.overallCompletenessScore}%
- Status: ${report.status}`);

  // Document coverage
  sections.push(`## Documents Received (${report.documentCoverage.totalDocuments} total)
${report.documentCoverage.documentsReceived
  .map((d) => `- ${d.label}: ${d.count} documents`)
  .join("\n")}`);

  // Missing documents
  if (report.documentCoverage.documentsMissing.length > 0) {
    sections.push(`## Missing Documents
${report.documentCoverage.documentsMissing
  .map((m) => {
    let line = `- ${m.label} (${m.priority} priority)`;
    if (m.missingMonths && m.missingMonths.length > 0) {
      line += ` - Missing: ${m.missingMonths.slice(0, 6).join(", ")}`;
      if (m.missingMonths.length > 6) {
        line += ` and ${m.missingMonths.length - 6} more`;
      }
    }
    return line;
  })
  .join("\n")}`);
  }

  // Statement coverage gaps
  if (report.documentCoverage.dateRangeCoverage.gaps.length > 0) {
    sections.push(`## Statement Coverage Gaps
- Months with statements: ${report.documentCoverage.dateRangeCoverage.monthsCovered} of ${report.documentCoverage.dateRangeCoverage.monthsExpected}
- Missing months: ${report.documentCoverage.dateRangeCoverage.gaps.slice(0, 6).join(", ")}${report.documentCoverage.dateRangeCoverage.gaps.length > 6 ? ` and ${report.documentCoverage.dateRangeCoverage.gaps.length - 6} more` : ""}`);
  }

  // Transaction summary
  if (report.transactionSummary.totalTransactions > 0) {
    sections.push(`## Transaction Summary
- Total transactions: ${report.transactionSummary.totalTransactions}
- Date range: ${report.transactionSummary.dateRange?.start || "N/A"} to ${report.transactionSummary.dateRange?.end || "N/A"}
- Total income: $${report.transactionSummary.totalIncome.toFixed(2)}
- Total expenses: $${report.transactionSummary.totalExpenses.toFixed(2)}
- Net: $${report.transactionSummary.netAmount.toFixed(2)}
- Average transaction: $${report.transactionSummary.averageTransactionSize.toFixed(2)}`);

    // Top vendors
    if (report.transactionSummary.topVendors.length > 0) {
      sections.push(`## Top Vendors by Spend
${report.transactionSummary.topVendors
  .slice(0, 5)
  .map((v) => `- ${v.vendor}: $${v.totalAmount.toFixed(2)} (${v.transactionCount} transactions)`)
  .join("\n")}`);
    }

    // Large transactions
    if (report.transactionSummary.largestTransactions.length > 0) {
      sections.push(`## Largest Transactions
${report.transactionSummary.largestTransactions
  .slice(0, 3)
  .map((t) => `- $${t.amount.toFixed(2)} on ${t.date}: ${t.description.substring(0, 50)}`)
  .join("\n")}`);
    }

    // Account mapping status
    const unmapped = report.transactionSummary.transactionsByAccount.find(
      (a) => a.accountNumber === "unassigned"
    );
    if (unmapped) {
      sections.push(`## Account Mapping
- Unmapped transactions: ${unmapped.transactionCount} (${Math.round(unmapped.transactionCount / report.transactionSummary.totalTransactions * 100)}%)`);
    }
  } else {
    sections.push(`## Transaction Summary
- No transactions extracted yet`);
  }

  // Chart of accounts
  sections.push(`## Chart of Accounts
- Total accounts: ${report.chartOfAccounts.totalAccounts}
- Industry template: ${report.chartOfAccounts.industry}
${report.chartOfAccounts.accountsByType.map((t) => `- ${t.type}: ${t.count} accounts`).join("\n")}`);

  return sections.join("\n\n");
}

// Generate specific questions to ask the client
export async function generateClientQuestions(
  report: OnboardingReport
): Promise<string[]> {
  try {
    const context = buildReportContext(report);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `Based on this client onboarding report, generate 3-5 specific questions the bookkeeper should ask the client to fill in gaps or clarify information.

${context}

Focus on:
1. Missing documents that need explanation
2. Unusual transactions that need clarification
3. Business-specific details that affect bookkeeping

Respond with a JSON array of strings, each being a specific question. Return ONLY valid JSON array, no other text.`,
        },
      ],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return [];
    }

    let jsonStr = textContent.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating client questions:", error);
    return [];
  }
}
