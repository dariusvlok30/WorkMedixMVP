import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TEST_TYPE_LABELS } from "@/types";

async function getData(id: string) {
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

function Tick({ checked }: { checked: boolean }) {
  return (
    <span style={{
      display: "inline-block", width: "14px", height: "14px",
      border: "1.5px solid #333", borderRadius: "2px",
      background: checked ? "#111" : "white",
      color: "white", fontSize: "11px", lineHeight: "13px",
      textAlign: "center", fontWeight: "700", flexShrink: 0,
    }}>
      {checked ? "✓" : ""}
    </span>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <tr>
      <td style={{ width: "40%", padding: "4px 8px", fontWeight: "600", fontSize: "10px", background: "#f9f9f9", borderBottom: "1px solid #e5e5e5" }}>{label}</td>
      <td style={{ padding: "4px 8px", fontSize: "10px", borderBottom: "1px solid #e5e5e5" }}>{value ?? "—"}</td>
    </tr>
  );
}

const HAZARDS = [
  "Noise (> 85 dB TWA)", "Dust / Silica", "Chemical Solvents",
  "Asbestos", "Vibration", "Radiation (ionising)", "Heights > 2m",
  "Extreme Heat/Cold", "Biological Agents", "Ergonomic Stress",
];

const ALL_TESTS = [
  { key: "spirometry", label: "Spirometry (Lung function)" },
  { key: "audiometry", label: "Audiometry (Hearing)" },
  { key: "vision", label: "Vision screening" },
  { key: "blood_pressure", label: "Blood pressure / Pulse" },
  { key: "height_weight", label: "Height, Weight & BMI" },
  { key: "urine", label: "Urine dipstick" },
  { key: "ecg", label: "ECG (12-lead)" },
  { key: "general", label: "Physical examination" },
];

export default async function Annexure3Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = await getData(id);
  if (!cert) notFound();

  type WorkerRow = {
    first_name: string; middle_name?: string | null; last_name: string;
    id_number: string; id_type: string; date_of_birth: string | null;
    gender: string | null; occupation?: string | null; department?: string | null;
    division?: string | null; race?: string | null;
  };
  type ResultRow = { test_type: string; result_status: string; result_data: Record<string, unknown> };
  type AppointmentRow = {
    results?: ResultRow[];
    session?: {
      session_date: string; location: string;
      company?: { name: string; address?: string | null };
      package?: { name: string; tests_included?: string[] };
    };
  };

  const worker = cert.worker as WorkerRow;
  const appt = cert.appointment as AppointmentRow | null;
  const session = appt?.session;
  const company = session?.company;
  const results: ResultRow[] = appt?.results ?? [];
  const doneTests = new Set(results.map((r) => r.test_type));
  const packageTests: string[] = session?.package?.tests_included ?? [];

  function age(dob: string | null) {
    if (!dob) return "—";
    return `${Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25))}`;
  }

  const resultColor: Record<string, string> = {
    normal: "#166534", borderline: "#854d0e", abnormal: "#9a3412", refer: "#7f1d1d",
  };

  const fitnessLabels: Record<string, string> = {
    fit: "Fit for Work",
    fit_with_restrictions: "Fit — with Restrictions",
    temporarily_unfit: "Temporarily Unfit",
    permanently_unfit: "Permanently Unfit",
  };

  return (
    <html lang="en">
      <head>
        <title>Annexure 3 — {worker.first_name} {worker.last_name}</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 11px; color: #111; background: white; }
          .page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 14mm 15mm; }
          table { width: 100%; border-collapse: collapse; }
          .border-table td, .border-table th { border: 1px solid #ccc; padding: 5px 8px; }
          h1 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; background: #111; color: white; padding: 4px 8px; margin: 12px 0 6px; }
          .sub { font-size: 9px; color: #555; }
          .tick-row { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 10px; }
          .result-bar { display: inline-block; padding: 2px 8px; border-radius: 3px; font-weight: 700; font-size: 10px; color: white; }
          .sig-box { border-top: 1.5px solid #333; margin-top: 36px; padding-top: 4px; font-size: 10px; color: #555; }
          .footer-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
          }
        `}</style>
      </head>
      <body>
        <div className="no-print" style={{ background: "#1f1f1f", padding: "10px", textAlign: "center", fontFamily: "Arial" }}>
          <a href={`/certificates/${id}`} style={{ color: "#888", fontSize: "12px", marginRight: "20px" }}>← Back</a>
          <button onClick={() => typeof window !== "undefined" && window.print()} style={{ padding: "7px 18px", background: "white", color: "#111", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>
            🖨 Print Annexure 3
          </button>
          <a href={`/certificates/${id}/print`} style={{ color: "#888", fontSize: "12px", marginLeft: "20px" }}>View COF →</a>
        </div>

        <div className="page">
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #111", paddingBottom: "10px", marginBottom: "12px" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: "700" }}>WorkMedix</div>
              <div style={{ fontSize: "10px", color: "#555" }}>Occupational Health Services</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <h1>ANNEXURE 3</h1>
              <div className="sub">Occupational Health Act 85 of 1993 — Medical Surveillance Record</div>
            </div>
            <div style={{ textAlign: "right", fontSize: "10px", color: "#555", lineHeight: "1.6" }}>
              <div>Cert No: <strong>{cert.certificate_number}</strong></div>
              <div>Date: {new Date(cert.issued_at).toLocaleDateString("en-ZA")}</div>
            </div>
          </div>

          {/* Employee Details */}
          <h2>1. Employee Details</h2>
          <table>
            <tbody>
              <Row label="Surname & First Names" value={`${worker.last_name}, ${worker.first_name}${worker.middle_name ? " " + worker.middle_name : ""}`} />
              <Row label="SA ID / Passport Number" value={worker.id_number} />
              <Row label="Date of Birth" value={worker.date_of_birth ? new Date(worker.date_of_birth).toLocaleDateString("en-ZA") : null} />
              <Row label="Age" value={age(worker.date_of_birth) + " years"} />
              <Row label="Gender" value={worker.gender ?? null} />
              <Row label="Occupation / Job Title" value={(worker as Record<string, unknown>).occupation as string ?? null} />
              <Row label="Department" value={(worker as Record<string, unknown>).department as string ?? null} />
              <Row label="Division / Branch" value={(worker as Record<string, unknown>).division as string ?? null} />
            </tbody>
          </table>

          {/* Employer Details */}
          <h2>2. Employer Details</h2>
          <table>
            <tbody>
              <Row label="Company Name" value={company?.name ?? null} />
              <Row label="Address" value={(company as Record<string, unknown> | undefined)?.address as string ?? null} />
              <Row label="Examination Location" value={session?.location ?? null} />
              <Row label="Date of Examination" value={session?.session_date ? new Date(session.session_date).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : null} />
            </tbody>
          </table>

          {/* Hazardous Exposures */}
          <h2>3. Occupational Hazard Exposures</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px", padding: "6px 8px" }}>
            {HAZARDS.map((h) => (
              <div key={h} className="tick-row">
                <Tick checked={false} />
                <span>{h}</span>
              </div>
            ))}
          </div>

          {/* Tests Performed */}
          <h2>4. Medical Surveillance Tests Performed</h2>
          <div style={{ padding: "6px 8px" }}>
            {ALL_TESTS.map(({ key, label }) => {
              const result = results.find((r) => r.test_type === key);
              const done = doneTests.has(key);
              const required = packageTests.includes(key);
              return (
                <div key={key} className="tick-row" style={{ justifyContent: "space-between", borderBottom: "1px solid #f0f0f0", paddingBottom: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Tick checked={done} />
                    <span>{label}</span>
                    {required && !done && <span style={{ fontSize: "9px", color: "#888" }}>(required)</span>}
                  </div>
                  {result && (
                    <span className="result-bar" style={{ background: resultColor[result.result_status] ?? "#333" }}>
                      {result.result_status.toUpperCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Key Results Summary */}
          {results.some((r) => Object.keys(r.result_data ?? {}).length > 0) && (
            <>
              <h2>5. Key Clinical Values</h2>
              <table className="border-table">
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    <th style={{ textAlign: "left", fontSize: "10px" }}>Test</th>
                    <th style={{ textAlign: "left", fontSize: "10px" }}>Key Values</th>
                    <th style={{ textAlign: "left", fontSize: "10px" }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const d = r.result_data ?? {};
                    let summary = "";
                    if (r.test_type === "spirometry") summary = `FVC: ${d.fvc_actual ?? "—"}L  FEV1: ${d.fev1_actual ?? "—"}L  FEV1/FVC: ${d.fev1_fvc_ratio ?? "—"}`;
                    else if (r.test_type === "audiometry") summary = `L-PTA: ${d.left_pta ?? "—"} dB  R-PTA: ${d.right_pta ?? "—"} dB`;
                    else if (r.test_type === "blood_pressure") summary = `${d.systolic ?? "—"}/${d.diastolic ?? "—"} mmHg  Pulse: ${d.pulse ?? "—"} bpm`;
                    else if (r.test_type === "height_weight") summary = `Height: ${d.height_cm ?? "—"}cm  Weight: ${d.weight_kg ?? "—"}kg  BMI: ${d.bmi ?? "—"}`;
                    else if (r.test_type === "vision") summary = `L: ${d.left_far ?? "—"}  R: ${d.right_far ?? "—"}`;
                    else summary = (d.interpretation as string) ?? "";
                    if (!summary) return null;
                    return (
                      <tr key={r.test_type}>
                        <td style={{ fontSize: "10px" }}>{TEST_TYPE_LABELS[r.test_type as keyof typeof TEST_TYPE_LABELS] ?? r.test_type}</td>
                        <td style={{ fontSize: "10px", fontFamily: "monospace" }}>{summary}</td>
                        <td style={{ fontSize: "10px", fontWeight: "700", color: resultColor[r.result_status] ?? "#111", textTransform: "uppercase" }}>{r.result_status}</td>
                      </tr>
                    );
                  }).filter(Boolean)}
                </tbody>
              </table>
            </>
          )}

          {/* Fitness Determination */}
          <h2>6. Fitness Determination</h2>
          <div style={{ padding: "8px 8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {(["fit", "fit_with_restrictions", "temporarily_unfit", "permanently_unfit"] as const).map((status) => (
              <div key={status} className="tick-row">
                <Tick checked={cert.fitness_status === status} />
                <span style={{ fontWeight: cert.fitness_status === status ? "700" : "400" }}>{fitnessLabels[status]}</span>
              </div>
            ))}
          </div>

          {cert.restrictions && cert.restrictions.length > 0 && (
            <div style={{ padding: "6px 8px", fontSize: "10px" }}>
              <strong>Restrictions / Conditions:</strong>
              <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                {cert.restrictions.map((r: string, i: number) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}

          {cert.valid_until && (
            <div style={{ padding: "4px 8px", fontSize: "10px" }}>
              <strong>Certificate valid until:</strong>{" "}
              {new Date(cert.valid_until).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })}
            </div>
          )}

          {cert.remarks && (
            <div style={{ padding: "4px 8px 8px", fontSize: "10px" }}>
              <strong>Remarks / Referrals:</strong> {cert.remarks}
            </div>
          )}

          {/* Signatures */}
          <h2>7. Declarations & Signatures</h2>
          <div className="footer-grid">
            <div>
              <div className="sig-box">{cert.issued_by_name}</div>
              <div style={{ fontSize: "9px", color: "#555", marginTop: "4px" }}>Occupational Health Practitioner</div>
              <div style={{ fontSize: "9px", color: "#555" }}>Signature & Date</div>
            </div>
            <div>
              <div className="sig-box">&nbsp;</div>
              <div style={{ fontSize: "9px", color: "#555", marginTop: "4px" }}>Employee: {worker.first_name} {worker.last_name}</div>
              <div style={{ fontSize: "9px", color: "#555" }}>Signature & Date</div>
            </div>
            <div>
              <div style={{ border: "2px dashed #ccc", borderRadius: "4px", height: "50px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "10px" }}>
                Official Stamp
              </div>
            </div>
          </div>

          <div style={{ marginTop: "16px", fontSize: "9px", color: "#aaa", textAlign: "center", borderTop: "1px solid #eee", paddingTop: "8px" }}>
            This document constitutes a medical surveillance record as required under Section 16 of the Occupational Health and Safety Act 85 of 1993 and OHSA Regulations. Retain for minimum 40 years. Generated by WorkMedix OHS · {cert.certificate_number}
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('load', function() { window.print(); });` }} />
      </body>
    </html>
  );
}
