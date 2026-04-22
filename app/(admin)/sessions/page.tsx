"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, CalendarCheck, ChevronRight, Loader2, Filter } from "lucide-react";
import type { ScreeningSession, SessionStatus } from "@/types";
import { SESSION_STATUS_COLORS, SESSION_STATUS_LABELS } from "@/types";
import { cn } from "@/lib/utils";

const STATUSES: Array<{ value: SessionStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");

  const fetchSessions = useCallback(async (status: SessionStatus | "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/sessions?${params}`);
      const data = await res.json();
      setSessions(data.sessions ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(statusFilter); }, [fetchSessions, statusFilter]);

  return (
    <div className="flex-1 overflow-auto bg-[#0c0c0c]">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-white">Screening Sessions</h1>
            <p className="text-[13px] text-[#666] mt-0.5">{total} sessions</p>
          </div>
          <Link
            href="/sessions/new"
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] bg-white text-black font-medium rounded-md hover:bg-[#e5e5e5] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> New Session
          </Link>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#555]" />
          <div className="flex gap-1.5">
            {STATUSES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "px-3 py-1 rounded-md text-[12px] transition-colors",
                  statusFilter === value
                    ? "bg-white text-black font-medium"
                    : "text-[#666] hover:text-white hover:bg-[#1a1a1a]"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#111] border border-[#1f1f1f] rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-[#555] animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <CalendarCheck className="w-8 h-8 text-[#333] mb-3" />
              <p className="text-[13px] text-[#666]">No sessions found</p>
              <Link href="/sessions/new" className="mt-3 text-[13px] text-white bg-[#1f1f1f] px-3 py-1.5 rounded-md hover:bg-[#2a2a2a] transition-colors">
                Book first session
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {["Date", "Company", "Package", "Location", "Workers", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] text-[#555] font-medium px-4 py-2.5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.id} className="border-b border-[#161616] hover:bg-[#141414] transition-colors">
                    <td className="px-4 py-3 text-[13px] text-white font-medium">
                      {new Date(s.session_date).toLocaleDateString("en-ZA")}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#aaa]">{s.company?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <p className="text-[13px] text-[#aaa]">{s.package?.name}</p>
                      <p className="text-[11px] text-[#555] font-mono">{s.package?.code}</p>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#8c8c8c]">{s.location}</td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-white font-medium">{s.completed_count ?? 0}</span>
                      <span className="text-[13px] text-[#555]">/{s.appointment_count ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[11px] px-2 py-0.5 rounded-full border font-medium", SESSION_STATUS_COLORS[s.status])}>
                        {SESSION_STATUS_LABELS[s.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/sessions/${s.id}`} className="inline-flex items-center gap-1 text-[12px] text-[#666] hover:text-white transition-colors">
                        Manage <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
