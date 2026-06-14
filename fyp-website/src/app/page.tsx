"use client";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { useGuestChatWidget } from "@/components/chat/GuestChatWidgetContext";
import {
  Activity,
  FileText,
  Database,
  Shield,
  Smartphone,
  Zap,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Users,
  MessageCircle,
  Brain,
  MapPin,
  Search,
  Calendar,
  ChevronRight,
  Star,
  Quote,
} from "lucide-react";

import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"patient" | "doctor">("patient");
  const [activeTestimonialTab, setActiveTestimonialTab] = useState<
    "patient" | "doctor"
  >("patient");
  const { openChat } = useGuestChatWidget();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
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
        <div className="relative h-full w-full bg-primary/5 p-8">
          <div className="flex flex-col gap-4">
            <div className="self-start rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
              <p className="text-sm font-medium text-slate-700">
                I have a persistent headache and feel dizzy...
              </p>
            </div>
            <div className="self-end rounded-2xl bg-primary p-4 text-primary-foreground shadow-md">
              <p className="text-sm">
                I understand. Based on your symptoms, it could be related to
                dehydration or tension. Would you like me to check for other
                symptoms?
              </p>
            </div>
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
            <div className="rounded-lg bg-white px-4 py-2 shadow-sm border border-slate-100">
              <span className="text-xs font-mono text-primary font-bold">
                Analyzing patterns... 98%
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Nearby Doctor Finder",
      desc: "Connect with the right specialists based on your AI diagnosis and current location.",
      details: [
        "Geo-location tracking",
        "Specialist matching",
        "Real-time availability",
      ],
      icon: MapPin,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl bg-white p-3 shadow-sm border border-slate-100"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 mb-2 flex items-center justify-center">
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
                <div className="h-2 w-12 bg-slate-100 rounded mb-1" />
                <div className="h-2 w-8 bg-slate-50 rounded" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-primary/20 animate-ping" />
            <MapPin className="h-8 w-8 text-primary absolute" />
          </div>
        </div>
      ),
    },
  ];

  const doctorFeatures = [
    {
      title: "AI-Powered Triage",
      desc: "Receive pre-analyzed patient symptoms and preliminary predictions to streamline your diagnosis.",
      details: [
        "Structured patient history",
        "Priority-based sorting",
        "Decision support system",
      ],
      icon: Zap,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-100"
              >
                <div
                  className={`h-2 w-2 rounded-full ${i === 1 ? "bg-primary" : "bg-accent"}`}
                />
                <div className="flex-1 space-y-1">
                  <div className="h-2 w-24 bg-slate-100 rounded" />
                  <div className="h-2 w-16 bg-slate-50 rounded" />
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Practice Management",
      desc: "Manage appointments, patient records, and follow-ups in one secure, unified dashboard.",
      details: [
        "Smart scheduling",
        "Secure EHR integration",
        "Patient communication tools",
      ],
      icon: Calendar,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-6">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div
                key={i}
                className={`h-6 rounded-sm ${i % 7 === 2 || i % 7 === 5 ? "bg-primary/40" : "bg-slate-200"}`}
              />
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-primary/20 p-3">
            <div className="h-2 w-full bg-primary/40 rounded" />
          </div>
        </div>
      ),
    },
    {
      title: "Clinical Insights",
      desc: "Access population health data and trend analysis to improve patient outcomes in your area.",
      details: [
        "Trend visualization",
        "Data-driven decisions",
        "HIPAA compliant analytics",
      ],
      icon: Activity,
      visual: (
        <div className="relative h-full w-full bg-primary/5 p-6">
          <div className="flex items-end gap-1 h-32">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                className="flex-1 bg-gradient-to-t from-primary to-primary/40 rounded-t-sm"
              />
            ))}
          </div>
        </div>
      ),
    },
  ];

  const patientTestimonials = [
    {
      quote:
        "The symptom checker was spot on. It helped me find the right specialist immediately.",
      author: "Sarah J.",
      role: "Patient",
      image: "SJ",
      rating: 5,
      color: "from-primary/10 to-primary/5",
    },
    {
      quote:
        "I feel much more confident about my health decisions with this AI assistant.",
      author: "Emily R.",
      role: "Patient",
      image: "ER",
      rating: 5,
      color: "from-primary/10 to-accent/10",
    },
    {
      quote:
        "Finally, a health app that actually understands what I'm describing!",
      author: "James L.",
      role: "Patient",
      image: "JL",
      rating: 5,
      color: "from-accent/10 to-accent/5",
    },
  ];

  const doctorTestimonials = [
    {
      quote:
        "Receiving pre-analyzed symptom reports helps me prepare better for appointments.",
      author: "Dr. Michael C.",
      role: "Cardiologist",
      image: "MC",
      rating: 5,
      color: "from-accent/10 to-accent/5",
    },
    {
      quote:
        "The AI-powered triage significantly reduces the time I spend on initial assessments.",
      author: "Dr. Anita K.",
      role: "General Physician",
      image: "AK",
      rating: 5,
      color: "from-primary/10 to-primary/5",
    },
    {
      quote:
        "Integration with clinical workflows is seamless. A great tool for modern practice.",
      author: "Dr. Robert S.",
      role: "Neurologist",
      image: "RS",
      rating: 5,
      color: "from-primary/10 to-accent/10",
    },
  ];

  const stats = [
    { label: "Active Patients", value: "10,000+" },
    { label: "AI Predictions", value: "50k+" },
    { label: "Verified Doctors", value: "500+" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      <main>
        {/* Hero Section */}
        <section className="relative px-6 pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
          {/* Hero Background Elements */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute left-1/2 top-0 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute bottom-0 right-0 h-[30rem] w-[30rem] translate-x-1/3 translate-y-1/3 rounded-full bg-accent/20 blur-[100px]"
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
                <span className="mr-2 flex h-2 w-2 rounded-full bg-primary"></span>
                v2.0 is now live
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl"
            >
              Your Personal AI <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Health Companion
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg lg:text-xl px-4 sm:px-0"
            >
              Chat with our advanced AI to analyze symptoms, predict potential
              conditions, and find the right doctors near you instantly.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <button
                  onClick={openChat}
                  className="group flex w-full items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 sm:text-lg"
                >
                  Check Symptoms
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto"
              >
                <Link
                  href={`${process.env.NEXT_PUBLIC_DOCTOR_APP_URL}/signup`}
                  className="flex w-full items-center justify-center rounded-full border border-border bg-background/50 px-8 py-4 text-base font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-accent/10 sm:text-lg"
                >
                  Join as Doctor
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Preview */}
            <motion.div
              variants={fadeUp}
              className="mt-16 grid grid-cols-2 gap-4 border-y border-border/50 py-8 sm:grid-cols-3 sm:gap-8"
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center ${i === 2 ? "col-span-2 sm:col-span-1" : ""}`}
                >
                  <div className="text-2xl font-bold text-foreground sm:text-3xl">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section
          className="px-6 py-16 sm:py-24 relative overflow-hidden bg-white"
          id="features"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 sm:mb-16 text-center">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4"
              >
                Features
              </motion.div>
              <motion.h2
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
              >
                Tailored for your needs
              </motion.h2>

              {/* Tabs Toggle */}
              <div className="mt-8 sm:mt-10 flex justify-center">
                <div className="relative flex w-full max-w-[320px] sm:max-w-[400px] rounded-full bg-slate-100 p-1 shadow-inner">
                  <motion.div
                    className="absolute inset-y-1 rounded-full bg-white shadow-sm"
                    initial={false}
                    animate={{
                      x: activeTab === "patient" ? 0 : "100%",
                      width: "50%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <button
                    onClick={() => setActiveTab("patient")}
                    className={`relative z-10 w-1/2 rounded-full py-2 text-sm font-semibold transition-colors ${
                      activeTab === "patient"
                        ? "text-primary"
                        : "text-slate-500"
                    }`}
                  >
                    For Patients
                  </button>
                  <button
                    onClick={() => setActiveTab("doctor")}
                    className={`relative z-10 w-1/2 rounded-full py-2 text-sm font-semibold transition-colors ${
                      activeTab === "doctor" ? "text-primary" : "text-slate-500"
                    }`}
                  >
                    For Doctors
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Sections */}
            <div className="space-y-16 sm:space-y-24 lg:space-y-32 mt-12 sm:mt-16 lg:mt-20">
              {(activeTab === "patient" ? patientFeatures : doctorFeatures).map(
                (feature, i) => (
                  <motion.div
                    key={`${activeTab}-${i}`}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className={`flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-stretch ${
                      i % 2 === 1 ? "lg:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Text Content */}
                    <div className="flex-1 flex flex-col justify-center space-y-4 sm:space-y-6 rounded-3xl border border-slate-100 bg-slate-50/50 p-6 sm:p-8 lg:p-12 shadow-sm">
                      <div className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <feature.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="text-lg sm:text-xl text-slate-600 leading-relaxed">
                        {feature.desc}
                      </p>
                      <ul className="space-y-2 sm:space-y-3">
                        {feature.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-center gap-2 sm:gap-3 text-slate-700 text-sm sm:text-base"
                          >
                            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                      <motion.div variants={fadeUp} className="mt-8">
                        <Link
                          href="/signup"
                          className="inline-flex items-center gap-2 font-semibold text-primary text-sm sm:text-base"
                        >
                          Get started now <ArrowRight className="h-4 w-4" />
                        </Link>
                      </motion.div>
                    </div>

                    {/* Visual Element */}
                    <div className="flex-1">
                      <div className="relative h-full min-h-[300px] sm:min-h-[400px] overflow-hidden rounded-3xl border border-slate-100 bg-slate-50 shadow-lg">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
                        <div className="h-full w-full p-1">
                          {feature.visual}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* Trust/Social Proof Section */}
        <section
          className="px-6 py-16 sm:py-24 relative overflow-hidden bg-slate-50/30"
          id="testimonials"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_0%_0%,var(--color-accent)_0%,transparent_50%)] opacity-[0.05]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 sm:mb-16 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4"
              >
                Testimonials
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl"
              >
                Trusted by patients and doctors alike
              </motion.h2>

              {/* Testimonials Tabs Toggle */}
              <div className="mt-8 sm:mt-10 flex justify-center">
                <div className="relative flex w-full max-w-[320px] sm:max-w-[400px] rounded-full bg-muted p-1 shadow-inner">
                  <motion.div
                    className="absolute inset-y-1 rounded-full bg-background shadow-sm"
                    initial={false}
                    animate={{
                      x: activeTestimonialTab === "patient" ? 0 : "100%",
                      width: "50%",
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                  <button
                    onClick={() => setActiveTestimonialTab("patient")}
                    className={`relative z-10 w-1/2 rounded-full py-2 text-sm font-semibold transition-colors ${
                      activeTestimonialTab === "patient"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Patients
                  </button>
                  <button
                    onClick={() => setActiveTestimonialTab("doctor")}
                    className={`relative z-10 w-1/2 rounded-full py-2 text-sm font-semibold transition-colors ${
                      activeTestimonialTab === "doctor"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    Doctors
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
              {(activeTestimonialTab === "patient"
                ? patientTestimonials
                : doctorTestimonials
              ).map((t, i) => (
                <motion.div
                  key={`${activeTestimonialTab}-${i}`}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="group relative flex flex-col justify-between rounded-3xl border border-border/50 bg-card/40 p-6 sm:p-8 backdrop-blur-md transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5"
                >
                  <div
                    className={`absolute inset-0 -z-10 bg-gradient-to-br ${t.color} opacity-0 transition-opacity group-hover:opacity-100 rounded-3xl`}
                  />

                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex gap-1">
                      {[...Array(t.rating)].map((_, idx) => (
                        <Star
                          key={idx}
                          className="h-3 w-3 sm:h-4 sm:w-4 fill-primary text-primary"
                        />
                      ))}
                    </div>

                    <div className="relative">
                      <Quote className="absolute -top-2 -left-2 h-6 w-6 sm:h-8 sm:w-8 text-primary/10 -z-10" />
                      <p className="text-base sm:text-lg font-medium leading-relaxed text-foreground/90 italic">
                        &quot;{t.quote}&quot;
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 border-t border-border/50 pt-4 sm:pt-6">
                    <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-sm sm:text-base font-bold text-primary ring-2 ring-primary/20">
                      {t.image}
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-bold text-foreground">
                        {t.author}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {t.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-white">
          <CTASection
            title="Take control of your health today"
            description="Join thousands of users who trust Trimed Al for instant symptom analysis and doctor connections."
            primaryBtnText="Start Health Chat"
            primaryBtnLink={`${process.env.NEXT_PUBLIC_PATIENT_APP_URL}/signup`}
            secondaryBtnText="Are you a Doctor?"
            secondaryBtnLink={`${process.env.NEXT_PUBLIC_DOCTOR_APP_URL}/signup`}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
