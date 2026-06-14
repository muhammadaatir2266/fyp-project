"use client";

import { createContext, useContext, useState } from "react";

interface GuestChatWidgetContextValue {
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
}

const GuestChatWidgetContext = createContext<GuestChatWidgetContextValue | null>(null);

export function GuestChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <GuestChatWidgetContext.Provider
      value={{
        isOpen,
        openChat: () => setIsOpen(true),
        closeChat: () => setIsOpen(false),
        toggleChat: () => setIsOpen((v) => !v),
      }}
    >
      {children}
    </GuestChatWidgetContext.Provider>
  );
}

export function useGuestChatWidget(): GuestChatWidgetContextValue {
  const ctx = useContext(GuestChatWidgetContext);
  if (!ctx) throw new Error("useGuestChatWidget must be used inside GuestChatWidgetProvider");
  return ctx;
}
