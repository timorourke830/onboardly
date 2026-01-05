import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateDocumentSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  isReviewed: z.boolean().optional(),
  year: z.number().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(document);
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      { error: "Failed to fetch document" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify document belongs to user's project
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateDocumentSchema.parse(body);

    const document = await prisma.document.update({
      where: { id },
      data,
    });

    return NextResponse.json(document);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating document:", error);
    return NextResponse.json(
      { error: "Failed to update document" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify document belongs to user's project
    const existingDocument = await prisma.document.findFirst({
      where: {
        id,
        project: {
          userId: session.user.id,
        },
      },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
