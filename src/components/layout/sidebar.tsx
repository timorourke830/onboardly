"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  FileSpreadsheet,
  Download,
  FolderOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  projectName?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function Sidebar({ isOpen, onClose, projectName }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams();
  const projectId = params?.id as string | undefined;

  const dashboardNavItems: NavItem[] = [
    {
      label: "Overview",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "All Projects",
      href: "/projects",
      icon: <FolderOpen className="h-5 w-5" />,
    },
  ];

  const projectNavItems: NavItem[] = projectId
    ? [
        {
          label: "Overview",
          href: `/projects/${projectId}`,
          icon: <LayoutDashboard className="h-5 w-5" />,
        },
        {
          label: "Upload Documents",
          href: `/projects/${projectId}/upload`,
          icon: <Upload className="h-5 w-5" />,
        },
        {
          label: "Review Documents",
          href: `/projects/${projectId}/documents`,
          icon: <FileSearch className="h-5 w-5" />,
        },
        {
          label: "Chart of Accounts",
          href: `/projects/${projectId}/coa`,
          icon: <FileSpreadsheet className="h-5 w-5" />,
        },
        {
          label: "Export",
          href: `/projects/${projectId}/export`,
          icon: <Download className="h-5 w-5" />,
        },
      ]
    : [];

  const navItems = projectId ? projectNavItems : dashboardNavItems;

  const isActive = (href: string) => {
    if (href === "/dashboard" || href === `/projects/${projectId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r border-gray-200 bg-white",
          "transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 lg:hidden">
            <span className="font-semibold text-gray-900">Menu</span>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Project name */}
          {projectName && (
            <div className="border-b border-gray-200 px-4 py-3">
              <p className="text-xs font-medium uppercase text-gray-500">
                Current Project
              </p>
              <p className="mt-1 font-semibold text-gray-900 truncate">
                {projectName}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Back to dashboard link when in project */}
            {projectId && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Back to Dashboard
                </Link>
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
}
