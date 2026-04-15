export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type ScreeningType =
  | "Occupational Health"
  | "Drug & Alcohol"
  | "Vision & Hearing"
  | "Full Medical"
  | "Pre-Employment"
  | "Annual Review"
  | "Custom Package";

export interface Booking {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  employee_count: number;
  screening_type: ScreeningType | string;
  preferred_dates: string[];
  notes: string | null;
  status: BookingStatus;
  clerk_user_id?: string | null;
  created_at: string;
  updated_at: string;
  documents?: Document[];
}

export interface Document {
  id: string;
  booking_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
  uploaded_at: string;
}

export interface BookingFormData {
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  employee_count: number;
  screening_type: string;
  preferred_dates: Date[];
  notes?: string;
}

export interface DashboardStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  thisWeek: number;
}

export interface SearchResult {
  booking_id: string;
  score: number;
  company_name: string;
  screening_type: string;
  status: BookingStatus;
  created_at: string;
}

export const SCREENING_TYPES: ScreeningType[] = [
  "Occupational Health",
  "Drug & Alcohol",
  "Vision & Hearing",
  "Full Medical",
  "Pre-Employment",
  "Annual Review",
  "Custom Package",
];

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};
