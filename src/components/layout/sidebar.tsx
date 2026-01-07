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
  ChevronLeft,
  Zap,
  ClipboardList,
  DollarSign,
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
      label: "Dashboard",
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
          label: "Upload",
          href: `/projects/${projectId}/upload`,
          icon: <Upload className="h-5 w-5" />,
        },
        {
          label: "Documents",
          href: `/projects/${projectId}/documents`,
          icon: <FileSearch className="h-5 w-5" />,
        },
        {
          label: "Transactions",
          href: `/projects/${projectId}/transactions`,
          icon: <DollarSign className="h-5 w-5" />,
        },
        {
          label: "Export",
          href: `/projects/${projectId}/export`,
          icon: <Download className="h-5 w-5" />,
        },
        {
          label: "Report & CoA",
          href: `/projects/${projectId}/report`,
          icon: <ClipboardList className="h-5 w-5" />,
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-slate-900",
          "transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">
                OnboardLy
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Project name badge */}
          {projectName && (
            <div className="mx-4 mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Current Project
              </p>
              <p className="mt-1 text-sm font-medium text-white truncate">
                {projectName}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Main section label */}
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {projectId ? "Workflow" : "Menu"}
            </p>

            <ul className="space-y-1">
              {navItems.map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive(item.href)
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-600/20"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                    aria-current={isActive(item.href) ? "page" : undefined}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0",
                        isActive(item.href) ? "text-white" : "text-slate-500"
                      )}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {/* Step indicator for project workflow */}
                    {projectId && (
                      <span
                        className={cn(
                          "ml-auto flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold",
                          isActive(item.href)
                            ? "bg-white/20 text-white"
                            : "bg-slate-800 text-slate-500"
                        )}
                      >
                        {index + 1}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Back to dashboard link when in project */}
            {projectId && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
                >
                  <ChevronLeft className="h-5 w-5 text-slate-500" />
                  <span>All Projects</span>
                </Link>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              <span className="text-xs text-slate-500">AI Ready</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
