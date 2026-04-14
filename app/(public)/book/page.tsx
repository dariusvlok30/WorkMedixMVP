import BookingForm from "@/components/public/BookingForm";

export const metadata = {
  title: "Book a Screening — WorkMedix",
  description: "Submit a booking request for your company's medical screening.",
};

export default function BookingPage() {
  return (
    <div className="bg-[#f9f9f9] min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-[22px] font-bold text-black tracking-tight">Book a Screening</h1>
          <p className="text-[13px] text-[#888] mt-1">
            Fill in your company details and we&apos;ll confirm your booking within 1–2 business days.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6">
          <BookingForm />
        </div>
      </div>
    </div>
  );
}
