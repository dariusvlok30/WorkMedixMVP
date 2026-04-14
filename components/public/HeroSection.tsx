import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";

const highlights = [
  "SANAS-aligned screening protocols",
  "Results within 24–48 hours",
  "On-site & clinic-based options",
];

export default function HeroSection() {
  return (
    <section className="bg-black text-white">
      <div className="max-w-6xl mx-auto px-6 py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 border border-white/20 text-white/70 text-[12px] rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            Now accepting company bookings
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
            Medical Screening<br />
            <span className="text-white/60">For Your Workforce</span>
          </h1>

          <p className="text-[15px] text-white/60 leading-relaxed mb-6 max-w-xl">
            Trusted occupational health and pre-employment medical screening
            for businesses. Fast, professional, and fully compliant.
          </p>

          <ul className="space-y-2 mb-8">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-[13px] text-white/70">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {h}
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/book"
              className="inline-flex items-center justify-center gap-2 h-9 px-5 bg-white text-black text-[13px] font-medium rounded-md hover:bg-white/90 transition-colors"
            >
              Book a Screening <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/#services"
              className="inline-flex items-center justify-center h-9 px-5 border border-white/20 text-white text-[13px] rounded-md hover:bg-white/5 transition-colors"
            >
              View Services
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
