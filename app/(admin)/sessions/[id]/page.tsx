"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Stethoscope, UserCheck, UserX, Loader2, Search, X } from "lucide-react";
import type { ScreeningSession, WorkerAppointment, Worker } from "@/types";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS, APPOINTMENT_STATUS_LABELS, FITNESS_STATUS_LABELS, FITNESS_STATUS_COLORS } from "@/types";
import { cn } from "@/lib/utils";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [appointments, setAppointments] = useState<WorkerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerResults, setWorkerResults] = useState<Worker[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions/${params.id}`);
      const data = await res.json();
      setSession(data.session);
      setAppointments(data.appointments ?? []);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function searchWorkers(q: string) {
    if (!q.trim()) { setWorkerResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/workers?search=${encodeURIComponent(q)}&limit=10`);
      const data = await res.json();
      setWorkerResults(data.workers ?? []);
    } finally {
      setSearching(false);
    }
  }

  async function addWorker(workerId: string) {
    setAdding(workerId);
    try {
      const res = await fetch(`/api/sessions/${params.id}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workers: [{ worker_id: workerId }] }),
      });
      if (res.ok) {
        fetchSession();
        setWorkerSearch("");
        setWorkerResults([]);
        setShowAddWorker(false);
      }
    } finally {
      setAdding(null);
    }
  }

  async function updateStatus(status: string) {
    await fetch(`/api/sessions/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSession();
  }

  async function addAllCompanyWorkers() {
    if (!session?.company_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${session.company_id}/workers`);
      const data = await res.json();
      const workers = Array.isArray(data) ? data : [];
      const existingIds = new Set(appointments.map((a) => a.worker_id));
      const toAdd = workers
        .filter((cw: {worker_id: string}) => !existingIds.has(cw.worker_id))
        .map((cw: {worker_id: string}) => ({ worker_id: cw.worker_id }));
      if (toAdd.length > 0) {
        await fetch(`/api/sessions/${params.id}/appointments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workers: toAdd }),
        });
      }
      fetchSession();
    } catch {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#0c0c0c]">
      <Loader2 className="w-5 h-5 text-[#555] animate-spin" />
    </div>
  );

  if (!session) return (
    <div className="flex-1 flex items-center justify-center bg-[#0c0c0c]">
      <p className="text-[13px] text-[#666]">Session not found</p>
    </div>
  );

  const completed = appointments.filter((a) => a.status === "completed").length;

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        <Link href="/sessions" className="inline-flex items-center gap-1.5 text-[13px] text-[#666] hover:text-white transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Sessions
        </Link>

        {/* Session header */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <h1 className="text-[18px] font-semibold text-white">
                  {new Date(session.session_date).toLocaleDateString("en-ZA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </h1>
                <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", SESSION_STATUS_COLORS[session.status])}>
                  {SESSION_STATUS_LABELS[session.status]}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[13px] text-[#666]">
                <Link href={`/companies/${session.company?.id}`} className="hover:text-white transition-colors">{session.company?.name}</Link>
                <span>·</span>
                <span>{session.package?.name}</span>
                <span>·</span>
                <span>{session.location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {session.status === "scheduled" && (
                <button onClick={() => updateStatus("in_progress")} className="px-3 py-1.5 text-[13px] bg-amber-500 text-black font-medium rounded-md hover:bg-amber-400 transition-colors">
                  Start Session
                </button>
              )}
              {session.status === "in_progress" && (
                <>
                  <Link href={`/sessions/${session.id}/clinic`} className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors">
                    <Stethoscope className="w-3.5 h-3.5" /> Open Clinic
                  </Link>
                  <button onClick={() => updateStatus("completed")} className="px-3 py-1.5 text-[13px] text-[#aaa] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
                    Close Session
                  </button>
                </>
              )}
              {session.status === "completed" && (
                <Link href={`/sessions/${session.id}/clinic`} className="flex items-center gap-2 px-3 py-1.5 text-[13px] text-[#aaa] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors">
                  <Stethoscope className="w-3.5 h-3.5" /> View Results
                </Link>
              )}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 pt-4 border-t border-[#1f1f1f]">
            <div className="flex items-center justify-between text-[12px] text-[#666] mb-2">
              <span>{completed} of {appointments.length} completed</span>
              <span>{appointments.length > 0 ? Math.round((completed / appointments.length) * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${appointments.length > 0 ? (completed / appointments.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Add worker panel */}
        {showAddWorker && (
          <div className="bg-[#111] border border-[#1f1f1f] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-white">Add Worker to Session</h3>
              <button onClick={() => { setShowAddWorker(false); setWorkerSearch(""); setWorkerResults([]); }} className="text-[#666] hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
              <input
                type="text"
                value={workerSearch}
                onChange={(e) => { setWorkerSearch(e.target.value); searchWorkers(e.target.value); }}
                placeholder="Search by name or ID number…"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md pl-9 pr-3 py-2 text-[13px] text-white placeholder:text-[#555] focus:outline-none focus:border-[#444]"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555] animate-spin" />}
            </div>
            {workerResults.length > 0 && (
              <div className="divide-y divide-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
                {workerResults.map((w) => {
                  const alreadyAdded = appointments.some((a) => a.worker_id === w.id);
                  return (
                    <div key={w.id} className="flex items-center justify-between px-3 py-2.5 bg-[#0f0f0f]">
                      <div>
                        <p className="text-[13px] text-white">{w.first_name} {w.last_name}</p>
                        <p className="text-[12px] text-[#555] font-mono">{w.id_number}</p>
                      </div>
                      {alreadyAdded ? (
                        <span className="text-[12px] text-[#555]">Added</span>
                      ) : (
                        <button
                          onClick={() => addWorker(w.id)}
                          disabled={adding === w.id}
                          className="text-[12px] px-2.5 py-1 bg-white text-black rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          {adding === w.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Appointments */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
            <h2 className="text-[13px] font-medium text-white">Workers ({appointments.length})</h2>
            <div className="flex items-center gap-2">
              {session.company_id && (
                <button onClick={addAllCompanyWorkers} className="text-[12px] text-[#666] hover:text-white transition-colors">
                  Add all company workers
                </button>
              )}
              <button
                onClick={() => setShowAddWorker(true)}
                className="flex items-center gap-1.5 text-[12px] text-[#aaa] border border-[#2a2a2a] px-2.5 py-1 rounded-md hover:border-[#444] hover:text-white transition-colors"
              >
                <Plus className="w-3 h-3" /> Add Worker
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px] text-[#555] mb-3">No workers scheduled yet</p>
              <button onClick={addAllCompanyWorkers} className="text-[13px] text-white bg-[#1f1f1f] px-3 py-1.5 rounded-md hover:bg-[#2a2a2a] transition-colors">
                Add all company workers
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#161616]">
                  {["Worker", "ID Number", "Time", "Status", "Certificate", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => {
                  const cert = Array.isArray(a.certificate) ? a.certificate[0] : a.certificate;
                  return (
                    <tr key={a.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                      <td className="px-4 py-3 text-[13px] text-white font-medium">
                        {a.worker?.first_name} {a.worker?.last_name}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#666] font-mono">{a.worker?.id_number}</td>
                      <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{a.scheduled_time ?? "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {a.status === "completed" ? <UserCheck className="w-3.5 h-3.5 text-green-400" /> : <UserX className="w-3.5 h-3.5 text-[#555]" />}
                          <span className="text-[12px] text-[#8c8c8c]">{APPOINTMENT_STATUS_LABELS[a.status]}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {cert ? (
                          <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", FITNESS_STATUS_COLORS[cert.fitness_status as keyof typeof FITNESS_STATUS_COLORS])}>
                            {FITNESS_STATUS_LABELS[cert.fitness_status as keyof typeof FITNESS_STATUS_LABELS]}
                          </span>
                        ) : <span className="text-[12px] text-[#555]">Pending</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/sessions/${params.id}/clinic?appointment_id=${a.id}`}
                          className="text-[12px] text-[#666] hover:text-white transition-colors"
                        >
                          {a.status === "scheduled" ? "Start →" : "View →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Back to router */}
        <div className="flex justify-end">
          <button onClick={() => router.back()} className="text-[12px] text-[#666] hover:text-white transition-colors">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
