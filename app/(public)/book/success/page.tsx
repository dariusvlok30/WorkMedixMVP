import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-green-50 border border-green-200 rounded-full mb-4">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        </div>
        <h1 className="text-[20px] font-bold text-black mb-2">Booking received</h1>
        <p className="text-[13px] text-[#666] leading-relaxed mb-1">
          Our team will review your request and reach out within <strong>1–2 business days</strong> to confirm your appointment.
        </p>
        <p className="text-[12px] text-[#aaa] mb-6">A confirmation email has been sent to you.</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Link href="/book" className="h-8 px-4 text-[13px] border border-[#e5e5e5] rounded-md bg-white hover:bg-[#f5f5f5] transition-colors flex items-center justify-center">
            Submit another
          </Link>
          <Link href="/" className="h-8 px-4 text-[13px] bg-black text-white rounded-md hover:bg-[#222] transition-colors flex items-center justify-center">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
