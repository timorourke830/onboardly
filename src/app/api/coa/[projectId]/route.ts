import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Account } from "@/types/coa";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ projectId: string }>;
}

// GET - Retrieve Chart of Accounts for a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

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

    return NextResponse.json({
      id: coa.id,
      projectId: coa.projectId,
      industry: coa.industry,
      accounts: coa.accounts,
      suggestedAccounts: coa.suggestedAccounts,
      createdAt: coa.createdAt,
      updatedAt: coa.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching Chart of Accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch Chart of Accounts" },
      { status: 500 }
    );
  }
}

const updateAccountSchema = z.object({
  number: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
  detailType: z.string().min(1),
  description: z.string(),
  isCustom: z.boolean().optional(),
  parentAccountNumber: z.string().optional(),
});

const patchSchema = z.object({
  accounts: z.array(updateAccountSchema).optional(),
  acceptSuggestion: z.object({
    suggestionIndex: z.number(),
  }).optional(),
  rejectSuggestion: z.object({
    suggestionIndex: z.number(),
  }).optional(),
  addAccount: updateAccountSchema.optional(),
  removeAccount: z.object({
    accountNumber: z.string(),
  }).optional(),
  updateAccount: z.object({
    accountNumber: z.string(),
    updates: updateAccountSchema.partial(),
  }).optional(),
});

// PATCH - Update Chart of Accounts
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;
    const body = await request.json();
    const validation = patchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

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

    let accounts = coa.accounts as unknown as Account[];
    let suggestedAccounts = (coa.suggestedAccounts || []) as unknown as any[];
    const data = validation.data;

    // Handle full accounts replacement
    if (data.accounts) {
      accounts = data.accounts.map((acc, index) => ({
        ...acc,
        detailType: acc.detailType as Account["detailType"],
        id: acc.isCustom ? `custom-${index}` : `base-${index}`,
      }));
    }

    // Handle accepting a suggestion
    if (data.acceptSuggestion) {
      const { suggestionIndex } = data.acceptSuggestion;
      if (suggestionIndex >= 0 && suggestionIndex < suggestedAccounts.length) {
        const suggestion = suggestedAccounts[suggestionIndex];
        accounts.push({
          ...suggestion.account,
          id: `accepted-${Date.now()}`,
          isCustom: true,
        });
        suggestedAccounts = suggestedAccounts.filter((_, i) => i !== suggestionIndex);
      }
    }

    // Handle rejecting a suggestion
    if (data.rejectSuggestion) {
      const { suggestionIndex } = data.rejectSuggestion;
      if (suggestionIndex >= 0 && suggestionIndex < suggestedAccounts.length) {
        suggestedAccounts = suggestedAccounts.filter((_, i) => i !== suggestionIndex);
      }
    }

    // Handle adding a new account
    if (data.addAccount) {
      accounts.push({
        ...data.addAccount,
        detailType: data.addAccount.detailType as Account["detailType"],
        id: `custom-${Date.now()}`,
        isCustom: true,
      });
    }

    // Handle removing an account
    if (data.removeAccount) {
      accounts = accounts.filter(
        (acc) => acc.number !== data.removeAccount!.accountNumber
      );
    }

    // Handle updating an account
    if (data.updateAccount) {
      const { accountNumber, updates } = data.updateAccount;
      accounts = accounts.map((acc) => {
        if (acc.number === accountNumber) {
          return {
            ...acc,
            ...updates,
            detailType: (updates.detailType || acc.detailType) as Account["detailType"],
          };
        }
        return acc;
      });
    }

    // Sort accounts by number
    accounts.sort((a, b) => a.number.localeCompare(b.number));

    // Update the database
    const updatedCoA = await prisma.chartOfAccounts.update({
      where: { id: coa.id },
      data: {
        accounts: accounts as unknown as any,
        suggestedAccounts: suggestedAccounts as unknown as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedCoA.id,
      projectId: updatedCoA.projectId,
      industry: updatedCoA.industry,
      accounts: updatedCoA.accounts,
      suggestedAccounts: updatedCoA.suggestedAccounts,
      createdAt: updatedCoA.createdAt,
      updatedAt: updatedCoA.updatedAt,
    });
  } catch (error) {
    console.error("Error updating Chart of Accounts:", error);
    return NextResponse.json(
      { error: "Failed to update Chart of Accounts" },
      { status: 500 }
    );
  }
}
