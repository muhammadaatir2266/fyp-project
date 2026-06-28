import Link from "next/link";
import { ReactNode } from "react";
import Footer from "@/components/Footer";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  intro?: string;
  children: ReactNode;
}

export default function LegalLayout({
  title,
  lastUpdated,
  intro,
  children,
}: LegalLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <main>
        {/* Hero */}
        <section className="relative flex items-center justify-center overflow-hidden pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            <div className="absolute left-1/2 top-0 h-[20rem] w-[20rem] sm:h-[30rem] sm:w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px] sm:blur-[100px]" />
          </div>

          <div className="mx-auto max-w-3xl px-6 text-center">
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Legal
            </span>
            <h1 className="mt-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </p>
            {intro && (
              <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
                {intro}
              </p>
            )}
          </div>
        </section>

        {/* Content */}
        <section className="bg-white px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl space-y-10 text-slate-600">
            {children}

            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-6">
              <p className="text-sm text-slate-500">
                Questions about this document? Contact us at{" "}
                <a
                  href="mailto:support@doclink.dev"
                  className="font-medium text-primary hover:underline"
                >
                  support@doclink.dev
                </a>{" "}
                or visit our{" "}
                <Link
                  href="/contact"
                  className="font-medium text-primary hover:underline"
                >
                  contact page
                </Link>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

/** Section heading + body wrapper for legal pages. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{heading}</h2>
      <div className="space-y-3 leading-relaxed">{children}</div>
    </div>
  );
}
