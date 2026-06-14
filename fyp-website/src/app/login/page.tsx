"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight, Stethoscope } from "lucide-react";
import { login, getRedirectUrl } from "@/lib/auth";
import { getGuestContext, buildGuestAuthHref, clearGuestContext } from "@/lib/guest-session";

function LoginForm() {
  const searchParams = useSearchParams();
  const isGuestExpired = searchParams.get("reason") === "guest_expired";
  const isFromGuest = searchParams.get("from") === "guest";
  const showGuestBanner = isGuestExpired || isFromGuest;

  // Prefer stored context; fall back to URL params for specialty
  const urlSpecialty = searchParams.get("specialty") ?? undefined;
  const urlGuestSessionId = searchParams.get("guestSessionId") ?? undefined;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { token, user } = await login(email, password);

      if (user.role === "PATIENT") {
        const ctx = getGuestContext();
        const specialty = ctx?.specialty ?? urlSpecialty;
        const guestSessionId = ctx?.guestSessionId ?? urlGuestSessionId;
        const guestOpts = specialty || guestSessionId
          ? { specialty, guestSessionId, redirect: "doctors" as const }
          : undefined;
        // Clear guest context before leaving — patient app takes over
        clearGuestContext();
        window.location.href = getRedirectUrl(user.role, token, guestOpts);
      } else {
        window.location.href = getRedirectUrl(user.role, token);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-2xl p-8">
      {/* Guest-expired banner */}
      {showGuestBanner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 mb-6"
        >
          <Stethoscope className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-primary font-medium">
            {urlSpecialty
              ? `Sign in to find a ${urlSpecialty} near you and book an appointment.`
              : "Create an account or sign in to find a doctor and book an appointment based on your results."}
          </p>
        </motion.div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Welcome Back
        </div>
        <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Access your Trimed Al account
        </p>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 mb-6"
        >
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-primary" />
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-primary" />
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 rounded-xl border border-input bg-background/50 px-3.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Signing in…
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link
          href={showGuestBanner ? buildGuestAuthHref("/signup/patient") : "/signup"}
          className="text-primary font-semibold hover:text-accent transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-background">
      {/* Background blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <Link href="/" className="absolute top-5 left-6 flex items-center gap-2.5 z-50 group">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
          <img src="/logo.png" alt="Trimed Al" className="h-full w-full object-cover" />
        </div>
        <span className="text-base font-bold text-foreground hidden sm:block">Trimed Al</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md relative z-10"
      >
        <Suspense fallback={
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-2xl p-8 flex justify-center">
            <svg className="animate-spin w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        }>
          <LoginForm />
        </Suspense>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </motion.div>
    </div>
  );
}
