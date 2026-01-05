import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  uploadFile,
  isValidFileType,
  isValidFileSize,
  MAX_FILE_SIZE,
} from "@/lib/storage/upload";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

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

    // Validate file type
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Accepted types: PDF, JPG, PNG, XLSX, CSV",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 }
      );
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const uploadResult = await uploadFile(
      buffer,
      file.name,
      file.type,
      projectId
    );

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        projectId,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.publicUrl,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        category: "other", // Will be classified by AI later
      },
    });

    return NextResponse.json(
      {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        fileType: document.fileType,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
