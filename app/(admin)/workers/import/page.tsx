"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle } from "lucide-react";
import CSVImport from "@/components/admin/CSVImport";
import type { Company } from "@/types";

function ImportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get("company_id") ?? "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState(preselectedCompanyId);
  const [result, setResult] = useState<{ created: number; linked: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/companies?limit=200").then((r) => r.json()).then((d) => setCompanies(d.companies ?? []));
  }, []);

  if (result) {
    return (
      <div className="flex-1 overflow-auto bg-[#0c0c0c]">
        <div className="max-w-lg mx-auto px-6 py-16 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <h2 className="text-[18px] font-semibold text-white">Import Complete</h2>
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4 space-y-2 text-left">
            <p className="text-[13px] text-[#aaa]"><span className="text-white font-medium">{result.created}</span> workers processed</p>
            <p className="text-[13px] text-[#aaa]"><span className="text-white font-medium">{result.linked}</span> linked to company</p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-[12px] text-amber-400 mb-1">{result.errors.length} errors:</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {result.errors.map((e, i) => <p key={i} className="text-[11px] text-red-400">{e}</p>)}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setResult(null)} className="px-4 py-2 text-[13px] text-[#aaa] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
              Import More
            </button>
            <button onClick={() => router.push(companyId ? `/companies/${companyId}` : "/workers")} className="px-4 py-2 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors">
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        <Link href="/workers" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Workers
        </Link>

        <div>
          <h1 className="text-[18px] font-semibold text-white">Import Workers from CSV</h1>
          <p className="text-[13px] text-[#666] mt-0.5">Upload a CSV roster to bulk-register workers and link them to a company</p>
        </div>

        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5 space-y-4">
          <div>
            <label className="block text-[12px] text-[#8c8c8c] mb-1">Company *</label>
            <select
              required
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]"
            >
              <option value="">Select company…</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {companyId ? (
            <CSVImport
              companyId={companyId}
              onComplete={setResult}
              onCancel={() => router.back()}
            />
          ) : (
            <p className="text-[13px] text-[#555] text-center py-4">Select a company first</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense>
      <ImportContent />
    </Suspense>
  );
}
