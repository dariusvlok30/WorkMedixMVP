import { ShieldCheck, Clock, Award, Users, FileText, HeadphonesIcon } from "lucide-react";

const reasons = [
  { icon: ShieldCheck, title: "Certified & Compliant", description: "All screenings follow OHSA and industry-specific regulatory requirements." },
  { icon: Clock, title: "Fast Turnaround", description: "Results and reports delivered within 24–48 hours of screening." },
  { icon: Award, title: "Experienced Clinicians", description: "Qualified occupational health practitioners with years of field experience." },
  { icon: Users, title: "Any Company Size", description: "From SMEs to large enterprises — we scale to your workforce needs." },
  { icon: FileText, title: "Digital Reports", description: "Secure digital documentation and certificate management for every employee." },
  { icon: HeadphonesIcon, title: "Dedicated Support", description: "A dedicated account manager for seamless booking and follow-up." },
];

export default function WhyChooseUs() {
  return (
    <section id="why-us" className="py-16 bg-[#f9f9f9]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-[12px] font-medium text-[#888] uppercase tracking-wider mb-2">Why WorkMedix</p>
          <h2 className="text-[26px] font-bold text-black tracking-tight">The trusted choice for businesses</h2>
          <p className="text-[14px] text-[#666] mt-2">
            We make occupational health screening simple, reliable, and professional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-3 p-4 bg-white rounded-lg border border-[#e5e5e5]">
              <div className="flex-shrink-0 w-8 h-8 bg-[#f0f0f0] rounded-lg flex items-center justify-center mt-0.5">
                <r.icon className="w-4 h-4 text-black" />
              </div>
              <div>
                <h3 className="text-[13px] font-semibold text-black">{r.title}</h3>
                <p className="text-[13px] text-[#666] mt-0.5 leading-relaxed">{r.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
