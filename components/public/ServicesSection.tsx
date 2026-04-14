import Link from "next/link";
import { Stethoscope, FlaskConical, Eye, HeartPulse, UserCheck, CalendarCheck } from "lucide-react";

const services = [
  { icon: Stethoscope, title: "Occupational Health", description: "Comprehensive workplace health assessments ensuring employees are fit for their specific job requirements." },
  { icon: FlaskConical, title: "Drug & Alcohol", description: "Rapid, certified substance testing fully compliant with workplace policies and legal standards." },
  { icon: Eye, title: "Vision & Hearing", description: "Professional audiometric and vision testing for noise- and sight-critical roles." },
  { icon: HeartPulse, title: "Full Medical", description: "In-depth examinations including vitals, bloods, ECG, lung function and specialist referrals." },
  { icon: UserCheck, title: "Pre-Employment", description: "Fast pre-employment medicals ensuring new hires meet your occupational health requirements." },
  { icon: CalendarCheck, title: "Annual Review", description: "Scheduled health surveillance programmes to monitor workforce trends and meet legal obligations." },
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-[12px] font-medium text-[#888] uppercase tracking-wider mb-2">Services</p>
          <h2 className="text-[26px] font-bold text-black tracking-tight">Comprehensive screening solutions</h2>
          <p className="text-[14px] text-[#666] mt-2 max-w-xl">
            From pre-employment medicals to ongoing annual surveillance — the full spectrum of occupational health services.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.title} className="p-5 rounded-lg border border-[#e5e5e5] hover:border-[#ccc] transition-colors">
              <s.icon className="w-5 h-5 text-black mb-3" />
              <h3 className="text-[13px] font-semibold text-black mb-1.5">{s.title}</h3>
              <p className="text-[13px] text-[#666] leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/book" className="inline-flex items-center gap-1.5 text-[13px] text-black font-medium hover:underline underline-offset-4">
            Book a screening for your company →
          </Link>
        </div>
      </div>
    </section>
  );
}
