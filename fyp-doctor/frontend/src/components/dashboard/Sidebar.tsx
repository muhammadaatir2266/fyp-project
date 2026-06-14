"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  LayoutDashboard,
  Calendar,
  Users,
  Phone,
  Clock,
  User,
  LogOut,
  Settings,
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

const sidebarLinks = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Appointments",
    href: "/appointments",
    icon: Calendar,
  },
  {
    title: "Patients",
    href: "/patients",
    icon: Users,
  },
  {
    title: "Call Logs",
    href: "/calls",
    icon: Phone,
  },
  {
    title: "Availability",
    href: "/availability",
    icon: Clock,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    logoutUser();
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3003";
    window.location.replace(`${websiteUrl}/login`);
  };

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col h-full bg-card border-r border-border",
        className
      )}
    >
      <div className="p-6 border-b border-border/50">
        <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"} className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/25 transition-transform"
          >
            <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
          </motion.div>
          <div className="flex flex-col">
            <h2 className="text-lg font-bold tracking-tight text-foreground leading-none">
              Trimed Al
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Doctor Portal
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-6 px-4">
        <nav className="grid gap-1.5">
          <AnimatePresence>
            {sidebarLinks.map((link, index) => {
              const isActive = pathname === link.href;
              return (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 relative overflow-hidden group",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 10 }}
                      className="relative z-10"
                    >
                      <link.icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </motion.div>
                    <span className="relative z-10">{link.title}</span>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </nav>
      </div>

      <div className="p-4 mt-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
        >
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm">Quick Stats</CardTitle>
              <CardDescription className="text-xs">
                View your performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <Button
                size="sm"
                className="w-full text-xs group relative overflow-hidden"
                variant="outline"
                asChild
              >
                <Link href="/dashboard">
                  <span className="relative z-10">View Dashboard</span>
                  <motion.div
                    className="absolute inset-0 bg-primary/10"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.5 }}
                  />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="border-t border-border/50 pt-4"
        >
          <motion.button
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}
