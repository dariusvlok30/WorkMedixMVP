"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard, CalendarCheck, Users, Building2,
  Stethoscope, Award, Shield, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { href: "/workers",       label: "Workers",       icon: Users },
  { href: "/companies",     label: "Companies",     icon: Building2 },
  { href: "/sessions",      label: "Sessions",      icon: Stethoscope },
  { href: "/certificates",  label: "Certificates",  icon: Award },
  { href: "/bookings",      label: "Bookings",      icon: CalendarCheck },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[220px] bg-[#0a0a0a] border-r border-[#1a1a1a] flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-[#1a1a1a]">
        <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
          <Shield className="w-4 h-4 text-black" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-white tracking-tight leading-none">WorkMedix</p>
          <p className="text-[10px] text-[#555] mt-0.5">OHS Platform</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors",
                active
                  ? "bg-white text-black"
                  : "text-[#777] hover:bg-[#161616] hover:text-white"
              )}
            >
              <Icon className={cn("w-[15px] h-[15px] flex-shrink-0", active ? "text-black" : "text-[#555]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-[#1a1a1a] space-y-3">
        <Link href="/" target="_blank" className="flex items-center gap-2 text-[12px] text-[#555] hover:text-[#aaa] transition-colors">
          <ExternalLink className="w-3.5 h-3.5" /> Public site
        </Link>
        <div className="flex items-center gap-2.5">
          <UserButton appearance={{ elements: { avatarBox: "w-6 h-6" } }} />
          <span className="text-[12px] text-[#555]">Account</span>
        </div>
      </div>
    </aside>
  );
}
