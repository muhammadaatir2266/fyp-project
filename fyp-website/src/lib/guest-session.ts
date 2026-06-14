const GUEST_SESSION_KEY = "trimed_guest_session_id";
const GUEST_COMPLETED_KEY = "trimed_guest_chat_completed";
const GUEST_CONTEXT_KEY = "trimed_guest_context";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
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

// --- Guest context (disease detection results) ---

export interface GuestPrediction {
  disease: string;
  confidence: number;
  specialty?: string;
}

export interface GuestContext {
  guestSessionId: string;
  specialty?: string;
  predictions: GuestPrediction[];
  symptoms?: string[];
  detectedAt: string;
}

export function saveGuestContext(ctx: GuestContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(GUEST_CONTEXT_KEY, JSON.stringify(ctx));
}

export function getGuestContext(): GuestContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(GUEST_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as GuestContext) : null;
  } catch {
    return null;
  }
}

export function clearGuestContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CONTEXT_KEY);
  localStorage.removeItem(GUEST_COMPLETED_KEY);
  localStorage.removeItem(GUEST_SESSION_KEY);
}

/**
 * Build a URL for login or patient signup that carries guest context as
 * query params so the destination can redirect to the doctors page.
 */
export function buildGuestAuthHref(
  path: "/login" | "/signup/patient",
  context?: GuestContext | null
): string {
  const ctx = context ?? (typeof window !== "undefined" ? getGuestContext() : null);
  if (!ctx) return path;

  const params = new URLSearchParams({ from: "guest" });
  if (ctx.specialty) params.set("specialty", ctx.specialty);
  params.set("guestSessionId", ctx.guestSessionId);
  return `${path}?${params.toString()}`;
}
