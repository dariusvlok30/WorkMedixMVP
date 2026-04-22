import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Building2, Users, CalendarCheck, Plus, Upload } from "lucide-react";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

async function getData(id: string) {
  const supabase = createAdminClient();
  const [companyRes, workersRes, sessionsRes] = await Promise.all([
    supabase.from("companies").select("*").eq("id", id).single(),
    supabase.from("company_workers").select("*, worker:workers(*)").eq("company_id", id).eq("is_active", true).order("created_at", { ascending: false }),
    supabase.from("screening_sessions").select("*, package:screening_packages(id, name, code)").eq("company_id", id).order("session_date", { ascending: false }).limit(20),
  ]);
  if (companyRes.error || !companyRes.data) return null;
  return {
    company: companyRes.data,
    workers: workersRes.data ?? [],
    sessions: sessionsRes.data ?? [],
  };
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { company, workers, sessions } = data;

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        <Link href="/companies" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Companies
        </Link>

        {/* Company header */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
                <Building2 className="w-6 h-6 text-[#555]" />
              </div>
              <div>
                <h1 className="text-[20px] font-semibold text-white">{company.name}</h1>
                {company.registration_number && <p className="text-[13px] text-[#666] mt-0.5">Reg: {company.registration_number}</p>}
                {company.industry_type && <p className="text-[12px] text-[#555]">{company.industry_type}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/workers/import?company_id=${company.id}`}
                className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#aaa] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Import Workers
              </Link>
              <Link
                href={`/sessions/new?company_id=${company.id}`}
                className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Book Session
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#1f1f1f]">
            {[
              { label: "Contact", value: company.contact_person },
              { label: "Phone", value: company.phone },
              { label: "Address", value: company.address },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-[#555] uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-[13px] text-[#ccc]">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wide mb-0.5">Portal Login Email</p>
              <p className="text-[13px] text-[#ccc]">{company.email ?? "—"}</p>
              <p className="text-[10px] text-[#555] mt-0.5">Client logs in with this email at /portal</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#1f1f1f]">
            {[
              { label: "Workers", value: workers.length },
              { label: "Sessions", value: sessions.length },
              { label: "Completed Sessions", value: sessions.filter((s: {status: string}) => s.status === "completed").length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#0f0f0f] rounded-md p-3 text-center border border-[#1a1a1a]">
                <p className="text-[22px] font-semibold text-white">{value}</p>
                <p className="text-[11px] text-[#555] mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Workers */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#555]" />
                <h2 className="text-[13px] font-medium text-white">Workers ({workers.length})</h2>
              </div>
              <Link href={`/workers/import?company_id=${company.id}`} className="text-[12px] text-[#666] hover:text-white transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
              </Link>
            </div>
            <div className="divide-y divide-[#161616] max-h-80 overflow-y-auto">
              {workers.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#555]">No workers linked yet</div>
              ) : (
                workers.map((cw: {id: string; worker: {id: string; id_number: string; first_name: string; last_name: string}; job_title?: string | null; department?: string | null; employee_number?: string | null}) => (
                  <div key={cw.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#141414] transition-colors">
                    <div>
                      <Link href={`/workers/${cw.worker.id}`} className="text-[13px] text-white hover:text-[#aaa] transition-colors">
                        {cw.worker.first_name} {cw.worker.last_name}
                      </Link>
                      <p className="text-[11px] text-[#555] font-mono">{cw.worker.id_number}</p>
                    </div>
                    <div className="text-right">
                      {cw.job_title && <p className="text-[12px] text-[#666]">{cw.job_title}</p>}
                      {cw.department && <p className="text-[11px] text-[#555]">{cw.department}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sessions */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-[#555]" />
                <h2 className="text-[13px] font-medium text-white">Sessions ({sessions.length})</h2>
              </div>
              <Link href={`/sessions/new?company_id=${company.id}`} className="text-[12px] text-[#666] hover:text-white transition-colors flex items-center gap-1">
                <Plus className="w-3 h-3" /> New
              </Link>
            </div>
            <div className="divide-y divide-[#161616] max-h-80 overflow-y-auto">
              {sessions.length === 0 ? (
                <div className="py-8 text-center text-[13px] text-[#555]">No sessions yet</div>
              ) : (
                sessions.map((s: {id: string; session_date: string; location: string; status: string; package: {name: string; code: string}}) => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#141414] transition-colors">
                    <div>
                      <Link href={`/sessions/${s.id}`} className="text-[13px] text-white hover:text-[#aaa] transition-colors">
                        {new Date(s.session_date).toLocaleDateString("en-ZA")}
                      </Link>
                      <p className="text-[12px] text-[#666]">{s.package.name} · {s.location}</p>
                    </div>
                    <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", SESSION_STATUS_COLORS[s.status as keyof typeof SESSION_STATUS_COLORS])}>
                      {SESSION_STATUS_LABELS[s.status as keyof typeof SESSION_STATUS_LABELS]}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
