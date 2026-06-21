"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Shield,
  Zap,
  MessageCircle,
  Users,
  Clock,
  HelpCircle,
} from "lucide-react";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");

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

  const faqCategories = [
    {
      name: "General",
      icon: HelpCircle,
      faqs: [
        {
          q: "What is DocLink?",
          a: "DocLink is an advanced AI health companion designed to help patients understand their symptoms and provide medical professionals with powerful diagnostic and administrative tools. It uses state-of-the-art machine learning models to analyze health data and provide actionable insights.",
        },
        {
          q: "Is DocLink a replacement for a doctor?",
          a: "No. DocLink is designed to be a supportive tool for both patients and doctors. It provides information and analysis to help you make more informed decisions, but it should never replace professional medical advice, diagnosis, or treatment.",
        },
        {
          q: "Can I use DocLink in an emergency?",
          a: "No. If you are experiencing a medical emergency, please call your local emergency services (like 911) immediately. DocLink is for informational purposes and non-urgent health guidance.",
        },
      ],
    },
    {
      name: "Security & Privacy",
      icon: Shield,
      faqs: [
        {
          q: "Is my health data secure?",
          a: "Absolutely. We take security extremely seriously. All data is encrypted both in transit and at rest using industry-standard AES-256 encryption. We are fully HIPAA compliant and follow strict security protocols to ensure your information remains private.",
        },
        {
          q: "Who can see my data?",
          a: "Only you and the medical professionals you explicitly grant access to can see your health data. We never sell your personal information to third parties or advertisers.",
        },
      ],
    },
    {
      name: "For Professionals",
      icon: Zap,
      faqs: [
        {
          q: "How does it integrate with EHRs?",
          a: "We provide seamless integration with most major Electronic Health Record (EHR) systems through our robust API. This allows for automated note drafting, patient data syncing, and streamlined clinical workflows.",
        },
        {
          q: "What clinical datasets was the AI trained on?",
          a: "Our AI models have been trained on millions of anonymized, validated clinical cases and medical research papers to ensure high accuracy in symptom analysis and disease prediction.",
        },
      ],
    },
  ];

  const filteredFaqs = faqCategories
    .map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.a.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.faqs.length > 0);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <main>
        {/* Hero Section */}
        <section className="min-h-[85svh] relative flex items-center justify-center overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute left-1/2 top-0 h-[25rem] w-[25rem] sm:h-[38rem] sm:w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"
            />
          </div>

          <motion.div
            initial="hidden"
            animate="show"
            variants={container}
            className="mx-auto max-w-6xl text-center"
          >
            <motion.div variants={fadeUp} className="mb-6 flex justify-center">
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                Help Center
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            >
              Common <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Questions
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-xl"
            >
              Find quick answers to your questions about DocLink, security,
              and how we can help you.
            </motion.p>

            {/* Search Bar UI */}
            <motion.div
              variants={fadeUp}
              className="mx-auto mt-8 sm:mt-10 max-w-2xl relative"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for answers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 sm:py-4 text-sm sm:text-base text-slate-900 shadow-xl shadow-slate-200/50 focus:border-primary focus:outline-none transition-all"
                />
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* FAQ Content Section */}
        <section className="px-6 py-16 sm:py-24 bg-white relative">
          <div className="mx-auto max-w-4xl">
            {filteredFaqs.length > 0 ? (
              <div className="space-y-12 sm:space-y-16">
                {filteredFaqs.map((category, catIndex) => (
                  <div key={catIndex} className="space-y-6">
                    <div className="flex items-center gap-3 mb-6 sm:mb-8">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <category.icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                        {category.name}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {category.faqs.map((faq, faqIndex) => {
                        const globalIndex = catIndex * 10 + faqIndex;
                        const isOpen = openIndex === globalIndex;
                        return (
                          <motion.div
                            key={faqIndex}
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: faqIndex * 0.05 }}
                            className={`rounded-2xl sm:rounded-3xl border transition-all duration-300 ${
                              isOpen
                                ? "border-primary/20 bg-primary/5 shadow-sm"
                                : "border-slate-100 bg-white hover:border-slate-200"
                            }`}
                          >
                            <button
                              onClick={() =>
                                setOpenIndex(isOpen ? null : globalIndex)
                              }
                              className="flex w-full items-center justify-between p-5 sm:p-6 text-left focus:outline-none"
                            >
                              <span
                                className={`text-base sm:text-lg font-bold transition-colors ${
                                  isOpen ? "text-primary" : "text-slate-900"
                                }`}
                              >
                                {faq.q}
                              </span>
                              <div
                                className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                                  isOpen
                                    ? "bg-primary text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {isOpen ? (
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                ) : (
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                )}
                              </div>
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeInOut",
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-primary/10 pt-4 mt-2">
                                    {faq.a}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 sm:py-20">
                <div className="flex justify-center mb-6">
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-50">
                    <Search className="h-6 w-6 sm:h-8 sm:w-8 text-slate-300" />
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  No results found
                </h3>
                <p className="text-sm sm:text-base text-slate-500 mt-2">
                  Try adjusting your search terms or browse our categories.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Support Section - Subtle Theme Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl">
            <div className="rounded-[2rem] sm:rounded-[3rem] bg-white border border-slate-100 p-8 lg:p-16 shadow-xl shadow-slate-200/50 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              <div className="flex-1 space-y-4 sm:space-y-6 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  Still have questions?
                </h2>
                <p className="text-base sm:text-lg text-slate-600">
                  Can't find the answer you're looking for? Our support team is
                  available 24/7 to help you with any issues or inquiries.
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-4 pt-2">
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-slate-50 text-xs sm:text-sm font-medium text-slate-600 border border-slate-100">
                    <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    <span>Live Chat</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-2xl bg-slate-50 text-xs sm:text-sm font-medium text-slate-600 border border-slate-100">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    <span>Community Forum</span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 w-full lg:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full lg:w-auto rounded-2xl bg-primary px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                  onClick={() => (window.location.href = "/contact")}
                >
                  Contact Support
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Ready to transform your healthcare?"
            description="Join thousands of users who trust DocLink for their health journey."
            primaryBtnText="Get Started Free"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup`}
            secondaryBtnText="Learn More"
            secondaryBtnLink="/about"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
