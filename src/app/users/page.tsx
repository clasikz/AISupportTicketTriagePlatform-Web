"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { endpoints } from "@/lib/endpoints";
import { UserRole } from "@/types";

interface UserRow {
    masterId: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    isAdmin: boolean;
    createdAt: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
    [UserRole.Agent]: "Agent",
    [UserRole.Customer]: "Customer",
};

export default function UsersPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [toggling, setToggling] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: UserRole.Customer,
        isAdmin: false,
    });
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.isAdmin) {
            router.replace("/");
        }
    }, [user, router]);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(endpoints.users);
            if (!res.ok) throw new Error();
            setUsers(await res.json());
        } catch {
            showToast("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.isAdmin) fetchUsers();
    }, [user, fetchUsers]);

    async function handleToggleAdmin(masterId: string, currentIsAdmin: boolean) {
        setToggling(masterId);
        try {
            const res = await apiFetch(endpoints.updateUser(masterId), {
                method: "PATCH",
                body: JSON.stringify({ isAdmin: !currentIsAdmin }),
            });
            if (!res.ok) throw new Error();
            setUsers((prev) =>
                prev.map((u) => (u.masterId === masterId ? { ...u, isAdmin: !currentIsAdmin } : u)),
            );
        } catch {
            showToast("Failed to update user");
        } finally {
            setToggling(null);
        }
    }

    async function handleDelete(masterId: string) {
        if (!confirm("Delete this user? This cannot be undone.")) return;
        setDeleting(masterId);
        try {
            const res = await apiFetch(endpoints.deleteUser(masterId), { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                showToast(body?.error ?? "Failed to delete user");
                return;
            }
            setUsers((prev) => prev.filter((u) => u.masterId !== masterId));
            showToast("User deleted");
        } finally {
            setDeleting(null);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setCreating(true);
        try {
            const res = await apiFetch(endpoints.users, {
                method: "POST",
                body: JSON.stringify(form),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                setFormError(body?.error ?? "Failed to create user");
                return;
            }
            setShowCreate(false);
            setForm({
                firstName: "",
                lastName: "",
                email: "",
                password: "",
                role: UserRole.Customer,
                isAdmin: false,
            });
            await fetchUsers();
            showToast("User created");
        } finally {
            setCreating(false);
        }
    }

    if (!user?.isAdmin) return null;

    return (
        <div className="px-6 py-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-[#172b4d]">Users</h1>
                    <p className="text-[12px] text-[#5e6c84] mt-0.5">
                        Manage user accounts and admin access
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="h-8 px-3 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors"
                >
                    Add user
                </button>
            </div>

            <div className="bg-white rounded-lg border border-[#dfe1e6] overflow-hidden mb-12">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#dfe1e6] bg-[#f4f5f7]">
                            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Name
                            </th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Email
                            </th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                ID
                            </th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Role
                            </th>
                            <th className="px-4 py-2.5 text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide">
                                Admin
                            </th>
                            <th className="px-4 py-2.5" />
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="border-b border-[#f4f5f7]">
                                    {Array.from({ length: 6 }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <div className="h-3 bg-[#ebecf0] rounded animate-pulse w-24" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-4 py-8 text-center text-[13px] text-[#5e6c84]"
                                >
                                    No users found
                                </td>
                            </tr>
                        ) : (
                            users.map((u) => (
                                <tr
                                    key={u.masterId}
                                    className="border-b border-[#f4f5f7] hover:bg-[#fafbfc]"
                                >
                                    <td className="px-4 py-3 text-[13px] font-medium text-[#172b4d]">
                                        {u.firstName} {u.lastName}
                                    </td>
                                    <td className="px-4 py-3 text-[13px] text-[#42526e]">
                                        {u.email}
                                    </td>
                                    <td className="px-4 py-3 text-[12px] text-[#97a0af] font-mono">
                                        {u.masterId}
                                    </td>
                                    <td className="px-4 py-3 text-[13px] text-[#42526e]">
                                        {ROLE_LABELS[u.role] ?? u.role}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            disabled={
                                                toggling === u.masterId ||
                                                u.masterId === user.masterId
                                            }
                                            onClick={() => handleToggleAdmin(u.masterId, u.isAdmin)}
                                            title={
                                                u.masterId === user.masterId
                                                    ? "Cannot change your own admin status"
                                                    : undefined
                                            }
                                            className={`w-9 h-5 rounded-full relative transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                                                u.isAdmin ? "bg-primary" : "bg-[#dfe1e6]"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 left-0 ${
                                                    u.isAdmin
                                                        ? "translate-x-[18px]"
                                                        : "translate-x-0.5"
                                                }`}
                                            />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {u.masterId !== user.masterId && (
                                            <button
                                                disabled={deleting === u.masterId}
                                                onClick={() => handleDelete(u.masterId)}
                                                className="text-[12px] text-[#97a0af] hover:text-red-500 transition-colors disabled:opacity-50"
                                            >
                                                {deleting === u.masterId ? "Deleting..." : "Delete"}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCreate && (
                <>
                    <div
                        className="fixed inset-0 bg-[#091e42]/30 z-40"
                        onClick={() => setShowCreate(false)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg border border-[#dfe1e6] shadow-xl w-full max-w-md">
                            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dfe1e6]">
                                <span className="text-[14px] font-semibold text-[#172b4d]">
                                    Add user
                                </span>
                                <button
                                    onClick={() => setShowCreate(false)}
                                    className="w-7 h-7 rounded hover:bg-[#f4f5f7] text-[#5e6c84] flex items-center justify-center text-base transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="px-5 py-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                            First name
                                        </label>
                                        <input
                                            required
                                            value={form.firstName}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    firstName: e.target.value,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                            Last name
                                        </label>
                                        <input
                                            required
                                            value={form.lastName}
                                            onChange={(e) =>
                                                setForm((f) => ({ ...f, lastName: e.target.value }))
                                            }
                                            className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Email
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        value={form.email}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, email: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                        Password
                                    </label>
                                    <input
                                        required
                                        type="password"
                                        value={form.password}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, password: e.target.value }))
                                        }
                                        className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-[#5e6c84] uppercase tracking-wide mb-1">
                                            Role
                                        </label>
                                        <select
                                            value={form.role}
                                            onChange={(e) =>
                                                setForm((f) => ({
                                                    ...f,
                                                    role: Number(e.target.value) as UserRole,
                                                }))
                                            }
                                            className="w-full px-3 py-2 border border-[#dfe1e6] rounded text-[13px] text-[#172b4d] focus:outline-none focus:border-primary bg-white"
                                        >
                                            <option value={UserRole.Customer}>Customer</option>
                                            <option value={UserRole.Agent}>Agent</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col justify-end">
                                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                                            <input
                                                type="checkbox"
                                                checked={form.isAdmin}
                                                onChange={(e) =>
                                                    setForm((f) => ({
                                                        ...f,
                                                        isAdmin: e.target.checked,
                                                    }))
                                                }
                                                className="w-4 h-4 rounded border-[#dfe1e6] text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-[13px] text-[#172b4d] font-medium">
                                                Admin
                                            </span>
                                        </label>
                                    </div>
                                </div>
                                {formError && (
                                    <p className="text-[12px] text-red-600">{formError}</p>
                                )}
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreate(false)}
                                        className="h-8 px-3 bg-white border border-[#dfe1e6] text-[#42526e] text-[13px] font-medium rounded hover:bg-[#f4f5f7] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="h-8 px-3 bg-primary hover:bg-primary-dark text-white text-[13px] font-medium rounded transition-colors disabled:opacity-50"
                                    >
                                        {creating ? "Creating..." : "Create"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}

            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#172b4d] text-white text-[13px] rounded shadow-lg whitespace-nowrap z-50">
                    {toast}
                </div>
            )}
        </div>
    );
}
