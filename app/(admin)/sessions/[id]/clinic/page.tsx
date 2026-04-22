"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft, User, ChevronRight, Check, Loader2, Award,
  AlertCircle, Wind, Ear, Eye, Heart, Scale, FlaskConical,
  Wifi, WifiOff, Plug,
} from "lucide-react";
import type {
  WorkerAppointment, ScreeningSession, TestType, ResultStatus,
} from "@/types";
import { TEST_TYPE_LABELS, FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

// ─── Device bridge WebSocket hook ────────────────────────────────────────────

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
      socket.onerror = () => {
        setConnected(false);
        setError("Bridge not reachable — is the device bridge running?");
      };
      socket.onmessage = (e) => {
        try {
          const { device_type, data } = JSON.parse(e.data);
          onDataRef.current(device_type, data);
        } catch {}
      };
      ws.current = socket;
    } catch {
      setError("Could not connect to bridge service.");
    }
  }

  function disconnect() {
    ws.current?.close();
    ws.current = null;
    setConnected(false);
    setError(null);
  }

  useEffect(() => () => { ws.current?.close(); }, []);

  return { connected, error, connect, disconnect };
}

// ─── Device panel ─────────────────────────────────────────────────────────────

function DevicePanel({
  connected,
  error,
  onConnect,
  onDisconnect,
  lastDevice,
}: {
  connected: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  lastDevice: string | null;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 border-b text-[12px]",
      connected ? "border-[#1f2f1f] bg-[#0c150c]" : "border-[#1f1f1f] bg-[#0c0c0c]"
    )}>
      <div className="flex items-center gap-2">
        {connected
          ? <Wifi className="w-3.5 h-3.5 text-green-400" />
          : <WifiOff className="w-3.5 h-3.5 text-[#555]" />}
        <span className={connected ? "text-green-400" : "text-[#555]"}>
          {connected ? "Bridge connected" : "Bridge disconnected"}
        </span>
        {connected && lastDevice && (
          <span className="text-[#777] ml-1">· last: {lastDevice}</span>
        )}
      </div>

      {error && (
        <span className="text-amber-500 flex-1 truncate">{error}</span>
      )}

      <div className="ml-auto">
        {connected ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1f1f1f] text-[#aaa] hover:text-white rounded transition-colors"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a2a1a] text-green-400 hover:bg-[#1f301f] rounded transition-colors"
          >
            <Plug className="w-3 h-3" /> Connect Device Bridge
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Test form renderers ──────────────────────────────────────────────────────

function SpirometryForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });

  const ratio = parseFloat(f("fev1_fvc_ratio"));
  const fev1pct = parseFloat(f("fev1_percent"));
  let hint = "";
  if (!isNaN(ratio)) {
    if (ratio < 0.7) hint = fev1pct < 80 ? "Possible obstruction" : "Possible restriction";
    else if (fev1pct < 80) hint = "Possible restriction";
    else hint = "Normal pattern";
  }

  const fields: Array<{ key: string; label: string; unit: string }> = [
    { key: "fvc_actual", label: "FVC Actual", unit: "L" },
    { key: "fvc_predicted", label: "FVC Predicted", unit: "L" },
    { key: "fvc_percent", label: "FVC %", unit: "%" },
    { key: "fev1_actual", label: "FEV1 Actual", unit: "L" },
    { key: "fev1_predicted", label: "FEV1 Predicted", unit: "L" },
    { key: "fev1_percent", label: "FEV1 %", unit: "%" },
    { key: "fev1_fvc_ratio", label: "FEV1/FVC Ratio", unit: "" },
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {fields.map(({ key, label, unit }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1">{label}{unit && <span className="text-[#444]"> ({unit})</span>}</label>
            <input type="number" step="0.01" value={f(key)} onChange={(e) => s(key, e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
          </div>
        ))}
      </div>
      {hint && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded text-[12px] text-[#aaa]">
          <span className="text-[#555]">↳</span> {hint}
        </div>
      )}
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} placeholder="Normal / Restrictive / Obstructive / Mixed" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function AudiometryForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const freqs = ["500", "1000", "2000", "4000", "8000"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        {(["left", "right"] as const).map((ear) => (
          <div key={ear}>
            <p className="text-[12px] text-[#888] uppercase tracking-wide mb-2">{ear} ear (dB HL)</p>
            <div className="space-y-2">
              {freqs.map((hz) => (
                <div key={hz} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#555] w-12">{hz}Hz</span>
                  <input type="number" value={f(`${ear}_${hz}`)} onChange={(e) => s(`${ear}_${hz}`, e.target.value)} className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-[#666] mb-1">Left PTA (dB)</label>
          <input type="number" step="0.1" value={f("left_pta")} onChange={(e) => s("left_pta", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
        </div>
        <div>
          <label className="block text-[11px] text-[#666] mb-1">Right PTA (dB)</label>
          <input type="number" step="0.1" value={f("right_pta")} onChange={(e) => s("right_pta", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} placeholder="Normal / Mild loss / Moderate loss / Severe loss" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function VisionForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "left_near", label: "Left Near" }, { key: "left_far", label: "Left Far" },
          { key: "right_near", label: "Right Near" }, { key: "right_far", label: "Right Far" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1">{label}</label>
            <input type="text" value={f(key)} onChange={(e) => s(key, e.target.value)} placeholder="6/6" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { key: "colour_vision", label: "Colour Vision" },
          { key: "depth_perception", label: "Depth Perception" },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1">{label}</label>
            <select value={f(key)} onChange={(e) => s(key, e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]">
              <option value="">Select</option>
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        ))}
        <div>
          <label className="block text-[11px] text-[#666] mb-1">Glasses Required</label>
          <select value={f("glasses_required")} onChange={(e) => s("glasses_required", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]">
            <option value="">Select</option>
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function BloodPressureForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });

  const sys = parseInt(f("systolic"));
  const dia = parseInt(f("diastolic"));
  let bpHint = "";
  if (!isNaN(sys) && !isNaN(dia)) {
    if (sys >= 180 || dia >= 120) bpHint = "Hypertensive crisis — refer urgently";
    else if (sys >= 140 || dia >= 90) bpHint = "Stage 2 hypertension";
    else if (sys >= 130 || dia >= 80) bpHint = "Stage 1 hypertension";
    else if (sys >= 120) bpHint = "Elevated";
    else bpHint = "Normal";
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[{ key: "systolic", label: "Systolic (mmHg)" }, { key: "diastolic", label: "Diastolic (mmHg)" }, { key: "pulse", label: "Pulse (bpm)" }].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1">{label}</label>
            <input type="number" value={f(key)} onChange={(e) => s(key, e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
          </div>
        ))}
      </div>
      {bpHint && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded text-[12px] text-[#aaa]">
          <span className="text-[#555]">↳</span> {bpHint}
        </div>
      )}
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} placeholder="Normal / Pre-hypertension / Stage 1 / Stage 2" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function HeightWeightForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => {
    const updated = { ...data, [k]: v };
    const h = parseFloat(String(updated.height_cm));
    const w = parseFloat(String(updated.weight_kg));
    if (h > 0 && w > 0) updated.bmi = Math.round((w / ((h / 100) * (h / 100))) * 10) / 10;
    onChange(updated);
  };
  const bmi = parseFloat(f("bmi"));
  const bmiHint = !isNaN(bmi) ? (bmi < 18.5 ? "Underweight" : bmi < 25 ? "Normal" : bmi < 30 ? "Overweight" : "Obese") : "";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[{ key: "height_cm", label: "Height (cm)" }, { key: "weight_kg", label: "Weight (kg)" }, { key: "bmi", label: "BMI (auto)" }].map(({ key, label }) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1">{label}</label>
            <input type="number" step="0.1" value={f(key)} onChange={(e) => s(key, e.target.value)} readOnly={key === "bmi"} className={cn("w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]", key === "bmi" && "opacity-60")} />
          </div>
        ))}
      </div>
      {bmiHint && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a1a] rounded text-[12px] text-[#aaa]">
          <span className="text-[#555]">↳</span> BMI {f("bmi")} — {bmiHint}
        </div>
      )}
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} placeholder="Normal / Overweight / Obese / Underweight" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function UrineForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  const dipFields = ["protein", "glucose", "blood", "ketones", "leukocytes", "nitrites"] as const;
  const OPTIONS = ["negative", "trace", "+", "++", "+++"];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {dipFields.map((key) => (
          <div key={key}>
            <label className="block text-[11px] text-[#666] mb-1 capitalize">{key}</label>
            <select value={f(key)} onChange={(e) => s(key, e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]">
              <option value="">Select</option>
              {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <label className="block text-[11px] text-[#666] mb-1">pH</label>
          <input type="number" step="0.5" min="4" max="9" value={f("ph")} onChange={(e) => s("ph", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
        </div>
        <div>
          <label className="block text-[11px] text-[#666] mb-1">Specific Gravity</label>
          <input type="number" step="0.001" min="1.000" max="1.030" value={f("specific_gravity")} onChange={(e) => s("specific_gravity", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Interpretation</label>
        <input type="text" value={f("interpretation")} onChange={(e) => s("interpretation", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
      </div>
    </div>
  );
}

function GeneralForm({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  const f = (k: string) => String(data[k] ?? "");
  const s = (k: string, v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Medical History</label>
        <textarea value={f("medical_history")} onChange={(e) => s("medical_history", e.target.value)} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444] resize-none" />
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Current Medications</label>
        <input type="text" value={f("medications")} onChange={(e) => s("medications", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Allergies</label>
        <input type="text" value={f("allergies")} onChange={(e) => s("allergies", e.target.value)} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444]" />
      </div>
      <div>
        <label className="block text-[11px] text-[#666] mb-1">Examination Notes</label>
        <textarea value={f("notes")} onChange={(e) => s("notes", e.target.value)} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2.5 py-1.5 text-[13px] text-white focus:outline-none focus:border-[#444] resize-none" />
      </div>
    </div>
  );
}

const TEST_ICONS: Record<TestType, React.ElementType> = {
  spirometry: Wind,
  audiometry: Ear,
  vision: Eye,
  blood_pressure: Heart,
  height_weight: Scale,
  urine: FlaskConical,
  ecg: Heart,
  general: User,
};

// Map device bridge device_type values to TestType keys
const DEVICE_TO_TEST: Record<string, TestType> = {
  spirometer: "spirometry",
  audiometer: "audiometry",
  keystone: "vision",
  bp_monitor: "blood_pressure",
};

const STATUS_OPTIONS: Array<{ value: ResultStatus; label: string; color: string }> = [
  { value: "normal", label: "Normal", color: "bg-green-500" },
  { value: "borderline", label: "Borderline", color: "bg-amber-500" },
  { value: "abnormal", label: "Abnormal", color: "bg-orange-500" },
  { value: "refer", label: "Refer", color: "bg-red-500" },
];

// ─── Main clinic page ─────────────────────────────────────────────────────────

function ClinicContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const preselectedApptId = searchParams.get("appointment_id");

  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [appointments, setAppointments] = useState<WorkerAppointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<WorkerAppointment | null>(null);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [testData, setTestData] = useState<Record<string, unknown>>({});
  const [testStatus, setTestStatus] = useState<ResultStatus>("normal");
  const [savedResults, setSavedResults] = useState<Record<string, ResultStatus>>({});
  const [savingTest, setSavingTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastDevice, setLastDevice] = useState<string | null>(null);

  const [showCert, setShowCert] = useState(false);
  const [certForm, setCertForm] = useState({
    fitness_status: "fit" as string,
    valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    restrictions: "",
    remarks: "",
  });
  const [issuingCert, setIssuingCert] = useState(false);

  const activeTestRef = useRef(activeTest);
  activeTestRef.current = activeTest;

  const { connected, error: bridgeError, connect, disconnect } = useDeviceBridge(
    useCallback((deviceType: string, data: Record<string, unknown>) => {
      const testType = DEVICE_TO_TEST[deviceType];
      if (!testType) return;
      setLastDevice(deviceType);
      // Switch to the incoming test and pre-fill data
      setActiveTest(testType);
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
    if (preselectedApptId) {
      const found = appts.find((a) => a.id === preselectedApptId);
      if (found) doSelectAppointment(found);
    }
    setLoading(false);
  }, [params.id, preselectedApptId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);

  function doSelectAppointment(appt: WorkerAppointment) {
    setSelectedAppt(appt);
    setActiveTest(null);
    setTestData({});
    const existing: Record<string, ResultStatus> = {};
    (appt.results ?? []).forEach((r) => { existing[r.test_type] = r.result_status; });
    setSavedResults(existing);
    setShowCert(false);
  }

  async function selectAppointment(appt: WorkerAppointment) {
    doSelectAppointment(appt);
    // Auto check-in: mark as in_progress when selected
    if (appt.status === "scheduled") {
      await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      setAppointments((prev) =>
        prev.map((a) => a.id === appt.id ? { ...a, status: "in_progress" } : a)
      );
    }
  }

  async function saveTestResult() {
    if (!selectedAppt || !activeTest) return;
    setSavingTest(true);
    try {
      const res = await fetch(`/api/appointments/${selectedAppt.id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test_type: activeTest, result_data: testData, result_status: testStatus }),
      });
      if (res.ok) {
        setSavedResults((prev) => ({ ...prev, [activeTest]: testStatus }));
        setActiveTest(null);
        setTestData({});
      }
    } finally {
      setSavingTest(false);
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
          restrictions: certForm.restrictions ? certForm.restrictions.split(",").map((s) => s.trim()).filter(Boolean) : [],
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

  const packageTests: TestType[] = session?.package?.tests_included ?? [];

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0c0c0c]">
      <Loader2 className="w-5 h-5 text-[#555] animate-spin" />
    </div>
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-[#0c0c0c]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-[#1f1f1f] bg-[#0c0c0c] flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link href={`/sessions/${params.id}`} className="text-[#666] hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[13px] font-medium text-white">{session?.company?.name}</span>
            <span className="text-[13px] text-[#555] mx-2">·</span>
            <span className="text-[13px] text-[#666]">{session && new Date(session.session_date).toLocaleDateString("en-ZA")}</span>
          </div>
        </div>
        <div className="text-[12px] text-[#555]">
          {appointments.filter((a) => a.status === "completed").length}/{appointments.length} done
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left: worker list */}
        <div className="w-[220px] flex-shrink-0 border-r border-[#1f1f1f] overflow-y-auto">
          {appointments.map((a) => {
            const cert = Array.isArray(a.certificate) ? a.certificate[0] : a.certificate;
            const isSelected = selectedAppt?.id === a.id;
            const completedCount = Object.keys(
              (() => {
                const m: Record<string, boolean> = {};
                (a.results ?? []).forEach((r) => { m[r.test_type] = true; });
                return m;
              })()
            ).length;
            const totalTests = packageTests.length;
            return (
              <button
                key={a.id}
                onClick={() => selectAppointment(a)}
                className={cn(
                  "w-full text-left px-3 py-2.5 border-b border-[#161616] transition-colors",
                  isSelected ? "bg-[#1f1f1f]" : "hover:bg-[#141414]"
                )}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] text-white truncate">{a.worker?.first_name} {a.worker?.last_name}</p>
                  {a.status === "completed"
                    ? <Check className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    : a.status === "in_progress"
                    ? <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    : <ChevronRight className="w-3.5 h-3.5 text-[#555] flex-shrink-0" />}
                </div>
                <p className="text-[11px] text-[#555] font-mono mt-0.5">{a.worker?.id_number}</p>
                {totalTests > 0 && (
                  <p className="text-[10px] text-[#444] mt-0.5">{completedCount}/{totalTests} tests</p>
                )}
                {cert && (
                  <span className={cn("inline-block text-[10px] px-1.5 py-0.5 rounded-full border font-medium mt-1", FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
                    {FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: clinical workspace */}
        {!selectedAppt ? (
          <div className="flex-1 flex flex-col">
            <DevicePanel
              connected={connected}
              error={bridgeError}
              onConnect={connect}
              onDisconnect={disconnect}
              lastDevice={lastDevice}
            />
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <User className="w-10 h-10 text-[#333] mx-auto mb-3" />
                <p className="text-[13px] text-[#666]">Select a worker to begin</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Device panel */}
            <DevicePanel
              connected={connected}
              error={bridgeError}
              onConnect={connect}
              onDisconnect={disconnect}
              lastDevice={lastDevice}
            />

            {/* Worker header */}
            <div className="sticky top-0 bg-[#0f0f0f] border-b border-[#1f1f1f] px-5 py-3 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[16px] font-semibold text-white">{selectedAppt.worker?.first_name} {selectedAppt.worker?.last_name}</h2>
                  <p className="text-[12px] text-[#666] font-mono">{selectedAppt.worker?.id_number}</p>
                </div>
                {!showCert && (
                  <button
                    onClick={() => setShowCert(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
                  >
                    <Award className="w-3.5 h-3.5" /> Issue Certificate
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Certificate form */}
              {showCert && (
                <div className="bg-[#111] border border-[#2a2a2a] rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-white">Issue Certificate of Fitness</h3>
                    <button onClick={() => setShowCert(false)} className="text-[#555] hover:text-white transition-colors text-[13px]">Cancel</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#666] mb-1">Fitness Status</label>
                      <select value={certForm.fitness_status} onChange={(e) => setCertForm({ ...certForm, fitness_status: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]">
                        <option value="fit">Fit</option>
                        <option value="fit_with_restrictions">Fit with Restrictions</option>
                        <option value="temporarily_unfit">Temporarily Unfit</option>
                        <option value="permanently_unfit">Permanently Unfit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-[#666] mb-1">Valid Until</label>
                      <input type="date" value={certForm.valid_until} onChange={(e) => setCertForm({ ...certForm, valid_until: e.target.value })} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1">Restrictions (comma separated)</label>
                    <input type="text" value={certForm.restrictions} onChange={(e) => setCertForm({ ...certForm, restrictions: e.target.value })} placeholder="No heights, No dust exposure" className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]" />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#666] mb-1">Remarks</label>
                    <textarea value={certForm.remarks} onChange={(e) => setCertForm({ ...certForm, remarks: e.target.value })} rows={2} className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-[13px] text-white focus:outline-none focus:border-[#444] resize-none" />
                  </div>
                  <button onClick={issueCertificate} disabled={issuingCert} className="w-full py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {issuingCert && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Issue & Print Certificate
                  </button>
                </div>
              )}

              {/* Test tabs */}
              <div className="grid grid-cols-4 gap-2">
                {packageTests.map((test) => {
                  const Icon = TEST_ICONS[test] ?? User;
                  const saved = savedResults[test];
                  const isActive = activeTest === test;
                  return (
                    <button
                      key={test}
                      onClick={() => {
                        if (isActive) { setActiveTest(null); return; }
                        setActiveTest(test);
                        setTestData({});
                        setTestStatus(saved ?? "normal");
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors",
                        isActive ? "bg-[#1f1f1f] border-[#444]" :
                          saved ? "bg-[#111] border-[#1f1f1f]" : "bg-[#0f0f0f] border-[#1a1a1a] hover:border-[#2a2a2a]"
                      )}
                    >
                      <div className="relative">
                        <Icon className={cn("w-5 h-5", saved ? "text-white" : "text-[#555]")} />
                        {saved && (
                          <div className={cn("absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full", STATUS_OPTIONS.find((s) => s.value === saved)?.color ?? "bg-green-500")} />
                        )}
                      </div>
                      <span className={cn("text-[11px]", saved || isActive ? "text-[#aaa]" : "text-[#555]")}>
                        {TEST_TYPE_LABELS[test]}
                      </span>
                      {saved && <span className="text-[10px] text-[#666] capitalize">{saved}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Active test form */}
              {activeTest && (
                <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-white">{TEST_TYPE_LABELS[activeTest]}</h3>
                      {connected && (
                        <span className="text-[11px] text-green-500 bg-green-950/30 px-2 py-0.5 rounded-full">
                          Device ready
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {STATUS_OPTIONS.map(({ value, label, color }) => (
                        <button
                          key={value}
                          onClick={() => setTestStatus(value)}
                          className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors",
                            testStatus === value ? "bg-[#2a2a2a] border-[#444] text-white" : "border-transparent text-[#666] hover:text-[#aaa]"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", color)} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeTest === "spirometry" && <SpirometryForm data={testData} onChange={setTestData} />}
                  {activeTest === "audiometry" && <AudiometryForm data={testData} onChange={setTestData} />}
                  {activeTest === "vision" && <VisionForm data={testData} onChange={setTestData} />}
                  {activeTest === "blood_pressure" && <BloodPressureForm data={testData} onChange={setTestData} />}
                  {activeTest === "height_weight" && <HeightWeightForm data={testData} onChange={setTestData} />}
                  {activeTest === "urine" && <UrineForm data={testData} onChange={setTestData} />}
                  {(activeTest === "general" || activeTest === "ecg") && <GeneralForm data={testData} onChange={setTestData} />}

                  {testStatus !== "normal" && (
                    <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-900/30 rounded-md px-3 py-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[12px] text-amber-400">Result flagged as <strong>{testStatus}</strong> — will be reflected on certificate</p>
                    </div>
                  )}

                  <button
                    onClick={saveTestResult}
                    disabled={savingTest}
                    className="w-full py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savingTest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save {TEST_TYPE_LABELS[activeTest]} Result
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClinicPage() {
  return (
    <Suspense>
      <ClinicContent />
    </Suspense>
  );
}
