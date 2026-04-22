"use client";

import { useState } from "react";
import { Search, UserCheck, UserX, Loader2 } from "lucide-react";
import { Worker, FitnessCertificate, FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

interface SearchResult {
  found: boolean;
  worker?: Worker;
  latest_certificate?: FitnessCertificate | null;
  companies?: Array<{ company: { id: string; name: string } }>;
}

interface Props {
  onSelect?: (worker: Worker) => void;
}

export default function WorkerSearch({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/workers/search?id_number=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setResult(data);
    } finally {
      setLoading(false);
    }
  }

  const cert = result?.latest_certificate;
  const certExpired = cert?.valid_until ? new Date(cert.valid_until) < new Date() : false;

  return (
    <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4">
      <p className="text-[13px] text-[#8c8c8c] mb-3">Look up any worker by SA ID or passport number</p>
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SA ID number or passport"
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Search
        </button>
      </form>

      {result && (
        <div className="mt-4">
          {!result.found ? (
            <div className="flex items-center gap-2 text-[#8c8c8c] text-[13px] py-3 px-3 bg-[#1a1a1a] rounded-md border border-[#2a2a2a]">
              <UserX className="w-4 h-4 text-[#555]" />
              No worker found with that ID number. You can register them as a new worker.
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-md p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <div>
                    <p className="text-[14px] font-semibold text-white">
                      {result.worker!.first_name} {result.worker!.last_name}
                    </p>
                    <p className="text-[12px] text-[#666]">{result.worker!.id_number}</p>
                  </div>
                </div>
                {onSelect && (
                  <button
                    onClick={() => onSelect(result.worker!)}
                    className="text-[12px] px-3 py-1.5 bg-white text-black rounded-md hover:bg-[#e5e5e5] transition-colors font-medium"
                  >
                    Select
                  </button>
                )}
              </div>

              {result.companies && result.companies.length > 0 && (
                <div>
                  <p className="text-[11px] text-[#666] uppercase tracking-wide mb-1">Companies</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.companies.map((cw, i) => (
                      <span key={i} className="text-[12px] bg-[#252525] border border-[#333] text-[#aaa] px-2 py-0.5 rounded-full">
                        {cw.company.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {cert && (
                <div>
                  <p className="text-[11px] text-[#666] uppercase tracking-wide mb-1">Last Certificate</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", FITNESS_STATUS_COLORS[cert.fitness_status])}>
                      {FITNESS_STATUS_LABELS[cert.fitness_status]}
                    </span>
                    {cert.valid_until && (
                      <span className={cn("text-[12px]", certExpired ? "text-red-400" : "text-[#8c8c8c]")}>
                        {certExpired ? "Expired" : "Valid until"} {new Date(cert.valid_until).toLocaleDateString("en-ZA")}
                      </span>
                    )}
                    <span className="text-[12px] text-[#666]">#{cert.certificate_number}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
