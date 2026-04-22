import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { FITNESS_STATUS_LABELS, TEST_TYPE_LABELS } from "@/types";

async function getCertificate(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("fitness_certificates")
    .select(`
      *,
      worker:workers(*),
      appointment:worker_appointments(
        *,
        session:screening_sessions(
          *, company:companies(*), package:screening_packages(*)
        ),
        results:screening_results(*)
      )
    `)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function CertificatePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await getCertificate(id);
  if (!cert) notFound();

  const worker = cert.worker as {
    first_name: string; last_name: string; id_number: string; id_type: string;
    date_of_birth: string | null; gender: string | null; race: string | null;
  };

  type AppointmentData = {
    results?: Array<{ test_type: string; result_status: string; result_data: Record<string, unknown> }>;
    session?: {
      session_date: string; location: string;
      company?: { name: string; address: string };
      package?: { name: string };
    };
  };
  const appointment = cert.appointment as AppointmentData | undefined;
  const results: Array<{ test_type: string; result_status: string; result_data: Record<string, unknown> }> = appointment?.results ?? [];
  const session = appointment?.session;
  const company = session?.company;

  const statusColor: Record<string, string> = {
    fit: "#166534",
    fit_with_restrictions: "#854d0e",
    temporarily_unfit: "#9a3412",
    permanently_unfit: "#7f1d1d",
  };

  const resultColor = { normal: "#166534", borderline: "#854d0e", abnormal: "#9a3412", refer: "#7f1d1d" };

  function age(dob: string | null) {
    if (!dob) return "Unknown";
    return `${Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} years`;
  }

  return (
    <html lang="en">
      <head>
        <title>Certificate of Fitness — {cert.certificate_number}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm; }
          .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 3px solid #111; padding-bottom: 12px; margin-bottom: 16px; }
          .logo-text { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
          .logo-sub { font-size: 10px; color: #555; margin-top: 2px; }
          .cert-title { text-align: center; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .cert-num { text-align: center; font-size: 10px; color: #555; margin-bottom: 16px; }
          .section { margin-bottom: 14px; }
          .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #555; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; margin-bottom: 8px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
          .field { padding: 6px 8px; background: #f9f9f9; border-radius: 3px; }
          .field-label { font-size: 9px; color: #888; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 2px; }
          .field-value { font-size: 11px; font-weight: 600; color: #111; }
          .status-box { text-align: center; padding: 12px; border-radius: 6px; margin-bottom: 14px; }
          .status-label { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
          .status-sub { font-size: 10px; margin-top: 4px; opacity: 0.8; }
          .results-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .result-item { padding: 6px 8px; border-radius: 3px; border: 1px solid #e5e5e5; }
          .result-test { font-size: 9px; color: #666; text-transform: uppercase; }
          .result-status { font-size: 11px; font-weight: 600; }
          .restrictions-list { list-style: disc; padding-left: 14px; }
          .restrictions-list li { margin-bottom: 3px; }
          .footer { margin-top: auto; border-top: 1px solid #ddd; padding-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
          .sig-line { border-top: 1px solid #333; margin-top: 32px; padding-top: 4px; }
          .sig-label { font-size: 10px; color: #555; }
          .stamp-area { border: 2px dashed #ccc; border-radius: 6px; height: 70px; display: flex; align-items: center; justify-content: center; color: #bbb; font-size: 11px; }
          .qr-note { text-align: center; font-size: 9px; color: #aaa; margin-top: 8px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
        `}</style>
      </head>
      <body>
        {/* Print button (hidden when printing) */}
        <div className="no-print" style={{ background: "#f0f0f0", padding: "10px", textAlign: "center", fontFamily: "Arial", fontSize: "13px" }}>
          <button onClick={() => typeof window !== "undefined" && window.print()} style={{ padding: "8px 20px", background: "#111", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
            🖨 Print Certificate
          </button>
          <span style={{ margin: "0 16px", color: "#888" }}>|</span>
          <a href={`/certificates/${id}`} style={{ color: "#555", fontSize: "13px" }}>← Back</a>
        </div>

        <div className="page">
          {/* Header */}
          <div className="header">
            <div>
              <div className="logo-text">WorkMedix</div>
              <div className="logo-sub">Occupational Health Services</div>
            </div>
            <div style={{ textAlign: "right", fontSize: "10px", color: "#555", lineHeight: "1.5" }}>
              <p>info@workmedix.co.za</p>
              <p>www.workmedix.co.za</p>
            </div>
          </div>

          {/* Title */}
          <div className="cert-title">Certificate of Fitness</div>
          <div className="cert-num">Certificate No: {cert.certificate_number}</div>

          {/* Fitness status banner */}
          <div className="status-box" style={{ background: statusColor[cert.fitness_status] ?? "#111", color: "white" }}>
            <div className="status-label">{FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}</div>
            {cert.valid_until && (
              <div className="status-sub">
                Valid until: {new Date(cert.valid_until).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            )}
          </div>

          {/* Worker details */}
          <div className="section">
            <div className="section-title">Employee Details</div>
            <div className="grid-3">
              <div className="field">
                <div className="field-label">Full Name</div>
                <div className="field-value">{worker.first_name} {worker.last_name}</div>
              </div>
              <div className="field">
                <div className="field-label">{worker.id_type === "passport" ? "Passport No." : "SA ID Number"}</div>
                <div className="field-value" style={{ fontFamily: "monospace" }}>{worker.id_number}</div>
              </div>
              <div className="field">
                <div className="field-label">Date of Birth</div>
                <div className="field-value">
                  {worker.date_of_birth ? new Date(worker.date_of_birth).toLocaleDateString("en-ZA") : "—"}
                </div>
              </div>
              <div className="field">
                <div className="field-label">Age</div>
                <div className="field-value">{age(worker.date_of_birth)}</div>
              </div>
              <div className="field">
                <div className="field-label">Gender</div>
                <div className="field-value" style={{ textTransform: "capitalize" }}>{worker.gender ?? "—"}</div>
              </div>
              <div className="field">
                <div className="field-label">Company</div>
                <div className="field-value">{company?.name ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Examination details */}
          <div className="section">
            <div className="section-title">Examination Details</div>
            <div className="grid-3">
              <div className="field">
                <div className="field-label">Date of Examination</div>
                <div className="field-value">
                  {session?.session_date ? new Date(session.session_date).toLocaleDateString("en-ZA") : "—"}
                </div>
              </div>
              <div className="field">
                <div className="field-label">Location</div>
                <div className="field-value">{session?.location ?? "—"}</div>
              </div>
              <div className="field">
                <div className="field-label">Package</div>
                <div className="field-value">{session?.package?.name ?? "—"}</div>
              </div>
            </div>
          </div>

          {/* Test results */}
          {results.length > 0 && (
            <div className="section">
              <div className="section-title">Test Results Summary</div>
              <div className="results-grid">
                {results.map((r) => (
                  <div key={r.test_type} className="result-item">
                    <div className="result-test">{TEST_TYPE_LABELS[r.test_type as keyof typeof TEST_TYPE_LABELS] ?? r.test_type}</div>
                    <div className="result-status" style={{ color: resultColor[r.result_status as keyof typeof resultColor] ?? "#111", textTransform: "capitalize" }}>
                      {r.result_status}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restrictions */}
          {cert.restrictions && cert.restrictions.length > 0 && (
            <div className="section">
              <div className="section-title">Restrictions / Conditions</div>
              <ul className="restrictions-list">
                {cert.restrictions.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Remarks */}
          {cert.remarks && (
            <div className="section">
              <div className="section-title">Remarks</div>
              <p style={{ lineHeight: "1.5" }}>{cert.remarks}</p>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <div>
              <div className="sig-line">
                <div className="sig-label">{cert.issued_by_name}</div>
                <div className="sig-label">Occupational Health Practitioner</div>
                <div className="sig-label" style={{ marginTop: "2px" }}>
                  {new Date(cert.issued_at).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
            <div>
              <div className="stamp-area">Official Stamp</div>
            </div>
          </div>

          <div className="qr-note" style={{ marginTop: "12px" }}>
            This certificate was generated by WorkMedix OHS · Certificate No: {cert.certificate_number}
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load', function() { window.print(); });` }} />
      </body>
    </html>
  );
}
