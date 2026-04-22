import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, Printer, Award } from "lucide-react";
import { FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS, TEST_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

async function getCertificate(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fitness_certificates")
    .select(`
      *,
      worker:workers(*),
      appointment:worker_appointments(
        *,
        session:screening_sessions(*, company:companies(*), package:screening_packages(*)),
        results:screening_results(*)
      )
    `)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function CertificateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await getCertificate(id);
  if (!cert) notFound();

  const worker = cert.worker as { first_name: string; last_name: string; id_number: string; date_of_birth: string | null; gender: string | null };
  type ApptData = { results?: Array<{ test_type: string; result_status: string }>; session?: { session_date: string; location: string; company?: { name: string }; package?: { name: string } } };
  const appt = cert.appointment as ApptData | undefined;
  const results = appt?.results ?? [];
  const session = appt?.session;

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        <div className="flex items-center justify-between">
          <Link href="/certificates" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Certificates
          </Link>
          <a
            href={`/certificates/${id}/print`}
            target="_blank"
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
          >
            <Printer className="w-3.5 h-3.5" /> Print Certificate
          </a>
        </div>

        {/* Status banner */}
        <div className={cn("rounded-lg p-5 text-center", FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
          <div className="flex items-center justify-center gap-2.5 mb-1">
            <Award className="w-5 h-5" />
            <span className="text-[18px] font-bold">
              {FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
            </span>
          </div>
          <p className="text-[12px] opacity-80">
            Certificate #{cert.certificate_number}
            {cert.valid_until && ` · Valid until ${new Date(cert.valid_until).toLocaleDateString("en-ZA")}`}
          </p>
        </div>

        {/* Details */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5 space-y-5">
          {/* Worker */}
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">Employee</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Name", value: `${worker.first_name} ${worker.last_name}` },
                { label: "ID Number", value: worker.id_number },
                { label: "Date of Birth", value: worker.date_of_birth ? new Date(worker.date_of_birth).toLocaleDateString("en-ZA") : "—" },
                { label: "Age", value: worker.date_of_birth ? `${Math.floor((Date.now() - new Date(worker.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years` : "—" },
                { label: "Gender", value: worker.gender ?? "—" },
                { label: "Company", value: session?.company?.name ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0f0f0f] p-2.5 rounded-md border border-[#1a1a1a]">
                  <p className="text-[10px] text-[#555] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[13px] text-[#ccc] capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Examination */}
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">Examination</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Date", value: session?.session_date ? new Date(session.session_date).toLocaleDateString("en-ZA") : "—" },
                { label: "Location", value: session?.location ?? "—" },
                { label: "Package", value: session?.package?.name ?? "—" },
                { label: "Issued By", value: cert.issued_by_name },
                { label: "Issued At", value: new Date(cert.issued_at).toLocaleDateString("en-ZA") },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#0f0f0f] p-2.5 rounded-md border border-[#1a1a1a]">
                  <p className="text-[10px] text-[#555] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[13px] text-[#ccc]">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Test results */}
          {results.length > 0 && (
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wide mb-3">Test Results</p>
              <div className="grid grid-cols-3 gap-2">
                {results.map((r) => (
                  <div key={r.test_type} className="bg-[#0f0f0f] p-2.5 rounded-md border border-[#1a1a1a]">
                    <p className="text-[10px] text-[#555] uppercase tracking-wide mb-1">{TEST_TYPE_LABELS[r.test_type as keyof typeof TEST_TYPE_LABELS] ?? r.test_type}</p>
                    <p className={cn("text-[12px] font-medium capitalize",
                      r.result_status === "normal" ? "text-green-400" :
                      r.result_status === "borderline" ? "text-amber-400" :
                      r.result_status === "abnormal" ? "text-orange-400" : "text-red-400"
                    )}>
                      {r.result_status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restrictions */}
          {cert.restrictions && cert.restrictions.length > 0 && (
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wide mb-2">Restrictions</p>
              <ul className="space-y-1">
                {cert.restrictions.map((r: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-amber-300">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Remarks */}
          {cert.remarks && (
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wide mb-2">Remarks</p>
              <p className="text-[13px] text-[#aaa]">{cert.remarks}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href={`/workers/${cert.worker_id}`} className="text-[13px] text-[#666] hover:text-white transition-colors">
            View worker history →
          </Link>
        </div>
      </div>
    </div>
  );
}
