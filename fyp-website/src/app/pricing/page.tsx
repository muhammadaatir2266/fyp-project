"use client";

import { motion, Variants } from "framer-motion";
import { useState } from "react";
import {
  CheckCircle2,
  Zap,
  Shield,
  Users,
  ArrowRight,
  Star,
  Activity,
  MessageCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const plans = [
    {
      name: "Starter",
      description: "For individual clinicians and small practices.",
      monthlyPrice: 19,
      yearlyPrice: 15,
      features: [
        "AI Visit Summaries",
        "Clinical Note Drafting",
        "Basic Data Extraction",
        "Standard Templates",
        "Email Support",
        "HIPAA Compliant Data",
      ],
      icon: MessageCircle,
      color: "text-slate-900",
      buttonText: "Get Started",
      buttonLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
      highlight: false,
    },
    {
      name: "Pro",
      description: "For growing practices and medical teams.",
      monthlyPrice: 49,
      yearlyPrice: 39,
      features: [
        "Everything in Starter",
        "Advanced AI Templates",
        "Bi-directional EHR Sync",
        "Team Collaboration",
        "Priority 24/7 Support",
        "Advanced Analytics",
      ],
      icon: Zap,
      color: "text-primary",
      buttonText: "Get Pro Now",
      buttonLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup`,
      highlight: true,
    },
    {
      name: "Enterprise",
      description: "For large organizations and health systems.",
      monthlyPrice: "Custom",
      yearlyPrice: "Custom",
      features: [
        "Everything in Pro",
        "SOC2-Ready Controls",
        "Custom EHR Integrations",
        "SSO & Audit Logs",
        "Dedicated Account Manager",
        "SLA Guarantees",
      ],
      icon: Shield,
      color: "text-accent",
      buttonText: "Contact Sales",
      buttonLink: "/contact",
      highlight: false,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <main>
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-16 sm:pt-40 sm:pb-24 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute left-1/2 top-0 h-[25rem] w-[25rem] sm:h-[38rem] sm:w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px] sm:blur-[100px]"
            />
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="mx-auto max-w-6xl text-center"
          >
            <motion.div
              variants={fadeUp}
              className="mb-4 sm:mb-6 flex justify-center"
            >
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Pricing Plans
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-7xl"
            >
              Simple, Transparent <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Healthcare Pricing
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-4 sm:mt-6 max-w-2xl text-base text-muted-foreground sm:text-xl"
            >
              Choose the perfect plan to streamline your clinical workflow and
              improve patient outcomes with our AI-powered assistant.
            </motion.p>

            {/* Billing Switcher */}
            <motion.div
              variants={fadeUp}
              className="mt-8 sm:mt-12 flex justify-center items-center gap-4"
            >
              <span
                className={`text-sm font-bold ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}
              >
                Monthly
              </span>
              <button
                onClick={() =>
                  setBillingCycle(
                    billingCycle === "monthly" ? "yearly" : "monthly",
                  )
                }
                className="relative w-14 h-7 bg-slate-200 rounded-full p-1 transition-colors"
              >
                <motion.div
                  className="w-5 h-5 bg-white rounded-full shadow-sm"
                  animate={{ x: billingCycle === "monthly" ? 0 : 28 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              </button>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold ${billingCycle === "yearly" ? "text-slate-900" : "text-slate-400"}`}
                >
                  Yearly
                </span>
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Save 20%
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Pricing Cards Section */}
        <section className="px-6 py-12 sm:py-20 bg-white relative">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative flex flex-col p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border ${
                    plan.highlight
                      ? "border-primary bg-primary/[0.02] shadow-2xl shadow-primary/10 ring-1 ring-primary/20"
                      : "border-slate-100 bg-white shadow-sm"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-[10px] sm:text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      MOST POPULAR
                    </div>
                  )}

                  <div className="mb-6 sm:mb-8">
                    <div
                      className={`mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl ${
                        plan.highlight
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      <plan.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    <p className="text-sm sm:text-base text-slate-500 mt-2 min-h-0 sm:min-h-[48px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-bold text-slate-900">
                        {typeof plan.monthlyPrice === "number"
                          ? `$${billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}`
                          : plan.monthlyPrice}
                      </span>
                      {typeof plan.monthlyPrice === "number" && (
                        <span className="text-sm sm:text-base text-slate-500 font-medium">
                          /month
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" &&
                      typeof plan.monthlyPrice === "number" && (
                        <p className="text-[10px] sm:text-xs text-green-600 font-bold mt-1">
                          Billed annually
                        </p>
                      )}
                  </div>

                  <div className="flex-1 space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Features Included:
                    </p>
                    {plan.features.map((feature, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        <CheckCircle2
                          className={`h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 ${plan.highlight ? "text-primary" : "text-slate-400"}`}
                        />
                        <span className="text-sm text-slate-600 font-medium leading-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={plan.buttonLink}
                    className={`flex items-center justify-center gap-2 w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all ${
                      plan.highlight
                        ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                  >
                    {plan.buttonText}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Preview - Subtle Theme Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Everything you need to know about our plans and billing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
              {[
                {
                  q: "Can I change plans later?",
                  a: "Yes, you can upgrade or downgrade your plan at any time from your dashboard.",
                },
                {
                  q: "Do you offer a free trial?",
                  a: "We offer a 14-day free trial for our Pro plan so you can experience the full capabilities.",
                },
                {
                  q: "What happens after my trial ends?",
                  a: "You'll be automatically moved to the Starter plan unless you choose to subscribe to Pro.",
                },
                {
                  q: "Is there a discount for non-profits?",
                  a: "Yes, we offer special pricing for registered non-profit medical organizations.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm"
                >
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
                    {faq.q}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="px-6 py-16 sm:py-24 bg-white">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-slate-400 uppercase tracking-widest mb-10 sm:mb-12">
              Trusted by Leading Institutions
            </h2>
            <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 lg:gap-20 opacity-50 grayscale">
              {/* Replace with actual logos in production */}
              <div className="text-xl sm:text-2xl font-black italic">
                CLINIC_A
              </div>
              <div className="text-xl sm:text-2xl font-black italic">
                HEALTH_PLUS
              </div>
              <div className="text-xl sm:text-2xl font-black italic">
                MED_CENTER
              </div>
              <div className="text-xl sm:text-2xl font-black italic">
                UNI_HOSPITAL
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Start your clinical transformation"
            description="Join over 5,000+ clinicians using DocLink to provide better care."
            primaryBtnText="Start Free Trial"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup`}
            secondaryBtnText="Schedule Demo"
            secondaryBtnLink="/contact"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
