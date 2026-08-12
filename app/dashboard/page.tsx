"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "../components/Sidebar";
import {
  API_BASE_URL,
  clearAuth,
  getAuthUser,
  getStoredAuth,
  saveAuth,
} from "../lib/auth";
import {
  createContent,
  deleteContent,
  deleteUser,
  fetchContents,
  fetchUsers,
  updateContent,
  updateUserRole,
  getCurrentUser,
} from "../lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"content" | "users">("content");
  const [contents, setContents] = useState<
    Array<{
      _id: string;
      title: string;
      body: string;
      status?: string;
      tags?: string[];
      author?: { username: string; role: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<string | null>(null);

  const [users, setUsers] = useState<
    Array<{ _id: string; username: string; role: string }>
  >([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState("User");
  const [userActionLoading, setUserActionLoading] = useState(false);
  const [userActionError, setUserActionError] = useState("");
  const [userActionSuccess, setUserActionSuccess] = useState("");
  const [mounted, setMounted] = useState(false);

  const currentUsername = getAuthUser()?.username ?? "";
  const contentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const init = async () => {
      // Respect optional ?tab=users query so external navigation targets correct section
      try {
        const search =
          typeof window !== "undefined" ? window.location.search : "";
        const params = new URLSearchParams(search);
        const tab = params.get("tab");
        if (tab === "users") setActiveTab("users");
        else setActiveTab("content");
      } catch (_) {
        setActiveTab("content");
      }
      const auth = getStoredAuth();
      if (!auth?.token) {
        router.replace("/login");
        return;
      }

      // fetch up-to-date user info from server and update local storage
      try {
        const resp = (await getCurrentUser()) as any;
        if (resp?.user) {
          const token = resp.token ?? auth.token;
          saveAuth({
            token,
            user: { username: resp.user.username, role: resp.user.role },
          });
          setUserRole(resp.user.role);
        } else {
          const user = getAuthUser();
          const role = user?.role ?? auth.user.role;
          setUserRole(role);
        }
      } catch (err) {
        // Failed to refresh user, fall back to stored auth
        const user = getAuthUser();
        const role = user?.role ?? auth.user.role;
        setUserRole(role);
      }

      // load contents and users based on refreshed role
      fetchContents()
        .then((response) => {
          setContents(response.data ?? []);
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "Failed to load content",
          );
        })
        .finally(() => setLoading(false));

      const roleNow = getAuthUser()?.role ?? getStoredAuth()?.user.role;
      if (roleNow === "Admin" || roleNow === "Manager") {
        setUsersLoading(true);
        setUsersError("");
        fetchUsers()
          .then((response) => {
            setUsers(response.data ?? []);
          })
          .catch((err) => {
            setUsersError(
              err instanceof Error ? err.message : "Failed to load users",
            );
          })
          .finally(() => setUsersLoading(false));
      } else {
        setUsersLoading(false);
      }
      setMounted(true);
    };

    init();
  }, [router]);

  // Socket listeners with debounced refresh (10s)
  useEffect(() => {
    const socket = io(API_BASE_URL);

    const startContentDebounce = () => {
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      contentTimerRef.current = setTimeout(() => {
        fetchContents()
          .then((response) => setContents(response.data ?? []))
          .catch(() => {});
        contentTimerRef.current = null;
      }, 10000);
    };

    const startUserDebounce = () => {
      if (userTimerRef.current) clearTimeout(userTimerRef.current);
      userTimerRef.current = setTimeout(async () => {
        try {
          const me = (await getCurrentUser()) as any;
          if (!me || !me.user) {
            clearAuth();
            router.replace("/login");
            return;
          }
        } catch (e) {
          clearAuth();
          router.replace("/login");
          return;
        }

        const roleNow = getAuthUser()?.role ?? getStoredAuth()?.user.role;
        if (roleNow === "Admin" || roleNow === "Manager") {
          fetchUsers()
            .then((response) => setUsers(response.data ?? []))
            .catch(() => {});
        }

        userTimerRef.current = null;
      }, 10000);
    };

    socket.on("connect", () => {
      // connected
    });
    socket.on("content:changed", startContentDebounce);
    socket.on("user:changed", startUserDebounce);

    return () => {
      if (contentTimerRef.current) clearTimeout(contentTimerRef.current);
      if (userTimerRef.current) clearTimeout(userTimerRef.current);
      socket.disconnect();
    };
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTags, setNewTags] = useState("");
  const [newStatus, setNewStatus] = useState("draft");
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null,
  );
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  const resetForm = () => {
    setSelectedContentId(null);
    setNewTitle("");
    setNewBody("");
    setNewTags("");
    setNewStatus("draft");
    setCreateError("");
    setCreateSuccess("");
  };

  const handleSelectUser = (user: {
    _id: string;
    username: string;
    role: string;
  }) => {
    setSelectedUserId(user._id);
    setSelectedUserRole(user.role);
    setUserActionError("");
    setUserActionSuccess("");
  };

  const handleCancelUserEdit = () => {
    setSelectedUserId(null);
    setSelectedUserRole("User");
    setUserActionError("");
    setUserActionSuccess("");
  };

  const handleSaveUserRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUserId) return;

    setUserActionError("");
    setUserActionSuccess("");
    setUserActionLoading(true);

    try {
      await updateUserRole(selectedUserId, { role: selectedUserRole });
      setUserActionSuccess("User role updated successfully.");
      const response = await fetchUsers();
      setUsers(response.data ?? []);
      handleCancelUserEdit();
    } catch (err) {
      setUserActionError(
        err instanceof Error ? err.message : "Failed to update user role",
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    const confirmed = window.confirm("Delete this user permanently?");
    if (!confirmed) return;

    setUserActionError("");
    setUserActionSuccess("");
    setUserActionLoading(true);

    try {
      await deleteUser(id);
      setUserActionSuccess("User deleted successfully.");
      if (selectedUserId === id) {
        handleCancelUserEdit();
      }
      const response = await fetchUsers();
      setUsers(response.data ?? []);
    } catch (err) {
      setUserActionError(
        err instanceof Error ? err.message : "Failed to delete user",
      );
    } finally {
      setUserActionLoading(false);
    }
  };

  const handleSaveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreateLoading(true);

    try {
      const payload = {
        title: newTitle,
        body: newBody,
        status: newStatus,
        tags: newTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };

      if (selectedContentId) {
        await updateContent(selectedContentId, payload);
        setCreateSuccess("Content updated successfully.");
      } else {
        await createContent(payload);
        setCreateSuccess("Content created successfully.");
      }

      resetForm();
      const response = await fetchContents();
      setContents(response.data ?? []);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to save content",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditClick = (content: {
    _id: string;
    title: string;
    body: string;
    status?: string;
    tags?: string[];
  }) => {
    setSelectedContentId(content._id);
    setNewTitle(content.title);
    setNewBody(content.body);
    setNewStatus(content.status ?? "draft");
    setNewTags((content.tags ?? []).join(", "));
    setCreateError("");
    setCreateSuccess("");
  };

  const handleDeleteClick = async (id: string) => {
    const confirmed = window.confirm("Delete this content permanently?");
    if (!confirmed) return;

    setCreateError("");
    setCreateSuccess("");
    setCreateLoading(true);

    try {
      await deleteContent(id);
      setCreateSuccess("Content deleted successfully.");
      if (selectedContentId === id) {
        resetForm();
      }
      const response = await fetchContents();
      setContents(response.data ?? []);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : "Failed to delete content",
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const canCreate = userRole === "Admin" || userRole === "Manager";
  const canEdit = userRole === "Admin";
  const canDelete = userRole === "Admin";
  const canManageUsers = userRole === "Admin" || userRole === "Manager";

  const publishedCount = contents.filter(
    (content) => content.status?.toLowerCase() === "published",
  ).length;
  const draftCount = contents.filter(
    (content) => content.status?.toLowerCase() === "draft",
  ).length;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100">
      {/* Sidebar Navigation */}
      {/** Sidebar component shared across pages */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        canManageUsers={canManageUsers}
        onLogout={handleLogout}
      />

      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10">
          <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                {activeTab === "content" ? "Contents" : "Users"}
              </h1>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                {activeTab === "content"
                  ? "Manage and publish your application content."
                  : "Overview and access control for system users."}
              </p>
            </div>
            {activeTab === "content" && canCreate && (
              <button
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                New Entry
              </button>
            )}
          </header>

          <div className="mb-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Items
              </p>
              <p className="mt-2 text-2xl font-bold">{contents.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Published
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {publishedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Drafts
              </p>
              <p className="mt-2 text-2xl font-bold text-amber-500">
                {draftCount}
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
            <div className="space-y-6">
              {activeTab === "content" ? (
                <section className="space-y-4">
                  {loading ? (
                    <div className="py-20 text-center text-slate-400">
                      Loading...
                    </div>
                  ) : contents.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-20 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                      No content items found.
                    </div>
                  ) : (
                    contents.map((content) => (
                      <article
                        key={content._id}
                        className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex items-center gap-2">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                                  content.status?.toLowerCase() === "published"
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                                    : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                }`}
                              >
                                {content.status ?? "DRAFT"}
                              </span>
                              <span className="text-xs text-slate-400">
                                by {content.author?.username ?? "Unknown"}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                              {content.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400">
                              {content.body}
                            </p>
                          </div>
                          <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            {canEdit && (
                              <button
                                onClick={() => handleEditClick(content)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                              >
                                Edit
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteClick(content._id)}
                                className="rounded-lg p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </section>
              ) : (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          User
                        </th>
                        <th className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          Role
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-900 dark:text-white">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="group hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            {user.username}
                            {user.username === currentUsername ? " (You)" : ""}
                          </td>
                          <td className="px-6 py-4">
                            <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-bold uppercase dark:bg-slate-800">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => handleSelectUser(user)}
                                className="text-indigo-600 font-medium hover:underline dark:text-indigo-400"
                              >
                                Edit role
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                disabled={user.username === currentUsername}
                                className="text-rose-600 font-medium hover:underline disabled:opacity-50 dark:text-rose-400"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                {activeTab === "content" ? (
                  canCreate ? (
                    <form className="space-y-4" onSubmit={handleSaveContent}>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {selectedContentId ? "Edit Entry" : "Create Entry"}
                      </h3>
                      {createError ? (
                        <p className="text-xs text-rose-600">{createError}</p>
                      ) : null}
                      {createSuccess ? (
                        <p className="text-xs text-emerald-600">
                          {createSuccess}
                        </p>
                      ) : null}
                      <div className="space-y-3">
                        <input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                          placeholder="Title"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <textarea
                          value={newBody}
                          onChange={(e) => setNewBody(e.target.value)}
                          required
                          rows={4}
                          placeholder="Content body..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800"
                        />
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                        <input
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                          placeholder="Tags (comma separated)"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={createLoading}
                            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {createLoading
                              ? "Saving..."
                              : selectedContentId
                                ? "Update"
                                : "Create"}
                          </button>
                          {selectedContentId && (
                            <button
                              type="button"
                              onClick={resetForm}
                              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-slate-500">
                        Select an item to view or edit details.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      User Management
                    </h3>
                    {selectedUserId ? (
                      <form className="space-y-4" onSubmit={handleSaveUserRole}>
                        <div>
                          <p className="text-xs text-slate-500">
                            Editing user:
                          </p>
                          <p className="text-sm font-semibold">
                            {
                              users.find((u) => u._id === selectedUserId)
                                ?.username
                            }
                          </p>
                        </div>
                        {userActionError ? (
                          <p className="text-xs text-rose-600">
                            {userActionError}
                          </p>
                        ) : null}
                        {userActionSuccess ? (
                          <p className="text-xs text-emerald-600">
                            {userActionSuccess}
                          </p>
                        ) : null}
                        <select
                          value={selectedUserRole}
                          onChange={(e) => setSelectedUserRole(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Manager">Manager</option>
                          <option value="User">User</option>
                        </select>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={userActionLoading}
                            className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {userActionLoading ? "Saving..." : "Save Changes"}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelUserEdit}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-slate-500">
                        Select a user from the directory to update their role or
                        manage their account.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
