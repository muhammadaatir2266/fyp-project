const COOKIE_NAME = "doctor_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("doctor_token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("doctor_token", token);
  // Set a presence-only cookie so Next.js middleware can gate dashboard routes at the edge.
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=1; path=/; SameSite=Lax${secure}`;
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("doctor_token");
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logoutUser(): void {
  removeToken();
}
