"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  User,
  Bot,
  Loader2,
  Stethoscope,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/services/chat.service";
import Link from "next/link";

interface PredictionItem {
  disease: string;
  confidence: number;
}

interface DoctorItem {
  id: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  specialty?: { name: string };
  city?: string;
  rating?: number;
  consultationFee?: number;
}

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  predictions?: PredictionItem[];
  doctors?: DoctorItem[];
};

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm your AI medical assistant powered by Trimed Al. Describe your symptoms and I'll analyze them, suggest possible conditions, and recommend the right specialist for you.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const currentInput = input.trim();
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
      const response = await sendMessage(currentInput, undefined, sessionId);

      if (response.success && response.data) {
        if (response.sessionId) setSessionId(response.sessionId);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            response.data.message ||
            response.data.response ||
            "I received your message.",
          timestamp: new Date(),
          predictions: normalizePredictions(response.data.prediction),
          doctors: response.data.doctors,
        };
        setMessages((prev) => [...prev, aiMessage]);
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
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/10">
            <AvatarFallback className="bg-primary/10 text-primary">
              AI
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-sm font-semibold leading-none">
              Medical Assistant
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
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "flex gap-3 max-w-[88%] md:max-w-[72%]",
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
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

              <div className="flex flex-col gap-2 min-w-0">
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 shadow-sm text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted/50 border rounded-tl-none"
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div
                    className={cn(
                      "text-[10px] mt-1 opacity-70 text-right",
                      message.role === "user"
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    )}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {/* Prediction cards */}
                {message.predictions && message.predictions.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Possible Conditions
                    </p>
                    <div className="space-y-1.5">
                      {message.predictions.map((pred, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs"
                        >
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
                      ))}
                    </div>
                    <p className="text-[10px] text-amber-700 dark:text-amber-500 italic">
                      For informational purposes only. Please consult a qualified doctor.
                    </p>
                  </div>
                )}

                {/* Doctor recommendation cards */}
                {message.doctors && message.doctors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground px-1">
                      Recommended Specialists
                    </p>
                    {message.doctors.slice(0, 3).map((doc) => {
                      const name =
                        doc.fullName ||
                        `${doc.firstName || ""} ${doc.lastName || ""}`.trim();
                      return (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-background border border-border/60 rounded-xl px-3 py-2.5 shadow-sm"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">
                              Dr. {name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {doc.specialty?.name}
                              {doc.city ? ` · ${doc.city}` : ""}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="ml-2 shrink-0 h-7 text-xs gap-1"
                            asChild
                          >
                            <Link
                              href={`/patient/appointments?doctorId=${doc.id}&doctorName=${encodeURIComponent("Dr. " + name)}`}
                            >
                              Book
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
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

      {/* Input */}
      <div className="p-4 bg-background border-t sticky bottom-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-xl border focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe your symptoms..."
              className="min-h-[50px] max-h-[150px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-3"
            />
            <Button
              onClick={handleSendMessage}
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

function normalizePredictions(raw: any): PredictionItem[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return { disease: item, confidence: 1 };
        if (typeof item === "object" && item.disease)
          return { disease: item.disease, confidence: item.confidence ?? 1 };
        return null;
      })
      .filter(Boolean) as PredictionItem[];
  }
  if (typeof raw === "object" && raw.disease)
    return [{ disease: raw.disease, confidence: raw.confidence ?? 1 }];
  return undefined;
}
