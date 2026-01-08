import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  generateQBOCSV,
  getQBOFilename,
  generateQBDIIF,
  getQBDFilename,
  generateXeroCSV,
  getXeroFilename,
} from "@/lib/export";
import { Account } from "@/types/coa";
import { Transaction } from "@/types/transaction";
import { z } from "zod";
import JSZip from "jszip";

const exportSchema = z.object({
  projectId: z.string().min(1),
  includeQBO: z.boolean().default(true),
  includeQBD: z.boolean().default(true),
  includeXero: z.boolean().default(true),
  includeTransactions: z.boolean().default(true),
});

/**
 * Escapes a value for CSV format
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

    const { projectId, includeQBO, includeQBD, includeXero, includeTransactions } = validation.data;

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

    const zip = new JSZip();
    const sanitizedName = project.name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const date = new Date().toISOString().split("T")[0];

    // Get Chart of Accounts
    const coa = await prisma.chartOfAccounts.findFirst({
      where: { projectId },
    });

    const accounts = coa ? (coa.accounts as unknown as Account[]) : [];

    if (accounts.length > 0) {
      // Add QBO CSV if requested
      if (includeQBO) {
        const qboContent = generateQBOCSV(accounts);
        zip.file(getQBOFilename(sanitizedName), qboContent);
      }

      // Add QBD IIF if requested
      if (includeQBD) {
        const qbdContent = generateQBDIIF(accounts);
        zip.file(getQBDFilename(sanitizedName), qbdContent);
      }

      // Add Xero CSV if requested
      if (includeXero) {
        const xeroContent = generateXeroCSV(accounts);
        zip.file(getXeroFilename(sanitizedName), xeroContent);
      }
    }

    // Get Transactions if requested
    if (includeTransactions) {
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

      if (dbTransactions.length > 0) {
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

        const transactionsContent = generateTransactionsCSV(transactions);
        zip.file(`${sanitizedName}_Transactions_${date}.csv`, transactionsContent);
      }
    }

    // Check if we have any files
    const fileCount = Object.keys(zip.files).length;
    if (fileCount === 0) {
      return NextResponse.json(
        { error: "No data to export. Please generate Chart of Accounts or extract transactions first." },
        { status: 400 }
      );
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const filename = `${sanitizedName}_Export_${date}.zip`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(zipBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting bundle:", error);
    return NextResponse.json(
      { error: "Failed to export files" },
      { status: 500 }
    );
  }
}
