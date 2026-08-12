"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAuthUser, getStoredAuth, clearAuth } from "../lib/auth";
import { getCurrentUser } from "../lib/api";

type Props = {
  activeTab?: "content" | "users";
  setActiveTab?: (t: "content" | "users") => void;
  canManageUsers?: boolean;
  onLogout?: () => void;
};

export default function Sidebar({
  activeTab,
  setActiveTab,
  canManageUsers,
  onLogout,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [currentUsername, setCurrentUsername] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const resp = (await getCurrentUser()) as any;
        if (resp?.user) {
          setCurrentUsername(resp.user.username);
          setUserRole(resp.user.role);
          setMounted(true);
          return;
        }
      } catch (_) {}

      const stored = getStoredAuth();
      if (stored?.user) {
        setCurrentUsername(stored.user.username);
        setUserRole(stored.user.role);
      }
      setMounted(true);
    };
    init();
  }, []);

  const handleLogout = () => {
    if (onLogout) return onLogout();
    clearAuth();
    // fallback: reload to login
    window.location.href = "/login";
  };

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 lg:block">
      <div className="flex h-full flex-col p-6">
        <div className="mb-10 flex items-center gap-3 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">
            C
          </div>
          <span className="text-lg font-bold tracking-tight">CMS Admin</span>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => {
              if (setActiveTab) return setActiveTab("content");
              router.push("/dashboard");
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === "content"
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            Content Management
          </button>

          <Link
            href="/account"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname?.startsWith("/account")
                ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
            }`}
          >
            Account
          </Link>

          {canManageUsers && (
            <button
              onClick={() => {
                if (setActiveTab) return setActiveTab("users");
                router.push("/dashboard?tab=users");
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                  : "text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50"
              }`}
            >
              User Directory
            </button>
          )}
        </nav>

        <div className="mt-auto border-t border-slate-100 pt-6 dark:border-slate-800">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-medium dark:bg-slate-800">
              {mounted ? currentUsername.substring(0, 2).toUpperCase() : ""}
            </div>
            <div className="flex flex-col">
              <span
                style={{ maxWidth: 120 }}
                className="truncate text-sm font-semibold"
              >
                {mounted ? currentUsername : "Loading..."}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                {mounted ? userRole : ""}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-rose-500 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
