import { API_BASE_URL, getToken } from "./auth";

type ApiResponse<T> = {
  message?: string;
  user?: { username: string; role: string };
  token?: string;
  success?: boolean;
  data?: T;
};

async function request<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
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
