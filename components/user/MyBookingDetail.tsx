"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, CalendarIcon, X, UploadCloud, FileText, Download, Eye, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { Booking, BookingStatus, Document } from "@/types";

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};
const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending review",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-[#aaa] uppercase tracking-wide font-medium">{label}</span>
      {children}
    </div>
  );
}

export default function MyBookingDetail({ booking: initial }: { booking: Booking }) {
  const { toast } = useToast();
  const [booking, setBooking] = useState<Booking>(initial);
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [contactPerson, setContactPerson] = useState(initial.contact_person);
  const [phone, setPhone] = useState(initial.phone);
  const [preferredDates, setPreferredDates] = useState<string[]>(initial.preferred_dates ?? []);
  const [saving, setSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isDirty =
    notes !== (initial.notes ?? "") ||
    contactPerson !== initial.contact_person ||
    phone !== initial.phone ||
    JSON.stringify(preferredDates) !== JSON.stringify(initial.preferred_dates);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, contact_person: contactPerson, phone, preferred_dates: preferredDates }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const updated = await res.json();
      setBooking(updated);
      toast({ title: "Changes saved" });
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Try again.", variant: "destructive" });
    } finally { setSaving(false); }
  }

  function addDate(val: string) {
    if (!val || preferredDates.includes(val)) return;
    setPreferredDates((prev) => [...prev, val]);
  }
  function removeDate(d: string) {
    setPreferredDates((prev) => prev.filter((x) => x !== d));
  }

  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles((prev) => {
      const combined = [...prev, ...accepted.filter((f) => !prev.find((p) => p.name === f.name))];
      return combined.slice(0, 5);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxSize: 10 * 1024 * 1024, maxFiles: 5,
  });

  async function uploadFiles() {
    if (!pendingFiles.length) return;
    setUploading(true);
    const uploaded: Document[] = [];
    for (const file of pendingFiles) {
      const form = new FormData();
      form.append("file", file);
      form.append("booking_id", booking.id);
      try {
        const res = await fetch("/api/public/documents", { method: "POST", body: form });
        if (res.ok) uploaded.push(await res.json());
      } catch { /* ignore individual failures */ }
    }
    if (uploaded.length) {
      setBooking((b) => ({ ...b, documents: [...(b.documents ?? []), ...uploaded] }));
      toast({ title: `Uploaded ${uploaded.length} file${uploaded.length > 1 ? "s" : ""}` });
    }
    setPendingFiles([]);
    setUploading(false);
  }

  async function handleView(doc: Document) {
    setViewing(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      toast({ title: "Could not open file.", variant: "destructive" });
    } finally { setViewing(null); }
  }

  async function handleDeleteDoc(doc: Document) {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBooking((b) => ({ ...b, documents: (b.documents ?? []).filter((d) => d.id !== doc.id) }));
      toast({ title: "Document deleted" });
    } catch {
      toast({ title: "Could not delete document.", variant: "destructive" });
    } finally { setDeleting(null); }
  }

  async function handleDownload(doc: Document) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}?dl=1`);
      if (!res.ok) throw new Error();
      const { url, file_name } = await res.json();
      const blob = await (await fetch(url)).blob();
      const a = Object.assign(document.createElement("a"), {
        href: URL.createObjectURL(blob), download: file_name,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      toast({ title: "Could not download file.", variant: "destructive" });
    } finally { setDownloading(null); }
  }

  const inputCls = "w-full h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]";

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back + header */}
      <div>
        <Link href="/my-bookings" className="inline-flex items-center gap-1.5 text-[13px] text-[#888] hover:text-black transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> My Bookings
        </Link>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-[20px] font-bold text-black">{booking.company_name}</h1>
            <p className="text-[13px] text-[#888] mt-0.5">Submitted {formatDate(booking.created_at, "dd MMM yyyy, HH:mm")}</p>
          </div>
          <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${STATUS_STYLES[booking.status as BookingStatus] ?? ""}`}>
            {STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — details + editable fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Read-only booking info */}
          <div className="bg-white rounded-xl border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">Booking Details</h2>
            </div>
            <div className="grid grid-cols-2 divide-y divide-[#f9f9f9]">
              {[
                ["Screening Type", booking.screening_type],
                ["Employees", String(booking.employee_count)],
                ["Address", booking.address],
                ["Email", booking.email],
              ].map(([label, value]) => (
                <div key={label} className="col-span-2 sm:col-span-1 px-4 py-2.5 flex flex-col gap-0.5">
                  <span className="text-[11px] text-[#aaa] uppercase tracking-wide">{label}</span>
                  <span className="text-[13px] text-black">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Editable fields */}
          <div className="bg-white rounded-xl border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">Edit Request</h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Contact Person">
                  <input className={inputCls} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
                </Field>
                <Field label="Phone">
                  <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
              </div>

              <Field label="Preferred Dates">
                <input
                  type="date"
                  className={inputCls}
                  onChange={(e) => { addDate(e.target.value); e.currentTarget.value = ""; }}
                  min={new Date().toISOString().split("T")[0]}
                />
                {preferredDates.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {preferredDates.map((d) => (
                      <span key={d} className="inline-flex items-center gap-1 bg-[#f0f0f0] text-[12px] text-black px-2.5 py-1 rounded-full border border-[#e5e5e5]">
                        <CalendarIcon className="w-3 h-3 text-[#888]" />
                        {format(new Date(d + "T12:00:00"), "dd MMM yyyy")}
                        <button type="button" onClick={() => removeDate(d)} className="ml-0.5 text-[#888] hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Field>

              <Field label="Notes">
                <textarea
                  rows={4}
                  className="w-full text-[13px] border border-[#e5e5e5] rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
                  placeholder="Any special requirements or updates..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </Field>

              <button
                onClick={save}
                disabled={saving || !isDirty}
                className="h-8 px-4 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving</> : <><Save className="w-3.5 h-3.5" /> Save changes</>}
              </button>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl border border-[#e5e5e5]">
            <div className="px-4 py-2.5 border-b border-[#e5e5e5]">
              <h2 className="text-[11px] font-semibold text-[#888] uppercase tracking-wide">Documents</h2>
            </div>
            <div className="p-4 space-y-3">
              {/* Existing docs */}
              {(booking.documents ?? []).length === 0 && pendingFiles.length === 0 ? (
                <p className="text-[13px] text-[#aaa]">No documents uploaded yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {(booking.documents ?? []).map((doc) => (
                    <li key={doc.id} className="flex items-center justify-between bg-[#f9f9f9] border border-[#e5e5e5] rounded-md px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium truncate">{doc.file_name}</p>
                          <p className="text-[11px] text-[#888]">{doc.file_type} · {formatFileSize(doc.file_size)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-3 flex-shrink-0">
                        <button onClick={() => handleView(doc)} disabled={viewing === doc.id} className="p-1.5 text-[#888] hover:text-black rounded transition-colors" title="View">
                          {viewing === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id} className="p-1.5 text-[#888] hover:text-black rounded transition-colors" title="Download">
                          {downloading === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => handleDeleteDoc(doc)} disabled={deleting === doc.id} className="p-1.5 text-[#aaa] hover:text-red-500 rounded transition-colors" title="Delete">
                          {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Upload zone */}
              <div {...getRootProps()} className={`border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? "border-black bg-[#f5f5f5]" : "border-[#ddd] hover:border-[#aaa]"}`}>
                <input {...getInputProps()} />
                <UploadCloud className="w-4 h-4 mx-auto text-[#bbb] mb-1" />
                <p className="text-[12px] text-[#666]">Add more documents — PDF or DOCX, max 10 MB</p>
              </div>

              {pendingFiles.length > 0 && (
                <div className="space-y-1.5">
                  {pendingFiles.map((f) => (
                    <div key={f.name} className="flex items-center justify-between bg-[#f5f5f5] border border-[#e5e5e5] rounded-md px-3 py-2">
                      <span className="text-[13px] truncate">{f.name}</span>
                      <button onClick={() => setPendingFiles((p) => p.filter((x) => x.name !== f.name))} className="ml-2 text-[#aaa] hover:text-red-500">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button onClick={uploadFiles} disabled={uploading} className="w-full h-8 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-50 flex items-center justify-center gap-1.5">
                    {uploading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</> : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — meta */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 space-y-3">
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
            <div>
              <p className="text-[11px] text-[#aaa] uppercase tracking-wide mb-1.5">Status</p>
              <span className={`text-[12px] font-medium px-3 py-1 rounded-full border ${STATUS_STYLES[booking.status as BookingStatus] ?? ""}`}>
                {STATUS_LABELS[booking.status as BookingStatus] ?? booking.status}
              </span>
            </div>
          </div>
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-4">
            <p className="text-[12px] text-[#92400e] font-medium">Need to make changes?</p>
            <p className="text-[12px] text-[#92400e] mt-1">Update the fields above and click Save. For urgent changes or cancellations, contact us directly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
