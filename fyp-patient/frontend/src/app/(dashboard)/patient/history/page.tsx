"use client";

import { useState, useEffect } from "react";
import api from "@/services/api.service";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { History, Loader2, MessageSquare, Stethoscope } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ChatSession {
  id: string;
  startedAt: string;
  endedAt: string | null;
  predictions: Array<{
    confidence: number;
    disease: {
      name: string;
      recommendedSpecialty: { name: string } | null;
    };
  }>;
  messages: Array<{ role: string; content: string }>;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/symptoms/history")
      .then((res) => setSessions(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultation History</h1>
          <p className="text-muted-foreground mt-1">Your past AI consultations and diagnoses</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/patient/chat">
            <MessageSquare className="mr-2 h-4 w-4" />
            New Consultation
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <History className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No consultation history yet</p>
          <p className="text-sm">Start a chat consultation to see your history here</p>
          <Button className="mt-4" asChild>
            <Link href="/patient/chat">Start AI Consultation</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => {
            const firstMsg = session.messages[0];
            const topPrediction = session.predictions[0];
            return (
              <Card key={session.id} className="border-border/50 hover:shadow-sm transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">
                      {new Date(session.startedAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.startedAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {firstMsg && (
                    <p className="text-sm text-muted-foreground italic">
                      "{firstMsg.content.slice(0, 120)}{firstMsg.content.length > 120 ? "..." : ""}"
                    </p>
                  )}
                  {session.predictions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">AI Predictions</p>
                      <div className="flex flex-wrap gap-2">
                        {session.predictions.map((p, i) => (
                          <div key={i} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                            <Stethoscope className="h-3 w-3" />
                            <span className="font-medium">{p.disease.name}</span>
                            <span className="text-primary/70">({Math.round(p.confidence * 100)}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topPrediction?.disease?.recommendedSpecialty && (
                    <p className="text-xs text-muted-foreground">
                      Recommended specialist:{" "}
                      <span className="font-medium text-foreground">
                        {topPrediction.disease.recommendedSpecialty.name}
                      </span>
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
