"use client";

import { GuestChatWidgetProvider } from "@/components/chat/GuestChatWidgetContext";
import { GuestChatWidget } from "@/components/chat/GuestChatWidget";

export default function RootLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <GuestChatWidgetProvider>
      {children}
      <GuestChatWidget />
    </GuestChatWidgetProvider>
  );
}
