"use client";

import { Mail } from "lucide-react";

interface Props { to: string; contactName: string; companyName?: string; }

export default function EmailButton({ to, contactName, companyName }: Props) {
  const subject = encodeURIComponent(
    `Booking Update${companyName ? ` — ${companyName}` : ""}`
  );
  return (
    <a
      href={`mailto:${to}?subject=${subject}`}
      className="h-7 px-3 text-[12px] border border-[#e5e5e5] rounded-md bg-white hover:bg-[#f5f5f5] transition-colors inline-flex items-center gap-1.5 text-[#444]"
    >
      <Mail className="w-3.5 h-3.5" /> Email
    </a>
  );
}
