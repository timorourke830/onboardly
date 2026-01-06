import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractTransactionsFromDocument } from "@/lib/ai/transaction-extractor";
import { mapTransactionsToAccounts } from "@/lib/ai/transaction-mapper";
import { Account } from "@/types/coa";
import { z } from "zod";

const extractSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
});

// Document categories that contain transactions
const TRANSACTION_CATEGORIES = [
  "bank_statement",
  "receipt",
  "invoice",
  "credit_card",
];

export async function POST(request: NextRequest) {
  console.log("[POST /api/extract-transactions] ========== REQUEST START ==========");

  try {
    const session = await getServerSession(authOptions);
    console.log("[POST /api/extract-transactions] Session:", session?.user?.id ? "authenticated" : "null");

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = extractSchema.safeParse(body);

    if (!validation.success) {
      console.log("[POST /api/extract-transactions] Validation failed:", validation.error.issues);
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { projectId } = validation.data;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "extracting" },
    });

    // Fetch documents that could contain transactions
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        category: { in: TRANSACTION_CATEGORIES },
      },
    });

    console.log(`[POST /api/extract-transactions] Found ${documents.length} documents to process`);

    // Fetch Chart of Accounts for mapping
    const coa = await prisma.chartOfAccounts.findFirst({
      where: { projectId },
    });

    const chartOfAccounts = (coa?.accounts || []) as unknown as Account[];

    // Delete existing transactions for this project (fresh extraction)
    await prisma.transaction.deleteMany({
      where: { projectId },
    });

    // Process each document
    const results = {
      documentsProcessed: 0,
      totalTransactions: 0,
      errors: [] as string[],
    };

    for (const doc of documents) {
      console.log(`[POST /api/extract-transactions] Processing: ${doc.fileName}`);

      try {
        // Extract transactions
        const extractionResult = await extractTransactionsFromDocument(
          doc.id,
          doc.fileName,
          doc.fileUrl,
          doc.fileType,
          doc.category
        );

        if (extractionResult.errors.length > 0) {
          results.errors.push(...extractionResult.errors.map((e) => `${doc.fileName}: ${e}`));
        }

        if (extractionResult.transactions.length === 0) {
          console.log(`[POST /api/extract-transactions] No transactions found in ${doc.fileName}`);
          continue;
        }

        // Map transactions to accounts if CoA exists
        let mappedTransactions = extractionResult.transactions;
        if (chartOfAccounts.length > 0) {
          mappedTransactions = await mapTransactionsToAccounts(
            extractionResult.transactions,
            chartOfAccounts
          );
        }

        // Save transactions to database
        for (const transaction of mappedTransactions) {
          await prisma.transaction.create({
            data: {
              projectId,
              documentId: doc.id,
              date: new Date(transaction.date),
              description: transaction.description,
              amount: transaction.amount,
              type: transaction.type,
              vendor: transaction.vendor,
              suggestedAccountNumber: transaction.suggestedAccountNumber,
              suggestedAccountName: transaction.suggestedAccountName,
              confidence: transaction.confidence,
              isReviewed: false,
            },
          });
        }

        results.documentsProcessed++;
        results.totalTransactions += mappedTransactions.length;
        console.log(`[POST /api/extract-transactions] Extracted ${mappedTransactions.length} transactions from ${doc.fileName}`);

        // Small delay between documents to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[POST /api/extract-transactions] Error processing ${doc.fileName}:`, error);
        results.errors.push(`${doc.fileName}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    // Update project status
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "reviewing" },
    });

    console.log("[POST /api/extract-transactions] ========== COMPLETE ==========");
    console.log(`[POST /api/extract-transactions] Processed: ${results.documentsProcessed}, Transactions: ${results.totalTransactions}`);

    return NextResponse.json({
      success: true,
      documentsProcessed: results.documentsProcessed,
      totalTransactions: results.totalTransactions,
      errors: results.errors,
    });
  } catch (error) {
    console.error("[POST /api/extract-transactions] Error:", error);
    return NextResponse.json(
      { error: "Failed to extract transactions" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch transactions for a project
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch transactions with document info
    const transactions = await prisma.transaction.findMany({
      where: { projectId },
      include: {
        document: {
          select: {
            fileName: true,
            category: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        description: t.description,
        amount: t.amount,
        type: t.type,
        vendor: t.vendor,
        documentId: t.documentId,
        documentName: t.document.fileName,
        category: t.document.category,
        suggestedAccountNumber: t.suggestedAccountNumber,
        suggestedAccountName: t.suggestedAccountName,
        confidence: t.confidence,
        isReviewed: t.isReviewed,
        reviewedAccountNumber: t.reviewedAccountNumber,
        reviewedAccountName: t.reviewedAccountName,
      })),
      total: transactions.length,
    });
  } catch (error) {
    console.error("[GET /api/extract-transactions] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
