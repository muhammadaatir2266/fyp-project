const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:5000/api";

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  patient?: { id: string; firstName: string; lastName: string };
  doctor?: { id: string; firstName: string; lastName: string };
  admin?: { id: string; firstName: string; lastName: string };
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const login = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const res = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error || "Login failed. Please try again.");
  }

  return res.json();
};

export interface PatientSignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  address?: string;
  medicalHistory?: string;
  allergies?: string;
}

export const signupPatient = async (data: PatientSignupData): Promise<LoginResponse> => {
  const res = await fetch(`${AUTH_API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, role: "PATIENT" }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Signup failed. Please try again.");
  }

  return res.json();
};

export interface GuestRedirectOpts {
  specialty?: string;
  guestSessionId?: string;
  redirect?: "doctors";
}

export const getRedirectUrl = (
  role: UserRole,
  token: string,
  guestOpts?: GuestRedirectOpts
): string => {
  const encoded = encodeURIComponent(token);

  const patientUrl =
    process.env.NEXT_PUBLIC_PATIENT_APP_URL || "http://localhost:3000";
  const doctorUrl =
    process.env.NEXT_PUBLIC_DOCTOR_APP_URL || "http://localhost:3001";
  const adminUrl =
    process.env.NEXT_PUBLIC_ADMIN_APP_URL || "http://localhost:3002";

  if (role === "PATIENT" && guestOpts) {
    const params = new URLSearchParams({ token: encoded });
    if (guestOpts.redirect) params.set("redirect", guestOpts.redirect);
    if (guestOpts.specialty) params.set("specialty", guestOpts.specialty);
    if (guestOpts.guestSessionId) params.set("guestSessionId", guestOpts.guestSessionId);
    return `${patientUrl}/auth/callback?${params.toString()}`;
  }

  switch (role) {
    case "PATIENT":
      return `${patientUrl}/auth/callback?token=${encoded}`;
    case "DOCTOR":
      return `${doctorUrl}/auth/callback?token=${encoded}`;
    case "ADMIN":
      return `${adminUrl}/auth/callback?token=${encoded}`;
  }
};
