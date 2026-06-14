"use client";

import { useState, useEffect } from "react";
import api from "@/services/api.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useChatWidget } from "@/components/chat/ChatWidgetContext";

interface PatientSymptom {
  id: string;
  reportedAt: string;
  severity: number;
  duration: string | null;
  notes: string | null;
  symptom: { id: string; name: string; description: string | null };
  chatSession: { id: string; startedAt: string } | null;
}

const SEVERITY_COLORS = ["", "text-green-600", "text-yellow-500", "text-orange-500", "text-red-500", "text-red-700"];
const SEVERITY_LABELS = ["", "Mild", "Mild-Moderate", "Moderate", "Moderate-Severe", "Severe"];

export default function SymptomsPage() {
  const [symptoms, setSymptoms] = useState<PatientSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const { openChat } = useChatWidget();

  useEffect(() => {
    api.get("/symptoms")
      .then((res) => setSymptoms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Symptom Log</h1>
          <p className="text-muted-foreground mt-1">Symptoms reported during AI chat consultations</p>
        </div>
        <Button variant="outline" onClick={openChat}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Start Chat
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : symptoms.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="mx-auto h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No symptoms logged yet</p>
          <p className="text-sm">Chat with the AI assistant to log symptoms automatically</p>
          <Button className="mt-4" onClick={openChat}>
            Start AI Consultation
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {symptoms.map((s) => (
            <Card key={s.id} className="border-border/50">
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{s.symptom.name}</p>
                  {s.symptom.description && (
                    <p className="text-sm text-muted-foreground">{s.symptom.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                    <span>
                      {new Date(s.reportedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    {s.duration && <span>Duration: {s.duration}</span>}
                    {s.notes && <span className="italic">"{s.notes}"</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${SEVERITY_COLORS[s.severity] || "text-muted-foreground"}`}>
                    {SEVERITY_LABELS[s.severity] || `Severity ${s.severity}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
