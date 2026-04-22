"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Award, Printer, ChevronRight, Loader2, Search } from "lucide-react";
import type { FitnessCertificate } from "@/types";
import { FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

export default function CertificatesPage() {
  const [certs, setCerts] = useState<FitnessCertificate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/certificates?limit=100");
      const data = await res.json();
      setCerts(data.certificates ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCerts(); }, [fetchCerts]);

  const filtered = search
    ? certs.filter((c) =>
        c.certificate_number.toLowerCase().includes(search.toLowerCase()) ||
        `${c.worker?.first_name} ${c.worker?.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
        c.worker?.id_number.includes(search)
      )
    : certs;

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-white">Fitness Certificates</h1>
            <p className="text-[13px] text-[#666] mt-0.5">{total} certificates issued</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or certificate number…"
            className="w-full bg-[#111] border border-[#1f1f1f] rounded-md pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#333]"
          />
        </div>

        {/* Table */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#555] animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Award className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-[13px] text-[#666]">No certificates found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Certificate #", "Worker", "ID Number", "Status", "Company", "Issued", "Valid Until", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const expired = c.valid_until ? new Date(c.valid_until) < new Date() : false;
                  // The appointment's session company name from nested join
                  type AppointmentWithSession = {
                    session?: { company?: { name?: string } }
                  };
                  const companyName = (c.appointment as AppointmentWithSession | undefined)?.session?.company?.name ?? "—";
                  return (
                    <tr key={c.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[12px] text-[#aaa]">{c.certificate_number}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/workers/${c.worker_id}`} className="text-[13px] font-medium text-white hover:text-[#aaa] transition-colors">
                          {c.worker?.first_name} {c.worker?.last_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#666] font-mono">{c.worker?.id_number}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", FITNESS_STATUS_COLORS[c.fitness_status])}>
                          {FITNESS_STATUS_LABELS[c.fitness_status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{companyName}</td>
                      <td className="px-4 py-3 text-[13px] text-[#666]">
                        {new Date(c.issued_at).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 py-3">
                        {c.valid_until ? (
                          <span className={cn("text-[13px]", expired ? "text-red-400" : "text-[#8c8c8c]")}>
                            {expired && "Expired · "}
                            {new Date(c.valid_until).toLocaleDateString("en-ZA")}
                          </span>
                        ) : <span className="text-[13px] text-[#555]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/certificates/${c.id}/print`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[12px] text-[#666] hover:text-white transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </a>
                          <Link href={`/certificates/${c.id}`} className="inline-flex items-center gap-1 text-[12px] text-[#666] hover:text-white transition-colors">
                            View <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
