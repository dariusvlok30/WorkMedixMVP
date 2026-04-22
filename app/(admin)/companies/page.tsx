"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Building2, ChevronRight, Loader2 } from "lucide-react";
import type { Company } from "@/types";

interface CompanyFormData {
  name: string;
  registration_number: string;
  industry_type: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

const INDUSTRIES = [
  "Mining", "Construction", "Manufacturing", "Transport & Logistics", "Agriculture",
  "Healthcare", "Finance", "Retail", "Technology", "Energy", "Other",
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<CompanyFormData>({
    name: "", registration_number: "", industry_type: "", contact_person: "",
    email: "", phone: "", address: "", notes: "",
  });

  const fetchCompanies = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/companies?${params}`);
      const data = await res.json();
      setCompanies(data.companies ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(searchTerm); }, [fetchCompanies, searchTerm]);

  function set(field: keyof CompanyFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          registration_number: form.registration_number || null,
          industry_type: form.industry_type || null,
          notes: form.notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create company");
      setShowForm(false);
      setForm({ name: "", registration_number: "", industry_type: "", contact_person: "", email: "", phone: "", address: "", notes: "" });
      fetchCompanies(searchTerm);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-white">Companies</h1>
            <p className="text-[13px] text-[#666] mt-0.5">{total} companies</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Company
          </button>
        </div>

        {/* New company modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[#1f1f1f] rounded-lg w-full max-w-xl p-5 max-h-[90vh] overflow-y-auto space-y-4">
              <h2 className="text-[15px] font-semibold text-white">Add Company</h2>
              {formError && (
                <div className="text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">{formError}</div>
              )}
              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Company Name *</label>
                    <input required value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Reg. Number</label>
                    <input value={form.registration_number} onChange={(e) => set("registration_number", e.target.value)} placeholder="2023/123456/07" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8c8c8c] mb-1">Industry</label>
                  <select value={form.industry_type} onChange={(e) => set("industry_type", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]">
                    <option value="">Select industry…</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Contact Person *</label>
                    <input required value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Email *</label>
                    <input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Phone *</label>
                    <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Address *</label>
                    <input required value={form.address} onChange={(e) => set("address", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8c8c8c] mb-1">Notes</label>
                  <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444] resize-none" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving} className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Company
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search */}
        <form onSubmit={(e) => { e.preventDefault(); setSearchTerm(search); }} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search companies…" className="w-full bg-[#111] border border-[#1f1f1f] rounded-md pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#333]" />
          </div>
          <button type="submit" className="px-4 py-2 text-[13px] text-[#aaa] border border-[#1f1f1f] rounded-md hover:border-[#333] hover:text-white transition-colors">Search</button>
        </form>

        {/* Table */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#555] animate-spin" /></div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-[13px] text-[#666]">No companies found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Company", "Industry", "Contact", "Workers", "Added", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {companies.map((c) => (
                  <tr key={c.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-white">{c.name}</p>
                      {c.registration_number && <p className="text-[12px] text-[#555]">{c.registration_number}</p>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{c.industry_type ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-[#aaa]">{c.contact_person}</p>
                      <p className="text-[12px] text-[#555]">{c.email}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{c.worker_count ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-[#666]">{new Date(c.created_at).toLocaleDateString("en-ZA")}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/companies/${c.id}`} className="inline-flex items-center gap-1 text-[12px] text-[#666] hover:text-white transition-colors">
                        View <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
