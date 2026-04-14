"use client";

import { useState } from "react";
import { FileText, Download, Trash2, Loader2, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatFileSize } from "@/lib/utils";
import type { Document } from "@/types";

interface Props { documents: Document[]; bookingId: string; onDelete: (id: string) => void; }

export default function DocumentList({ documents, onDelete }: Props) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDownload(doc: Document) {
    setDownloading(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      toast({ title: "Error", description: "Could not download file.", variant: "destructive" });
    } finally { setDownloading(null); }
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.file_name}"?`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDelete(doc.id);
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Error", description: "Could not delete file.", variant: "destructive" });
    } finally { setDeleting(null); }
  }

  if (documents.length === 0) {
    return <p className="text-[13px] text-[#888] py-2">No documents uploaded.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {documents.map((doc) => {
        const isImg = ["JPEG","JPG","PNG","WEBP"].includes(doc.file_type.toUpperCase());
        return (
          <li key={doc.id} className="flex items-center justify-between bg-[#f9f9f9] border border-[#e5e5e5] rounded-md px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {isImg
                ? <Image className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                : <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              }
              <div className="min-w-0">
                <p className="text-[13px] font-medium truncate">{doc.file_name}</p>
                <p className="text-[11px] text-[#888]">{doc.file_type} · {formatFileSize(doc.file_size)} · {formatDate(doc.uploaded_at)}</p>
              </div>
            </div>
            <div className="flex gap-1 ml-3 flex-shrink-0">
              <button
                onClick={() => handleDownload(doc)}
                disabled={downloading === doc.id}
                className="p-1.5 text-[#888] hover:text-black rounded transition-colors"
                title="Download"
              >
                {downloading === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => handleDelete(doc)}
                disabled={deleting === doc.id}
                className="p-1.5 text-[#888] hover:text-red-500 rounded transition-colors"
                title="Delete"
              >
                {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
