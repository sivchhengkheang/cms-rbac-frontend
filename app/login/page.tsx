"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getStoredAuth, saveAuth } from "../lib/auth";
import { loginUser } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser({ username, password });
      if (!response.token || !response.user) {
        throw new Error(response.message || "Login failed");
      }
      saveAuth({ token: response.token, user: response.user });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-xl rounded-3xl bg-white p-10 shadow-xl shadow-slate-200/80 dark:bg-slate-900 dark:shadow-black/20">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
            CMS RBAC Portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Login to access your role-based dashboard, manage content, and view
            approvals.
          </p>
        </div>

        <form className="space-y-6" autoComplete="off" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
            </span>
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              placeholder="Enter your name"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="Enter your password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Don’t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-slate-900 hover:text-slate-700 dark:text-slate-100 dark:hover:text-slate-200"
          >
            Register here
          </Link>
        </div>
      </main>
    </div>
  );
}
