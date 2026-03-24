export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("doctor_token");
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("doctor_token", token);
}

export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("doctor_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logoutUser(): void {
  removeToken();
}
