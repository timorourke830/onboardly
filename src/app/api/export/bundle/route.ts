import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateQBOCSV,
  generateQBOTransactionsCSV,
  getQBOFilename,
  getQBOTransactionsFilename,
  generateQBDIIF,
  generateQBDTransactionsIIF,
  getQBDFilename,
  getQBDTransactionsFilename,
  generateXeroCSV,
  generateXeroTransactionsCSV,
  getXeroFilename,
  getXeroTransactionsFilename,
  generateSummaryCSV,
  getSummaryFilename,
} from "@/lib/export";
import { Account } from "@/types/coa";
import { Transaction } from "@/types/transaction";
import { z } from "zod";

const exportSchema = z.object({
  projectId: z.string().min(1),
  format: z.enum(["qbo", "qbd", "xero"]),
  includeCoA: z.boolean().default(true),
  includeTransactions: z.boolean().default(true),
  includeSummary: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = exportSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { projectId, format, includeCoA, includeTransactions, includeSummary } = validation.data;

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

    const files: { filename: string; content: string; contentType: string }[] = [];

    // Get Chart of Accounts
    let accounts: Account[] = [];
    if (includeCoA) {
      const coa = await prisma.chartOfAccounts.findFirst({
        where: { projectId },
      });

      if (coa) {
        accounts = coa.accounts as unknown as Account[];

        const coaContent = format === "qbo"
          ? generateQBOCSV(accounts)
          : format === "qbd"
            ? generateQBDIIF(accounts)
            : generateXeroCSV(accounts);

        const coaFilename = format === "qbo"
          ? getQBOFilename(project.name)
          : format === "qbd"
            ? getQBDFilename(project.name)
            : getXeroFilename(project.name);

        files.push({
          filename: coaFilename,
          content: coaContent,
          contentType: format === "qbd" ? "text/plain" : "text/csv",
        });
      }
    }

    // Get Transactions
    let transactions: Transaction[] = [];
    if (includeTransactions || includeSummary) {
      const dbTransactions = await prisma.transaction.findMany({
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

      transactions = dbTransactions.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        description: t.description,
        amount: t.amount,
        type: t.type as "debit" | "credit",
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
      }));
    }

    // Add transactions file
    if (includeTransactions && transactions.length > 0) {
      const transContent = format === "qbo"
        ? generateQBOTransactionsCSV(transactions)
        : format === "qbd"
          ? generateQBDTransactionsIIF(transactions)
          : generateXeroTransactionsCSV(transactions);

      const transFilename = format === "qbo"
        ? getQBOTransactionsFilename(project.name)
        : format === "qbd"
          ? getQBDTransactionsFilename(project.name)
          : getXeroTransactionsFilename(project.name);

      files.push({
        filename: transFilename,
        content: transContent,
        contentType: format === "qbd" ? "text/plain" : "text/csv",
      });
    }

    // Add summary file
    if (includeSummary && transactions.length > 0) {
      const summaryContent = generateSummaryCSV(transactions);
      const summaryFilename = getSummaryFilename(project.name);

      files.push({
        filename: summaryFilename,
        content: summaryContent,
        contentType: "text/csv",
      });
    }

    // If only one file, return it directly
    if (files.length === 1) {
      return new NextResponse(files[0].content, {
        status: 200,
        headers: {
          "Content-Type": files[0].contentType,
          "Content-Disposition": `attachment; filename="${files[0].filename}"`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // If multiple files, return as JSON with file contents
    // (Client will handle downloading each file)
    return NextResponse.json({
      success: true,
      files: files.map((f) => ({
        filename: f.filename,
        content: f.content,
        contentType: f.contentType,
      })),
    });
  } catch (error) {
    console.error("Error exporting bundle:", error);
    return NextResponse.json(
      { error: "Failed to export files" },
      { status: 500 }
    );
  }
}
