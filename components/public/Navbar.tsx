"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Shield } from "lucide-react";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-black tracking-tight">WorkMedix</span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/#services" className="text-[13px] text-[#666] hover:text-black transition-colors">Services</Link>
            <Link href="/#why-us" className="text-[13px] text-[#666] hover:text-black transition-colors">Why Us</Link>
            <Link href="/#contact" className="text-[13px] text-[#666] hover:text-black transition-colors">Contact</Link>
            <Link
              href="/book"
              className="h-8 px-4 text-[13px] font-medium bg-black text-white rounded-md hover:bg-[#222] transition-colors flex items-center"
            >
              Book a Screening
            </Link>
            <SignedIn>
              <Link
                href="/my-bookings"
                className="h-7 px-3 text-[12px] font-medium border border-[#e5e5e5] rounded-full text-[#555] hover:border-black hover:text-black transition-colors flex items-center"
              >
                My Bookings
              </Link>
              <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="redirect">
                <button className="h-8 px-3 text-[13px] border border-[#e5e5e5] rounded-md hover:bg-[#f5f5f5] transition-colors text-[#666]">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>

          <button className="md:hidden p-1.5 text-[#666] hover:text-black" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-[#e5e5e5] py-3 space-y-1">
            {["/#services", "/#why-us", "/#contact"].map((href) => (
              <Link key={href} href={href} className="block px-1 py-1.5 text-[13px] text-[#666] hover:text-black" onClick={() => setOpen(false)}>
                {href.replace("/#", "").replace("-", " ").replace(/^\w/, c => c.toUpperCase())}
              </Link>
            ))}
            <Link href="/book" className="block mt-2 h-8 px-4 text-[13px] font-medium bg-black text-white rounded-md hover:bg-[#222] text-center leading-8" onClick={() => setOpen(false)}>
              Book a Screening
            </Link>
            <div className="pt-2 flex items-center gap-2">
              <SignedIn>
                <Link
                  href="/my-bookings"
                  className="h-7 px-3 text-[12px] font-medium border border-[#e5e5e5] rounded-full text-[#555] hover:border-black hover:text-black transition-colors flex items-center"
                  onClick={() => setOpen(false)}
                >
                  My Bookings
                </Link>
                <UserButton appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="redirect">
                  <button className="h-8 px-3 text-[13px] border border-[#e5e5e5] rounded-md text-[#666]">
                    Sign in
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
