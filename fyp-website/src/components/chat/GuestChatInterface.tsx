"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Stethoscope, LogIn, UserPlus, Lock, ArrowRight, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { sendGuestMessage, saveGuestSnapshot, type DoctorRecommendations } from "@/lib/guest-chat";
import { getGuestLocation } from "@/lib/location";
import { DoctorRecommendations as DoctorRecommendationsUI } from "@/components/chat/DoctorRecommendations";
import { ChatMessageContent, splitAssistantMessage } from "@/components/chat/ChatMessageContent";
import { LoadingText } from "@/components/chat/LoadingText";
import {
  getOrCreateGuestSessionId,
  isGuestChatCompleted,
  markGuestChatCompleted,
  saveGuestContext,
  getGuestContext,
  buildGuestAuthHref,
  saveGuestMessages,
  loadGuestMessages,
  type GuestPrediction,
  type GuestDoctorRecommendations,
} from "@/lib/guest-session";

interface PredictionItem {
  disease: string;
  confidence: number;
  specialty?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  predictions?: PredictionItem[];
  doctorRecommendations?: DoctorRecommendations;
}

const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

const SUGGESTION_CHIPS = [
  "I've had a persistent headache for days",
  "My child isn't eating well",
  "I feel chest tightness when walking",
  "I have a sore throat and mild fever",
];

export default function GuestChatInterface({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm **DocLink Care AI**. Describe how you're feeling and I'll analyze your symptoms and suggest possible conditions. No account needed for your first session.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [topSpecialty, setTopSpecialty] = useState<string | undefined>(undefined);
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const id = getOrCreateGuestSessionId();
    setGuestSessionId(id);

    // Prefetch location so it's ready when the first message is sent
    getGuestLocation()
      .then((loc) => { locationRef.current = loc; })
      .catch(() => {});

    // Restore full message history if available
    const savedMessages = loadGuestMessages();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(
        savedMessages.map((m) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }))
      );
    }

    // Restore locked state if chat was already completed
    if (isGuestChatCompleted()) {
      const ctx = getGuestContext();
      if (ctx) {
        setIsLocked(true);
        setTopSpecialty(ctx.specialty);
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Persist messages to localStorage on every change so they survive a refresh
  useEffect(() => {
    // Don't persist the single default welcome message — it's always regenerated
    if (messages.length <= 1 && messages[0]?.id === "1") return;
    saveGuestMessages(
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp.toISOString(),
        predictions: m.predictions,
      }))
    );
  }, [messages]);

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading || isLocked || !guestSessionId) return;

    setInput("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() },
    ]);

    try {
      const response = await sendGuestMessage(text, guestSessionId, locationRef.current);

      const predictions = response.data.prediction ?? [];

      const doctorRecs = response.data.doctorRecommendations;

      // Split a long reply into multiple bubbles so it reads like a real chat
      const segments = splitAssistantMessage(response.data.message || "I received your message.");
      const base = Date.now() + 1;
      const aiMessages: Message[] = segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return {
          id: `${base + idx}`,
          role: "assistant",
          content: segment,
          timestamp: new Date(),
          predictions: isLast && predictions.length > 0 ? predictions : undefined,
          doctorRecommendations: isLast ? doctorRecs : undefined,
        };
      });

      // Drip messages in one-by-one with a typing pause between each bubble
      for (let i = 0; i < aiMessages.length; i++) {
        setMessages((prev) => [...prev, aiMessages[i]]);
        if (i < aiMessages.length - 1) {
          await new Promise((r) => setTimeout(r, 650));
        }
      }

      if (response.diseaseDetected) {
        markGuestChatCompleted();
        const topSpec = predictions[0]?.specialty;
        setTopSpecialty(topSpec);
        setIsLocked(true);

        const ctx = {
          guestSessionId,
          specialty: topSpec,
          predictions: predictions as GuestPrediction[],
          symptoms: response.data.symptoms,
          detectedAt: new Date().toISOString(),
          doctorRecommendations: doctorRecs as GuestDoctorRecommendations | undefined,
        };
        saveGuestContext(ctx);

        // Capture the full conversation (use the latest messages ref so we get
        // everything including the just-dripped AI bubbles)
        setMessages((prev) => {
          const thread = prev.map((m) => ({ id: m.id, role: m.role, content: m.content }));
          saveGuestSnapshot(
            guestSessionId,
            predictions as GuestPrediction[],
            response.data.symptoms,
            topSpec,
            thread,
          ).catch(() => {});
          return prev; // no state change — side-effect only
        });
      }
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Sorry, something went wrong. Please try again.",
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
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header — hidden inside popup widget */}
      {!embedded && (
        <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">DocLink Care AI</h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              Online · Guest session
            </p>
          </div>
          {!isLocked && (
            <Link
              href={buildGuestAuthHref("/login")}
              className="ml-auto text-xs font-medium text-primary hover:text-accent transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const prev = messages[idx - 1];
            const next = messages[idx + 1];
            const showAvatar = !prev || prev.role !== msg.role;
            const showTimestamp = !next || next.role !== msg.role;
            return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start",
                !showAvatar && "-mt-2"
              )}
            >
              <div
                className={cn(
                  "flex gap-3 max-w-[92%] md:max-w-[85%]",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {showAvatar ? (
                  <div
                    className={cn(
                      "h-8 w-8 mt-1 shrink-0 rounded-full flex items-center justify-center border shadow-sm",
                      msg.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.role === "assistant" ? (
                      <Bot className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                ) : (
                  <div className="w-8 shrink-0" aria-hidden="true" />
                )}

                <div className="flex flex-col gap-1.5 min-w-0">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none text-sm leading-relaxed"
                        : "bg-muted/50 border rounded-tl-none"
                    )}
                  >
                    <ChatMessageContent role={msg.role} content={msg.content} />
                  </div>
                  {showTimestamp && (
                    <div className="text-[10px] px-1 opacity-70 text-left text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}

                  {/* Suggestion chips — shown only on the initial welcome state */}
                  {msg.role === "assistant" &&
                    messages.length === 1 &&
                    msg.id === "1" &&
                    !isLocked && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {SUGGESTION_CHIPS.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => handleSend(chip)}
                            disabled={isLoading}
                            className="text-xs text-left rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-foreground/80 hover:bg-primary/10 hover:border-primary/50 transition-colors disabled:opacity-50"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Prediction cards */}
                  {msg.predictions && msg.predictions.length > 0 && (
                    <div className="mt-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                        <Stethoscope className="h-3.5 w-3.5" />
                        Possible Conditions
                      </p>
                      <div className="space-y-2">
                        {msg.predictions.map((pred, i) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground">{pred.disease}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-amber-500"
                                    style={{ width: `${Math.round(pred.confidence * 100)}%` }}
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
                    </div>
                  )}

                  {/* Recommended doctors from n8n */}
                  {msg.doctorRecommendations && (
                    <div className="mt-3">
                      <DoctorRecommendationsUI recommendations={msg.doctorRecommendations} />
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
              <div className="h-8 w-8 shrink-0 rounded-full flex items-center justify-center border shadow-sm bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
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
      </div>

      {/* Input area / locked state */}
      <div className="p-4 bg-background border-t sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          {isLocked ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/20 bg-primary/5 backdrop-blur-sm p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {topSpecialty ? `Ready to find a ${topSpecialty}?` : "Ready to find a specialist?"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Create your account to connect with verified doctors near you.
                  </p>
                </div>
              </div>

              {/* 3-step preview */}
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <UserPlus className="h-3 w-3 text-primary" /> Create account
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" /> See nearby doctors
                </span>
                <ArrowRight className="h-3 w-3 shrink-0" />
                <span className="flex items-center gap-1">
                  <CalendarCheck className="h-3 w-3" /> Book appointment
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href={buildGuestAuthHref("/signup/patient")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Link>
                <Link
                  href={buildGuestAuthHref("/login")}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/25 focus-within:border-primary/50 transition-all shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe symptoms or ask a follow-up…"
                rows={1}
                className="flex-1 min-h-[56px] max-h-[150px] resize-none border-0 bg-transparent focus:outline-none px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                style={{ overflow: "auto" }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="mb-1 h-9 w-9 shrink-0 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          )}
          {!isLocked && (
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              AI can make mistakes. Always consult a qualified medical professional.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
