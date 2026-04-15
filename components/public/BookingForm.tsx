"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, UploadCloud, FileText, Lock } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useToast } from "@/hooks/use-toast";
import { SCREENING_TYPES } from "@/types";
import { formatFileSize } from "@/lib/utils";

const schema = z.object({
  company_name: z.string().min(2, "Required"),
  contact_person: z.string().min(2, "Required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(7, "Required"),
  address: z.string().min(5, "Required"),
  employee_count: z.coerce.number().min(1, "Must be at least 1"),
  screening_type: z.string().min(1, "Required"),
  preferred_dates: z.array(z.string()).min(1, "Add at least one date"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultName?: string;
  defaultEmail?: string;
  /** When true the email field is locked and cannot be edited */
  emailLocked?: boolean;
}

function Field({ label, error, children, hint }: {
  label: string; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-medium text-[#444] block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[#aaa]">{hint}</p>}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

const inputCls = "w-full h-8 text-[13px] border border-[#e5e5e5] rounded-md px-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]";
const selectCls = `${inputCls} appearance-none`;

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/msword": [".doc"],
};
const MAX_FILES = 5;

export default function BookingForm({ defaultName = "", defaultEmail = "", emailLocked = false }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [dropError, setDropError] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      preferred_dates: [],
      contact_person: defaultName,
      email: defaultEmail,
    },
  });

  // Update form if props arrive after mount (SSR hydration)
  useEffect(() => {
    if (defaultName) setValue("contact_person", defaultName);
    if (defaultEmail) setValue("email", defaultEmail);
  }, [defaultName, defaultEmail, setValue]);

  const preferredDates = watch("preferred_dates");

  function handleDateChange(val: string) {
    if (!val || preferredDates.includes(val)) return;
    setValue("preferred_dates", [...preferredDates, val], { shouldValidate: true });
  }

  function removeDate(d: string) {
    setValue("preferred_dates", preferredDates.filter((x) => x !== d), { shouldValidate: true });
  }

  const onDrop = useCallback((accepted: File[]) => {
    setDropError(null);
    setFiles((prev) => {
      const combined = [...prev, ...accepted.filter((f) => !prev.find((p) => p.name === f.name))];
      if (combined.length > MAX_FILES) {
        setDropError(`Maximum ${MAX_FILES} files allowed.`);
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
    onDropRejected: (rejected) =>
      setDropError(rejected[0]?.errors[0]?.message ?? "File rejected — PDF or DOCX only, max 10 MB"),
  });

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
    setDropError(null);
  }

  async function uploadDocuments(bookingId: string) {
    if (files.length === 0) return;
    setUploadingDocs(true);
    await Promise.allSettled(
      files.map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        form.append("booking_id", bookingId);
        await fetch("/api/public/documents", { method: "POST", body: form });
      })
    );
    setUploadingDocs(false);
  }

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Something went wrong");
      const booking = await res.json();
      await uploadDocuments(booking.id);
      router.push("/book/success");
    } catch (e) {
      toast({
        title: "Submission failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  const isLoading = submitting || uploadingDocs;
  const loadingLabel = uploadingDocs
    ? `Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`
    : "Submitting...";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Company Details */}
      <div>
        <p className="text-[11px] font-medium text-[#aaa] uppercase tracking-wider mb-3">Company Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Company Name *" error={errors.company_name?.message}>
            <input className={inputCls} placeholder="Acme Corp" {...register("company_name")} />
          </Field>
          <Field label="Contact Person *" error={errors.contact_person?.message}>
            <input className={inputCls} placeholder="Jane Smith" {...register("contact_person")} />
          </Field>
          <Field label="Email Address *" error={errors.email?.message}>
            {emailLocked ? (
              <div className="relative">
                <input
                  className={`${inputCls} bg-[#f5f5f5] text-[#888] cursor-not-allowed pr-8`}
                  type="email"
                  readOnly
                  {...register("email")}
                />
                <Lock className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#bbb]" />
              </div>
            ) : (
              <input className={inputCls} type="email" placeholder="jane@acme.com" {...register("email")} />
            )}
            {emailLocked && (
              <p className="text-[11px] text-[#aaa]">Linked to your account — cannot be changed here.</p>
            )}
          </Field>
          <Field label="Phone Number *" error={errors.phone?.message}>
            <input className={inputCls} type="tel" placeholder="+27 11 000 0000" {...register("phone")} />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Company Address *" error={errors.address?.message} hint="Used for on-site visit scheduling">
            <input className={inputCls} placeholder="123 Business Park, Johannesburg" {...register("address")} />
          </Field>
        </div>
      </div>

      {/* Screening Details */}
      <div className="border-t border-[#f0f0f0] pt-5">
        <p className="text-[11px] font-medium text-[#aaa] uppercase tracking-wider mb-3">Screening Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Number of Employees *" error={errors.employee_count?.message}>
            <input className={inputCls} type="number" min={1} placeholder="50" {...register("employee_count")} />
          </Field>
          <Field label="Type of Screening *" error={errors.screening_type?.message}>
            <Controller
              name="screening_type"
              control={control}
              render={({ field }) => (
                <select className={selectCls} value={field.value} onChange={field.onChange}>
                  <option value="">Select type...</option>
                  {SCREENING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              )}
            />
          </Field>
        </div>

        {/* Preferred Dates — auto-add on select */}
        <div className="mt-3 space-y-1.5">
          <label className="text-[12px] font-medium text-[#444] block">Preferred Date(s) *</label>
          <input
            type="date"
            onChange={(e) => { handleDateChange(e.target.value); e.target.value = ""; }}
            min={new Date().toISOString().split("T")[0]}
            className={inputCls}
          />
          <p className="text-[11px] text-[#aaa]">Select a date to add it — you can add multiple.</p>
          {preferredDates.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
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
          {errors.preferred_dates && <p className="text-[11px] text-red-500">{errors.preferred_dates.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div className="border-t border-[#f0f0f0] pt-5">
        <Field label="Notes / Special Requirements">
          <textarea
            className="w-full text-[13px] border border-[#e5e5e5] rounded-md px-2.5 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-black/20 placeholder:text-[#bbb]"
            placeholder="Any special requirements, shift considerations, or additional information..."
            rows={3}
            {...register("notes")}
          />
        </Field>
      </div>

      {/* Supporting Documents */}
      <div className="border-t border-[#f0f0f0] pt-5">
        <p className="text-[11px] font-medium text-[#aaa] uppercase tracking-wider mb-1">Supporting Documents</p>
        <p className="text-[12px] text-[#888] mb-3">
          Attach employee lists, previous records, or relevant documents. PDF or DOCX only, max {MAX_FILES} files, 10 MB each.
        </p>

        {files.length < MAX_FILES && (
          <div
            {...getRootProps()}
            className={`border border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-black bg-[#f5f5f5]" : "border-[#ddd] hover:border-[#aaa] hover:bg-[#fafafa]"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="w-5 h-5 mx-auto text-[#bbb] mb-2" />
            <p className="text-[13px] text-[#555]">
              {isDragActive ? "Drop files here" : "Drag & drop or click to browse"}
            </p>
            <p className="text-[11px] text-[#aaa] mt-1">PDF, DOCX — max 10 MB each</p>
          </div>
        )}

        {dropError && <p className="text-[11px] text-red-500 mt-1.5">{dropError}</p>}

        {files.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {files.map((file) => (
              <li key={file.name} className="flex items-center justify-between bg-[#f9f9f9] border border-[#e5e5e5] rounded-md px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium truncate">{file.name}</p>
                    <p className="text-[11px] text-[#888]">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.name)}
                  className="ml-3 p-1 text-[#aaa] hover:text-red-500 flex-shrink-0 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-9 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
      >
        {isLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {loadingLabel}</> : "Submit Booking Request"}
      </button>

      <p className="text-[11px] text-[#aaa] text-center">
        By submitting you agree to be contacted by WorkMedix regarding your booking.
      </p>
    </form>
  );
}
