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
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Fetch document and verify ownership
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        project: {
          userId: session.user.id,
        },
      },
      include: {
        project: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Classify the document
    const result = await classifyDocument(document.fileUrl, document.fileType);

    // Update document with classification
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        category: result.category,
        confidence: result.confidence,
        year: result.year,
        subcategory: result.subcategory,
        metadata: result.metadata as object,
      },
    });

    return NextResponse.json({
      id: updatedDocument.id,
      category: updatedDocument.category,
      confidence: updatedDocument.confidence,
      year: updatedDocument.year,
      subcategory: updatedDocument.subcategory,
      metadata: updatedDocument.metadata,
      reasoning: result.reasoning,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "Failed to classify document" },
      { status: 500 }
    );
  }
}
