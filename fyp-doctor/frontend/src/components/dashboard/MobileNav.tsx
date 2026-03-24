"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg overflow-hidden">
            <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
          </div>
          <span className="font-bold">Trimed Al</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="flex justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar />
        </div>
      )}
    </>
  );
}
