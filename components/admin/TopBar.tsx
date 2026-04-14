"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/bookings": "Bookings",
};

function getTitle(pathname: string): string {
  if (pathname.match(/^\/bookings\/.+/)) return "Booking Detail";
  return PAGE_TITLES[pathname] ?? "Admin";
}

export default function TopBar() {
  const pathname = usePathname();

  return (
    <header className="h-11 bg-[#0c0c0c] border-b border-[#1f1f1f] flex items-center px-5 flex-shrink-0">
      <span className="text-[13px] font-medium text-[#888]">{getTitle(pathname)}</span>
    </header>
  );
}
