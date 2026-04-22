import { currentUser } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getCompanyData(email: string) {
  const supabase = createAdminClient();

  // Find the company whose contact email matches the logged-in user
  const { data: company, error } = await supabase
    .from("companies")
    .select("id, name, address, contact_person, phone, email")
    .eq("email", email)
    .single();

  if (error || !company) return null;

  // Get all workers linked to this company with their latest certificate
  const { data: workers } = await supabase
    .from("company_workers")
    .select(`
      worker:workers(
        id, first_name, last_name, id_number, date_of_birth, gender,
        fitness_certificates(
          id, certificate_number, fitness_status, valid_until, issued_at
        )
      )
    `)
    .eq("company_id", company.id)
    .eq("is_active", true);

  return { company, workers: workers ?? [] };
}

export default async function PortalPage() {
  const user = await currentUser();
  const email = user?.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress;
  if (!email) redirect("/sign-in");

  const result = await getCompanyData(email);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <h1 className="text-[18px] font-semibold text-black mb-2">No company account found</h1>
          <p className="text-[13px] text-[#888]">
            Your email address (<strong>{email}</strong>) is not linked to a company in our system.
            Please contact WorkMedix to set up your portal access.
          </p>
          <a href="mailto:info@workmedix.co.za" className="mt-4 inline-block text-[13px] text-black underline underline-offset-2">
            info@workmedix.co.za
          </a>
        </div>
      </div>
    );
  }

  const { company, workers } = result;

  type CertRow = { id: string; certificate_number: string; fitness_status: string; valid_until: string | null; issued_at: string };
  type WorkerRow = { id: string; first_name: string; last_name: string; id_number: string; date_of_birth: string | null; gender: string | null; fitness_certificates?: CertRow[] };

  const workerList: WorkerRow[] = workers
    .map((w) => (w.worker as unknown as WorkerRow | null))
    .filter((w): w is WorkerRow => w !== null);

  const fitCount = workerList.filter((w) => {
    const cert = w.fitness_certificates?.[0];
    return cert?.fitness_status === "fit";
  }).length;

  const restrictedCount = workerList.filter((w) => {
    const cert = w.fitness_certificates?.[0];
    return cert?.fitness_status === "fit_with_restrictions";
  }).length;

  const unfitCount = workerList.filter((w) => {
    const cert = w.fitness_certificates?.[0];
    return ["temporarily_unfit", "permanently_unfit"].includes(cert?.fitness_status ?? "");
  }).length;

  const pendingCount = workerList.filter((w) => !w.fitness_certificates?.length).length;

  function isExpired(validUntil: string | null) {
    if (!validUntil) return false;
    return new Date(validUntil) < new Date();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-black">{company.name}</h1>
        <p className="text-[13px] text-[#888] mt-0.5">Medical screening records for your employees</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: workerList.length, color: "text-black" },
          { label: "Fit for Work", value: fitCount, color: "text-green-600" },
          { label: "With Restrictions", value: restrictedCount, color: "text-amber-600" },
          { label: "Unfit / Pending", value: unfitCount + pendingCount, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-[#e5e5e5] rounded-xl p-5">
            <p className={`text-[28px] font-bold leading-none ${color}`}>{value}</p>
            <p className="text-[12px] text-[#888] mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Worker table */}
      <div>
        <h2 className="text-[14px] font-semibold text-black mb-3">Employee Medical Records</h2>
        {workerList.length === 0 ? (
          <div className="bg-white border border-[#e5e5e5] rounded-xl p-10 text-center">
            <p className="text-[13px] text-[#888]">No employee records found. Contact WorkMedix to add your employees.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#f0f0f0]">
                  <th className="text-left text-[11px] text-[#888] font-medium px-5 py-3 uppercase tracking-wide">Employee</th>
                  <th className="text-left text-[11px] text-[#888] font-medium px-5 py-3 uppercase tracking-wide">ID Number</th>
                  <th className="text-left text-[11px] text-[#888] font-medium px-5 py-3 uppercase tracking-wide">Status</th>
                  <th className="text-left text-[11px] text-[#888] font-medium px-5 py-3 uppercase tracking-wide">Valid Until</th>
                  <th className="text-left text-[11px] text-[#888] font-medium px-5 py-3 uppercase tracking-wide">Documents</th>
                </tr>
              </thead>
              <tbody>
                {workerList.map((w) => {
                  const cert = w.fitness_certificates?.[0];
                  const expired = isExpired(cert?.valid_until ?? null);
                  return (
                    <tr key={w.id} className="border-b border-[#f9f9f9] hover:bg-[#fafafa] transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-medium text-black">{w.first_name} {w.last_name}</p>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-[12px] text-[#666] font-mono">{w.id_number}</p>
                      </td>
                      <td className="px-5 py-3">
                        {cert ? (
                          <span className={cn(
                            "inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize",
                            expired ? "bg-red-50 text-red-600 border-red-200" :
                            FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS]
                          )}>
                            {expired ? "Expired" : FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                          </span>
                        ) : (
                          <span className="inline-block text-[11px] font-medium px-2.5 py-1 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {cert?.valid_until ? (
                          <p className={cn("text-[12px]", expired ? "text-red-500 font-medium" : "text-[#666]")}>
                            {new Date(cert.valid_until).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                          </p>
                        ) : (
                          <p className="text-[12px] text-[#999]">—</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {cert ? (
                          <Link
                            href={`/portal/workers/${w.id}`}
                            className="text-[12px] text-black font-medium underline underline-offset-2 hover:text-[#555] transition-colors"
                          >
                            View docs →
                          </Link>
                        ) : (
                          <span className="text-[12px] text-[#bbb]">No documents yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#bbb] text-center">
        Medical records are confidential and governed by the POPI Act. For queries contact info@workmedix.co.za
      </p>
    </div>
  );
}
