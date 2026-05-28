"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageSquare,
  Calendar,
  ArrowRight,
  Search,
  History,
  Stethoscope,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import api from "@/services/api.service";
import { fetchCurrentUser, type User } from "@/lib/auth";

interface Appointment {
  id: string;
  scheduledAt: string;
  status: string;
  reason: string | null;
  doctor: {
    firstName: string;
    lastName: string;
    city: string;
    clinicLocation: string | null;
    specialty: { name: string };
  };
}

interface ChatSession {
  id: string;
  startedAt: string;
  predictions: Array<{
    disease: { name: string; recommendedSpecialty: { name: string } | null };
    confidence: number;
  }>;
  messages: Array<{ content: string }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [recentHistory, setRecentHistory] = useState<ChatSession[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoadingUser(false));

    api
      .get("/appointments", { params: { upcoming: "true" } })
      .then((res) => {
        if (res.data.length > 0) setNextAppointment(res.data[0]);
      })
      .catch(() => {});

    api
      .get("/symptoms/history", { params: { limit: "3" } })
      .then((res) => setRecentHistory(res.data))
      .catch(() => {});
  }, []);

  const firstName = user?.patient?.firstName || "there";

  return (
    <div className="flex flex-col gap-8 pb-8 max-w-5xl mx-auto w-full">
      {/* Welcome */}
      <div className="flex flex-col gap-2 py-4">
        {loadingUser ? (
          <div className="h-9 w-48 bg-muted animate-pulse rounded-lg" />
        ) : (
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hello, {firstName}
          </h1>
        )}
        <p className="text-muted-foreground text-lg">{currentDate}</p>
      </div>

      {/* Hero: AI Symptom Checker */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
          <div className="flex flex-col gap-6 max-w-xl">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                How are you feeling today?
              </h2>
              <p className="text-primary-foreground/90 text-lg md:text-xl leading-relaxed">
                Describe your symptoms to our AI assistant for instant analysis and specialist recommendations.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                variant="secondary"
                className="h-14 px-8 text-lg rounded-2xl shadow-lg hover:scale-105 transition-transform font-semibold"
                asChild
              >
                <Link href="/patient/chat">
                  <MessageSquare className="mr-2.5 h-6 w-6" />
                  Start Symptom Check
                </Link>
              </Button>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-center bg-white/10 rounded-full p-8 backdrop-blur-sm border border-white/20">
            <Stethoscope className="h-24 w-24 text-white/90" />
          </div>
        </div>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Find Doctors */}
        <Link href="/patient/doctors" className="group">
          <Card className="h-full border-border/40 hover:border-primary/50 transition-all hover:shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Search className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                Find a Specialist
                <ChevronRight className="h-5 w-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </CardTitle>
              <CardDescription className="text-base">
                Search for doctors by specialty, condition, or location.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">Cardiologists</span>
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">Dermatologists</span>
                <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium text-muted-foreground">General</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Upcoming Appointment */}
        <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Next Appointment</CardTitle>
              <CardDescription>Upcoming schedule</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full" asChild>
              <Link href="/patient/appointments">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {nextAppointment ? (
              <div className="rounded-xl border border-border/50 bg-background p-4 flex gap-4 items-start">
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary font-bold text-center">
                  <span className="text-xs uppercase">
                    {new Date(nextAppointment.scheduledAt).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                  <span className="text-xl">{new Date(nextAppointment.scheduledAt).getDate()}</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">
                    Dr. {nextAppointment.doctor.firstName} {nextAppointment.doctor.lastName}
                  </h4>
                  <p className="text-sm text-muted-foreground">{nextAppointment.doctor.specialty?.name}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(nextAppointment.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {nextAppointment.doctor.city}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-muted-foreground">
                <Calendar className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No upcoming appointments</p>
                <Button variant="link" size="sm" className="mt-1 h-auto p-0" asChild>
                  <Link href="/patient/appointments">Book one now</Link>
                </Button>
              </div>
            )}
            <div className="mt-4 text-center">
              <Button variant="link" size="sm" className="text-muted-foreground h-auto p-0" asChild>
                <Link href="/patient/appointments">View all appointments</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Consultations */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground" />
            Recent Consultations
          </h3>
          <Link href="/patient/history" className="text-sm text-primary hover:underline">
            View History
          </Link>
        </div>
        {recentHistory.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No consultations yet.{" "}
              <Link href="/patient/chat" className="text-primary hover:underline">
                Start your first AI consultation
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {recentHistory.map((session) => {
              const topPred = session.predictions[0];
              const firstMsg = session.messages[0];
              return (
                <HistoryCard
                  key={session.id}
                  date={new Date(session.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  symptom={firstMsg?.content?.slice(0, 40) || "Chat consultation"}
                  outcome={topPred?.disease?.name || "Analysis complete"}
                  specialist={topPred?.disease?.recommendedSpecialty?.name || "Specialist"}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function HistoryCard({
  date,
  symptom,
  outcome,
  specialist,
}: {
  date: string;
  symptom: string;
  outcome: string;
  specialist: string;
}) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-border/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{date}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground text-sm">{symptom}</h4>
          <p className="text-sm text-muted-foreground mt-1">Possible: {outcome}</p>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-xs text-primary font-medium">
          <Stethoscope className="h-3.5 w-3.5" />
          Rec: {specialist}
        </div>
      </CardContent>
    </Card>
  );
}
