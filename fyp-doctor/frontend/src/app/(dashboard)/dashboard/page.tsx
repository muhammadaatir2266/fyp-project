"use client";

import { useEffect, useState } from "react";
import { Calendar, Users, Phone, Activity, Clock, Star } from "lucide-react";
import { motion } from "framer-motion";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import api from "@/lib/api";
import { formatDate, formatTime } from "@/lib/utils";
import type { Appointment, CallLog, DashboardStats } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    upcomingAppointments: 0,
    totalPatients: 0,
    recentCalls: 0,
    aiActivity: 0,
  });
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [recentCalls, setRecentCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewSummary, setReviewSummary] = useState<{ avgRating: number | null; total: number; reviews: Array<{ id: string; rating: number; comment: string | null; createdAt: string; patientInitial: string }> } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, appointmentsRes, callsRes, reviewsRes] = await Promise.all([
        api.get("/doctor/dashboard/stats"),
        api.get("/doctor/dashboard/appointments/today"),
        api.get("/doctor/dashboard/calls/recent"),
        api.get("/doctor/reviews", { params: { limit: 3 } }),
      ]);

      setStats(statsRes.data);
      setTodayAppointments(appointmentsRes.data);
      setRecentCalls(callsRes.data);
      setReviewSummary(reviewsRes.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      PENDING: "warning",
      CONFIRMED: "success",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={container}
      className="space-y-6"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your overview for today.
        </p>
      </motion.div>

      <motion.div
        variants={container}
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
      >
        <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <StatsCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={Calendar}
            description="Scheduled for today"
          />
        </motion.div>
        <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <StatsCard
            title="Upcoming"
            value={stats.upcomingAppointments}
            icon={Clock}
            description="Next 7 days"
          />
        </motion.div>
        <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <StatsCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            description="All time"
          />
        </motion.div>
        <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <StatsCard
            title="Recent Calls"
            value={stats.recentCalls}
            icon={Phone}
            description="Last 24 hours"
          />
        </motion.div>
        <motion.div variants={item} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <StatsCard
            title="AI Activity"
            value={stats.aiActivity}
            icon={Activity}
            description="Predictions made"
          />
        </motion.div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2">
        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Today's Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments for today
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayAppointments.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  No appointments scheduled for today
                </motion.p>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.slice(0, 5).map((appointment, index) => (
                    <motion.div
                      key={appointment.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {appointment.patient?.firstName}{" "}
                          {appointment.patient?.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(appointment.scheduledAt)}
                        </p>
                      </div>
                      {getStatusBadge(appointment.status)}
                    </motion.div>
                  ))}
                  {todayAppointments.length > 5 && (
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/appointments">View All</Link>
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>Recent Call Logs</CardTitle>
              <CardDescription>Latest calls from patients</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCalls.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  No recent calls
                </motion.p>
              ) : (
                <div className="space-y-4">
                  {recentCalls.slice(0, 5).map((call, index) => (
                    <motion.div
                      key={call.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/50 transition-all cursor-pointer"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {call.callerName || call.callerPhone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(call.startedAt)} at{" "}
                          {formatTime(call.startedAt)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          call.status === "COMPLETED" ? "success" : "destructive"
                        }
                      >
                        {call.status}
                      </Badge>
                    </motion.div>
                  ))}
                  {recentCalls.length > 5 && (
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="/calls">View All</Link>
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Patient Reviews */}
        {reviewSummary && (reviewSummary.total > 0) && (
          <motion.div variants={item} className="md:col-span-2">
            <Card className="hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Patient Reviews</CardTitle>
                    <CardDescription>
                      {reviewSummary.avgRating !== null
                        ? `${reviewSummary.avgRating.toFixed(1)} avg rating · ${reviewSummary.total} review${reviewSummary.total !== 1 ? "s" : ""}`
                        : `${reviewSummary.total} review${reviewSummary.total !== 1 ? "s" : ""}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="text-lg font-bold text-foreground">
                      {reviewSummary.avgRating !== null ? reviewSummary.avgRating.toFixed(1) : "—"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {reviewSummary.reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border/60 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{r.patientInitial}</span>
                      </div>
                      {r.comment && (
                        <p className="text-xs text-foreground line-clamp-3">{r.comment}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
