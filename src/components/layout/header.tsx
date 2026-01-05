"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { LogOut, User, ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { data: session } = useSession();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-2">
            <span className="text-xl font-bold text-blue-600">OnboardLy</span>
          </Link>
        </div>

        {session ? (
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Projects
              </Link>
            </nav>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={cn(
                  "flex items-center gap-2 rounded-full p-1.5 pr-3",
                  "text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                )}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <span className="hidden sm:inline-block max-w-[150px] truncate">
                  {session.user?.email}
                </span>
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isUserMenuOpen && "rotate-180"
                )} />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session.user?.email}
                    </p>
                  </div>
                  <div className="md:hidden border-b border-gray-100">
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/projects"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      Projects
                    </Link>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
