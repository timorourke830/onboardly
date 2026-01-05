import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateQBOCSV, getQBOContentType, getQBOFilename } from "@/lib/export";
import { Account } from "@/types/coa";

interface RouteParams {
  params: Promise<{ projectId: string }>;
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

    // Get Chart of Accounts for this project
    const coa = await prisma.chartOfAccounts.findFirst({
      where: { projectId },
    });

    if (!coa) {
      return NextResponse.json(
        { error: "Chart of Accounts not found. Please generate one first." },
        { status: 404 }
      );
    }

    const accounts = coa.accounts as unknown as Account[];

    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        { error: "No accounts found in Chart of Accounts" },
        { status: 400 }
      );
    }

    // Generate QBO CSV content
    const csvContent = generateQBOCSV(accounts);
    const filename = getQBOFilename(project.name);
    const contentType = getQBOContentType();

    // Return as downloadable file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error exporting QBO CSV:", error);
    return NextResponse.json(
      { error: "Failed to export Chart of Accounts" },
      { status: 500 }
    );
  }
}
