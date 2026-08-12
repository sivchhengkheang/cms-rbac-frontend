"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import { getAuthUser, getStoredAuth } from "../lib/auth";
import { fetchContents, getCurrentUser } from "../lib/api";

export default function AccountPage() {
  const [user, setUser] = useState<{ username: string; role: string } | null>(
    null,
  );
  const [ownContents, setOwnContents] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // prefer server-validated user
      try {
        const resp = (await getCurrentUser()) as any;
        if (resp?.user) {
          setUser({ username: resp.user.username, role: resp.user.role });
          setRoleNow(resp.user.role);
        }
      } catch {
        const stored = getStoredAuth();
        if (stored?.user) {
          setUser({ username: stored.user.username, role: stored.user.role });
          setRoleNow(stored.user.role);
        }
      }

      try {
        const resp = await fetchContents();
        const all = resp.data ?? [];
        const username =
          getAuthUser()?.username ?? getStoredAuth()?.user.username;
        const mine = all.filter((c: any) => c.author?.username === username);
        setOwnContents(mine);
      } catch (e) {
        setOwnContents([]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const [roleNow, setRoleNow] = useState<string | null>(null);
  const canManageUsers = roleNow === "Admin" || roleNow === "Manager";

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored?.user?.role) {
      setRoleNow(stored.user.role);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      <Sidebar canManageUsers={canManageUsers} />
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          <header className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Account</h1>
              <p className="text-sm text-slate-500">Profile & your content</p>
            </div>
            <div>
              <Link
                href="/dashboard"
                className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-white"
              >
                Back
              </Link>
            </div>
          </header>

          <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Your Content</h2>
                <p className="text-sm text-slate-500">
                  A list of content you created
                </p>
              </div>

              {loading ? (
                <p>Loading...</p>
              ) : ownContents.length === 0 ? (
                <p className="text-sm text-slate-500">
                  You have not created any content yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ownContents.map((c) => (
                    <li key={c._id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm text-slate-400">
                            {c.status?.toUpperCase()}
                          </div>
                          <div className="font-semibold">{c.title}</div>
                          <div className="text-sm text-slate-500">
                            {c.body?.slice(0, 120)}
                            {c.body && c.body.length > 120 ? "..." : ""}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end gap-2">
                          <Link
                            href={`/content/${c._id}`}
                            className="rounded-md bg-slate-900 px-3 py-1 text-white text-sm"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="col-span-1 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-slate-200 text-xl font-bold flex items-center justify-center">
                  {(user?.username ?? "U").substring(0, 2).toUpperCase()}
                </div>
                <div className="text-center">
                  <div className="font-semibold">
                    {user?.username ?? "Loading..."}
                  </div>
                  <div className="text-sm text-slate-500">
                    {user?.role ?? ""}
                  </div>
                </div>
                <div className="mt-4 w-full">
                  <Link
                    href="/account/edit"
                    className="inline-flex w-full items-center justify-center rounded-md border px-3 py-2"
                  >
                    Edit profile
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
