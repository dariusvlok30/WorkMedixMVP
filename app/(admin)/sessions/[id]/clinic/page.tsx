"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, Loader2, Award, AlertCircle,
  Wind, Ear, Eye, Heart, Scale, FlaskConical, User, Wifi, WifiOff,
} from "lucide-react";
import type { WorkerAppointment, ScreeningSession, TestType, ResultStatus } from "@/types";
import { TEST_TYPE_LABELS, FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

// Ordered test workflow — clinician goes through these in sequence
const TEST_STEPS: TestType[] = [
  "general", "height_weight", "blood_pressure", "vision", "urine", "audiometry", "spirometry",
];

const TEST_ICONS: Record<TestType, React.ElementType> = {
  spirometry: Wind, audiometry: Ear, vision: Eye,
  blood_pressure: Heart, height_weight: Scale, urine: FlaskConical,
  ecg: Heart, general: User,
};

const STATUS_OPTIONS: Array<{ value: ResultStatus; label: string; dot: string }> = [
  { value: "normal",     label: "Normal",    dot: "bg-green-400" },
  { value: "borderline", label: "Borderline", dot: "bg-amber-400" },
  { value: "abnormal",   label: "Abnormal",  dot: "bg-orange-500" },
  { value: "refer",      label: "Refer",     dot: "bg-red-500" },
];

const DEVICE_TO_TEST: Record<string, TestType> = {
  spirometer: "spirometry", audiometer: "audiometry",
  keystone: "vision", bp_monitor: "blood_pressure",
};

// ─── Device bridge hook ────────────────────────────────────────────────────────

function useDeviceBridge(onData: (deviceType: string, data: Record<string, unknown>) => void) {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  function connect() {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    setError(null);
    try {
      const socket = new WebSocket("ws://localhost:3001");
      socket.onopen = () => setConnected(true);
      socket.onclose = () => setConnected(false);
      socket.onerror = () => { setConnected(false); setError("Bridge not running"); };
      socket.onmessage = (e) => {
        try { const { device_type, data } = JSON.parse(e.data); onDataRef.current(device_type, data); } catch {}
      };
      ws.current = socket;
    } catch { setError("Could not connect"); }
  }

  function disconnect() { ws.current?.close(); ws.current = null; setConnected(false); setError(null); }
  useEffect(() => () => { ws.current?.close(); }, []);
  return { connected, error, connect, disconnect };
}

// ─── Test forms ────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-[#666] uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inp = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#444] transition-colors";
const sel = `${inp}`;

function GeneralForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <Field label="Medical History"><textarea value={f("medical_history")} onChange={e => s("medical_history", e.target.value)} rows={2} placeholder="Relevant medical history, chronic conditions…" className={`${inp} resize-none`} /></Field>
      <Field label="Current Medications"><input type="text" value={f("medications")} onChange={e => s("medications", e.target.value)} placeholder="List medications or 'None'" className={inp} /></Field>
      <Field label="Allergies"><input type="text" value={f("allergies")} onChange={e => s("allergies", e.target.value)} placeholder="Known allergies or 'NKDA'" className={inp} /></Field>
      <Field label="Examination Notes"><textarea value={f("notes")} onChange={e => s("notes", e.target.value)} rows={2} className={`${inp} resize-none`} /></Field>
    </div>
  );
}

function HeightWeightForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => {
    const u = { ...data, [k]: v };
    const h = parseFloat(String(u.height_cm)), w = parseFloat(String(u.weight_kg));
    if (h > 0 && w > 0) u.bmi = Math.round((w / ((h / 100) ** 2)) * 10) / 10;
    onChange(u);
  };
  const bmi = parseFloat(f("bmi"));
  const cat = !isNaN(bmi) ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal weight" : bmi < 30 ? "Overweight" : "Obese") : "";
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Height (cm)"><input type="number" step="0.1" value={f("height_cm")} onChange={e => s("height_cm", e.target.value)} className={inp} /></Field>
        <Field label="Weight (kg)"><input type="number" step="0.1" value={f("weight_kg")} onChange={e => s("weight_kg", e.target.value)} className={inp} /></Field>
        <Field label="BMI (auto)"><input type="number" value={f("bmi")} readOnly className={`${inp} opacity-60`} /></Field>
      </div>
      {cat && <p className="text-[12px] text-[#777]">↳ {cat} (BMI {f("bmi")})</p>}
    </div>
  );
}

function BloodPressureForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const sys = parseInt(f("systolic")), dia = parseInt(f("diastolic"));
  let hint = "";
  if (!isNaN(sys) && !isNaN(dia)) {
    if (sys >= 180 || dia >= 120) hint = "⚠ Hypertensive crisis — refer urgently";
    else if (sys >= 140 || dia >= 90) hint = "Stage 2 hypertension";
    else if (sys >= 130 || dia >= 80) hint = "Stage 1 hypertension";
    else if (sys >= 120) hint = "Elevated BP";
    else hint = "Normal";
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Field label="Systolic (mmHg)"><input type="number" value={f("systolic")} onChange={e => s("systolic", e.target.value)} className={inp} /></Field>
        <Field label="Diastolic (mmHg)"><input type="number" value={f("diastolic")} onChange={e => s("diastolic", e.target.value)} className={inp} /></Field>
        <Field label="Pulse (bpm)"><input type="number" value={f("pulse")} onChange={e => s("pulse", e.target.value)} className={inp} /></Field>
      </div>
      {hint && <p className={`text-[12px] ${hint.startsWith("⚠") ? "text-red-400" : "text-[#777]"}`}>{hint}</p>}
    </div>
  );
}

function VisionForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[{ key: "left_near", label: "Left — Near" }, { key: "left_far", label: "Left — Far" }, { key: "right_near", label: "Right — Near" }, { key: "right_far", label: "Right — Far" }].map(({ key, label }) => (
          <Field key={key} label={label}><input type="text" value={f(key)} onChange={e => s(key, e.target.value)} placeholder="6/6" className={inp} /></Field>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[{ key: "colour_vision", label: "Colour Vision" }, { key: "depth_perception", label: "Depth Perception" }, { key: "glasses_required", label: "Glasses Required" }].map(({ key, label }) => (
          <Field key={key} label={label}>
            <select value={f(key)} onChange={e => s(key, e.target.value)} className={sel}>
              <option value="">Select</option><option value="pass">Pass</option><option value="fail">Fail</option>
            </select>
          </Field>
        ))}
      </div>
    </div>
  );
}

function UrineForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const opts = ["negative", "trace", "+", "++", "+++"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {["protein", "glucose", "blood", "ketones", "leukocytes", "nitrites"].map((k) => (
          <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}>
            <select value={f(k)} onChange={e => s(k, e.target.value)} className={sel}>
              <option value="">—</option>{opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
        ))}
        <Field label="pH"><input type="number" step="0.5" min="4" max="9" value={f("ph")} onChange={e => s("ph", e.target.value)} className={inp} /></Field>
        <Field label="Specific Gravity"><input type="number" step="0.001" min="1.000" max="1.030" value={f("specific_gravity")} onChange={e => s("specific_gravity", e.target.value)} className={inp} /></Field>
      </div>
    </div>
  );
}

function AudiometryForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const freqs = ["500", "1000", "2000", "4000", "8000"];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-6">
        {(["left", "right"] as const).map((ear) => (
          <div key={ear}>
            <p className="text-[11px] text-[#666] uppercase tracking-wide mb-2">{ear} ear (dB HL)</p>
            <div className="space-y-2">
              {freqs.map((hz) => (
                <div key={hz} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#555] w-14 flex-shrink-0">{hz} Hz</span>
                  <input type="number" value={f(`${ear}_${hz}`)} onChange={e => s(`${ear}_${hz}`, e.target.value)} className={`${inp} flex-1`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Left PTA (dB)"><input type="number" step="0.1" value={f("left_pta")} onChange={e => s("left_pta", e.target.value)} className={inp} /></Field>
        <Field label="Right PTA (dB)"><input type="number" step="0.1" value={f("right_pta")} onChange={e => s("right_pta", e.target.value)} className={inp} /></Field>
      </div>
    </div>
  );
}

function SpirometryForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const ratio = parseFloat(f("fev1_fvc_ratio"));
  const pct = parseFloat(f("fev1_percent"));
  let hint = "";
  if (!isNaN(ratio)) {
    hint = ratio < 0.7 ? (pct < 80 ? "Possible obstruction" : "Possible restriction") : (pct < 80 ? "Possible restriction" : "Normal pattern");
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "fvc_actual", label: "FVC Actual (L)" }, { key: "fvc_predicted", label: "FVC Predicted (L)" }, { key: "fvc_percent", label: "FVC %" },
          { key: "fev1_actual", label: "FEV1 Actual (L)" }, { key: "fev1_predicted", label: "FEV1 Predicted (L)" }, { key: "fev1_percent", label: "FEV1 %" },
          { key: "fev1_fvc_ratio", label: "FEV1/FVC Ratio" },
        ].map(({ key, label }) => (
          <Field key={key} label={label}><input type="number" step="0.01" value={f(key)} onChange={e => s(key, e.target.value)} className={inp} /></Field>
        ))}
      </div>
      {hint && <p className="text-[12px] text-[#777]">↳ {hint}</p>}
      <Field label="Interpretation"><input type="text" value={f("interpretation")} onChange={e => s("interpretation", e.target.value)} placeholder="Normal / Obstructive / Restrictive / Mixed" className={inp} /></Field>
    </div>
  );
}

// ─── Main clinic page ──────────────────────────────────────────────────────────

function ClinicContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const preselectedId = searchParams.get("appointment_id");

  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [appointments, setAppointments] = useState<WorkerAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<WorkerAppointment | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [testData, setTestData] = useState<Record<string, unknown>>({});
  const [testStatus, setTestStatus] = useState<ResultStatus>("normal");
  const [savedResults, setSavedResults] = useState<Record<string, ResultStatus>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCert, setShowCert] = useState(false);
  const [certForm, setCertForm] = useState({ fitness_status: "fit", valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], restrictions: "", remarks: "" });
  const [issuingCert, setIssuingCert] = useState(false);
  const [lastDevice, setLastDevice] = useState<string | null>(null);

  const { connected, error: bridgeError, connect, disconnect } = useDeviceBridge(
    useCallback((deviceType: string, data: Record<string, unknown>) => {
      const testType = DEVICE_TO_TEST[deviceType];
      if (!testType) return;
      setLastDevice(deviceType);
      const stepIdx = TEST_STEPS.indexOf(testType);
      if (stepIdx !== -1) setCurrentStep(stepIdx);
      setTestData(data);
    }, [])
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sessions/${params.id}`);
    const data = await res.json();
    setSession(data.session);
    const appts: WorkerAppointment[] = data.appointments ?? [];
    setAppointments(appts);
    if (preselectedId) {
      const found = appts.find(a => a.id === preselectedId);
      if (found) doSelect(found);
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, preselectedId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function doSelect(appt: WorkerAppointment) {
    setSelectedAppt(appt);
    setCurrentStep(0);
    setTestData({});
    setTestStatus("normal");
    setShowCert(false);
    const saved: Record<string, ResultStatus> = {};
    (appt.results ?? []).forEach(r => { saved[r.test_type] = r.result_status; });
    setSavedResults(saved);
  }

  async function selectWorker(appt: WorkerAppointment) {
    doSelect(appt);
    if (appt.status === "scheduled") {
      await fetch(`/api/appointments/${appt.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "in_progress" }) });
      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, status: "in_progress" } : a));
    }
  }

  async function saveTest(andNext = false) {
    if (!selectedAppt) return;
    const test = TEST_STEPS[currentStep];
    if (!test) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_type: test, result_data: testData, result_status: testStatus }),
      });
      if (res.ok) {
        setSavedResults(prev => ({ ...prev, [test]: testStatus }));
        if (andNext && currentStep < TEST_STEPS.length - 1) {
          setCurrentStep(s => s + 1);
          setTestData({});
          setTestStatus("normal");
        } else if (andNext) {
          setShowCert(true);
        }
      }
    } finally {
      setSaving(false);
    }
  }

  async function issueCertificate() {
    if (!selectedAppt) return;
    setIssuingCert(true);
    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: selectedAppt.id,
          fitness_status: certForm.fitness_status,
          valid_until: certForm.valid_until || null,
          restrictions: certForm.restrictions ? certForm.restrictions.split(",").map(s => s.trim()).filter(Boolean) : [],
          remarks: certForm.remarks || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCert(false);
        fetchData();
        window.open(`/certificates/${data.id}/print`, "_blank");
      }
    } finally {
      setIssuingCert(false);
    }
  }

  const packageTests: TestType[] = session?.package?.tests_included ?? TEST_STEPS;
  const activeSteps = TEST_STEPS.filter(t => packageTests.includes(t));
  const currentTest = activeSteps[currentStep] as TestType | undefined;
  const allDone = activeSteps.every(t => savedResults[t]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="w-5 h-5 text-[#555] animate-spin" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 h-12 border-b border-[#1a1a1a] flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/sessions/${params.id}`} className="text-[#555] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white">{session?.company?.name ?? "Session"}</span>
            <span className="text-[#333]">·</span>
            <span className="text-[12px] text-[#555]">
              {session && new Date(session.session_date).toLocaleDateString("en-ZA")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Device status */}
          <button
            onClick={connected ? disconnect : connect}
            className={cn(
              "flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border transition-colors",
              connected
                ? "text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20"
                : "text-[#555] border-[#2a2a2a] hover:text-[#aaa] hover:border-[#444]"
            )}
          >
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {connected ? `Bridge${lastDevice ? ` · ${lastDevice}` : ""}` : "Connect Bridge"}
          </button>
          {bridgeError && <span className="text-[11px] text-amber-500">{bridgeError}</span>}
          <span className="text-[12px] text-[#555]">
            {appointments.filter(a => a.status === "completed").length}/{appointments.length} complete
          </span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Worker queue */}
        <div className="w-[200px] flex-shrink-0 border-r border-[#1a1a1a] overflow-y-auto bg-[#0a0a0a]">
          {appointments.length === 0 ? (
            <div className="p-4 text-center text-[12px] text-[#555]">No workers in this session</div>
          ) : appointments.map((a) => {
            const cert = Array.isArray(a.certificate) ? a.certificate[0] : a.certificate;
            const isSelected = selectedAppt?.id === a.id;
            const doneCount = (a.results ?? []).length;
            return (
              <button key={a.id} onClick={() => selectWorker(a)} className={cn(
                "w-full text-left px-3.5 py-3 border-b border-[#141414] transition-colors",
                isSelected ? "bg-[#161616]" : "hover:bg-[#111]"
              )}>
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-[13px] text-white truncate leading-snug">{a.worker?.first_name} {a.worker?.last_name}</p>
                  {a.status === "completed" && <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
                  {a.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-[#555] font-mono">{a.worker?.id_number}</p>
                {activeSteps.length > 0 && (
                  <div className="mt-1.5 flex gap-0.5">
                    {activeSteps.map((t) => (
                      <div key={t} className={cn("h-1 flex-1 rounded-full", savedResults[t] || (a.results ?? []).some(r => r.test_type === t) ? "bg-green-500" : "bg-[#2a2a2a]")} />
                    ))}
                  </div>
                )}
                {cert && (
                  <span className={cn("inline-block text-[10px] px-1.5 py-0.5 rounded-full border font-medium mt-1.5", FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
                    {FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Workspace */}
        {!selectedAppt ? (
          <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
            <div className="text-center">
              <User className="w-12 h-12 text-[#222] mx-auto mb-3" />
              <p className="text-[13px] text-[#555]">Select a worker from the queue to begin screening</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0a]">
            {/* Worker header */}
            <div className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold text-white">
                  {selectedAppt.worker?.first_name} {selectedAppt.worker?.last_name}
                </h2>
                <p className="text-[12px] text-[#555] font-mono mt-0.5">{selectedAppt.worker?.id_number}</p>
              </div>
              {(allDone || showCert) && !showCert && (
                <button onClick={() => setShowCert(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-[13px] font-semibold rounded-md hover:bg-[#e5e5e5] transition-colors">
                  <Award className="w-4 h-4" /> Issue Certificate
                </button>
              )}
            </div>

            {showCert ? (
              // Certificate form
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-lg space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[15px] font-semibold text-white">Issue Certificate of Fitness</h3>
                    <button onClick={() => setShowCert(false)} className="text-[#555] hover:text-white text-[13px] transition-colors">Back</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Fitness Status">
                      <select value={certForm.fitness_status} onChange={e => setCertForm({ ...certForm, fitness_status: e.target.value })} className={sel}>
                        <option value="fit">Fit for Work</option>
                        <option value="fit_with_restrictions">Fit — with Restrictions</option>
                        <option value="temporarily_unfit">Temporarily Unfit</option>
                        <option value="permanently_unfit">Permanently Unfit</option>
                      </select>
                    </Field>
                    <Field label="Valid Until">
                      <input type="date" value={certForm.valid_until} onChange={e => setCertForm({ ...certForm, valid_until: e.target.value })} className={inp} />
                    </Field>
                  </div>
                  <Field label="Restrictions (comma separated)">
                    <input type="text" value={certForm.restrictions} onChange={e => setCertForm({ ...certForm, restrictions: e.target.value })} placeholder="No heights, No dust exposure" className={inp} />
                  </Field>
                  <Field label="Remarks / Referrals">
                    <textarea value={certForm.remarks} onChange={e => setCertForm({ ...certForm, remarks: e.target.value })} rows={3} className={`${inp} resize-none`} />
                  </Field>
                  <button onClick={issueCertificate} disabled={issuingCert} className="w-full py-3 bg-white text-black text-[14px] font-bold rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {issuingCert && <Loader2 className="w-4 h-4 animate-spin" />}
                    Issue Certificate & Print
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Step progress bar */}
                <div className="px-6 py-3 border-b border-[#1a1a1a] flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    {activeSteps.map((test, i) => {
                      const Icon = TEST_ICONS[test] ?? User;
                      const done = Boolean(savedResults[test]);
                      const active = i === currentStep;
                      return (
                        <button
                          key={test}
                          onClick={() => { setCurrentStep(i); setTestData({}); setTestStatus(savedResults[test] ?? "normal"); }}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors flex-shrink-0",
                            active ? "bg-white text-black" :
                            done  ? "bg-green-500/10 text-green-400 border border-green-500/20" :
                                    "text-[#555] hover:text-[#aaa]"
                          )}
                        >
                          {done && !active ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                          <span>{TEST_TYPE_LABELS[test]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active test */}
                {currentTest && (
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-2xl space-y-5">
                      {/* Status selector */}
                      <div className="flex items-center justify-between">
                        <h3 className="text-[15px] font-semibold text-white">
                          {TEST_TYPE_LABELS[currentTest]}
                          {connected && <span className="ml-2 text-[11px] text-green-400 font-normal">● Device ready</span>}
                        </h3>
                        <div className="flex gap-1">
                          {STATUS_OPTIONS.map(({ value, label, dot }) => (
                            <button key={value} onClick={() => setTestStatus(value)} className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                              testStatus === value ? "bg-[#1f1f1f] border-[#333] text-white" : "border-transparent text-[#555] hover:text-[#aaa]"
                            )}>
                              <span className={cn("w-2 h-2 rounded-full", dot)} />{label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {testStatus !== "normal" && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <p className="text-[12px] text-amber-300">Result flagged as <strong>{testStatus}</strong> — will appear on certificate</p>
                        </div>
                      )}

                      {/* Form */}
                      {currentTest === "general" && <GeneralForm data={testData} onChange={setTestData} />}
                      {currentTest === "height_weight" && <HeightWeightForm data={testData} onChange={setTestData} />}
                      {currentTest === "blood_pressure" && <BloodPressureForm data={testData} onChange={setTestData} />}
                      {currentTest === "vision" && <VisionForm data={testData} onChange={setTestData} />}
                      {currentTest === "urine" && <UrineForm data={testData} onChange={setTestData} />}
                      {currentTest === "audiometry" && <AudiometryForm data={testData} onChange={setTestData} />}
                      {currentTest === "spirometry" && <SpirometryForm data={testData} onChange={setTestData} />}

                      {/* Actions */}
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => saveTest(false)} disabled={saving} className="px-5 py-2.5 bg-[#1f1f1f] border border-[#2a2a2a] text-white text-[13px] font-medium rounded-md hover:border-[#444] transition-colors disabled:opacity-50 flex items-center gap-2">
                          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
                        </button>
                        <button onClick={() => saveTest(true)} disabled={saving} className="flex-1 py-2.5 bg-white text-black text-[13px] font-bold rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {currentStep < activeSteps.length - 1 ? `Save & Next →` : "Save & Issue Certificate"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClinicPage() {
  return <Suspense><ClinicContent /></Suspense>;
}
