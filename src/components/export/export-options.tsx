"use client";

import { DownloadButton, ExportFormat } from "./download-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExportOption {
  format: ExportFormat;
  name: string;
  description: string;
  fileType: string;
  icon: React.ReactNode;
  instructions: string[];
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: "qbo",
    name: "QuickBooks Online",
    description: "CSV file compatible with QuickBooks Online import wizard",
    fileType: "CSV",
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="h-10 w-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#2CA01C" />
        <path
          d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20C32 13.373 26.627 8 20 8ZM20 28C15.589 28 12 24.411 12 20C12 15.589 15.589 12 20 12C24.411 12 28 15.589 28 20C28 24.411 24.411 28 20 28Z"
          fill="white"
        />
        <path
          d="M20 14C16.686 14 14 16.686 14 20C14 23.314 16.686 26 20 26C23.314 26 26 23.314 26 20C26 16.686 23.314 14 20 14ZM20 24C17.791 24 16 22.209 16 20C16 17.791 17.791 16 20 16C22.209 16 24 17.791 24 20C24 22.209 22.209 24 20 24Z"
          fill="white"
        />
      </svg>
    ),
    instructions: [
      "Go to Settings > Import Data",
      "Select 'Chart of Accounts'",
      "Upload the downloaded CSV file",
      "Map columns if needed and import",
    ],
  },
  {
    format: "qbd",
    name: "QuickBooks Desktop",
    description: "IIF file format for QuickBooks Desktop Pro, Premier, or Enterprise",
    fileType: "IIF",
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="h-10 w-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#1B5AA0" />
        <path
          d="M20 8C13.373 8 8 13.373 8 20C8 26.627 13.373 32 20 32C26.627 32 32 26.627 32 20C32 13.373 26.627 8 20 8ZM20 28C15.589 28 12 24.411 12 20C12 15.589 15.589 12 20 12C24.411 12 28 15.589 28 20C28 24.411 24.411 28 20 28Z"
          fill="white"
        />
        <path
          d="M20 14C16.686 14 14 16.686 14 20C14 23.314 16.686 26 20 26C23.314 26 26 23.314 26 20C26 16.686 23.314 14 20 14ZM20 24C17.791 24 16 22.209 16 20C16 17.791 17.791 16 20 16C22.209 16 24 17.791 24 20C24 22.209 22.209 24 20 24Z"
          fill="white"
        />
      </svg>
    ),
    instructions: [
      "Open QuickBooks Desktop",
      "Go to File > Utilities > Import > IIF Files",
      "Select the downloaded .iif file",
      "Review import summary",
    ],
  },
  {
    format: "xero",
    name: "Xero",
    description: "CSV file formatted for Xero's chart of accounts import",
    fileType: "CSV",
    icon: (
      <svg
        viewBox="0 0 40 40"
        className="h-10 w-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="40" height="40" rx="8" fill="#13B5EA" />
        <path
          d="M12 14L16 20L12 26H15.5L18 22.5L20.5 26H24L20 20L24 14H20.5L18 17.5L15.5 14H12Z"
          fill="white"
        />
        <circle cx="27" cy="20" r="3" fill="white" />
      </svg>
    ),
    instructions: [
      "Go to Accounting > Chart of Accounts",
      "Click 'Import' button",
      "Upload the downloaded CSV file",
      "Review and confirm import",
    ],
  },
];

interface ExportOptionsProps {
  projectId: string;
}

export function ExportOptions({ projectId }: ExportOptionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {EXPORT_OPTIONS.map((option) => (
        <Card key={option.format} className="flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">{option.icon}</div>
              <div>
                <CardTitle className="text-lg">{option.name}</CardTitle>
                <CardDescription className="mt-1">
                  {option.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Import Instructions
              </p>
              <ol className="text-sm text-gray-600 space-y-1">
                {option.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-indigo-600 font-medium flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100">
              <DownloadButton
                projectId={projectId}
                format={option.format}
                label={`Download ${option.fileType}`}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
