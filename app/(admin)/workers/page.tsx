"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UserPlus, Search, ChevronRight, Loader2, Users,
} from "lucide-react";
import WorkerForm from "@/components/admin/WorkerForm";
import WorkerSearch from "@/components/admin/WorkerSearch";
import type { Worker } from "@/types";

type Modal = "none" | "new" | "search";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<Modal>("none");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchWorkers = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/workers?${params}`);
      const data = await res.json();
      setWorkers(data.workers ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkers(searchTerm);
  }, [fetchWorkers, searchTerm]);

  function handleSearchInput(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchTerm(search);
  }

  function age(dob: string | null) {
    if (!dob) return "—";
    const years = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    return `${years} yrs`;
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-white">Worker Registry</h1>
            <p className="text-[13px] text-[#666] mt-0.5">{total.toLocaleString()} registered workers</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal("search")}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#aaa] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              ID Lookup
            </button>
            <button
              onClick={() => setModal("new")}
              className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Worker
            </button>
          </div>
        </div>

        {/* ID Lookup modal */}
        {modal === "search" && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[#1f1f1f] rounded-lg w-full max-w-lg p-5 space-y-4">
              <h2 className="text-[15px] font-semibold text-white">Worker ID Lookup</h2>
              <WorkerSearch
                onSelect={(worker) => {
                  setModal("none");
                  window.location.href = `/workers/${worker.id}`;
                }}
              />
              <button onClick={() => setModal("none")} className="text-[13px] text-[#666] hover:text-white transition-colors">
                Close
              </button>
            </div>
          </div>
        )}

        {/* New worker modal */}
        {modal === "new" && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111] border border-[#1f1f1f] rounded-lg w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-[15px] font-semibold text-white">Register New Worker</h2>
              <WorkerForm
                onSuccess={(w) => {
                  setModal("none");
                  window.location.href = `/workers/${w.id}`;
                }}
                onCancel={() => setModal("none")}
              />
            </div>
          </div>
        )}

        {/* Search bar */}
        <form onSubmit={handleSearchInput} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or ID number…"
              className="w-full bg-[#111] border border-[#1f1f1f] rounded-md pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#333]"
            />
          </div>
          <button type="submit" className="px-4 py-2 text-[13px] text-[#aaa] border border-[#1f1f1f] rounded-md hover:border-[#333] hover:text-white transition-colors">
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={() => { setSearch(""); setSearchTerm(""); }}
              className="px-3 py-2 text-[13px] text-[#666] hover:text-white transition-colors"
            >
              Clear
            </button>
          )}
        </form>

        {/* Table */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 text-[#555] animate-spin" />
            </div>
          ) : workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-[13px] text-[#666]">No workers found</p>
              {searchTerm && <p className="text-[12px] text-[#555] mt-1">Try a different search term</p>}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  <th className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">ID Number</th>
                  <th className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">Name</th>
                  <th className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">Age</th>
                  <th className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">Gender</th>
                  <th className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">Registered</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {workers.map((w) => (
                  <tr key={w.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-[13px] text-[#aaa]">{w.id_number}</span>
                      <span className="ml-2 text-[11px] text-[#555] uppercase">{w.id_type === "passport" ? "PP" : "ID"}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-white font-medium">
                      {w.first_name} {w.last_name}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{age(w.date_of_birth)}</td>
                    <td className="px-4 py-3 text-[13px] text-[#8c8c8c] capitalize">{w.gender ?? "—"}</td>
                    <td className="px-4 py-3 text-[13px] text-[#666]">
                      {new Date(w.created_at).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/workers/${w.id}`}
                        className="inline-flex items-center gap-1 text-[12px] text-[#666] hover:text-white transition-colors"
                      >
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
