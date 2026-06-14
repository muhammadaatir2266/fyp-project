const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000/api";

export interface GuestChatResponse {
  success: boolean;
  diseaseDetected: boolean;
  data: {
    message: string;
    prediction?: Array<{ disease: string; confidence: number }>;
    symptoms?: string[];
  };
}

export async function sendGuestMessage(
  message: string,
  guestSessionId: string,
  location?: string
): Promise<GuestChatResponse> {
  const res = await fetch(`${AUTH_API_URL}/chat/guest/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, guestSessionId, ...(location && { location }) }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Failed to send message. Please try again.");
  }

  return res.json();
}
