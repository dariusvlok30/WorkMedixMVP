import Link from "next/link";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#f9f9f9] border-t border-[#e5e5e5] py-8">
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
            <Shield className="w-3 h-3 text-white" />
          </div>
          <span className="text-[13px] font-semibold text-black">WorkMedix</span>
        </Link>
        <div className="flex items-center gap-5 text-[12px] text-[#888]">
          <Link href="/#services" className="hover:text-black transition-colors">Services</Link>
          <Link href="/book" className="hover:text-black transition-colors">Book</Link>
          <Link href="/sign-in" className="hover:text-black transition-colors">Admin</Link>
        </div>
        <p className="text-[12px] text-[#aaa]">&copy; {new Date().getFullYear()} WorkMedix</p>
      </div>
    </footer>
  );
}
