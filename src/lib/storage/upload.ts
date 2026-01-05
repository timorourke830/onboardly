import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy initialization to ensure env vars are loaded
let supabase: SupabaseClient | null = null;

/**
 * Strip surrounding quotes from a string (handles .env parsing edge cases)
 */
function stripQuotes(value: string): string {
  const trimmed = value.trim();
  // Remove surrounding double or single quotes if present
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function getSupabaseClient(): SupabaseClient {
  if (supabase) return supabase;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Validate environment variables
  if (!rawUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  if (!rawKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  // Strip quotes and whitespace (handles .env parsing edge cases)
  const supabaseUrl = stripQuotes(rawUrl);
  const supabaseServiceKey = stripQuotes(rawKey);

  // Validate key format (JWT should start with "eyJ")
  if (!supabaseServiceKey.startsWith("eyJ")) {
    throw new Error(
      `SUPABASE_SERVICE_ROLE_KEY appears to be invalid. Expected JWT starting with "eyJ", got "${supabaseServiceKey.substring(0, 10)}..."`
    );
  }

  // Use service role key for server-side uploads (bypasses RLS)
  supabase = createClient(supabaseUrl, supabaseServiceKey);
  return supabase;
}

const BUCKET_NAME = "documents";

export interface UploadResult {
  path: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

/**
 * Generate a unique file name with timestamp and random suffix
 */
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split(".").pop() || "";
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");

  return `${timestamp}-${randomSuffix}-${baseName}.${extension}`;
}

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  file: Buffer | Blob,
  originalFileName: string,
  contentType: string,
  projectId: string
): Promise<UploadResult> {
  const uniqueFileName = generateUniqueFileName(originalFileName);
  const filePath = `${projectId}/${uniqueFileName}`;

  const client = getSupabaseClient();

  const { error: uploadError } = await client.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      contentType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }

  const { data: urlData } = client.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  const fileSize = file instanceof Blob ? file.size : file.length;

  return {
    path: filePath,
    publicUrl: urlData.publicUrl,
    fileName: originalFileName,
    fileSize,
    fileType: contentType,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) {
    console.error("Supabase delete error:", error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

/**
 * Validate file type
 */
export function isValidFileType(mimeType: string): boolean {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.ms-excel", // xls
    "text/csv",
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Get file type category for display
 */
export function getFileTypeCategory(mimeType: string): string {
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType === "text/csv") {
    return "spreadsheet";
  }
  return "other";
}

/**
 * Maximum file size in bytes (50MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Validate file size
 */
export function isValidFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}
