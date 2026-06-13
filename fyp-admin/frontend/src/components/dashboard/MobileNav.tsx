"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";

interface MobileNavProps {
  adminName?: string;
  adminEmail?: string;
}

export function MobileNav({ adminName, adminEmail }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.div
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-end p-3 border-b border-border bg-card">
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <Sidebar
                    adminName={adminName}
                    adminEmail={adminEmail}
                    onLinkClick={() => setOpen(false)}
                    className="h-full"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
