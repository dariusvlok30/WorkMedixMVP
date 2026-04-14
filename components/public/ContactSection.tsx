import Link from "next/link";
import { Mail, Phone, ArrowRight } from "lucide-react";

export default function ContactSection() {
  return (
    <section id="contact" className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-black rounded-xl p-10 lg:p-14">
          <div className="max-w-xl">
            <h2 className="text-[26px] font-bold text-white tracking-tight mb-3">
              Ready to get started?
            </h2>
            <p className="text-[14px] text-white/60 mb-6 leading-relaxed">
              Submit a booking request and our team will contact you within 1–2 business days
              to confirm your appointment.
            </p>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 h-9 px-5 bg-white text-black text-[13px] font-medium rounded-md hover:bg-white/90 transition-colors mb-6"
            >
              Book a Screening <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <div className="flex flex-col sm:flex-row gap-4 text-[13px] text-white/50">
              <a href="mailto:info@workmedix.com" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" /> info@workmedix.com
              </a>
              <a href="tel:+27110000000" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5" /> +27 (0)11 000 0000
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
