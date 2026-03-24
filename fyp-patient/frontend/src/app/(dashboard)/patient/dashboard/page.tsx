"use client";

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
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-8 pb-8 max-w-5xl mx-auto w-full">
      {/* Welcome & Primary Action (Chat Centric) */}
      <div className="flex flex-col gap-2 py-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Hello, John
        </h1>
        <p className="text-muted-foreground text-lg">
          {currentDate}
        </p>
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
                Describe your symptoms to our AI assistant to get instant analysis and specialist recommendations.
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
        {/* Find Doctors Action */}
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

        {/* Upcoming Appointments */}
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
            <div className="rounded-xl border border-border/50 bg-background p-4 flex gap-4 items-start">
               <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary font-bold">
                  <span className="text-xs uppercase">Tomorrow</span>
                  <span className="text-xl">10</span>
               </div>
               <div className="space-y-1">
                  <h4 className="font-semibold text-foreground">Dr. Sarah Smith</h4>
                  <p className="text-sm text-muted-foreground">General Checkup</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> 10:00 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> City Medical Center
                    </span>
                  </div>
               </div>
            </div>
             <div className="mt-4 text-center">
                <Button variant="link" size="sm" className="text-muted-foreground h-auto p-0" asChild>
                  <Link href="/patient/appointments">View all appointments</Link>
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent History / Context */}
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
        <div className="grid gap-4 md:grid-cols-3">
           <HistoryCard 
             date="Today, 9:41 AM"
             symptom="Severe Headache"
             outcome="Tension Headache"
             specialist="Neurologist"
           />
           <HistoryCard 
             date="Yesterday"
             symptom="Skin Rash"
             outcome="Contact Dermatitis"
             specialist="Dermatologist"
           />
           <HistoryCard 
             date="Oct 24"
             symptom="Stomach Pain"
             outcome="Gastritis"
             specialist="Gastroenterologist"
           />
        </div>
      </section>
    </div>
  );
}

function HistoryCard({ date, symptom, outcome, specialist }: any) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow border-border/40">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">{date}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{symptom}</h4>
          <p className="text-sm text-muted-foreground mt-1">Possible: {outcome}</p>
        </div>
        <div className="pt-2 border-t border-border/50 flex items-center gap-2 text-xs text-primary font-medium">
           <Stethoscope className="h-3.5 w-3.5" />
           Rec: {specialist}
        </div>
      </CardContent>
    </Card>
  )
}
