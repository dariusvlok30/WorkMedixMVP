"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "./StatusBadge";
import DocumentUpload from "./DocumentUpload";
import DocumentList from "./DocumentList";
import EmailButton from "./EmailModal";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { Booking, BookingStatus } from "@/types";
import { Save, Loader2 } from "lucide-react";

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingDetailView({ booking: initial }: { booking: Booking }) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [booking, setBooking] = useState<Booking>(initial);
  const [status, setStatus] = useState<BookingStatus>(initial.status);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function saveChanges() {
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setBooking(updated);
      toast({ title: "Saved" });
      startTransition(() => router.refresh());
    } catch {
      toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-black">{booking.company_name}</h1>
          <p className="text-[13px] text-[#888] mt-0.5">
            Submitted {formatDate(booking.created_at, "dd MMM yyyy, HH:mm")}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={status} />
          <EmailButton to={booking.email} contactName={booking.contact_person} companyName={booking.company_name} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Company info */}
          <div className="bg-white rounded-lg border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[12px] font-medium text-[#888] uppercase tracking-wide">Company</h2>
            </div>
            <dl className="grid grid-cols-2 gap-0 divide-y divide-[#f0f0f0]">
              {[
                ["Company Name", booking.company_name],
                ["Contact Person", booking.contact_person],
                ["Email", booking.email],
                ["Phone", booking.phone],
                ["Address", booking.address],
                ["Employees", String(booking.employee_count)],
              ].map(([k, v]) => (
                <div key={k} className="px-4 py-2.5 col-span-2 sm:col-span-1 flex flex-col">
                  <dt className="text-[11px] text-[#aaa] uppercase tracking-wide">{k}</dt>
                  <dd className="text-[13px] text-black mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Screening info */}
          <div className="bg-white rounded-lg border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[12px] font-medium text-[#888] uppercase tracking-wide">Screening</h2>
            </div>
            <dl className="grid grid-cols-2 divide-y divide-[#f0f0f0]">
              <div className="px-4 py-2.5 col-span-2 sm:col-span-1 flex flex-col">
                <dt className="text-[11px] text-[#aaa] uppercase tracking-wide">Type</dt>
                <dd className="text-[13px] text-black mt-0.5">{booking.screening_type}</dd>
              </div>
              <div className="px-4 py-2.5 col-span-2 sm:col-span-1 flex flex-col">
                <dt className="text-[11px] text-[#aaa] uppercase tracking-wide">Preferred Dates</dt>
                <dd className="text-[13px] text-black mt-0.5">
                  {booking.preferred_dates.map((d) => formatDate(d)).join(", ")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-lg border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[12px] font-medium text-[#888] uppercase tracking-wide">Documents</h2>
            </div>
            <div className="p-4 space-y-3">
              <DocumentList
                documents={booking.documents ?? []}
                bookingId={booking.id}
                onDelete={(id) =>
                  setBooking((b) => ({ ...b, documents: (b.documents ?? []).filter((d) => d.id !== id) }))
                }
              />
              <DocumentUpload
                bookingId={booking.id}
                onUploaded={(doc) =>
                  setBooking((b) => ({ ...b, documents: [...(b.documents ?? []), doc] }))
                }
              />
            </div>
          </div>
        </div>

        {/* Sidebar panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[12px] font-medium text-[#888] uppercase tracking-wide">Manage</h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[12px] text-[#666] block mb-1.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BookingStatus)}
                  className="w-full h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black/20"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-[#666] block mb-1.5">Admin Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={5}
                  placeholder="Internal notes..."
                  className="w-full text-[13px] border border-[#e5e5e5] rounded-md px-3 py-2 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
                />
              </div>
              <button
                onClick={saveChanges}
                disabled={saving}
                className="w-full h-8 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</> : <><Save className="w-3.5 h-3.5" /> Save changes</>}
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-lg border border-[#e5e5e5] p-4 space-y-3">
            <div>
              <p className="text-[11px] text-[#aaa] uppercase tracking-wide">Booking ID</p>
              <p className="text-[11px] font-mono text-[#666] mt-0.5 break-all">{booking.id}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#aaa] uppercase tracking-wide">Submitted</p>
              <p className="text-[13px] text-black mt-0.5">{formatDate(booking.created_at, "dd MMM yyyy, HH:mm")}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#aaa] uppercase tracking-wide">Last updated</p>
              <p className="text-[13px] text-black mt-0.5">{formatDate(booking.updated_at, "dd MMM yyyy, HH:mm")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
