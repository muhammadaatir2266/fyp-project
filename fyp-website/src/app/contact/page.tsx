"use client";

import { motion, Variants } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from "lucide-react";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function ContactPage() {
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

  const contactInfo = [
    {
      title: "Email Us",
      desc: "Our team is here to help with any health-related questions.",
      value: "support@trimedal.com",
      icon: Mail,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Call Us",
      desc: "Available Mon-Fri from 9am to 6pm for urgent inquiries.",
      value: "+1 (555) 000-0000",
      icon: Phone,
      color: "bg-accent/10 text-accent",
    },
    {
      title: "Visit Us",
      desc: "123 Medical Plaza, Health City, HC 12345",
      value: "View on Maps",
      icon: MapPin,
      color: "bg-primary/10 text-primary",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <main>
        {/* Hero Section */}
        <section className="min-h-[85svh] relative flex items-center justify-center overflow-hidden">
          {/* Hero Background Elements */}
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
                Contact Us
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            >
              How can we <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Help You Today?
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-xl"
            >
              Have questions about our AI health companion? Our team is ready to
              support you and your medical practice.
            </motion.p>
          </motion.div>
        </section>

        {/* Contact Form & Info Section - White Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-12 lg:gap-16 lg:grid-cols-12">
              {/* Contact Information */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-5 space-y-12"
              >
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6">
                    Get in touch
                  </h2>
                  <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                    We're committed to providing you with the best experience.
                    Reach out to us through any of these channels or fill out
                    the form.
                  </p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  {contactInfo.map((item, i) => (
                    <div key={i} className="flex gap-4 sm:gap-6">
                      <div
                        className={`flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl ${item.color}`}
                      >
                        <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-slate-500 mb-1">
                          {item.desc}
                        </p>
                        <p className="text-sm sm:text-base font-semibold text-primary">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl bg-slate-50 p-6 sm:p-8 border border-slate-100">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-slate-900">Response Time</h3>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600">
                    We typically respond to all inquiries within 2 business
                    days. For urgent medical issues, please contact your local
                    emergency services.
                  </p>
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:col-span-7"
              >
                <div className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 lg:p-12 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                    <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                      Send us a message
                    </h3>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">
                          Full Name
                        </label>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-primary focus:outline-none transition-colors"
                          placeholder="John Doe"
                          type="text"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 ml-1">
                          Email Address
                        </label>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-primary focus:outline-none transition-colors"
                          placeholder="john@example.com"
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">
                        Organization (Optional)
                      </label>
                      <input
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-primary focus:outline-none transition-colors"
                        placeholder="Medical Center"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 ml-1">
                        Your Message
                      </label>
                      <textarea
                        className="h-32 sm:h-40 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm sm:text-base text-slate-900 focus:border-primary focus:outline-none transition-colors resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-3 sm:py-4 text-base sm:text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
                    >
                      <Send className="h-5 w-5" />
                      Send Message
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Preview - Subtle Theme Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
              Quick answers to some of our most common questions. Can't find
              what you're looking for? Send us a message!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {[
                {
                  q: "Is my health data secure?",
                  a: "Yes, we use industry-standard encryption and follow strict HIPAA guidelines.",
                },
                {
                  q: "Can I use it for emergencies?",
                  a: "No, Trimed Al is for informational purposes. Always call emergency services for urgent issues.",
                },
                {
                  q: "How accurate are the predictions?",
                  a: "Our models achieve over 98% accuracy on validated clinical datasets.",
                },
                {
                  q: "Do you offer doctor integrations?",
                  a: "Yes, we have specialized tools for medical professionals and practices.",
                },
              ].map((faq, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm"
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

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Experience the future of healthcare"
            description="Start your journey towards better health with our AI assistant."
            primaryBtnText="Try Free Now"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup`}
            secondaryBtnText="View Pricing"
            secondaryBtnLink="/pricing"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
