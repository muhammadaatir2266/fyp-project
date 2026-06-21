"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  AnimatePresence,
} from "framer-motion";
import { useState } from "react";
import { Activity, Menu, X, ArrowRight } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "FAQ", href: "/faq" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed left-1/2 z-50 w-full -translate-x-1/2 transition-all duration-500 ease-in-out ${
        scrolled
          ? "top-6 max-w-[90%] md:max-w-5xl lg:max-w-6xl"
          : "top-0 max-w-full"
      }`}
    >
      <div
        className={`mx-auto flex items-center justify-between px-6 transition-all duration-500 ${
          scrolled
            ? "rounded-full border border-white/10 bg-white/[0.05] py-2.5 shadow-lg backdrop-blur-xl"
            : "bg-transparent py-6"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground transition-all"
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg transition-transform group-hover:scale-110">
            <img src="/logo.png" alt="DocLink" className="h-full w-full object-cover" />
          </div>
          <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            DocLink
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <div className="mr-4 flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="group relative px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {link.name}
                <span className="absolute bottom-1 left-1/2 h-0.5 w-0 -translate-x-1/2 bg-primary transition-all duration-300 group-hover:w-1/2" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 border-l border-border/40 pl-6">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                href="/signup"
                className="group flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-primary/30"
              >
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-foreground md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute left-0 right-0 top-full mt-4 mx-6 rounded-3xl border border-border/40 bg-card/90 p-8 shadow-2xl backdrop-blur-2xl md:hidden"
            >
              <nav className="flex flex-col space-y-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-xl font-semibold text-foreground transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="h-px w-full bg-border/40" />
                <div className="flex flex-col gap-4">
                  <Link
                    href="/login"
                    className="flex items-center justify-center rounded-2xl border border-border py-4 font-bold text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
