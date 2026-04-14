"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, UploadCloud, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatFileSize } from "@/lib/utils";
import type { Document } from "@/types";

interface Props { bookingId: string; onUploaded: (doc: Document) => void; }

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};
const MAX_FILES = 5;

export default function DocumentUpload({ bookingId, onUploaded }: Props) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((accepted: File[]) => {
    setError(null);
    setPendingFiles((prev) => {
      const combined = [...prev, ...accepted.filter((f) => !prev.find((p) => p.name === f.name))];
      if (combined.length > MAX_FILES) {
        setError(`Maximum ${MAX_FILES} files at a time.`);
        return prev;
      }
      return combined;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxSize: 10 * 1024 * 1024,
    maxFiles: MAX_FILES,
    onDropRejected: (files) => setError(files[0]?.errors[0]?.message ?? "PDF or DOCX only, max 10 MB"),
  });

  function removeFile(name: string) {
    setPendingFiles((prev) => prev.filter((f) => f.name !== name));
    setError(null);
  }

  async function upload() {
    if (pendingFiles.length === 0) return;
    setUploading(true);
    setError(null);
    let uploaded = 0;
    for (const file of pendingFiles) {
      const form = new FormData();
      form.append("file", file);
      form.append("booking_id", bookingId);
      try {
        const res = await fetch("/api/documents", { method: "POST", body: form });
        if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
        onUploaded(await res.json() as Document);
        uploaded++;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        toast({ title: `Failed: ${file.name}`, description: msg, variant: "destructive" });
      }
    }
    if (uploaded > 0) {
      toast({ title: `Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""}` });
    }
    setPendingFiles([]);
    setUploading(false);
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
        <p className="text-[11px] text-[#aaa] mt-0.5">PDF, DOCX — max 10 MB · up to {MAX_FILES} files</p>
      </div>

      {pendingFiles.length > 0 && (
        <div className="space-y-1.5">
          {pendingFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between bg-[#f5f5f5] border border-[#e5e5e5] rounded-md px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium truncate">{file.name}</p>
                  <p className="text-[11px] text-[#888]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button onClick={() => removeFile(file.name)} className="p-1 text-[#888] hover:text-black ml-2" disabled={uploading}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={upload}
            disabled={uploading}
            className="w-full h-8 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {uploading ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</> : `Upload ${pendingFiles.length} file${pendingFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {error && <p className="text-[12px] text-red-500">{error}</p>}
    </div>
  );
}
