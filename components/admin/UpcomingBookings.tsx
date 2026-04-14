import Link from "next/link";
import StatusBadge from "./StatusBadge";
import { formatDate } from "@/lib/utils";
import type { Booking } from "@/types";

export default function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="bg-white rounded-lg border border-[#e5e5e5]">
      <div className="px-4 py-3 border-b border-[#e5e5e5]">
        <h3 className="text-[13px] font-medium text-black">Upcoming this week</h3>
      </div>
      {bookings.length === 0 ? (
        <p className="text-[13px] text-[#888] text-center py-8">No upcoming bookings.</p>
      ) : (
        <ul className="divide-y divide-[#f0f0f0]">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link href={`/bookings/${b.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-[#fafafa] transition-colors group">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-black truncate group-hover:text-blue-600">{b.company_name}</p>
                  <p className="text-[12px] text-[#888]">{b.screening_type} · {formatDate(b.preferred_dates[0])}</p>
                </div>
                <StatusBadge status={b.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
