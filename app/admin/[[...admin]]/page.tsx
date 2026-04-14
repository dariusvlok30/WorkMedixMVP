import { SignIn } from "@clerk/nextjs";
import { Shield } from "lucide-react";

export const metadata = { title: "Admin — WorkMedix" };

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-9 h-9 bg-black rounded-lg mb-3">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-[15px] font-semibold text-black">WorkMedix Admin</h1>
          <p className="text-[13px] text-[#888] mt-0.5">Sign in to your account</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-black hover:bg-[#222] text-white text-sm normal-case h-9 rounded-md",
              card: "shadow-none border border-[#e5e5e5] rounded-xl",
              headerTitle: "text-[15px] font-semibold",
              headerSubtitle: "text-[13px] text-[#888]",
              formFieldInput:
                "h-8 text-[13px] border-[#e5e5e5] rounded-md",
              formFieldLabel: "text-[12px] text-[#666]",
              footerActionLink: "text-black font-medium",
            },
          }}
        />
      </div>
    </div>
  );
}
