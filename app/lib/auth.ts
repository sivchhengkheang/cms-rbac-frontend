export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}${
        window.location.hostname === "localhost" ? ":5000" : ""
      }`
    : "http://localhost:5000");

const storageKey = "cms-rbac-auth";

export type AuthState = {
  // token is not stored client-side when using httpOnly cookies
  token?: string | null;
  user: {
    username: string;
    role: string;
  };
};

export function getStoredAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  // access tokens are kept in httpOnly cookies; not available to JS
  return null;
}

export function saveAuth(auth: AuthState) {
  if (typeof window === "undefined") return;
  // only persist non-sensitive user info; do NOT persist tokens
  const toStore = { token: null, user: auth.user } as AuthState;
  localStorage.setItem(storageKey, JSON.stringify(toStore));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}

export function decodeJwt(token: string) {
  try {
    const body = token.split(".")[1];
    const decoded = atob(body.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(
      decodeURIComponent(
        decoded
          .split("")
          .map(
            (char) => `%${("00" + char.charCodeAt(0).toString(16)).slice(-2)}`,
          )
          .join(""),
      ),
    );
  } catch {
    return null;
  }
}

export function getAuthUser() {
  const stored = getStoredAuth();
  return (stored?.user ?? null) as {
    id?: string;
    username: string;
    role: string;
  } | null;
}
