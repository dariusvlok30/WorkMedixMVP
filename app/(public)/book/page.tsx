import { currentUser } from "@clerk/nextjs/server";
import { SignIn } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import BookingForm from "@/components/public/BookingForm";

export const metadata = {
  title: "Book a Screening — WorkMedix",
  description: "Submit a booking request for your company's medical screening.",
};

export default async function BookingPage() {
  const user = await currentUser();

  if (!user) {
    return (
      <div className="bg-[#f9f9f9] min-h-screen py-10 px-4">
        <div className="max-w-sm mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-9 h-9 bg-black rounded-lg mb-3">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[16px] font-semibold text-black">Sign in to Book</h1>
            <p className="text-[13px] text-[#888] mt-1">
              Use your Google or Microsoft account to continue.
            </p>
          </div>
          <SignIn
            redirectUrl="/book"
            appearance={{
              elements: {
                formButtonPrimary: "bg-black hover:bg-[#222] text-white text-sm normal-case h-9 rounded-md",
                card: "shadow-none border border-[#e5e5e5] rounded-xl",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formFieldInput: "h-8 text-[13px] border-[#e5e5e5] rounded-md",
                formFieldLabel: "text-[12px] text-[#666]",
                footerActionLink: "text-black font-medium",
              },
            }}
          />
        </div>
      </div>
    );
  }

  const defaultName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const defaultEmail = user.primaryEmailAddress?.emailAddress ?? "";

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
          <BookingForm defaultName={defaultName} defaultEmail={defaultEmail} />
        </div>
      </div>
    </div>
  );
}
