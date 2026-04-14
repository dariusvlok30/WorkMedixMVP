import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/types";

const styles: Record<BookingStatus, string> = {
  pending:   "bg-amber-50  text-amber-700  border-amber-200",
  confirmed: "bg-blue-50   text-blue-700   border-blue-200",
  completed: "bg-green-50  text-green-700  border-green-200",
  cancelled: "bg-red-50    text-red-600    border-red-200",
};

const labels: Record<BookingStatus, string> = {
  pending: "Pending", confirmed: "Confirmed",
  completed: "Completed", cancelled: "Cancelled",
};

export default function StatusBadge({ status, className }: { status: BookingStatus; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border",
      styles[status], className
    )}>
      {labels[status]}
    </span>
  );
}
