"use client";

import { motion, Variants, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  MessageCircle,
  Brain,
  MapPin,
  Search,
  Calendar,
  Activity,
  Stethoscope,
  FileText,
  Database,
  Shield,
  Smartphone,
  Zap,
  CheckCircle2,
  Users,
  ArrowRight,
} from "lucide-react";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function FeaturesPage() {
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");

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

  const patientFeatures = [
    {
      title: "AI Symptom Checker",
      desc: "Describe your symptoms in plain English and our advanced AI will analyze them in real-time.",
      details: [
        "Natural language understanding",
        "Instant health insights",
        "ML-driven accuracy",
      ],
      icon: MessageCircle,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-8 flex flex-col gap-4">
          <div className="self-start rounded-2xl bg-white p-4 shadow-sm border border-slate-100 max-w-[80%]">
            <p className="text-sm font-medium text-slate-700">
              I have a persistent headache and feel dizzy...
            </p>
          </div>
          <div className="self-end rounded-2xl bg-primary p-4 text-primary-foreground shadow-md max-w-[80%]">
            <p className="text-sm">
              I understand. Based on your symptoms, it could be tension-related.
              Would you like to check for other indicators?
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Disease Prediction",
      desc: "Our machine learning models process your symptoms to predict potential conditions with high confidence.",
      details: [
        "Trained on millions of clinical cases",
        "Risk factor assessment",
        "Early warning indicators",
      ],
      icon: Brain,
      visual: (
        <div className="relative flex h-full w-full items-center justify-center bg-primary/5 p-8 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,var(--color-primary)_0%,transparent_70%)]" />
          <div className="relative flex flex-col items-center gap-6">
            <div className="flex gap-2">
              {[0.8, 0.4, 0.9, 0.6].map((v, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [40, 80 * v, 40] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-3 rounded-full bg-primary"
                />
              ))}
            </div>
            <div className="rounded-xl bg-white px-4 py-2 shadow-sm border border-slate-100">
              <span className="text-xs font-bold text-primary">
                98.2% Confidence
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Hospital Finder",
      desc: "Locate the nearest specialized healthcare facilities based on your predicted condition.",
      details: [
        "Real-time availability",
        "Specialization matching",
        "Integrated navigation",
      ],
      icon: MapPin,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-8 flex items-center justify-center">
          <div className="relative h-48 w-48 rounded-full border-4 border-dashed border-primary/20 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="h-32 w-32 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center"
            >
              <MapPin className="h-12 w-12 text-primary" />
            </motion.div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0"
            >
              <div className="absolute -top-2 left-1/2 h-4 w-4 -translate-x-1/2 rounded-full bg-accent shadow-lg" />
            </motion.div>
          </div>
        </div>
      ),
    },
  ];

  const doctorFeatures = [
    {
      title: "Clinical Note Drafting",
      desc: "Automatically generate comprehensive SOAP notes and clinical summaries from patient encounters.",
      details: [
        "AI-powered transcription",
        "Structured SOAP format",
        "Customizable templates",
      ],
      icon: FileText,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-8">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 space-y-3">
            <div className="h-2 w-1/3 rounded-full bg-slate-100" />
            <div className="space-y-2">
              <div className="h-2 w-full rounded-full bg-primary/10" />
              <div className="h-2 w-[90%] rounded-full bg-primary/10" />
              <div className="h-2 w-[95%] rounded-full bg-primary/10" />
            </div>
            <div className="flex justify-end pt-2">
              <div className="h-8 w-24 rounded-lg bg-primary/20 animate-pulse" />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Patient Risk Stratification",
      desc: "Identify high-risk patients using predictive analytics to enable proactive care management.",
      details: [
        "Population health insights",
        "Early intervention alerts",
        "Comorbidity analysis",
      ],
      icon: Activity,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-8 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 w-20 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center"
              >
                <div
                  className={`h-3 w-3 rounded-full ${i === 1 ? "bg-red-500 animate-ping" : "bg-green-500"}`}
                />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Interoperability Engine",
      desc: "Seamlessly sync data with existing EHR systems through secure HL7 and FHIR integrations.",
      details: [
        "EHR-agnostic syncing",
        "HIPAA compliant transit",
        "Bi-directional data flow",
      ],
      icon: Database,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-8 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              <Database className="h-8 w-8 text-primary" />
            </div>
            <motion.div
              animate={{ x: [0, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ArrowRight className="h-6 w-6 text-slate-300" />
            </motion.div>
            <div className="h-16 w-16 rounded-2xl bg-primary shadow-lg flex items-center justify-center">
              <Smartphone className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const activeFeatures =
    activeTab === "patient" ? patientFeatures : doctorFeatures;

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
                Our Capabilities
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            >
              Advanced <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Health Solutions
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-xl"
            >
              Explore our suite of AI-powered features designed to empower
              patients and streamline clinical excellence for medical
              professionals.
            </motion.p>

            {/* Tab Switcher */}
            <motion.div
              variants={fadeUp}
              className="mt-10 sm:mt-12 flex justify-center"
            >
              <div className="relative flex p-1 bg-slate-100 rounded-2xl w-full max-w-[280px] sm:max-w-sm">
                <motion.div
                  className="absolute inset-y-1 bg-white rounded-xl shadow-sm z-0"
                  initial={false}
                  animate={{
                    left: activeTab === "patient" ? "4px" : "50%",
                    width: "calc(50% - 4px)",
                  }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
                <button
                  onClick={() => setActiveTab("patient")}
                  className={`relative flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors z-10 ${
                    activeTab === "patient" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  For Patients
                </button>
                <button
                  onClick={() => setActiveTab("doctor")}
                  className={`relative flex-1 py-2.5 sm:py-3 text-xs sm:text-sm font-bold transition-colors z-10 ${
                    activeTab === "doctor" ? "text-primary" : "text-slate-500"
                  }`}
                >
                  For Doctors
                </button>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Content Section */}
        <section className="px-6 py-16 sm:py-24 bg-white relative">
          <div className="mx-auto max-w-6xl space-y-16 sm:space-y-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-20 sm:space-y-32"
              >
                {activeFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className={`flex flex-col gap-10 lg:gap-20 items-stretch ${
                      index % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                    }`}
                  >
                    {/* Text Content */}
                    <div className="flex-1 flex flex-col justify-center space-y-6 sm:space-y-8 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 lg:p-12 shadow-sm">
                      <div className="space-y-4">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                          {feature.title}
                        </h2>
                        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                          {feature.desc}
                        </p>
                      </div>

                      <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-200/50">
                        {feature.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-center gap-3">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <CheckCircle2 className="h-3 w-3" />
                            </div>
                            <span className="text-sm sm:text-base text-slate-700 font-medium">
                              {detail}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <motion.button
                          whileHover={{ x: 5 }}
                          className="flex items-center gap-2 text-sm sm:text-base text-primary font-bold group"
                        >
                          Learn more
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Visual Container */}
                    <div className="flex-1">
                      <div className="relative h-full min-h-[300px] sm:min-h-[400px] overflow-hidden rounded-3xl border border-slate-100 bg-primary/5 shadow-lg">
                        {feature.visual}
                        {/* Decorative background elements */}
                        <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10">
                          <feature.icon className="h-20 w-20 sm:h-32 sm:w-32" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Comparison Section - Subtle Theme Background */}
        <section className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">
              Why choose Trimed Al?
            </h2>
            <p className="text-base sm:text-lg text-slate-600 mb-8 sm:mb-12 max-w-2xl mx-auto">
              We combine cutting-edge AI with medical expertise to deliver the
              best health companion experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  title: "HIPAA Compliant",
                  desc: "Your data is protected by the highest medical security standards.",
                  icon: Shield,
                },
                {
                  title: "High Accuracy",
                  desc: "98%+ precision in symptom analysis and clinical summaries.",
                  icon: Zap,
                },
                {
                  title: "Universal Access",
                  desc: "Available on web, mobile, and integrated directly into EHRs.",
                  icon: Smartphone,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-3xl border border-slate-100 bg-white p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mx-auto flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 sm:mb-6">
                    <item.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2 sm:mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Ready to experience these features?"
            description="Join our growing community of patients and healthcare providers today."
            primaryBtnText="Get Started Free"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_APP_URL}/signup`}
            secondaryBtnText="Book a Demo"
            secondaryBtnLink="/contact"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
