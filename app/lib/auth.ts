export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (typeof window !== "undefined"
    ? "https://cms-rbac-server.onrender.com/"
    : "http://localhost:5000");

// `https://{window.localhost.hostname}:5000` : "http://localhost:5000");

const storageKey = "cms-rbac-auth";

export type AuthState = {
  token: string;
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
  return getStoredAuth()?.token ?? null;
}

export function saveAuth(auth: AuthState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey, JSON.stringify(auth));
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
  const token = getToken();
  if (!token) return null;
  return decodeJwt(token) as {
    id: string;
    username: string;
    role: string;
  } | null;
}
