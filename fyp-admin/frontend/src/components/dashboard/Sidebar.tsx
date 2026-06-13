"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Key,
  FileText,
  Settings,
  LogOut,
  Book,
  Brain,
} from "lucide-react";
import { removeAuthToken } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/doctors", label: "Doctors", icon: Users },
  { href: "/appointments", label: "Appointments", icon: Calendar },
  { href: "/api-access", label: "API Access", icon: Key },
  { href: "/api-logs", label: "API Logs", icon: FileText },
  { href: "/api-docs", label: "Doctor API Docs", icon: Book },
  { href: "/ml-api-docs", label: "ML API Docs", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
  adminName?: string;
  adminEmail?: string;
  onLinkClick?: () => void;
}

export function Sidebar({
  className,
  adminName = "Admin User",
  adminEmail = "admin@example.com",
  onLinkClick,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    removeAuthToken();
    router.push("/login");
  };

  const getInitials = () => {
    const parts = adminName.trim().split(" ");
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : adminName.charAt(0).toUpperCase();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        className,
      )}
    >
      {/* Logo */}
      <div className="p-6 border-b border-border/50">
        <Link
          href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"}
          className="flex items-center gap-2 group"
          onClick={onLinkClick}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Trimed Al
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid gap-1.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                pathname === item.href
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* User section + logout */}
      <div className="p-4 mt-auto space-y-3 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-primary/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{adminName}</p>
            <p className="text-xs text-muted-foreground truncate">{adminEmail}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
