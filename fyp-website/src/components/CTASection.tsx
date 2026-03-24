"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTAProps {
  title?: string;
  description?: string;
  primaryBtnText?: string;
  primaryBtnLink?: string;
  secondaryBtnText?: string;
  secondaryBtnLink?: string;
  className?: string;
}

export default function CTASection({
  title = "Ready to transform your practice?",
  description = "Join thousands of clinicians who are saving time and improving care with Trimed Al.",
  primaryBtnText = "Start Free Trial",
  primaryBtnLink,
  secondaryBtnText = "Contact Sales",
  secondaryBtnLink = "/contact",
  className = "",
}: CTAProps) {
  const finalPrimaryLink = primaryBtnLink || "/signup";
  return (
    <section className={`px-6 py-24 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center shadow-2xl sm:px-16"
      >
        {/* Abstract Background Shapes */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 h-64 w-64 translate-y-1/2 rounded-full bg-accent/20 blur-3xl"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-primary-foreground backdrop-blur-sm ring-1 ring-white/20">
            <Sparkles className="h-6 w-6" />
          </div>

          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            {title}
          </h2>
          <p className="mt-4 max-w-xl text-lg text-primary-foreground/90">
            {description}
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={finalPrimaryLink}
              className="group flex items-center justify-center gap-2 rounded-full bg-background px-8 py-3 font-semibold text-primary transition-all hover:bg-background/90 hover:scale-105 active:scale-95"
            >
              {primaryBtnText}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            {secondaryBtnText && (
              <Link
                href={secondaryBtnLink}
                className="rounded-full border border-primary-foreground/30 bg-primary-foreground/10 px-8 py-3 font-medium text-primary-foreground backdrop-blur-sm transition-colors hover:bg-primary-foreground/20"
              >
                {secondaryBtnText}
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
