import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { exportToQBO, exportToQBD, exportToXero } from "@/lib/ai/coa-generator";
import { Account, ExportFormat } from "@/types/coa";
import { z } from "zod";

const exportSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  format: z.enum(["qbo", "qbd", "xero"]),
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

    const { projectId, format } = validation.data;

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

    const coa = await prisma.chartOfAccounts.findFirst({
      where: { projectId },
    });

    if (!coa) {
      return NextResponse.json({ error: "Chart of Accounts not found" }, { status: 404 });
    }

    const accounts = coa.accounts as unknown as Account[];

    // Generate export based on format
    let content: string;
    let filename: string;
    let contentType: string;

    switch (format as ExportFormat) {
      case "qbo":
        content = exportToQBO(accounts);
        filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_COA_QBO.csv`;
        contentType = "text/csv";
        break;
      case "qbd":
        content = exportToQBD(accounts);
        filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_COA.iif`;
        contentType = "text/plain";
        break;
      case "xero":
        content = exportToXero(accounts);
        filename = `${project.name.replace(/[^a-zA-Z0-9]/g, "_")}_COA_Xero.csv`;
        contentType = "text/csv";
        break;
      default:
        return NextResponse.json({ error: "Invalid format" }, { status: 400 });
    }

    // Return the file content with appropriate headers
    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error exporting Chart of Accounts:", error);
    return NextResponse.json(
      { error: "Failed to export Chart of Accounts" },
      { status: 500 }
    );
  }
}
