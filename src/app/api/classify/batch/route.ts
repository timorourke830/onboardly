import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyDocument } from "@/lib/ai/classifier";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update project status to classifying
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "classifying" },
    });

    // Fetch all unclassified documents
    const documents = await prisma.document.findMany({
      where: {
        projectId,
        category: "other",
        confidence: 0,
      },
    });

    const results: {
      documentId: string;
      fileName: string;
      category: string;
      confidence: number;
      success: boolean;
      error?: string;
    }[] = [];

    // Classify each document sequentially to avoid rate limits
    for (const document of documents) {
      try {
        const result = await classifyDocument(
          document.fileUrl,
          document.fileType
        );

        // Update document with classification
        await prisma.document.update({
          where: { id: document.id },
          data: {
            category: result.category,
            confidence: result.confidence,
            year: result.year,
            subcategory: result.subcategory,
            metadata: result.metadata as object,
          },
        });

        results.push({
          documentId: document.id,
          fileName: document.fileName,
          category: result.category,
          confidence: result.confidence,
          success: true,
        });

        // Small delay between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to classify ${document.fileName}:`, error);
        results.push({
          documentId: document.id,
          fileName: document.fileName,
          category: "other",
          confidence: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Update project status to reviewing
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "reviewing" },
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    // Aggregate categories for summary
    const categorySummary = results.reduce(
      (acc, r) => {
        if (r.success) {
          acc[r.category] = (acc[r.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      message: "Classification complete",
      projectId,
      total: documents.length,
      success: successCount,
      failed: failureCount,
      categorySummary,
      results,
    });
  } catch (error) {
    console.error("Batch classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify documents" },
      { status: 500 }
    );
  }
}
