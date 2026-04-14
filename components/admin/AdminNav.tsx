"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bookings", label: "Bookings" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-[#e5e5e5] sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-5">
          <Link href="/dashboard" className="flex items-center gap-1.5">
            <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-black tracking-tight">WorkMedix</span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-2.5 py-1 rounded text-[13px] transition-colors",
                    active
                      ? "text-black font-medium bg-[#f0f0f0]"
                      : "text-[#888] hover:text-black hover:bg-[#f5f5f5]"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: user + public link */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="text-[12px] text-[#888] hover:text-black transition-colors"
          >
            View site ↗
          </Link>
          <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
        </div>
      </div>
    </header>
  );
}
