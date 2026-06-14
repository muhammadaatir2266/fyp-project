const GUEST_SESSION_KEY = "trimed_guest_session_id";
const GUEST_COMPLETED_KEY = "trimed_guest_chat_completed";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateGuestSessionId(): string {
  if (typeof window === "undefined") return generateUUID();
  const existing = localStorage.getItem(GUEST_SESSION_KEY);
  if (existing) return existing;
  const id = generateUUID();
  localStorage.setItem(GUEST_SESSION_KEY, id);
  return id;
}

export function isGuestChatCompleted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(GUEST_COMPLETED_KEY) === "true";
}

export function markGuestChatCompleted(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_COMPLETED_KEY, "true");
}
