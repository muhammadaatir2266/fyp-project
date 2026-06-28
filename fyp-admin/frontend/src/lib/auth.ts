const COOKIE_NAME = "admin_session";

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminToken', token);
    // Presence-only session cookie for Next.js middleware edge-level route protection.
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${COOKIE_NAME}=1; path=/; SameSite=Lax${secure}`;
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken');
  }
  return null;
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('adminToken');
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};
