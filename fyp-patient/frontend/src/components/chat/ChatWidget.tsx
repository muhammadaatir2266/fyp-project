"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Bot } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { useChatWidget } from "./ChatWidgetContext";

function ChatAutoOpen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openChat } = useChatWidget();

  useEffect(() => {
    if (searchParams.get("chat") === "open") {
      openChat();
      // Strip the param from the URL without adding a history entry
      const url = new URL(window.location.href);
      url.searchParams.delete("chat");
      router.replace(url.pathname + (url.search || ""));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export function ChatWidget() {
  const { isOpen, openChat, closeChat, toggleChat } = useChatWidget();

  return (
    <>
      {/* Auto-open handler (reads ?chat=open query param) */}
      <Suspense fallback={null}>
        <ChatAutoOpen />
      </Suspense>

      {/* Popup panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-popup"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl border border-border shadow-2xl bg-background overflow-hidden
                       w-[calc(100vw-2rem)] sm:w-[400px] max-w-[400px]"
            style={{ height: "min(640px, 80vh)" }}
          >
            {/* Panel chrome */}
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
                  Online
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

            {/* Chat body — flex-1 + min-h-0 so the internal scroll works */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <ChatInterface embedded />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating action button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
        aria-label={isOpen ? "Close chat" : "Open chat assistant"}
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
              <MessageSquare className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
