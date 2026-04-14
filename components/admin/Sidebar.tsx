"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  CalendarCheck,
  ExternalLink,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[200px] bg-[#0c0c0c] flex-shrink-0 border-r border-[#1f1f1f]">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-12 border-b border-[#1f1f1f]">
        <div className="w-5 h-5 bg-white rounded flex items-center justify-center flex-shrink-0">
          <Shield className="w-3 h-3 text-black" />
        </div>
        <span className="text-[13px] font-semibold text-white tracking-tight">WorkMedix</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-colors",
                active
                  ? "text-white bg-[#1f1f1f]"
                  : "text-[#8c8c8c] hover:text-white hover:bg-[#161616]"
              )}
            >
              <Icon className={cn("w-[15px] h-[15px] flex-shrink-0", active ? "text-white" : "text-[#666]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-3 border-t border-[#1f1f1f] space-y-2.5">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 text-[12px] text-[#666] hover:text-[#aaa] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Public Site
        </Link>
        <div className="flex items-center gap-2">
          <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
          <span className="text-[12px] text-[#666]">Account</span>
        </div>
      </div>
    </aside>
  );
}
