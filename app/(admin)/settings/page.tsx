"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, UserMinus } from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const [grantEmail, setGrantEmail] = useState("");
  const [revokeEmail, setRevokeEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState(false);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!grantEmail.trim()) return;
    setGranting(true);
    try {
      const res = await fetch("/api/admin/grant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: grantEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Admin access granted", description: `${data.name || grantEmail} is now an admin.` });
      setGrantEmail("");
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setGranting(false); }
  }

  async function handleRevoke(e: React.FormEvent) {
    e.preventDefault();
    if (!revokeEmail.trim()) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/admin/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: revokeEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Admin access revoked", description: `${revokeEmail} no longer has admin access.` });
      setRevokeEmail("");
    } catch (e) {
      toast({ title: "Failed", description: e instanceof Error ? e.message : "Something went wrong.", variant: "destructive" });
    } finally { setRevoking(false); }
  }

  return (
    <div className="max-w-xl space-y-6 animate-fade-in">
      <div>
        <h1 className="text-[18px] font-semibold text-black">Settings</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Manage admin access for your team.</p>
      </div>

      {/* Grant admin */}
      <div className="bg-white rounded-lg border border-[#e5e5e5]">
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-[13px] font-semibold text-black">Grant Admin Access</h2>
          <p className="text-[12px] text-[#888] mt-0.5">
            The person must have signed in with Google or Microsoft at least once before you can grant access.
          </p>
        </div>
        <form onSubmit={handleGrant} className="p-4 flex gap-2">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={grantEmail}
            onChange={(e) => setGrantEmail(e.target.value)}
            className="flex-1 h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
          />
          <button
            type="submit"
            disabled={granting || !grantEmail.trim()}
            className="h-8 px-3 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {granting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
            Grant
          </button>
        </form>
      </div>

      {/* Revoke admin */}
      <div className="bg-white rounded-lg border border-[#e5e5e5]">
        <div className="px-4 py-3 border-b border-[#e5e5e5]">
          <h2 className="text-[13px] font-semibold text-black">Revoke Admin Access</h2>
          <p className="text-[12px] text-[#888] mt-0.5">Remove admin access from a team member.</p>
        </div>
        <form onSubmit={handleRevoke} className="p-4 flex gap-2">
          <input
            type="email"
            placeholder="colleague@company.com"
            value={revokeEmail}
            onChange={(e) => setRevokeEmail(e.target.value)}
            className="flex-1 h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
          />
          <button
            type="submit"
            disabled={revoking || !revokeEmail.trim()}
            className="h-8 px-3 bg-red-600 text-white text-[13px] font-medium rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
            Revoke
          </button>
        </form>
      </div>

      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg p-4">
        <p className="text-[12px] text-[#92400e] font-medium">Note</p>
        <p className="text-[12px] text-[#92400e] mt-0.5">
          To add Google or Microsoft SSO for new admins, configure the OAuth providers in your{" "}
          <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="underline">
            Clerk dashboard
          </a>.
        </p>
      </div>
    </div>
  );
}
