"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getStoredAuth } from "./lib/auth";

export default function Home() {
  useEffect(() => {
    const auth = getStoredAuth();
    if (auth?.user) {
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.9fr] lg:items-center">
          <section className="space-y-8">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400">
                CMS Role-Based Access Control
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
                Build secure content workflows for Admins, Managers, and Users.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-700 dark:text-slate-300">
                This CMS frontend connects to the RBAC server so only approved
                accounts can sign in, view content, and take actions authorized
                by their role.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-4 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-800"
              >
                Register
              </Link>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-2xl shadow-slate-200/40 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-950/40">
            <h2 className="text-xl font-semibold text-slate-950 dark:text-white">
              How the app works
            </h2>
            <div className="mt-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
              <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-950 dark:text-white">
                  1. Authenticate
                </p>
                <p>
                  Login or register before accessing the CMS. The server
                  verifies credentials and issues a JWT token.
                </p>
              </div>
              <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-950 dark:text-white">
                  2. Role check
                </p>
                <p>
                  The backend approves the request based on the user role.
                  Admin, Manager, and User get different levels of content
                  access.
                </p>
              </div>
              <div className="space-y-2 rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="font-semibold text-slate-950 dark:text-white">
                  3. Dashboard access
                </p>
                <p>
                  Approved users are redirected to the dashboard, where they can
                  review content and see actions allowed for their role.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Admin",
              description:
                "Create, approve, and delete content. Manage users and global workflows.",
            },
            {
              title: "Manager",
              description:
                "Review drafts, publish approved content, and keep editorial workflows moving.",
            },
            {
              title: "User",
              description:
                "Submit content, view approved items, and participate in role-based review.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/80"
            >
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
