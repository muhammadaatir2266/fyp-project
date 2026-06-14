"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Bot, Stethoscope } from "lucide-react";
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

  // Don't show the widget at all for logged-in patients
  if (access === "checking" || access === "blocked") return null;

  const handleOpen = () => {
    // If chat was already completed, open the popup — GuestChatInterface will
    // restore the locked state with previous predictions so the user sees CTAs.
    openChat();
  };

  const handleFABClick = () => {
    if (isOpen) {
      toggleChat();
    } else {
      handleOpen();
    }
  };

  return (
    <>
      {/* Popup panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="guest-chat-popup"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl border border-border shadow-2xl bg-background overflow-hidden
                       w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]"
            style={{ height: "min(620px, 80vh)" }}
          >
            {/* Popup chrome */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-none">Medical Assistant</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                  </span>
                  Online · Guest session
                </p>
              </div>
              <button
                onClick={closeChat}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat body */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <GuestChatInterface embedded />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={handleFABClick}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
        aria-label={isOpen ? "Close chat" : "Check your symptoms with AI"}
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
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
            >
              <Stethoscope className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
