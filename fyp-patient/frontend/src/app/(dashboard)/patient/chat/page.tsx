import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] md:h-screen w-full">
      <ChatInterface />
    </div>
  );
}
