"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, UserPlus, Trash2, RefreshCw } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface ClerkUser {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
  role: string;
  createdAt: number;
  lastSignInAt: number | null;
}

function Avatar({ user }: { user: ClerkUser }) {
  const initials = user.name === "—"
    ? user.email.slice(0, 2).toUpperCase()
    : user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="relative w-8 h-8 flex-shrink-0">
      {user.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#f0f0f0] border border-[#e5e5e5] flex items-center justify-center text-[11px] font-semibold text-[#555]">
          {initials}
        </div>
      )}
    </div>
  );
}

type Tab = "admins" | "users";

export default function SettingsPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("admins");
  const [allUsers, setAllUsers] = useState<ClerkUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error();
      setAllUsers(await res.json());
    } catch {
      toast({ title: "Failed to load users", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const admins = allUsers.filter((u) => u.role === "admin");
  const users = allUsers.filter((u) => u.role !== "admin");

  async function handleGrant(email: string) {
    const target = allUsers.find((u) => u.email === email);
    setActionId(target?.id ?? email);
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Admin access granted", description: `${data.name || email} is now an admin.` });
      setGrantEmail("");
      await fetchUsers();
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setActionId(null); }
  }

  async function handleRevoke(user: ClerkUser) {
    if (!confirm(`Remove admin access for ${user.name || user.email}?`)) return;
    setActionId(user.id);
    try {
      const res = await fetch("/api/admin/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Admin access revoked" });
      await fetchUsers();
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setActionId(null); }
  }

  const displayed = tab === "admins" ? admins : users;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] font-semibold text-black">User Management</h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            {admins.length} admin{admins.length !== 1 ? "s" : ""} · {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="h-8 w-8 border border-[#e5e5e5] rounded-md flex items-center justify-center text-[#888] hover:text-black hover:bg-[#f5f5f5] transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Grant admin by email */}
      <div className="bg-white rounded-lg border border-[#e5e5e5] p-4">
        <p className="text-[12px] font-medium text-[#444] mb-2">Grant admin access by email</p>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && grantEmail.trim() && handleGrant(grantEmail.trim())}
            className="flex-1 h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
          />
          <button
            onClick={() => grantEmail.trim() && handleGrant(grantEmail.trim())}
            disabled={granting || !grantEmail.trim()}
            className="h-8 px-3 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Grant
          </button>
        </div>
        <p className="text-[11px] text-[#aaa] mt-1.5">User must have signed in with Google or Microsoft at least once.</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-[#e5e5e5] overflow-hidden">
        <div className="flex border-b border-[#e5e5e5]">
          <button
            onClick={() => setTab("admins")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "admins"
                ? "border-black text-black"
                : "border-transparent text-[#888] hover:text-black"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Admins
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${tab === "admins" ? "bg-black text-white" : "bg-[#f0f0f0] text-[#666]"}`}>
              {admins.length}
            </span>
          </button>
          <button
            onClick={() => setTab("users")}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
              tab === "users"
                ? "border-black text-black"
                : "border-transparent text-[#888] hover:text-black"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users
            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${tab === "users" ? "bg-black text-white" : "bg-[#f0f0f0] text-[#666]"}`}>
              {users.length}
            </span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-[#aaa]" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[13px] font-medium text-black">
              {tab === "admins" ? "No admins yet" : "No users yet"}
            </p>
            <p className="text-[12px] text-[#888] mt-1">
              {tab === "admins" ? "Grant admin access using the form above." : "Users appear here after they sign in."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0f0f0]">
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide hidden sm:table-cell">Joined</th>
                <th className="text-left px-4 py-2.5 text-[11px] font-medium text-[#888] uppercase tracking-wide hidden md:table-cell">Last seen</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((user) => (
                <tr key={user.id} className="border-b border-[#f9f9f9] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={user} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-black truncate">{user.name}</p>
                        <p className="text-[12px] text-[#888] truncate">{user.email}</p>
                      </div>
                      {user.role === "admin" && tab === "users" && (
                        <span className="hidden" />
                      )}
                      {tab === "admins" && (
                        <span className="text-[11px] bg-black text-white px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          Admin
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#888] hidden sm:table-cell">
                    {user.createdAt ? formatDate(new Date(user.createdAt).toISOString(), "dd MMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#888] hidden md:table-cell">
                    {user.lastSignInAt ? formatDate(new Date(user.lastSignInAt).toISOString(), "dd MMM yyyy") : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {tab === "admins" ? (
                        <button
                          onClick={() => handleRevoke(user)}
                          disabled={actionId === user.id}
                          className="p-1.5 text-[#bbb] hover:text-red-500 rounded transition-colors"
                          title="Remove admin access"
                        >
                          {actionId === user.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrant(user.email)}
                          disabled={actionId === user.id}
                          className="h-7 px-2.5 text-[12px] border border-[#e5e5e5] rounded-md text-[#666] hover:bg-black hover:text-white hover:border-black transition-colors flex items-center gap-1"
                          title="Grant admin access"
                        >
                          {actionId === user.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <><Shield className="w-3 h-3" /> Make Admin</>}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
