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

  const [form, setForm] = useState({
    id_number: initialData?.id_number ?? "",
    id_type: initialData?.id_type ?? "sa_id",
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    date_of_birth: initialData?.date_of_birth ?? "",
    gender: initialData?.gender ?? "",
    race: initialData?.race ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
  });

  function set(field: string, value: string) {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">ID Type</label>
          <select
            value={form.id_type}
            onChange={(e) => set("id_type", e.target.value)}
            disabled={isEdit}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444] disabled:opacity-50"
          >
            <option value="sa_id">SA ID</option>
            <option value="passport">Passport</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">ID Number *</label>
          <input
            type="text"
            value={form.id_number}
            onChange={(e) => set("id_number", e.target.value)}
            required
            disabled={isEdit}
            placeholder="8001015800084"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444] disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">First Name *</label>
          <input
            type="text"
            value={form.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Last Name *</label>
          <input
            type="text"
            value={form.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            required
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Date of Birth</label>
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => set("date_of_birth", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => set("gender", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Race (EEA)</label>
          <select
            value={form.race}
            onChange={(e) => set("race", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
          >
            <option value="">Select</option>
            <option value="african">African</option>
            <option value="coloured">Coloured</option>
            <option value="indian">Indian</option>
            <option value="white">White</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+27 82 000 0000"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
          />
        </div>
        <div>
          <label className="block text-[12px] text-[#8c8c8c] mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {isEdit ? "Save Changes" : "Register Worker"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-[13px] text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
