"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bot, Stethoscope } from "lucide-react";
import GuestChatInterface from "./GuestChatInterface";
import { useGuestChatWidget } from "./GuestChatWidgetContext";

type AccessState = "checking" | "allowed" | "blocked";

export function GuestChatWidget() {
  const { isOpen, openChat, closeChat, toggleChat } = useGuestChatWidget();
  const [access, setAccess] = useState<AccessState>("checking");

  useEffect(() => {
    // Logged-in patient? Chat lives in the patient app, not here.
    const token = localStorage.getItem("authToken");
    if (token) {
      setAccess("blocked");
      return;
    }
    setAccess("allowed");
  }, []);

  // Close on Escape + lock background scroll while the modal is open.
  // (Hooks must run unconditionally — guard inside the effect, not before it.)
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeChat]);

  // Don't show the widget at all for logged-in patients
  if (access === "checking" || access === "blocked") return null;

  const handleFABClick = () => {
    if (isOpen) {
      toggleChat();
    } else {
      // If chat was already completed, open the modal — GuestChatInterface will
      // restore the locked state with previous predictions so the user sees CTAs.
      openChat();
    }
  };

  return (
    <>
      {/* Modal overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="guest-chat-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
              onClick={closeChat}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              key="guest-chat-panel"
              role="dialog"
              aria-modal="true"
              aria-label="DocLink Care AI"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex flex-col rounded-2xl border border-border shadow-2xl bg-background overflow-hidden
                         w-[calc(100vw-1rem)] h-[calc(100dvh-1rem)]
                         sm:w-[min(92vw,56rem)] sm:max-w-4xl sm:h-[min(90dvh,52rem)]"
            >
              {/* Panel chrome */}
              <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-4 border-b bg-linear-to-r from-primary/10 via-background to-background backdrop-blur shrink-0">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md shadow-primary/30">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-background" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground leading-tight tracking-tight">
                    DocLink Care AI
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Symptom analysis &middot; Guest session
                  </p>
                </div>
                <button
                  onClick={closeChat}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  aria-label="Close chat"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Chat body */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <GuestChatInterface embedded />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={handleFABClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
        aria-label={isOpen ? "Close chat" : "Check your symptoms with DocLink Care AI"}
      >
        {/* Attention pulse when closed */}
        {!isOpen && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-primary/40 animate-ping" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative"
            >
              <Stethoscope className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
