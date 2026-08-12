"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { registerUser, loginUser } from "../lib/api";
import { saveAuth, decodeJwt } from "../lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const resp = (await registerUser({ username, password, role })) as any;
      // If backend returned a token, save auth and go straight to dashboard
      if (resp?.token) {
        const user = resp.user ?? decodeJwt(resp.token);
        if (user) {
          saveAuth({
            token: resp.token,
            user: { username: user.username, role: user.role },
          });
        }
        router.push("/dashboard");
        return;
      }

      // If register didn't return a token, try to login immediately
      try {
        const loginResp = (await loginUser({ username, password })) as any;
        if (loginResp?.token) {
          const user = loginResp.user ?? decodeJwt(loginResp.token);
          if (user) {
            saveAuth({
              token: loginResp.token,
              user: { username: user.username, role: user.role },
            });
          }
          router.push("/dashboard");
          return;
        }
      } catch {
        // ignore login error and fall back to redirect to login page
      }

      setSuccess("Account created successfully.");
      setUsername("");
      setPassword("");
      setRole("User");
      setTimeout(() => router.push("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-xl rounded-[2rem] bg-white p-10 shadow-2xl shadow-slate-200/30 ring-1 ring-slate-200/80 backdrop-blur-xl dark:bg-slate-950/95 dark:shadow-slate-950/40 dark:ring-slate-700/50">
        <div className="mb-8 space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400">
            CMS RBAC portal
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl text-slate-950 dark:text-white">
            Create your account
          </h1>
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
            Register with a role to try Admin, Manager, or User access levels in
            the CMS.
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
              placeholder="alice"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
            </span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              placeholder="Create a password"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-slate-500"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {success ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-300">
              {success}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register account"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-slate-950 hover:text-slate-700 dark:text-white dark:hover:text-slate-200"
          >
            Sign in
          </Link>
        </div>
      </main>
    </div>
  );
}
