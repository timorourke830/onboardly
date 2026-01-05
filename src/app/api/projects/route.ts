import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  businessName: z.string().min(1, "Business name is required"),
  businessType: z.string().optional(),
  industry: z.string().default("general"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { documents: true },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        businessName: data.businessName,
        businessType: data.businessType || null,
        industry: data.industry,
        userId: session.user.id,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
