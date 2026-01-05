# OnboardLy MVP Setup Guide

## Overview

OnboardLy is an AI-powered document sorting and Chart of Accounts generator for fractional bookkeepers. It solves the "Day Zero" problem: when a new client hands over a shoebox of mixed documents and the bookkeeper needs to sort, classify, identify gaps, and generate a starting CoA before actual bookkeeping can begin.

**MVP Scope (Week 1):**
1. Upload documents (PDF, images, spreadsheets)
2. AI classification (bank statements, receipts, invoices, tax docs, etc.)
3. AI-recommended Chart of Accounts based on business type/industry
4. Download exports for QuickBooks Online (CSV), QuickBooks Desktop (IIF), and Xero (CSV)

---

## Part 1: Directory Structure

Create this structure in `C:\dev\onboardly\`:

```
C:\dev\onboardly\
├── CLAUDE.md                    # AI assistant context file
├── .env                         # Environment variables (API keys)
├── .env.example                 # Template for env vars
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
│
├── prisma/
│   └── schema.prisma            # Database schema
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
│
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing/home page
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── signup/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx         # Main dashboard
│   │   │   └── layout.tsx
│   │   │
│   │   ├── upload/
│   │   │   └── page.tsx         # Document upload interface
│   │   │
│   │   ├── projects/
│   │   │   ├── page.tsx         # List all client projects
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # Single project view
│   │   │       ├── documents/
│   │   │       │   └── page.tsx # Classified documents view
│   │   │       ├── coa/
│   │   │       │   └── page.tsx # Chart of Accounts editor
│   │   │       └── export/
│   │   │           └── page.tsx # Export options
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       │
│   │       ├── upload/
│   │       │   └── route.ts     # Handle file uploads
│   │       │
│   │       ├── classify/
│   │       │   └── route.ts     # AI document classification
│   │       │
│   │       ├── coa/
│   │       │   ├── generate/
│   │       │   │   └── route.ts # Generate CoA recommendation
│   │       │   └── route.ts     # CRUD for CoA
│   │       │
│   │       ├── export/
│   │       │   ├── qbo/
│   │       │   │   └── route.ts # QuickBooks Online CSV export
│   │       │   ├── qbd/
│   │       │   │   └── route.ts # QuickBooks Desktop IIF export
│   │       │   └── xero/
│   │       │       └── route.ts # Xero CSV export
│   │       │
│   │       └── projects/
│   │           └── route.ts     # CRUD for projects
│   │
│   ├── components/
│   │   ├── ui/                  # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── modal.tsx
│   │   │   └── toast.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── header.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── footer.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── dropzone.tsx     # Drag-drop file upload
│   │   │   ├── file-list.tsx    # List of uploaded files
│   │   │   └── progress-bar.tsx
│   │   │
│   │   ├── documents/
│   │   │   ├── document-card.tsx
│   │   │   ├── document-grid.tsx
│   │   │   ├── category-badge.tsx
│   │   │   └── classification-review.tsx
│   │   │
│   │   ├── coa/
│   │   │   ├── coa-table.tsx    # Editable CoA table
│   │   │   ├── coa-row.tsx
│   │   │   ├── add-account-modal.tsx
│   │   │   └── industry-selector.tsx
│   │   │
│   │   └── export/
│   │       ├── export-options.tsx
│   │       └── download-button.tsx
│   │
│   ├── lib/
│   │   ├── db.ts                # Prisma client
│   │   ├── auth.ts              # NextAuth config
│   │   ├── utils.ts             # Helper functions
│   │   │
│   │   ├── ai/
│   │   │   ├── classifier.ts    # Document classification logic
│   │   │   ├── coa-generator.ts # CoA generation logic
│   │   │   └── prompts.ts       # AI prompt templates
│   │   │
│   │   ├── export/
│   │   │   ├── qbo-csv.ts       # QBO CSV formatter
│   │   │   ├── qbd-iif.ts       # QBD IIF formatter
│   │   │   └── xero-csv.ts      # Xero CSV formatter
│   │   │
│   │   └── storage/
│   │       └── upload.ts        # File storage handling
│   │
│   ├── types/
│   │   ├── document.ts          # Document types
│   │   ├── coa.ts               # Chart of Accounts types
│   │   ├── project.ts           # Project types
│   │   └── export.ts            # Export types
│   │
│   └── data/
│       ├── coa-templates/       # Industry CoA templates
│       │   ├── restaurant.json
│       │   ├── contractor.json
│       │   ├── professional-services.json
│       │   ├── retail.json
│       │   ├── ecommerce.json
│       │   └── general.json
│       │
│       └── document-categories.json  # Classification categories
│
└── docs/
    ├── API.md                   # API documentation
    └── DEPLOYMENT.md            # Deployment guide
```

---

## Part 2: CLAUDE.md File

Create this file at `C:\dev\onboardly\CLAUDE.md`:

```markdown
# OnboardLy - AI Document Sorting for Fractional Bookkeepers

## Project Overview

OnboardLy solves the "Day Zero" problem for fractional bookkeepers: when a new client hands over a shoebox of mixed documents (bank statements, receipts from multiple years, random spreadsheets, photos of documents), the bookkeeper must sort through everything before actual bookkeeping can begin. This typically takes 3+ hours of unbillable time.

OnboardLy automates this by:
1. Accepting document uploads (PDF, images, spreadsheets)
2. Using AI to classify and categorize documents
3. Identifying missing documents
4. Recommending a Chart of Accounts based on business type
5. Exporting organized data to QuickBooks Online, QuickBooks Desktop, or Xero

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Auth**: NextAuth.js with email/password
- **AI**: Claude API (Anthropic) for document classification and CoA generation
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui

## Core Data Models

### Project (represents a client onboarding)
- id, name, businessName, businessType, industry
- status: 'uploading' | 'classifying' | 'reviewing' | 'complete'
- userId (owner)
- createdAt, updatedAt

### Document
- id, projectId, fileName, fileUrl, fileType, fileSize
- category: 'bank_statement' | 'receipt' | 'invoice' | 'tax_document' | 'payroll' | 'contract' | 'other'
- subcategory: string (e.g., "2023", "Q1", vendor name)
- confidence: number (AI classification confidence 0-1)
- year: number (extracted year if applicable)
- isReviewed: boolean
- metadata: JSON (extracted data like amounts, dates, vendors)

### ChartOfAccounts
- id, projectId
- accounts: JSON array of Account objects

### Account (within CoA)
- number: string (e.g., "1000", "4000")
- name: string
- type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
- detailType: string (e.g., "Cash", "Accounts Receivable")
- description: string
- isActive: boolean

## Document Categories

The AI classifies documents into these categories:
- **bank_statement**: Bank account statements, credit card statements
- **receipt**: Purchase receipts, expense receipts
- **invoice**: Sales invoices, purchase invoices, bills
- **tax_document**: W-2s, 1099s, tax returns, EIN letters
- **payroll**: Pay stubs, payroll reports, employee records
- **contract**: Service agreements, leases, vendor contracts
- **other**: Unclassifiable documents

## Export Formats

### QuickBooks Online (CSV)
Columns: Account Name, Type, Detail Type, Description, Account Number
Types must match QBO's expected values exactly.

### QuickBooks Desktop (IIF)
Tab-delimited text file with specific headers:
```
!ACCNT	NAME	ACCNTTYPE	DESC	ACCNUM
ACCNT	Checking	BANK	Main checking account	1000
```

### Xero (CSV)
Columns: *Code, *Name, *Type, Description, Tax Code
Types: CURRENT, CURRLIAB, EQUITY, REVENUE, EXPENSE, etc.

## AI Prompts

### Document Classification Prompt
When classifying documents, the AI should:
1. Identify document type from visual/text content
2. Extract key metadata (dates, amounts, vendor names)
3. Assign confidence score
4. Flag potential issues (missing pages, poor quality)

### CoA Generation Prompt
When generating Chart of Accounts, the AI should:
1. Consider the business type and industry
2. Include standard accounts for that industry
3. Add accounts suggested by the classified documents
4. Follow standard accounting hierarchy (1xxx Assets, 2xxx Liabilities, etc.)

## Key User Flows

### 1. New Project Creation
1. User clicks "New Client Onboarding"
2. Enters client/business name, selects industry
3. Redirected to upload page

### 2. Document Upload
1. Drag-drop or click to upload files
2. Files uploaded to Supabase Storage
3. Each file queued for AI classification
4. Progress shown in real-time

### 3. Classification Review
1. Documents displayed in grid, grouped by category
2. User can reclassify if AI was wrong
3. Missing documents highlighted (e.g., "No bank statements found for 2022")

### 4. CoA Generation
1. AI generates recommended CoA based on:
   - Selected industry template
   - Detected document patterns (vendors, expense types)
2. User reviews and edits CoA
3. Can add/remove/rename accounts

### 5. Export
1. User selects target platform (QBO, QBD, Xero)
2. System generates appropriate file format
3. User downloads file
4. Instructions shown for importing into target platform

## API Endpoints

### POST /api/upload
Upload files to storage and create Document records

### POST /api/classify
Run AI classification on a document

### POST /api/coa/generate
Generate CoA recommendation for a project

### GET /api/export/qbo/:projectId
Generate and download QBO CSV

### GET /api/export/qbd/:projectId
Generate and download QBD IIF

### GET /api/export/xero/:projectId
Generate and download Xero CSV

## Environment Variables

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Development Guidelines

1. **Error Handling**: Always wrap AI calls in try-catch, provide fallbacks
2. **File Validation**: Validate file types and sizes before upload
3. **Progress Feedback**: Show loading states for all async operations
4. **Mobile Responsive**: Design mobile-first, bookkeepers use phones
5. **Accessibility**: Use proper ARIA labels, keyboard navigation

## Industry CoA Templates

Pre-built templates available for:
- Restaurant/Food Service
- Contractor/Construction
- Professional Services (consultants, lawyers, etc.)
- Retail
- E-commerce
- General/Default

Each template includes industry-specific accounts (e.g., "Food Cost" for restaurants, "Materials" for contractors).

## MVP Limitations (to address post-launch)

- No direct API integration with QBO/Xero (export files only)
- Single user per account (no team features)
- No document OCR (relies on native text extraction)
- No client portal (bookkeeper-only interface)
- 50MB max file size per upload
- 500 documents max per project
```

---

## Part 3: Environment Variables Template

Create `.env.example`:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="generate-a-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-api03-..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

---

## Part 4: Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  projects      Project[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Project {
  id           String     @id @default(cuid())
  name         String
  businessName String
  businessType String?
  industry     String     @default("general")
  status       String     @default("uploading") // uploading, classifying, reviewing, complete
  userId       String
  user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  documents    Document[]
  coa          ChartOfAccounts?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
}

model Document {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fileName    String
  fileUrl     String
  fileType    String
  fileSize    Int
  category    String   @default("other") // bank_statement, receipt, invoice, tax_document, payroll, contract, other
  subcategory String?
  confidence  Float    @default(0)
  year        Int?
  isReviewed  Boolean  @default(false)
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ChartOfAccounts {
  id        String   @id @default(cuid())
  projectId String   @unique
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  accounts  Json     // Array of Account objects
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## Part 5: Claude Code Build Prompts

Use these prompts sequentially in Claude Code to build the MVP:

### Prompt 1: Project Initialization

```
Initialize a new Next.js 14 project with TypeScript in the current directory. Set up:

1. Next.js 14 with App Router
2. TypeScript configuration
3. Tailwind CSS with proper config
4. Prisma with the schema from prisma/schema.prisma
5. Install dependencies:
   - @prisma/client, prisma
   - next-auth, @auth/prisma-adapter
   - @supabase/supabase-js
   - @anthropic-ai/sdk
   - react-dropzone (for file uploads)
   - lucide-react (for icons)
   - zod (for validation)
   - clsx, tailwind-merge (for className utilities)

Create the basic folder structure matching the CLAUDE.md specification.
Set up the Prisma client in src/lib/db.ts.
Create utility functions in src/lib/utils.ts (cn function for classNames).
```

### Prompt 2: Authentication Setup

```
Set up NextAuth.js with email/password authentication:

1. Create the NextAuth configuration in src/lib/auth.ts using CredentialsProvider
2. Create the API route at src/app/api/auth/[...nextauth]/route.ts
3. Create login page at src/app/(auth)/login/page.tsx with:
   - Email and password inputs
   - Form validation
   - Error handling
   - Link to signup
4. Create signup page at src/app/(auth)/signup/page.tsx with:
   - Email, password, confirm password inputs
   - Password hashing with bcrypt
   - Creates user in database
   - Redirects to login after success
5. Create a middleware.ts to protect /dashboard and /projects routes
6. Add a SessionProvider wrapper in the root layout
```

### Prompt 3: Core UI Components

```
Create the shadcn/ui-style base components in src/components/ui/:

1. button.tsx - Button component with variants (default, outline, ghost, destructive) and sizes
2. card.tsx - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
3. input.tsx - Input component with proper styling and error states
4. select.tsx - Select dropdown component
5. table.tsx - Table, TableHeader, TableBody, TableRow, TableHead, TableCell
6. modal.tsx - Modal/Dialog component with overlay
7. toast.tsx - Toast notification component

Use Tailwind CSS, make them accessible with proper ARIA attributes.
Follow the patterns from shadcn/ui but keep them simple for MVP.
```

### Prompt 4: Layout Components

```
Create the application layout components:

1. src/components/layout/header.tsx
   - Logo (text for now)
   - Navigation links (Dashboard, Projects)
   - User menu with logout

2. src/components/layout/sidebar.tsx
   - For dashboard/project pages
   - Links: Overview, Upload Documents, Review, Chart of Accounts, Export
   - Current project name at top
   - Collapsible on mobile

3. src/app/layout.tsx - Root layout with SessionProvider
4. src/app/dashboard/layout.tsx - Dashboard layout with sidebar
5. src/app/page.tsx - Simple landing page with login/signup CTAs
```

### Prompt 5: File Upload System

```
Build the file upload system:

1. src/lib/storage/upload.ts
   - Function to upload file to Supabase Storage
   - Generate unique file names
   - Return public URL

2. src/components/upload/dropzone.tsx
   - Use react-dropzone
   - Accept PDF, images (jpg, png), Excel (xlsx, csv)
   - Show drag-over state
   - Max 50MB per file
   - Multiple file upload

3. src/components/upload/file-list.tsx
   - Show uploaded files with name, size, status
   - Remove file option
   - Upload progress indicator

4. src/app/api/upload/route.ts
   - POST endpoint to handle file uploads
   - Validate file type and size
   - Upload to Supabase Storage
   - Create Document record in database
   - Return document ID and URL

5. src/app/upload/page.tsx
   - Select or create project
   - Dropzone component
   - File list showing upload status
   - "Classify Documents" button when uploads complete
```

### Prompt 6: AI Document Classification

```
Build the AI document classification system:

1. src/lib/ai/prompts.ts
   - DOCUMENT_CLASSIFICATION_PROMPT: Detailed prompt for Claude to classify documents
   - Include all categories with descriptions
   - Request confidence score and metadata extraction

2. src/lib/ai/classifier.ts
   - classifyDocument(fileUrl: string, fileType: string): Promise<ClassificationResult>
   - For images/PDFs: Send to Claude with vision
   - For spreadsheets: Extract text first, then classify
   - Parse response into structured format
   - Handle errors gracefully

3. src/app/api/classify/route.ts
   - POST endpoint accepting documentId
   - Fetch document from database
   - Call classifier
   - Update document with category, confidence, metadata
   - Return updated document

4. src/components/documents/classification-review.tsx
   - Grid of documents grouped by category
   - Each document shows: thumbnail/icon, filename, category badge, confidence
   - Click to view details
   - Dropdown to reclassify if needed
   - "Missing Documents" alert section

5. src/app/projects/[id]/documents/page.tsx
   - Fetch all documents for project
   - Show classification-review component
   - Button to proceed to CoA generation
```

### Prompt 7: Chart of Accounts System

```
Build the Chart of Accounts generation and editing system:

1. src/data/coa-templates/*.json
   Create JSON files for industry templates:
   - general.json (default)
   - restaurant.json
   - contractor.json
   - professional-services.json
   - retail.json
   Each with accounts array: { number, name, type, detailType, description }

2. src/lib/ai/coa-generator.ts
   - generateCoA(industry: string, documents: Document[]): Promise<Account[]>
   - Load base template for industry
   - Send to Claude with document summary to suggest additions
   - Merge template with AI suggestions
   - Return complete CoA

3. src/app/api/coa/generate/route.ts
   - POST endpoint accepting projectId
   - Generate CoA using coa-generator
   - Save to ChartOfAccounts table
   - Return generated CoA

4. src/components/coa/coa-table.tsx
   - Editable table showing all accounts
   - Columns: Number, Name, Type, Detail Type, Actions
   - Inline editing
   - Add new account button
   - Delete account button
   - Reorder accounts

5. src/components/coa/industry-selector.tsx
   - Dropdown to select industry
   - "Regenerate CoA" button

6. src/app/projects/[id]/coa/page.tsx
   - Industry selector at top
   - CoA table
   - Save changes button
   - Proceed to Export button
```

### Prompt 8: Export System

```
Build the export system for QBO, QBD, and Xero:

1. src/lib/export/qbo-csv.ts
   - generateQBOCSV(accounts: Account[]): string
   - Format: Account Name,Type,Detail Type,Description,Account Number
   - Map our types to QBO types (Bank, Accounts Receivable, etc.)

2. src/lib/export/qbd-iif.ts
   - generateQBDIIF(accounts: Account[]): string
   - Format: Tab-delimited with !ACCNT header row
   - Map types to QBD ACCNTTYPE values

3. src/lib/export/xero-csv.ts
   - generateXeroCSV(accounts: Account[]): string
   - Format: *Code,*Name,*Type,Description,Tax Code
   - Map types to Xero account types

4. src/app/api/export/qbo/[projectId]/route.ts
5. src/app/api/export/qbd/[projectId]/route.ts
6. src/app/api/export/xero/[projectId]/route.ts
   - GET endpoints that:
   - Fetch CoA for project
   - Generate appropriate file format
   - Return as downloadable file with correct Content-Type and Content-Disposition

7. src/components/export/export-options.tsx
   - Three cards: QuickBooks Online, QuickBooks Desktop, Xero
   - Each with download button
   - Brief instructions for import

8. src/app/projects/[id]/export/page.tsx
   - Show export-options component
   - Summary of what will be exported
   - "Start New Project" button
```

### Prompt 9: Dashboard and Project Management

```
Build the dashboard and project management:

1. src/app/api/projects/route.ts
   - GET: List all projects for current user
   - POST: Create new project

2. src/app/api/projects/[id]/route.ts
   - GET: Get single project with documents and CoA
   - PATCH: Update project
   - DELETE: Delete project and all related data

3. src/app/dashboard/page.tsx
   - Welcome message with user name
   - Stats: Total projects, Documents processed, Recent activity
   - "New Client Onboarding" button
   - List of recent projects with status badges

4. src/app/projects/page.tsx
   - Full list of all projects
   - Search/filter
   - Status filter (uploading, classifying, reviewing, complete)
   - Create new project button

5. src/app/projects/[id]/page.tsx
   - Project overview
   - Status progress bar
   - Quick links: Upload, Documents, CoA, Export
   - Document count by category
   - Edit project details
```

### Prompt 10: Polish and Integration

```
Final polish and integration:

1. Error handling:
   - Create src/components/ui/error-boundary.tsx
   - Add error.tsx files for each route segment
   - Toast notifications for success/error states

2. Loading states:
   - Add loading.tsx files for each route segment
   - Skeleton loaders for lists and grids

3. Mobile responsiveness:
   - Review all pages on mobile viewport
   - Collapsible sidebar
   - Stack cards vertically on mobile
   - Touch-friendly buttons

4. Empty states:
   - No projects yet
   - No documents uploaded
   - No CoA generated

5. Onboarding flow:
   - New user welcome modal
   - Step-by-step guide overlay
   - Tooltips on key actions

6. Testing the full flow:
   - Create a new project
   - Upload sample documents
   - Run classification
   - Review and adjust categories
   - Generate CoA
   - Export to all three formats
   - Verify exports are valid

7. README.md with:
   - Project description
   - Setup instructions
   - Environment variables
   - Running locally
   - Deployment guide
```

---

## Part 6: Quick Start Commands

After creating the directory structure, run these commands:

```bash
# Navigate to project directory
cd C:\dev\onboardly

# Initialize Next.js (if starting fresh)
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Install additional dependencies
npm install @prisma/client @supabase/supabase-js @anthropic-ai/sdk next-auth react-dropzone lucide-react zod clsx tailwind-merge bcryptjs
npm install -D prisma @types/bcryptjs

# Initialize Prisma
npx prisma init

# After adding schema, generate client
npx prisma generate

# Push schema to database
npx prisma db push

# Run development server
npm run dev
```

---

## Part 7: Supabase Setup

1. Create a new Supabase project at supabase.com
2. Go to Project Settings > Database > Connection string
3. Copy the connection strings to your .env file
4. Go to Storage and create a bucket called "documents"
5. Set bucket to public (or configure RLS policies)
6. Copy your API keys from Project Settings > API

---

## Summary

This setup guide provides:

1. **CLAUDE.md** - Complete context for AI assistants working on the project
2. **Directory Structure** - Full file/folder layout for the MVP
3. **Prisma Schema** - Database models for users, projects, documents, and CoA
4. **10 Sequential Prompts** - For Claude Code to build the entire MVP step by step
5. **Environment Setup** - Variables needed and Supabase configuration

The prompts are designed to be used in order. Each builds on the previous, resulting in a complete working MVP by the end of Prompt 10.

Total estimated build time: 5-7 days for an experienced developer using Claude Code.
