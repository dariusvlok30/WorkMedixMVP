import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Award } from "lucide-react";
import { FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS, TEST_TYPE_LABELS } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getData(workerId: string, email: string) {
  const supabase = createAdminClient();

  // Verify the logged-in user's company owns this worker
  const { data: company } = await supabase
    .from("companies")
    .select("id, name")
    .eq("email", email)
    .single();

  if (!company) return null;

  const { data: link } = await supabase
    .from("company_workers")
    .select("worker_id")
    .eq("company_id", company.id)
    .eq("worker_id", workerId)
    .eq("is_active", true)
    .single();

  if (!link) return null; // Worker doesn't belong to this company

  const { data: worker } = await supabase
    .from("workers")
    .select(`
      *,
      fitness_certificates(
        *,
        appointment:worker_appointments(
          *,
          session:screening_sessions(*, package:screening_packages(*)),
          results:screening_results(*)
        )
      )
    `)
    .eq("id", workerId)
    .single();

  return { company, worker };
}

export default async function ClientWorkerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) redirect("/sign-in");

  const result = await getData(id, email);
  if (!result) notFound();

  const { worker } = result;
  if (!worker) notFound();

  type CertRow = {
    id: string; certificate_number: string; fitness_status: string;
    valid_until: string | null; issued_at: string; issued_by_name: string;
    restrictions: string[] | null; remarks: string | null;
    appointment?: {
      results?: Array<{ test_type: string; result_status: string }>;
      session?: { session_date: string; location: string; package?: { name: string } };
    };
  };

  const certs: CertRow[] = (worker.fitness_certificates ?? []) as CertRow[];
  const latestCert = certs[0];

  function isExpired(validUntil: string | null) {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  }

  const resultColor: Record<string, string> = {
    normal: "text-green-600", borderline: "text-amber-600",
    abnormal: "text-orange-600", refer: "text-red-600",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/portal" className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-black transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to employees
        </Link>
      </div>

      {/* Worker header */}
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[20px] font-semibold text-black">
              {worker.first_name} {worker.last_name}
            </h1>
            <p className="text-[13px] text-[#888] font-mono mt-1">{worker.id_number}</p>
            <div className="flex gap-4 mt-3 text-[12px] text-[#666]">
              {worker.date_of_birth && (
                <span>Age: {Math.floor((Date.now() - new Date(worker.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))}</span>
              )}
              {worker.gender && <span className="capitalize">{worker.gender}</span>}
            </div>
          </div>
          {latestCert && (
            <span className={cn(
              "text-[12px] font-medium px-3 py-1.5 rounded-full border",
              isExpired(latestCert.valid_until)
                ? "bg-red-50 text-red-600 border-red-200"
                : FITNESS_STATUS_COLORS[latestCert.fitness_status as keyof typeof FITNESS_STATUS_COLORS]
            )}>
              {isExpired(latestCert.valid_until)
                ? "Certificate Expired"
                : FITNESS_STATUS_LABELS[latestCert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
            </span>
          )}
        </div>
      </div>

      {/* Certificates */}
      {certs.length === 0 ? (
        <div className="bg-white border border-[#e5e5e5] rounded-xl p-10 text-center">
          <p className="text-[13px] text-[#888]">No medical records available yet for this employee.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-[14px] font-semibold text-black">Medical Records</h2>
          {certs.map((cert, idx) => {
            const session = cert.appointment?.session;
            const results = cert.appointment?.results ?? [];
            const expired = isExpired(cert.valid_until);

            return (
              <div key={cert.id} className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
                {/* Cert header */}
                <div className={cn(
                  "px-6 py-4 flex items-center justify-between border-b border-[#f0f0f0]",
                  idx === 0 ? "bg-[#fafafa]" : ""
                )}>
                  <div className="flex items-center gap-3">
                    <Award className="w-4 h-4 text-[#888]" />
                    <div>
                      <p className="text-[13px] font-semibold text-black">
                        Certificate {cert.certificate_number}
                        {idx === 0 && <span className="ml-2 text-[11px] text-[#888] font-normal">Latest</span>}
                      </p>
                      <p className="text-[12px] text-[#888]">
                        {session?.session_date
                          ? new Date(session.session_date).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
                          : "—"}{" "}
                        {session?.location && `· ${session.location}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[11px] font-medium px-2.5 py-1 rounded-full border",
                      expired
                        ? "bg-red-50 text-red-600 border-red-200"
                        : FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS]
                    )}>
                      {expired ? "Expired" : FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS]}
                    </span>
                  </div>
                </div>

                <div className="px-6 py-4 space-y-4">
                  {/* Validity */}
                  <div className="grid grid-cols-3 gap-4 text-[12px]">
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Issued</p>
                      <p className="text-black">{new Date(cert.issued_at).toLocaleDateString("en-ZA")}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Valid Until</p>
                      <p className={expired ? "text-red-500 font-medium" : "text-black"}>
                        {cert.valid_until ? new Date(cert.valid_until).toLocaleDateString("en-ZA") : "—"}
                        {expired && " (Expired)"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Package</p>
                      <p className="text-black">{session?.package?.name ?? "—"}</p>
                    </div>
                  </div>

                  {/* Test results */}
                  {results.length > 0 && (
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-2">Tests Performed</p>
                      <div className="flex flex-wrap gap-2">
                        {results.map((r) => (
                          <div key={r.test_type} className="flex items-center gap-1.5 bg-[#f9f9f9] border border-[#e5e5e5] rounded px-2.5 py-1">
                            <span className="text-[12px] text-[#666]">
                              {TEST_TYPE_LABELS[r.test_type as keyof typeof TEST_TYPE_LABELS] ?? r.test_type}
                            </span>
                            <span className={cn("text-[11px] font-medium capitalize", resultColor[r.result_status] ?? "text-gray-600")}>
                              {r.result_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Restrictions */}
                  {cert.restrictions && cert.restrictions.length > 0 && (
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-2">Restrictions</p>
                      <ul className="space-y-1">
                        {cert.restrictions.map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-[12px] text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {cert.remarks && (
                    <div>
                      <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1">Remarks</p>
                      <p className="text-[12px] text-[#666]">{cert.remarks}</p>
                    </div>
                  )}

                  {/* Document download links */}
                  <div className="flex gap-3 pt-2 border-t border-[#f0f0f0]">
                    <a
                      href={`/portal/documents/${cert.id}/cof`}
                      target="_blank"
                      className="flex items-center gap-2 text-[12px] text-black font-medium hover:text-[#555] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Certificate of Fitness
                    </a>
                    <span className="text-[#ddd]">|</span>
                    <a
                      href={`/portal/documents/${cert.id}/annexure3`}
                      target="_blank"
                      className="flex items-center gap-2 text-[12px] text-black font-medium hover:text-[#555] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Annexure 3
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
