"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";
import type { Document } from "@/types";

interface Props { bookingId: string; onUploaded: (doc: Document) => void; }

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export default function DocumentUpload({ bookingId, onUploaded }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) { setPendingFile(accepted[0]); setError(null); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    onDropRejected: (files) => setError(files[0]?.errors[0]?.message ?? "File rejected"),
  });

  async function upload() {
    if (!pendingFile) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", pendingFile);
    form.append("booking_id", bookingId);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      onUploaded(await res.json() as Document);
      setPendingFile(null);
      toast({ title: "Uploaded", description: `${pendingFile.name} uploaded.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div
        {...getRootProps()}
        className={`border border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-black bg-[#f5f5f5]" : "border-[#ddd] hover:border-[#aaa]"
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-5 h-5 mx-auto text-[#bbb] mb-1.5" />
        <p className="text-[13px] text-[#666]">
          {isDragActive ? "Drop here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-[11px] text-[#aaa] mt-0.5">PDF, JPEG, PNG, WebP — max 10 MB</p>
      </div>

      {pendingFile && (
        <div className="flex items-center justify-between bg-[#f5f5f5] border border-[#e5e5e5] rounded-md px-3 py-2">
          <div className="min-w-0">
            <p className="text-[13px] font-medium truncate">{pendingFile.name}</p>
            <p className="text-[11px] text-[#888]">{formatFileSize(pendingFile.size)}</p>
          </div>
          <div className="flex gap-1.5 ml-3 flex-shrink-0">
            <button onClick={() => setPendingFile(null)} className="p-1 text-[#888] hover:text-black" disabled={uploading}>
              <X className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={upload}
              disabled={uploading}
              className="h-7 px-3 bg-black text-white text-[12px] rounded hover:bg-[#222] disabled:opacity-50 flex items-center gap-1"
            >
              {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading</> : "Upload"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
