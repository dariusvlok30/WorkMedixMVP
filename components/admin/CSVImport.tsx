"use client";

import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from "lucide-react";

interface Props {
  companyId: string;
  onComplete: (results: { created: number; linked: number; errors: string[] }) => void;
  onCancel: () => void;
}

interface ParsedRow {
  id_number: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  gender?: string;
  race?: string;
  phone?: string;
  email?: string;
  employee_number?: string;
  department?: string;
  job_title?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row as ParsedRow;
  }).filter((r) => r.id_number && r.first_name && r.last_name);
}

export default function CSVImport({ companyId, onComplete, onCancel }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("No valid rows found. Make sure CSV has id_number, first_name, and last_name columns.");
        setRows([]);
      } else {
        setRows(parsed);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!rows.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, workers: rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed");
      onComplete(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md p-3 text-[12px] text-[#8c8c8c] space-y-1">
        <p className="font-medium text-[#aaa]">CSV Format</p>
        <p>Required columns: <code className="text-white">id_number, first_name, last_name</code></p>
        <p>Optional: <code className="text-white">date_of_birth, gender, race, phone, email, employee_number, department, job_title</code></p>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-[#2a2a2a] rounded-lg p-6 text-center cursor-pointer hover:border-[#444] transition-colors"
      >
        <Upload className="w-6 h-6 text-[#555] mx-auto mb-2" />
        {fileName ? (
          <div className="flex items-center justify-center gap-2 text-[13px] text-white">
            <FileText className="w-4 h-4 text-[#888]" />
            {fileName}
          </div>
        ) : (
          <p className="text-[13px] text-[#666]">Click to upload CSV file</p>
        )}
        <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-red-400 text-[13px] bg-red-950/30 border border-red-900/50 rounded-md px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {rows.length > 0 && (
        <div className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md p-3">
          <div className="flex items-center gap-2 text-[13px] text-[#aaa] mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            {rows.length} worker{rows.length !== 1 ? "s" : ""} ready to import
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {rows.slice(0, 5).map((r, i) => (
              <div key={i} className="text-[12px] text-[#666] flex gap-3">
                <span className="text-[#888] font-mono">{r.id_number}</span>
                <span>{r.first_name} {r.last_name}</span>
                {r.department && <span className="text-[#555]">{r.department}</span>}
              </div>
            ))}
            {rows.length > 5 && (
              <p className="text-[12px] text-[#555]">...and {rows.length - 5} more</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleImport}
          disabled={!rows.length || loading}
          className="flex-1 py-2 bg-white text-black text-[13px] font-medium rounded-md hover:bg-[#e5e5e5] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          Import {rows.length > 0 ? `${rows.length} Workers` : ""}
        </button>
        <button
          onClick={onCancel}
          className="p-2 text-[#8c8c8c] border border-[#2a2a2a] rounded-md hover:border-[#444] hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
