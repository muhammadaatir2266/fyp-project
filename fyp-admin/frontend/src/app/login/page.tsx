'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { setAuthToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Mail, Eye, EyeOff, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setAuthToken(response.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@mediassist.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden bg-background">
      {/* Background blur orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      {/* Logo – Top Left */}
      <Link
        href={websiteUrl}
        className="absolute top-4 sm:top-6 left-4 sm:left-6 flex items-center gap-2 sm:gap-3 z-50"
      >
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
          <img src="/logo.png" alt="DocLink" className="h-full w-full object-cover" />
        </div>
        <span className="text-lg sm:text-xl font-bold text-foreground">
          DocLink
        </span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                Admin Portal
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-foreground">
              Sign In
            </CardTitle>
            <CardDescription className="text-muted-foreground text-sm sm:text-base">
              Access the DocLink management panel
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 sm:p-4 mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-destructive flex-shrink-0" />
                <p className="text-xs sm:text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@mediassist.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-9 h-11 bg-background/50 border-input focus-visible:ring-primary"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Lock className="w-4 h-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-9 pr-10 h-11 bg-background/50 border-input focus-visible:ring-primary"
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
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-base font-semibold shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
              >
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full p-4 bg-primary/5 hover:bg-primary/10 rounded-xl border border-primary/20 hover:border-primary/40 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-medium text-primary text-sm">Use Demo Credentials</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">
                admin@mediassist.com / admin123
              </div>
            </button>
          </CardContent>

          <CardFooter className="justify-center pb-6">
            <p className="text-center text-sm text-muted-foreground">
              © 2024 DocLink — Secure Admin Access
            </p>
          </CardFooter>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
        </p>
      </motion.div>
    </div>
  );
}
