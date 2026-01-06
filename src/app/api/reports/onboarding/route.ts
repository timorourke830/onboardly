// Onboarding Report API Endpoint
// GET: Generate and return onboarding report (JSON or PDF)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOnboardingReport } from "@/lib/reports/onboarding-report";
import { generateOnboardingPDF } from "@/lib/reports/pdf-generator";
import { DocumentCategory } from "@/types/document";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const format = searchParams.get("format") || "json"; // "json" or "pdf"

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        documents: {
          select: {
            id: true,
            fileName: true,
            category: true,
            subcategory: true,
            year: true,
            createdAt: true,
            metadata: true,
          },
        },
        coa: {
          select: {
            id: true,
            industry: true,
            accounts: true,
          },
        },
        transactions: {
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            type: true,
            vendor: true,
            suggestedAccountNumber: true,
            suggestedAccountName: true,
            reviewedAccountNumber: true,
            reviewedAccountName: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Transform data for report generation
    const documents = project.documents.map((doc: {
      id: string;
      fileName: string;
      category: string;
      subcategory: string | null;
      year: number | null;
      createdAt: Date;
      metadata: unknown;
    }) => ({
      id: doc.id,
      fileName: doc.fileName,
      category: doc.category as DocumentCategory,
      subcategory: doc.subcategory,
      year: doc.year,
      createdAt: doc.createdAt,
      metadata: doc.metadata as Record<string, unknown> | null,
    }));

    const transactions = project.transactions.map((t: {
      id: string;
      date: Date;
      description: string;
      amount: number;
      type: string;
      vendor: string | null;
      suggestedAccountNumber: string | null;
      suggestedAccountName: string | null;
      reviewedAccountNumber: string | null;
      reviewedAccountName: string | null;
    }) => ({
      id: t.id,
      date: t.date.toISOString(),
      description: t.description,
      amount: t.amount,
      type: t.type as "debit" | "credit",
      vendor: t.vendor,
      suggestedAccountNumber: t.suggestedAccountNumber,
      suggestedAccountName: t.suggestedAccountName,
      reviewedAccountNumber: t.reviewedAccountNumber,
      reviewedAccountName: t.reviewedAccountName,
    }));

    const coa = project.coa
      ? {
          id: project.coa.id,
          industry: project.coa.industry,
          accounts: (project.coa.accounts as unknown as {
            number: string;
            name: string;
            type: string;
            subtype?: string;
            description?: string;
          }[]) || [],
        }
      : null;

    // Generate the report
    const report = generateOnboardingReport(
      {
        id: project.id,
        name: project.name,
        businessName: project.businessName,
        industry: project.industry,
        createdAt: project.createdAt,
      },
      documents,
      transactions,
      coa
    );

    // Return based on format
    if (format === "pdf") {
      const pdfBuffer = await generateOnboardingPDF(report);

      const filename = `${project.businessName.replace(/[^a-zA-Z0-9]/g, "_")}_Onboarding_Report.pdf`;

      // Convert Buffer to Uint8Array for NextResponse compatibility
      const uint8Array = new Uint8Array(pdfBuffer);

      return new NextResponse(uint8Array, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    }

    // Return JSON
    return NextResponse.json(report);
  } catch (error) {
    console.error("Error generating onboarding report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
