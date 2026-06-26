const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000/api";

export interface InternalDoctorItem {
  source: "internal_db";
  id: string;
  name: string;
  specialty: string;
  city: string;
  rating: number;
  experience: number;
  consultationFee: number;
  workingHours?: { from: string; to: string };
  workingDays?: string[];
}

export interface GoogleDoctorItem {
  source: "google_maps";
  name: string;
  rating: number;
  totalReviews?: number;
  address?: string;
  location?: { lat: number; lng: number };
  googleMapsUrl?: string;
}

export type RecommendedDoctorItem = InternalDoctorItem | GoogleDoctorItem;

export interface DoctorRecommendations {
  source: "internal_db" | "google_maps";
  doctors: RecommendedDoctorItem[];
}

export interface GuestChatResponse {
  success: boolean;
  diseaseDetected: boolean;
  data: {
    message: string;
    prediction?: Array<{ disease: string; confidence: number; specialty?: string }>;
    symptoms?: string[];
    doctorRecommendations?: DoctorRecommendations;
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

export async function saveGuestSnapshot(
  guestSessionId: string,
  predictions: Array<{ disease: string; confidence: number; specialty?: string }>,
  symptoms?: string[],
  specialty?: string,
  messages?: Array<{ id: string; role: "user" | "assistant"; content: string }>
): Promise<void> {
  await fetch(`${AUTH_API_URL}/chat/guest/snapshot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ guestSessionId, predictions, symptoms, specialty, messages }),
  });
}
