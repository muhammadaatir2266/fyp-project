"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  UserRound,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { buildGuestAuthHref } from "@/lib/guest-session";

export default function SignupSelectionPage() {
  const router = useRouter();
  const rootUrl = process.env.NEXT_PUBLIC_ROOT_URL || "/";
  const [patientHref, setPatientHref] = useState("/signup/patient");

  useEffect(() => {
    // Carry guest context into the patient signup wizard if present
    setPatientHref(buildGuestAuthHref("/signup/patient"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-br from-teal-50/50 via-emerald-50/30 to-cyan-50/50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-teal-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-200/20 rounded-full blur-3xl" />
      </div>

      {/* Logo & Back Button */}
      <div className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-3 z-50">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg bg-white/80 border border-teal-200/50 text-teal-600 hover:text-teal-700 hover:bg-white transition-all shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href={rootUrl} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md">
            <img src="/logo.png" alt="DocLink" className="h-full w-full object-cover" />
          </div>
          <span className="text-lg font-bold text-teal-600 hidden sm:block">
            DocLink
          </span>
        </Link>
      </div>

      <div className="w-full max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100/80 text-teal-600 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Join Our Community
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-teal-600 mb-4">
            How would you like to join us?
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            Select the account type that best describes you to get started with
            your personalized healthcare journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
          {/* Patient Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link href={patientHref} className="block group h-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 h-full border border-teal-100/50 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UserRound className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-teal-600 mb-3">
                  Join as a Patient
                </h2>
                <p className="text-slate-600 text-sm mb-8 flex-grow leading-relaxed">
                  Get instant AI symptom analysis, find doctors near you, and
                  manage your health journey seamlessly.
                </p>
                <div className="w-full py-3 bg-white border border-teal-500 text-teal-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 group-hover:bg-teal-500 group-hover:text-white transition-all">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Doctor Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link href="/signup/doctor" className="block group h-full">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 h-full border border-teal-100/50 hover:border-teal-300/50 hover:shadow-xl hover:shadow-teal-100/50 transition-all duration-300 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-xl bg-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheck className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-bold text-teal-600 mb-3">
                  Join as a Doctor
                </h2>
                <p className="text-slate-600 text-sm mb-8 flex-grow leading-relaxed">
                  Manage appointments, connect with patients, and expand your
                  practice with our AI-powered platform.
                </p>
                <div className="w-full py-3 bg-white border border-teal-500 text-teal-600 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 group-hover:bg-teal-500 group-hover:text-white transition-all">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-slate-600 text-sm mt-8"
        >
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
          >
            Sign in here
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
