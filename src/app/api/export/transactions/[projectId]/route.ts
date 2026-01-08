import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Transaction } from "@/types/transaction";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

/**
 * Escapes a value for CSV format (handles commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return "";
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Generates a standard transactions CSV
 */
function generateTransactionsCSV(transactions: Transaction[]): string {
  const headers = [
    "Date",
    "Description",
    "Vendor",
    "Amount",
    "Type",
    "Account Number",
    "Account Name",
    "Source Document",
    "Category",
  ];

  const rows: string[][] = [];
  rows.push(headers);

  for (const transaction of transactions) {
    // Use reviewed account if available, otherwise suggested
    const accountNumber = transaction.reviewedAccountNumber || transaction.suggestedAccountNumber || "";
    const accountName = transaction.reviewedAccountName || transaction.suggestedAccountName || "";

    rows.push([
      escapeCSV(transaction.date),
      escapeCSV(transaction.description),
      escapeCSV(transaction.vendor || ""),
      transaction.amount.toFixed(2),
      escapeCSV(transaction.type),
      escapeCSV(accountNumber),
      escapeCSV(accountName),
      escapeCSV(transaction.documentName || ""),
      escapeCSV(transaction.category || ""),
    ]);
  }

  return rows.map((row) => row.join(",")).join("\r\n");
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Verify project ownership and get project details
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get transactions for this project
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

    if (dbTransactions.length === 0) {
      return NextResponse.json(
        { error: "No transactions found. Please extract transactions first." },
        { status: 404 }
      );
    }

    // Transform to Transaction type
    const transactions: Transaction[] = dbTransactions.map((t) => ({
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

    // Generate CSV content
    const csvContent = generateTransactionsCSV(transactions);
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const date = new Date().toISOString().split("T")[0];
    const filename = `${sanitizedName}_Transactions_${date}.csv`;

    // Return as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return NextResponse.json(
      { error: "Failed to export transactions" },
      { status: 500 }
    );
  }
}
