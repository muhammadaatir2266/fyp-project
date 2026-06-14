"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Stethoscope, LogIn, UserPlus, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { sendGuestMessage, saveGuestSnapshot } from "@/lib/guest-chat";
import {
  getOrCreateGuestSessionId,
  isGuestChatCompleted,
  markGuestChatCompleted,
  saveGuestContext,
  buildGuestAuthHref,
  type GuestPrediction,
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
}

const cn = (...classes: (string | undefined | false)[]) =>
  classes.filter(Boolean).join(" ");

export default function GuestChatInterface({ embedded = false }: { embedded?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI medical assistant. Describe your symptoms and I'll analyze them and suggest possible conditions. No account needed for your first session.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [topSpecialty, setTopSpecialty] = useState<string | undefined>(undefined);
  const [guestSessionId, setGuestSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuestSessionId(getOrCreateGuestSessionId());
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || isLocked || !guestSessionId) return;

    const text = input.trim();
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() },
    ]);

    try {
      const response = await sendGuestMessage(text, guestSessionId);

      const predictions = response.data.prediction ?? [];

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.message || "I received your message.",
          timestamp: new Date(),
          predictions: predictions.length > 0 ? predictions : undefined,
        },
      ]);

      if (response.diseaseDetected) {
        markGuestChatCompleted();
        const topSpec = predictions[0]?.specialty;
        setTopSpecialty(topSpec);
        setIsLocked(true);

        // Persist context so login/signup pages can carry it through
        const ctx = {
          guestSessionId,
          specialty: topSpec,
          predictions: predictions as GuestPrediction[],
          symptoms: response.data.symptoms,
          detectedAt: new Date().toISOString(),
        };
        saveGuestContext(ctx);

        // Fire-and-forget snapshot to backend for later claim
        saveGuestSnapshot(guestSessionId, predictions as GuestPrediction[], response.data.symptoms, topSpec).catch(
          () => {}
        );
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
      {/* Header — hidden when inside the popup widget (popup chrome provides its own) */}
      {!embedded && (
        <div className="flex items-center gap-3 p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-none">Medical Assistant</h2>
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
              href="/login"
              className="ml-auto text-xs font-medium text-primary hover:text-accent transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "flex gap-3 max-w-[88%] md:max-w-[72%]",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
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

                <div className="flex flex-col gap-2 min-w-0">
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted/50 border rounded-tl-none"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    <div
                      className={cn(
                        "text-[10px] mt-1 opacity-60 text-right",
                        msg.role === "user" ? "text-primary-foreground" : "text-muted-foreground"
                      )}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  {/* Prediction cards */}
                  {msg.predictions && msg.predictions.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
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
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex gap-3">
              <div className="h-8 w-8 mt-1 shrink-0 rounded-full flex items-center justify-center border shadow-sm bg-primary text-primary-foreground">
                <Bot className="h-4 w-4" />
              </div>
              <div className="bg-muted/50 border rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area / locked state */}
      <div className="p-4 bg-background border-t sticky bottom-0 z-10">
        <div className="max-w-3xl mx-auto">
          {isLocked ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 text-center space-y-3"
            >
              <div className="flex justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Ready to find a specialist?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create an account or sign in to find{topSpecialty ? ` a ${topSpecialty}` : " a specialist"} near you and book an appointment.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link
                  href={buildGuestAuthHref("/signup/patient")}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Link>
                <Link
                  href={buildGuestAuthHref("/login")}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your symptoms…"
                rows={1}
                className="flex-1 min-h-[50px] max-h-[150px] resize-none border-0 bg-transparent focus:outline-none px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                style={{ overflow: "auto" }}
              />
              <button
                onClick={handleSend}
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
