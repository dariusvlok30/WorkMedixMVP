"use client";

import { useState, useEffect } from "react";
import { Plus, Package, Pencil, Check, X, Loader2 } from "lucide-react";
import type { ScreeningPackage, TestType } from "@/types";
import { TEST_TYPE_LABELS } from "@/types";

const ALL_TESTS: TestType[] = ["spirometry", "audiometry", "vision", "blood_pressure", "height_weight", "urine", "ecg", "general"];

function formatPrice(cents: number) {
  return `R ${(cents / 100).toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<ScreeningPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "", name: "", description: "", price_cents: "", tests_included: [] as TestType[],
  });

  async function fetchPackages() {
    setLoading(true);
    try {
      const res = await fetch("/api/packages");
      const data = await res.json();
      setPackages(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchPackages(); }, []);

  function toggleTest(t: TestType) {
    setForm((prev) => ({
      ...prev,
      tests_included: prev.tests_included.includes(t)
        ? prev.tests_included.filter((x) => x !== t)
        : [...prev.tests_included, t],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/packages/${editId}` : "/api/packages";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price_cents: Math.round(parseFloat(form.price_cents) * 100),
          code: form.code.toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      setShowNew(false);
      setEditId(null);
      setForm({ code: "", name: "", description: "", price_cents: "", tests_included: [] });
      fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(pkg: ScreeningPackage) {
    setEditId(pkg.id);
    setForm({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description ?? "",
      price_cents: (pkg.price_cents / 100).toString(),
      tests_included: pkg.tests_included,
    });
    setShowNew(true);
  }

  async function toggleActive(pkg: ScreeningPackage) {
    await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    fetchPackages();
  }

  const modal = showNew;

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-white">Screening Packages</h1>
            <p className="text-[13px] text-[#666] mt-0.5">{packages.length} packages</p>
          </div>
          <button
            onClick={() => { setEditId(null); setForm({ code: "", name: "", description: "", price_cents: "", tests_included: [] }); setShowNew(true); }}
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Package
          </button>
        </div>

        {/* Modal */}
        {modal && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[#1f1f1f] rounded-lg w-full max-w-lg p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-white">{editId ? "Edit Package" : "New Package"}</h2>
              {error && <div className="text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">{error}</div>}
              <form onSubmit={handleSave} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Code *</label>
                    <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="FULL" disabled={Boolean(editId)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white uppercase placeholder:text-[#555] focus:outline-none focus:border-[#444] disabled:opacity-50" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#8c8c8c] mb-1">Price (Rands) *</label>
                    <input required type="number" step="0.01" value={form.price_cents} onChange={(e) => setForm({ ...form, price_cents: e.target.value })} placeholder="17500" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] text-[#8c8c8c] mb-1">Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8c8c8c] mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444] resize-none" />
                </div>
                <div>
                  <label className="block text-[12px] text-[#8c8c8c] mb-2">Tests Included *</label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_TESTS.map((t) => {
                      const selected = form.tests_included.includes(t);
                      return (
                        <button type="button" key={t} onClick={() => toggleTest(t)} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] border transition-colors ${selected ? "bg-white text-black border-white" : "bg-transparent text-[#666] border-[#2a2a2a] hover:border-[#444] hover:text-[#aaa]"}`}>
                          {selected && <Check className="w-3 h-3" />}
                          {TEST_TYPE_LABELS[t]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving || form.tests_included.length === 0} className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Package
                  </button>
                  <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-[13px] text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Package cards */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#555] animate-spin" /></div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`bg-[#111] border rounded-lg p-4 space-y-3 ${pkg.is_active ? "border-[#1f1f1f]" : "border-[#161616] opacity-60"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#1f1f1f] rounded-md flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-[#888]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-white">{pkg.name}</p>
                      <p className="text-[11px] text-[#555] font-mono uppercase">{pkg.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold text-white">{formatPrice(pkg.price_cents)}</p>
                  </div>
                </div>
                {pkg.description && <p className="text-[12px] text-[#666]">{pkg.description}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {pkg.tests_included.map((t) => (
                    <span key={t} className="text-[11px] bg-[#1a1a1a] border border-[#2a2a2a] text-[#888] px-2 py-0.5 rounded-full">
                      {TEST_TYPE_LABELS[t] ?? t}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button onClick={() => startEdit(pkg)} className="flex items-center gap-1.5 text-[12px] text-[#666] hover:text-white transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => toggleActive(pkg)} className={`text-[12px] transition-colors ${pkg.is_active ? "text-[#666] hover:text-amber-400" : "text-amber-500 hover:text-white"}`}>
                    {pkg.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
