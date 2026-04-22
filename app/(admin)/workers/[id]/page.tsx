import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, User, Building2, CalendarCheck, Award } from "lucide-react";
import { FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS, APPOINTMENT_STATUS_LABELS, TEST_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

async function getWorker(id: string) {
  const supabase = createAdminClient();
  const [workerRes, companiesRes, appointmentsRes] = await Promise.all([
    supabase.from("workers").select("*").eq("id", id).single(),
    supabase.from("company_workers").select("*, company:companies(id, name, industry_type)").eq("worker_id", id).eq("is_active", true),
    supabase.from("worker_appointments").select(`
      *,
      session:screening_sessions(id, session_date, location, company:companies(id,name), package:screening_packages(id, name, code)),
      results:screening_results(*),
      certificate:fitness_certificates(*)
    `).eq("worker_id", id).order("created_at", { ascending: false }),
  ]);
  if (workerRes.error || !workerRes.data) return null;
  return { worker: workerRes.data, companies: companiesRes.data ?? [], appointments: appointmentsRes.data ?? [] };
}

export default async function WorkerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getWorker(id);
  if (!data) notFound();
  const { worker, companies, appointments } = data;

  function age(dob: string | null) {
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  }

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Back */}
        <Link href="/workers" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Workers
        </Link>

        {/* Worker header */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-[#1f1f1f] flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-[#555]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-semibold text-white">{worker.first_name} {worker.last_name}</h1>
              <p className="text-[13px] text-[#666] font-mono mt-0.5">{worker.id_number} · {worker.id_type === "passport" ? "Passport" : "SA ID"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[#1f1f1f]">
            {[
              { label: "Date of Birth", value: worker.date_of_birth ? new Date(worker.date_of_birth).toLocaleDateString("en-ZA") : "—" },
              { label: "Age", value: age(worker.date_of_birth) ? `${age(worker.date_of_birth)} years` : "—" },
              { label: "Gender", value: worker.gender ? worker.gender.charAt(0).toUpperCase() + worker.gender.slice(1) : "—" },
              { label: "Race (EEA)", value: worker.race ? worker.race.charAt(0).toUpperCase() + worker.race.slice(1) : "—" },
              { label: "Phone", value: worker.phone ?? "—" },
              { label: "Email", value: worker.email ?? "—" },
              { label: "Occupation", value: (worker as Record<string,unknown>).occupation as string ?? "—" },
              { label: "Department", value: (worker as Record<string,unknown>).department as string ?? "—" },
              { label: "Division", value: (worker as Record<string,unknown>).division as string ?? "—" },
              { label: "Noise Exposure", value: (worker as Record<string,unknown>).noise_exposure ? "Yes" : "No" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-[#555] uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-[13px] text-[#ccc]">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Companies */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-[#555]" />
              <h2 className="text-[13px] font-medium text-white">Companies ({companies.length})</h2>
            </div>
            {companies.length === 0 ? (
              <p className="text-[13px] text-[#555]">Not linked to any company</p>
            ) : (
              <div className="space-y-2">
                {companies.map((cw: {id: string; company: {id: string; name: string; industry_type: string | null}; job_title?: string | null; department?: string | null; employee_number?: string | null}) => (
                  <div key={cw.id} className="p-2.5 bg-[#0f0f0f] rounded-md border border-[#1a1a1a]">
                    <Link href={`/companies/${cw.company.id}`} className="text-[13px] font-medium text-white hover:text-[#aaa] transition-colors">
                      {cw.company.name}
                    </Link>
                    {cw.job_title && <p className="text-[12px] text-[#666] mt-0.5">{cw.job_title}</p>}
                    {cw.department && <p className="text-[12px] text-[#555]">{cw.department}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CalendarCheck className="w-4 h-4 text-[#555]" />
              <h2 className="text-[13px] font-medium text-white">Screening History</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 bg-[#0f0f0f] rounded-md border border-[#1a1a1a] text-center">
                <p className="text-[22px] font-semibold text-white">{appointments.length}</p>
                <p className="text-[11px] text-[#555] mt-0.5">Total</p>
              </div>
              <div className="p-2.5 bg-[#0f0f0f] rounded-md border border-[#1a1a1a] text-center">
                <p className="text-[22px] font-semibold text-white">
                  {appointments.filter((a: {status: string}) => a.status === "completed").length}
                </p>
                <p className="text-[11px] text-[#555] mt-0.5">Completed</p>
              </div>
            </div>
          </div>

          {/* Latest certificate */}
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#555]" />
              <h2 className="text-[13px] font-medium text-white">Latest Certificate</h2>
            </div>
            {(() => {
              const certs = appointments.flatMap((a: {certificate: unknown[]}) => a.certificate ?? []) as Array<{id: string; certificate_number: string; fitness_status: string; valid_until: string | null; issued_at: string}>;
              const latest = certs.sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())[0];
              if (!latest) return <p className="text-[13px] text-[#555]">No certificates issued</p>;
              const expired = latest.valid_until ? new Date(latest.valid_until) < new Date() : false;
              return (
                <div className="space-y-2">
                  <span className={cn("inline-block text-[12px] px-2.5 py-1 rounded-full border font-medium", FITNESS_STATUS_COLORS[latest.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
                    {FITNESS_STATUS_LABELS[latest.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                  </span>
                  <p className="text-[12px] text-[#666]">#{latest.certificate_number}</p>
                  {latest.valid_until && (
                    <p className={cn("text-[12px]", expired ? "text-red-400" : "text-[#8c8c8c]")}>
                      {expired ? "Expired" : "Valid until"} {new Date(latest.valid_until).toLocaleDateString("en-ZA")}
                    </p>
                  )}
                  <Link href={`/certificates/${latest.id}`} className="block text-[12px] text-[#666] hover:text-white transition-colors">
                    View certificate →
                  </Link>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Appointment history */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1f1f1f]">
            <h2 className="text-[13px] font-medium text-white">Appointment History</h2>
          </div>
          {appointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-[#555]">No appointments yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#161616]">
                  {["Date", "Company", "Package", "Tests", "Status", "Certificate", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt: {id: string; status: string; session: {session_date: string; company: {name: string}; package: {name: string; code: string}}; results: {test_type: string}[]; certificate: Array<{id: string; certificate_number: string; fitness_status: string}>}) => {
                  const cert = appt.certificate?.[0];
                  return (
                    <tr key={appt.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                      <td className="px-4 py-3 text-[13px] text-white">
                        {new Date(appt.session.session_date).toLocaleDateString("en-ZA")}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#aaa]">{appt.session.company.name}</td>
                      <td className="px-4 py-3 text-[13px] text-[#aaa]">{appt.session.package.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(appt.results ?? []).map((r: {test_type: string}) => (
                            <span key={r.test_type} className="text-[10px] bg-[#1f1f1f] text-[#888] px-1.5 py-0.5 rounded">
                              {TEST_TYPE_LABELS[r.test_type as keyof typeof TEST_TYPE_LABELS] ?? r.test_type}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[12px] text-[#8c8c8c]">
                          {APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {cert ? (
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
                            {FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                          </span>
                        ) : <span className="text-[12px] text-[#555]">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/sessions/${appt.session.session_date}/appointments/${appt.id}`} className="text-[12px] text-[#666] hover:text-white transition-colors">
                          View →
                        </Link>
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
