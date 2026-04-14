"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SCREENING_TYPES } from "@/types";

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

export default function BookingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [dateInput, setDateInput] = useState("");

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { preferred_dates: [] },
  });

  const preferredDates = watch("preferred_dates");

  function addDate() {
    if (!dateInput || preferredDates.includes(dateInput)) return;
    setValue("preferred_dates", [...preferredDates, dateInput], { shouldValidate: true });
    setDateInput("");
  }

  function removeDate(d: string) {
    setValue("preferred_dates", preferredDates.filter((x) => x !== d), { shouldValidate: true });
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
      router.push("/book/success");
    } catch (e) {
      toast({ title: "Submission failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Section header */}
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
            <input className={inputCls} type="email" placeholder="jane@acme.com" {...register("email")} />
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

        {/* Dates */}
        <div className="mt-3 space-y-1.5">
          <label className="text-[12px] font-medium text-[#444] block">Preferred Date(s) *</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={`${inputCls} flex-1`}
            />
            <button
              type="button"
              onClick={addDate}
              className="h-8 w-8 border border-[#e5e5e5] rounded-md flex items-center justify-center hover:bg-[#f5f5f5] transition-colors text-[#666]"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-9 bg-black text-white text-[13px] font-medium rounded-md hover:bg-[#222] disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
      >
        {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</> : "Submit Booking Request"}
      </button>

      <p className="text-[11px] text-[#aaa] text-center">
        By submitting you agree to be contacted by WorkMedix regarding your booking.
      </p>
    </form>
  );
}
