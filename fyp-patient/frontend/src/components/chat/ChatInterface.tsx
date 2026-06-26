"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  User,
  Bot,
  Loader2,
  Stethoscope,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { sendMessage, getLatestChatSession, type DoctorRecommendations } from "@/services/chat.service";
import { getPatientLocation, formatLocationForWebhook } from "@/lib/location";
import { DoctorRecommendations as DoctorRecommendationsUI } from "@/components/chat/DoctorRecommendations";
import { ChatMessageContent, splitAssistantMessage } from "@/components/chat/ChatMessageContent";
import { LoadingText } from "@/components/chat/LoadingText";
import Link from "next/link";

const SUGGESTION_CHIPS = [
  "I've had a persistent headache for days",
  "My child isn't eating well",
  "I feel chest tightness when walking",
  "I have a sore throat and mild fever",
];

interface PredictionItem {
  disease: string;
  confidence: number;
  specialty?: string;
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  predictions?: PredictionItem[];
  doctorRecommendations?: DoctorRecommendations;
};

export function ChatInterface({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm **DocLink Care AI**. Describe how you're feeling and I'll analyze your symptoms, suggest possible conditions, and recommend the right specialist for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Restore the most recent session on every mount (modal open)
  useEffect(() => {
    getLatestChatSession()
      .then((session) => {
        if (!session || session.messages.length === 0) return;

        setSessionId(session.id);

        const predictions: PredictionItem[] = session.predictions.map((p) => ({
          disease: p.disease.name,
          confidence: p.confidence,
          specialty: p.disease.recommendedSpecialty?.name,
        }));

        // Find the index of the last assistant message to attach predictions there
        const lastAssistantIdx = session.messages
          .map((m, i) => (m.role === "assistant" ? i : -1))
          .filter((i) => i !== -1)
          .at(-1) ?? -1;

        const restored: Message[] = session.messages.map((m, idx) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          timestamp: new Date(m.createdAt),
          predictions: idx === lastAssistantIdx && predictions.length > 0 ? predictions : undefined,
        }));

        setMessages(restored);
      })
      .catch(() => {
        // Silently fall back to the welcome message if history can't be loaded
      })
      .finally(() => setRestoring(false));
  }, []);

  useEffect(() => {
    // Prefetch location once on mount so it's ready when the first message is sent
    getPatientLocation()
      .then((loc) => { locationRef.current = formatLocationForWebhook(loc) ?? undefined; })
      .catch(() => {});
  }, []);

  const handleSendMessage = async (override?: string) => {
    const currentInput = (override ?? input).trim();
    if (!currentInput || isLoading) return;

    setInput("");
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentInput,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // If mount prefetch hasn't resolved yet, try once more (handles slow permission grant)
      if (!locationRef.current) {
        const loc = await getPatientLocation().catch(() => null);
        locationRef.current = formatLocationForWebhook(loc) ?? undefined;
      }
      const response = await sendMessage(currentInput, locationRef.current, sessionId);

      if (response.success && response.data) {
        if (response.sessionId) setSessionId(response.sessionId);

        const fullContent =
          response.data.message ||
          response.data.response ||
          "I received your message.";

        // Split a long reply into multiple bubbles so it reads like a real chat
        const segments = splitAssistantMessage(fullContent);
        const predictions = normalizePredictions(response.data.prediction);
        const { doctorRecommendations } = response.data;
        const base = Date.now() + 1;

        const aiMessages: Message[] = segments.map((segment, idx) => {
          const isLast = idx === segments.length - 1;
          return {
            id: `${base + idx}`,
            role: "assistant",
            content: segment,
            timestamp: new Date(),
            predictions: isLast ? predictions : undefined,
            doctorRecommendations: isLast ? doctorRecommendations : undefined,
          };
        });

        // Drip messages in one-by-one with a typing pause between each bubble
        for (let i = 0; i < aiMessages.length; i++) {
          setMessages((prev) => [...prev, aiMessages[i]]);
          if (i < aiMessages.length - 1) {
            // Keep typing indicator visible between bubbles
            await new Promise((r) => setTimeout(r, 650));
          }
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header — hidden when rendered inside the popup widget (popup chrome provides its own) */}
      {!embedded && <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold leading-none">
              DocLink Care AI
            </h2>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Online
            </p>
          </div>
        </div>
      </div>}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        {restoring ? (
          <div className="max-w-3xl mx-auto w-full flex flex-col gap-3 pt-2">
            {[80, 55, 70].map((w) => (
              <div key={w} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className={`h-10 rounded-2xl bg-muted animate-pulse`} style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        ) : (
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
        <AnimatePresence initial={false}>
        {messages.map((message, idx) => {
          const prev = messages[idx - 1];
          const next = messages[idx + 1];
          const showAvatar = !prev || prev.role !== message.role;
          const showTimestamp = !next || next.role !== message.role;
          return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start",
              !showAvatar && "-mt-2"
            )}
          >
            <div
              className={cn(
                "flex gap-3 max-w-[92%] md:max-w-[85%]",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {showAvatar ? (
                <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                  {message.role === "assistant" ? (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  ) : (
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
              ) : (
                <div className="w-8 shrink-0" aria-hidden="true" />
              )}

              <div className="flex flex-col gap-1.5 min-w-0">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 shadow-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none text-sm leading-relaxed"
                      : "bg-muted/50 border rounded-tl-none"
                  )}
                >
                  <ChatMessageContent role={message.role} content={message.content} />
                </div>
                {showTimestamp && (
                  <div
                    className={cn(
                      "text-[10px] px-1 opacity-70",
                      message.role === "user"
                        ? "text-right text-muted-foreground"
                        : "text-left text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Suggestion chips — shown only on the initial welcome state */}
                {message.role === "assistant" &&
                  messages.length === 1 &&
                  message.id === "1" &&
                  !restoring && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SUGGESTION_CHIPS.map((chip) => (
                        <button
                          key={chip}
                          onClick={() => handleSendMessage(chip)}
                          disabled={isLoading}
                          className="text-xs text-left rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-foreground/80 hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                {/* Prediction cards */}
                {message.predictions && message.predictions.length > 0 && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Possible Conditions
                    </p>
                    <div className="space-y-2">
                      {message.predictions.map((pred, i) => (
                        <div key={i} className="space-y-0.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-foreground">
                              {pred.disease}
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-amber-500"
                                  style={{
                                    width: `${Math.round(pred.confidence * 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-muted-foreground w-8 text-right">
                                {Math.round(pred.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                          {pred.specialty && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                              Recommended specialist: {pred.specialty}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500 italic">
                      For informational purposes only. Please consult a qualified doctor.
                    </p>

                    {/* Find a Specialist CTA */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-1 h-8 text-xs gap-1.5 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                      asChild
                    >
                      <Link
                        href={
                          message.predictions[0]?.specialty
                            ? `/patient/doctors?specialty=${encodeURIComponent(message.predictions[0].specialty)}&nearby=1`
                            : "/patient/doctors?nearby=1"
                        }
                      >
                        <Search className="h-3.5 w-3.5" />
                        Find a Specialist
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Recommended doctors from n8n */}
                {message.doctorRecommendations && (
                  <div className="mt-3">
                    <DoctorRecommendationsUI recommendations={message.doctorRecommendations} />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          );
        })}
        </AnimatePresence>

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex gap-3 items-center">
              <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" />
                </div>
                <LoadingText />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        </div>
        )}
      </div>


      {/* Input */}
      <div className="p-4 bg-background border-t sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/50 transition-all shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe symptoms or ask a follow-up…"
              className="min-h-[56px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="mb-1 h-9 w-9 shrink-0 rounded-lg transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send message</span>
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-2">
            AI can make mistakes. Always consult a qualified medical professional.
          </p>
        </div>
      </div>
    </div>
  );
}

function normalizePredictions(raw: unknown): PredictionItem[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return { disease: item, confidence: 1 };
        if (typeof item === "object" && item !== null && "disease" in item) {
          const p = item as { disease: string; confidence?: number; specialty?: string };
          return { disease: p.disease, confidence: p.confidence ?? 1, specialty: p.specialty };
        }
        return null;
      })
      .filter(Boolean) as PredictionItem[];
  }
  if (typeof raw === "object" && raw !== null && "disease" in raw) {
    const p = raw as { disease: string; confidence?: number; specialty?: string };
    return [{ disease: p.disease, confidence: p.confidence ?? 1, specialty: p.specialty }];
  }
  return undefined;
}
