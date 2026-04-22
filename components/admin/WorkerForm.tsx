"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Worker } from "@/types";

interface Props {
  initialData?: Partial<Worker>;
  onSuccess: (worker: Worker) => void;
  onCancel: () => void;
}

export default function WorkerForm({ initialData, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initialData?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const w = initialData as Record<string, unknown> | undefined;

  const [form, setForm] = useState({
    id_number: initialData?.id_number ?? "",
    id_type: initialData?.id_type ?? "sa_id",
    first_name: initialData?.first_name ?? "",
    middle_name: (w?.middle_name as string) ?? "",
    last_name: initialData?.last_name ?? "",
    date_of_birth: initialData?.date_of_birth ?? "",
    gender: initialData?.gender ?? "",
    race: initialData?.race ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    occupation: (w?.occupation as string) ?? "",
    department: (w?.department as string) ?? "",
    division: (w?.division as string) ?? "",
    noise_exposure: Boolean(w?.noise_exposure),
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = isEdit ? `/api/workers/${initialData!.id}` : "/api/workers";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date_of_birth: form.date_of_birth || null,
          gender: form.gender || null,
          race: form.race || null,
          phone: form.phone || null,
          email: form.email || null,
          middle_name: form.middle_name || null,
          occupation: form.occupation || null,
          department: form.department || null,
          division: form.division || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save worker");
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]";
  const labelCls = "block text-[12px] text-[#8c8c8c] mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Identity */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>ID Type</label>
          <select value={form.id_type} onChange={(e) => set("id_type", e.target.value)} disabled={isEdit} className={`${inputCls} disabled:opacity-50`}>
            <option value="sa_id">SA ID</option>
            <option value="passport">Passport</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>ID Number *</label>
          <input type="text" value={form.id_number} onChange={(e) => set("id_number", e.target.value)} required disabled={isEdit} placeholder="8001015800084" className={`${inputCls} disabled:opacity-50`} />
        </div>
      </div>

      {/* Name */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>First Name *</label>
          <input type="text" value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Middle Name</label>
          <input type="text" value={form.middle_name} onChange={(e) => set("middle_name", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Last Name *</label>
          <input type="text" value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required className={inputCls} />
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Date of Birth</label>
          <input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Gender</label>
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Race (EEA)</label>
          <select value={form.race} onChange={(e) => set("race", e.target.value)} className={inputCls}>
            <option value="">Select</option>
            <option value="african">African</option>
            <option value="coloured">Coloured</option>
            <option value="indian">Indian</option>
            <option value="white">White</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Contact */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+27 82 000 0000" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </div>
      </div>

      {/* Occupational details */}
      <div className="border-t border-[#1f1f1f] pt-4">
        <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">Occupational Details</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Occupation / Job Title</label>
            <input type="text" value={form.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Arc Welder" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Department</label>
            <input type="text" value={form.department} onChange={(e) => set("department", e.target.value)} placeholder="e.g. Operations" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Division / Branch</label>
            <input type="text" value={form.division} onChange={(e) => set("division", e.target.value)} placeholder="e.g. Plant A" className={inputCls} />
          </div>
        </div>
        <div className="mt-3">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.noise_exposure}
              onChange={(e) => set("noise_exposure", e.target.checked)}
              className="w-4 h-4 rounded border-[#2a2a2a] bg-[#1a1a1a] accent-white"
            />
            <span className="text-[13px] text-[#ccc]">Noise exposure above 85 dB TWA</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEdit ? "Save Changes" : "Register Worker"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[13px] text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
