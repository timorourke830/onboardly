import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateChartOfAccounts } from "@/lib/ai/coa-generator";
import { IndustryType } from "@/types/coa";
import { ClassifiedDocument } from "@/types/document";
import { z } from "zod";

const generateSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  industry: z.enum(["general", "restaurant", "contractor", "professional-services", "retail"]),
  includeDocumentSuggestions: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  console.log("[POST /api/coa/generate] ========== REQUEST START ==========");

  try {
    const session = await getServerSession(authOptions);
    console.log("[POST /api/coa/generate] Session userId:", session?.user?.id || "NULL");

    if (!session?.user?.id) {
      console.log("[POST /api/coa/generate] RETURNING 401 - No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log("[POST /api/coa/generate] Request body:", JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.log("[POST /api/coa/generate] RETURNING 400 - JSON parse error:", parseError);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validation = generateSchema.safeParse(body);
    console.log("[POST /api/coa/generate] Validation:", validation.success ? "PASSED" : "FAILED");

    if (!validation.success) {
      console.log("[POST /api/coa/generate] Validation errors:", JSON.stringify(validation.error.issues, null, 2));
      console.log("[POST /api/coa/generate] RETURNING 400 - Validation failed");
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { projectId, industry, includeDocumentSuggestions } = validation.data;
    console.log("[POST /api/coa/generate] Validated data:", { projectId, industry, includeDocumentSuggestions });

    // Verify project ownership
    console.log("[POST /api/coa/generate] Looking up project...");
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      console.log("[POST /api/coa/generate] RETURNING 404 - Project not found");
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    console.log("[POST /api/coa/generate] Project found:", project.name);

    // Get classified documents if needed
    let classifiedDocuments: ClassifiedDocument[] = [];
    if (includeDocumentSuggestions) {
      console.log("[POST /api/coa/generate] Fetching classified documents...");
      const documents = await prisma.document.findMany({
        where: {
          projectId,
          NOT: { category: "other" }, // Exclude unclassified documents
        },
        select: {
          category: true,
          subcategory: true,
          year: true,
          metadata: true,
        },
      });
      console.log("[POST /api/coa/generate] Found", documents.length, "classified documents");

      classifiedDocuments = documents
        .filter((doc: { category: string; subcategory: string | null; year: number | null; metadata: unknown }) => doc.category && doc.category !== "other")
        .map((doc: { category: string; subcategory: string | null; year: number | null; metadata: unknown }) => ({
          category: doc.category as ClassifiedDocument["category"],
          subcategory: doc.subcategory ?? undefined,
          year: doc.year ?? undefined,
          metadata: doc.metadata as ClassifiedDocument["metadata"],
        }));
    }

    // Generate Chart of Accounts
    console.log("[POST /api/coa/generate] Generating CoA for industry:", industry);
    const result = await generateChartOfAccounts(
      industry as IndustryType,
      classifiedDocuments
    );
    console.log("[POST /api/coa/generate] Generated", result.baseAccounts.length, "accounts,", result.suggestedAccounts.length, "suggestions");

    // Store the generated CoA in the database
    console.log("[POST /api/coa/generate] Saving to database...");
    const existingCoA = await prisma.chartOfAccounts.findFirst({
      where: { projectId },
    });

    if (existingCoA) {
      console.log("[POST /api/coa/generate] Updating existing CoA");
      await prisma.chartOfAccounts.update({
        where: { id: existingCoA.id },
        data: {
          industry,
          accounts: result.baseAccounts as unknown as any,
          suggestedAccounts: result.suggestedAccounts as unknown as any,
          updatedAt: new Date(),
        },
      });
    } else {
      console.log("[POST /api/coa/generate] Creating new CoA");
      await prisma.chartOfAccounts.create({
        data: {
          projectId,
          industry,
          accounts: result.baseAccounts as unknown as any,
          suggestedAccounts: result.suggestedAccounts as unknown as any,
        },
      });
    }

    console.log("[POST /api/coa/generate] ========== SUCCESS ==========");
    return NextResponse.json(result);
  } catch (error) {
    console.error("[POST /api/coa/generate] ========== ERROR ==========");
    console.error("[POST /api/coa/generate] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate Chart of Accounts" },
      { status: 500 }
    );
  }
}
