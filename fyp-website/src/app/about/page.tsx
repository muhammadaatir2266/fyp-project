"use client";

import { motion, Variants } from "framer-motion";
import { Shield, Target, Users, Zap, Heart, Activity } from "lucide-react";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function AboutPage() {
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

  const principles = [
    {
      title: "Privacy First",
      desc: "Your medical data is encrypted and handled with the highest security standards. We prioritize patient confidentiality above all else.",
      icon: Shield,
    },
    {
      title: "Reliability Over Novelty",
      desc: "Our AI models are rigorously tested against clinical datasets to ensure accurate and trustworthy health insights.",
      icon: Target,
    },
    {
      title: "Clinician-Led Design",
      desc: "We build our tools in collaboration with medical professionals to ensure they solve real-world healthcare challenges.",
      icon: Users,
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
              className="absolute left-1/2 top-0 h-[25rem] w-[25rem] sm:h-[38rem] sm:w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[80px] sm:blur-[100px]"
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
                Our Mission
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            >
              Democratizing <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Expert Health Care
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl px-4 sm:px-0"
            >
              We are on a mission to reduce the administrative burden in
              healthcare and empower every individual with instant, AI-driven
              medical insights.
            </motion.p>
          </motion.div>
        </section>

        {/* Vision Section - White Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-10 sm:gap-12 lg:flex-row lg:items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1 space-y-4 sm:space-y-6"
              >
                <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                  Built for a healthier tomorrow
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                  We believe that technology should be a bridge, not a barrier,
                  between patients and quality care. Our platform simplifies
                  complex medical documentation and provides a first line of
                  symptom analysis that is accessible to everyone, anywhere.
                </p>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4">
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-primary">
                      98%
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500">
                      Prediction Accuracy
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl sm:text-3xl font-bold text-accent">
                      24/7
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500">
                      AI Availability
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex-1"
              >
                <div className="relative aspect-square rounded-3xl bg-primary/5 border border-slate-100 p-6 sm:p-8 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--color-primary)_0%,transparent_60%)] opacity-10" />
                  <div className="relative h-full w-full flex items-center justify-center">
                    <Activity className="h-20 w-20 sm:h-32 sm:w-32 text-primary/20 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-40 w-40 sm:h-64 sm:w-64 rounded-full border border-primary/10 animate-[spin_10s_linear_infinite]" />
                      <div className="h-32 w-32 sm:h-48 sm:w-48 rounded-full border border-accent/10 animate-[spin_15s_linear_infinite_reverse]" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Principles Section - Subtle Theme Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 sm:mb-16 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
                Our Core Principles
              </h2>
              <p className="mt-4 text-base sm:text-lg text-slate-600">
                The values that drive every decision we make.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {principles.map((principle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 sm:mb-6 inline-flex h-10 sm:h-12 w-10 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <principle.icon className="h-5 sm:h-6 w-5 sm:w-6" />
                  </div>
                  <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl font-bold text-slate-900">
                    {principle.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {principle.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Ready to experience the future of health?"
            description="Join our community of patients and doctors today."
            primaryBtnText="Start Health Chat"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup`}
            secondaryBtnText="Join as a Doctor"
            secondaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup/doctor`}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
