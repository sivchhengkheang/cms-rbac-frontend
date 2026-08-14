import { API_BASE_URL, saveAuth, clearAuth, decodeJwt } from "./auth";

type ApiResponse<T> = {
  message?: string;
  user?: { username: string; role: string };
  token?: string;
  success?: boolean;
  data?: T;
};

async function refreshAccessToken() {
  try {
    const resp = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const body = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(body.message || "Refresh failed");
    }

    // If backend returns a token in the body, decode it for user info
    const newToken = (body as any).token;
    if (newToken) {
      const decoded = decodeJwt(newToken) as any;
      const user = decoded
        ? { username: decoded.username, role: decoded.role }
        : { username: "", role: "" };
      saveAuth({ token: null, user });
      return newToken;
    }

    // If backend returned user info directly
    if ((body as any).user) {
      const u = (body as any).user;
      saveAuth({ token: null, user: { username: u.username, role: u.role } });
      return null;
    }

    // Fallback: try fetching /me for user info
    try {
      const meResp = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const meBody = await meResp.json().catch(() => ({}));
      if (meResp.ok && (meBody as any).user) {
        const u = (meBody as any).user;
        saveAuth({ token: null, user: { username: u.username, role: u.role } });
      }
    } catch {}

    return null;
  } catch (err) {
    clearAuth();
    throw err;
  }
}

async function request<T>(path: string, options: RequestInit = {}) {
  const buildHeaders = (extra?: Record<string, string>) => ({
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
    ...extra,
  });

  const doFetch = async (useToken?: string | null) => {
    const headers: Record<string, string> = buildHeaders(
      undefined,
    );

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
    return response;
  };

  // first attempt
  let response = await doFetch();

  if (response.status === 401) {
    // try refresh once
    try {
      await refreshAccessToken();
      response = await doFetch();
    } catch (err) {
      throw new Error((err as Error).message || "Authentication failed");
    }
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAuth();
    }
    throw new Error(body.message || "Request failed");
  }

  return body as ApiResponse<T>;
}

export async function loginUser(credentials: {
  username: string;
  password: string;
}) {
  return request<{ username: string; role: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(payload: {
  username: string;
  password: string;
  role: string;
}) {
  return request<null>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser() {
  return request<{ username: string; role: string }>("/api/auth/me", {
    method: "GET",
  });
}

export async function fetchContents() {
  return request<
    Array<{
      _id: string;
      title: string;
      body: string;
      status?: string;
      tags?: string[];
      author?: { username: string; role: string };
    }>
  >("/api/contents", {
    method: "GET",
  });
}

export async function createContent(payload: {
  title: string;
  body: string;
  status?: string;
  tags?: string[];
}) {
  return request<{ _id: string }>("/api/content", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateContent(
  id: string,
  payload: {
    title: string;
    body: string;
    status?: string;
    tags?: string[];
  },
) {
  return request<{ _id: string }>(`/api/content/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteContent(id: string) {
  return request<null>(`/api/content/${id}`, {
    method: "DELETE",
  });
}

export async function fetchUsers() {
  return request<
    Array<{
      _id: string;
      username: string;
      role: string;
    }>
  >("/api/users", {
    method: "GET",
  });
}

export async function updateUserRole(id: string, payload: { role: string }) {
  return request<{ _id: string }>(`/api/user/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string) {
  return request<null>(`/api/user/${id}`, {
    method: "DELETE",
  });
}
