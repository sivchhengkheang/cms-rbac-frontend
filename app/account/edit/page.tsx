"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "../../lib/api";
import { clearAuth, getStoredAuth, saveAuth } from "../../lib/auth";

export default function EditAccountPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        const resp = (await getCurrentUser()) as any;
        if (resp?.user) setUsername(resp.user.username);
      } catch (e) {
        const stored = getStoredAuth();
        if (stored?.user) setUsername(stored.user.username);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const token = getStoredAuth()?.token;
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}/api/auth/me`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ username, password: password || undefined }),
        },
      );

      const body = await res.json();
      if (!res.ok) throw new Error(body.message || "Failed to update profile");

      if (body.token) {
        saveAuth({
          token: body.token,
          user: { username: body.user.username, role: body.user.role },
        });
      }

      setSuccess("Profile updated");
      setPassword("");
      setTimeout(() => router.push("/account"), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="text-2xl font-semibold mb-4">Edit Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            New Password (leave blank to keep)
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            className="mt-1 w-full rounded-md border px-3 py-2"
          />
        </div>

        {error && <div className="text-rose-600">{error}</div>}
        {success && <div className="text-emerald-600">{success}</div>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-white"
            disabled={loading}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="rounded-md border px-4 py-2"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
