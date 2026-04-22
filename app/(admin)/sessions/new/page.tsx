"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { Company, ScreeningPackage } from "@/types";

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get("company_id") ?? "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [packages, setPackages] = useState<ScreeningPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company_id: preselectedCompanyId,
    package_id: "",
    session_date: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/companies?limit=200").then((r) => r.json()),
      fetch("/api/packages").then((r) => r.json()),
    ]).then(([companiesData, packagesData]) => {
      setCompanies(companiesData.companies ?? []);
      setPackages(Array.isArray(packagesData) ? packagesData : []);
    });
  }, []);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, notes: form.notes || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create session");
      router.push(`/sessions/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setLoading(false);
    }
  }

  const selectedPackage = packages.find((p) => p.id === form.package_id);

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-6">

        <Link href="/sessions" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Sessions
        </Link>

        <div>
          <h1 className="text-[18px] font-semibold text-white">New Screening Session</h1>
          <p className="text-[13px] text-[#666] mt-0.5">Book a group screening session for a company</p>
        </div>

        {error && (
          <div className="text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5 space-y-4">
          {/* Company */}
          <div>
            <label className="block text-[12px] text-[#8c8c8c] mb-1">Company *</label>
            <select
              required
              value={form.company_id}
              onChange={(e) => set("company_id", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
            >
              <option value="">Select company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Package */}
          <div>
            <label className="block text-[12px] text-[#8c8c8c] mb-1">Screening Package *</label>
            <select
              required
              value={form.package_id}
              onChange={(e) => set("package_id", e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
            >
              <option value="">Select package…</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — R {(p.price_cents / 100).toLocaleString("en-ZA")} per person
                </option>
              ))}
            </select>
            {selectedPackage && (
              <div className="mt-2 p-2.5 bg-[#0f0f0f] rounded-md border border-[#1a1a1a]">
                <p className="text-[12px] text-[#666] mb-1.5">{selectedPackage.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPackage.tests_included.map((t) => (
                    <span key={t} className="text-[11px] bg-[#1f1f1f] text-[#888] px-2 py-0.5 rounded-full border border-[#2a2a2a]">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] text-[#8c8c8c] mb-1">Session Date *</label>
              <input
                required
                type="date"
                value={form.session_date}
                onChange={(e) => set("session_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#8c8c8c] mb-1">Location *</label>
              <input
                required
                type="text"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="WorkMedix Sandton"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[12px] text-[#8c8c8c] mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={2}
              placeholder="Any special instructions for this session…"
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444] resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Session
            </button>
            <Link href="/sessions" className="px-4 py-2 text-[13px] text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense>
      <NewSessionForm />
    </Suspense>
  );
}
