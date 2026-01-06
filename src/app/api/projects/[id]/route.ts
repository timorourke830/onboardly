import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  businessName: z.string().min(1).optional(),
  businessType: z.string().optional(),
  industry: z.string().optional(),
  status: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[GET /api/projects/[id]] Starting request...");

    const session = await getServerSession(authOptions);
    console.log("[GET /api/projects/[id]] Session:", session ? "found" : "null", "userId:", session?.user?.id);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    console.log("[GET /api/projects/[id]] Project ID:", id);

    // First, try to get the basic project
    const project = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Then fetch related data separately to avoid complex include issues
    const [documents, documentCount] = await Promise.all([
      prisma.document.findMany({
        where: { projectId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({
        where: { projectId: id },
      }),
    ]);

    // Try to fetch CoA separately - it may not exist yet in the database
    let coa = null;
    try {
      coa = await prisma.chartOfAccounts.findUnique({
        where: { projectId: id },
      });
    } catch (coaError) {
      // ChartOfAccounts table might not exist yet - that's okay
      console.log("[GET /api/projects/[id]] CoA table not available:", coaError instanceof Error ? coaError.message : "unknown");
    }

    // Combine results
    const projectWithRelations = {
      ...project,
      documents,
      coa,
      _count: { documents: documentCount },
    };

    console.log("[GET /api/projects/[id]] Project found:", project ? "yes" : "no");
    console.log("[GET /api/projects/[id]] Documents count:", documents.length);
    console.log("[GET /api/projects/[id]] CoA exists:", coa ? "yes" : "no");

    return NextResponse.json(projectWithRelations);
  } catch (error) {
    console.error("[GET /api/projects/[id]] Error:", error);
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json(
      {
        error: "Failed to fetch project",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
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

    // Verify project belongs to user
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
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
    console.log(`[DELETE /api/projects/${id}] Starting delete...`);

    // Verify project belongs to user and get documents for file cleanup
    const existingProject = await prisma.project.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        documents: {
          select: { fileUrl: true },
        },
      },
    });

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Delete files from Supabase Storage
    // Files are stored at URLs like: https://xxx.supabase.co/storage/v1/object/public/documents/userId/fileName
    const fileUrls = existingProject.documents.map((d: { fileUrl: string }) => d.fileUrl);
    console.log(`[DELETE /api/projects/${id}] Found ${fileUrls.length} files to delete from storage`);

    if (fileUrls.length > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        // Import Supabase client dynamically
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_KEY
        );

        // Extract file paths from URLs and delete them
        const filePaths = fileUrls
          .map((url: string) => {
            // URL format: .../storage/v1/object/public/documents/path/to/file
            const match = url.match(/\/storage\/v1\/object\/public\/documents\/(.+)$/);
            return match ? match[1] : null;
          })
          .filter((path: string | null): path is string => path !== null);

        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("documents")
            .remove(filePaths);

          if (storageError) {
            console.error(`[DELETE /api/projects/${id}] Storage cleanup error:`, storageError);
            // Continue with project deletion even if storage cleanup fails
          } else {
            console.log(`[DELETE /api/projects/${id}] Successfully deleted ${filePaths.length} files from storage`);
          }
        }
      } catch (storageError) {
        console.error(`[DELETE /api/projects/${id}] Storage cleanup failed:`, storageError);
        // Continue with project deletion even if storage cleanup fails
      }
    }

    // Delete the project (cascade will handle related records)
    // Prisma schema has onDelete: Cascade for documents, transactions, and CoA
    await prisma.project.delete({
      where: { id },
    });

    console.log(`[DELETE /api/projects/${id}] Project deleted successfully`);

    return NextResponse.json({
      message: "Project deleted",
      deletedFiles: fileUrls.length,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
