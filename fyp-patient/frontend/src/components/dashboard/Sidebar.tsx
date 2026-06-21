"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  User,
  LogOut,
  Settings,
  MessageSquare,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { logoutUser } from "@/lib/auth";
import { useChatWidget } from "@/components/chat/ChatWidgetContext";

const sidebarLinks = [
  {
    title: "Overview",
    href: "/patient/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Find Doctors",
    href: "/patient/doctors",
    icon: Stethoscope,
  },
  {
    title: "Appointments",
    href: "/patient/appointments",
    icon: Calendar,
  },
  {
    title: "Symptom Log",
    href: "/patient/symptoms",
    icon: FileText,
  },
  {
    title: "Profile",
    href: "/patient/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/patient/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { openChat } = useChatWidget();

  const handleLogout = () => {
    logoutUser();
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";
    window.location.replace(`${websiteUrl}/login`);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        className,
      )}
    >
      <div className="p-6 border-b border-border/50">
        <Link
          href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"}
          className="flex items-center gap-2 group"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="DocLink" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
              DocLink
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Patient Portal
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid gap-1.5">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                pathname === link.href
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <link.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              />
              {link.title}
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 mt-auto space-y-4">
        <Card className="bg-linear-to-br from-primary/5 to-accent/5 border-primary/10 shadow-sm">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm">Need Help?</CardTitle>
            <CardDescription className="text-xs">
              Talk to our AI assistant for instant support.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Button
              size="sm"
              className="w-full text-xs gap-1.5"
              variant="outline"
              onClick={openChat}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Start Chat
            </Button>
          </CardContent>
        </Card>

        <div className="border-t border-border/50 pt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
