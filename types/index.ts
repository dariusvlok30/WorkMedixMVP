// ============================================================
// Legacy booking types (kept for backward compatibility)
// ============================================================

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

// ============================================================
// OHS v2 Types
// ============================================================

export type IdType = "sa_id" | "passport";
export type Gender = "male" | "female" | "other";
export type Race = "african" | "coloured" | "indian" | "white" | "other";

export interface Worker {
  id: string;
  id_number: string;
  id_type: IdType;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  race: Race | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  // joined
  company_workers?: CompanyWorker[];
  latest_certificate?: FitnessCertificate | null;
}

export interface Company {
  id: string;
  name: string;
  registration_number: string | null;
  industry_type: string | null;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  clerk_user_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // joined
  worker_count?: number;
}

export interface CompanyWorker {
  id: string;
  company_id: string;
  worker_id: string;
  employee_number: string | null;
  department: string | null;
  job_title: string | null;
  occupation_class: string | null;
  date_of_employment: string | null;
  is_active: boolean;
  created_at: string;
  // joined
  worker?: Worker;
  company?: Company;
}

export type TestType =
  | "spirometry"
  | "audiometry"
  | "vision"
  | "blood_pressure"
  | "height_weight"
  | "urine"
  | "ecg"
  | "general";

export interface ScreeningPackage {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_cents: number;
  tests_included: TestType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type SessionStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export interface ScreeningSession {
  id: string;
  company_id: string;
  package_id: string;
  session_date: string;
  location: string;
  status: SessionStatus;
  created_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  company?: Company;
  package?: ScreeningPackage;
  appointment_count?: number;
  completed_count?: number;
}

export type AppointmentStatus = "scheduled" | "in_progress" | "completed" | "no_show" | "cancelled";

export interface WorkerAppointment {
  id: string;
  session_id: string;
  worker_id: string;
  scheduled_time: string | null;
  status: AppointmentStatus;
  clinician_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  worker?: Worker;
  session?: ScreeningSession;
  results?: ScreeningResult[];
  certificate?: FitnessCertificate | null;
}

export type ResultStatus = "normal" | "abnormal" | "borderline" | "refer";

export interface ScreeningResult {
  id: string;
  appointment_id: string;
  worker_id: string;
  test_type: TestType;
  result_data: Record<string, unknown>;
  result_status: ResultStatus;
  measured_by: string | null;
  device_serial_number: string | null;
  created_at: string;
}

export type FitnessStatus =
  | "fit"
  | "fit_with_restrictions"
  | "temporarily_unfit"
  | "permanently_unfit";

export interface FitnessCertificate {
  id: string;
  appointment_id: string;
  worker_id: string;
  certificate_number: string;
  fitness_status: FitnessStatus;
  valid_until: string | null;
  restrictions: string[];
  remarks: string | null;
  issued_by: string;
  issued_by_name: string;
  issued_at: string;
  pdf_url: string | null;
  created_at: string;
  // joined
  worker?: Worker;
  appointment?: WorkerAppointment;
}

// ============================================================
// Spirometry result shape
// ============================================================
export interface SpirometryData {
  fvc_actual: number;
  fvc_predicted: number;
  fvc_percent: number;
  fev1_actual: number;
  fev1_predicted: number;
  fev1_percent: number;
  fev1_fvc_ratio: number;
  interpretation: string;
  device_serial?: string;
}

// ============================================================
// Audiometry result shape
// ============================================================
export interface AudiometryData {
  left_500: number;
  left_1000: number;
  left_2000: number;
  left_4000: number;
  left_8000: number;
  right_500: number;
  right_1000: number;
  right_2000: number;
  right_4000: number;
  right_8000: number;
  left_pta: number;
  right_pta: number;
  interpretation: string;
}

// ============================================================
// Vision result shape
// ============================================================
export interface VisionData {
  left_near: string;
  left_far: string;
  right_near: string;
  right_far: string;
  colour_vision: "pass" | "fail";
  depth_perception: "pass" | "fail";
  glasses_required: boolean;
  interpretation: string;
}

// ============================================================
// Blood pressure result shape
// ============================================================
export interface BloodPressureData {
  systolic: number;
  diastolic: number;
  pulse: number;
  interpretation: string;
}

// ============================================================
// Height/Weight result shape
// ============================================================
export interface HeightWeightData {
  height_cm: number;
  weight_kg: number;
  bmi: number;
  interpretation: string;
}

// ============================================================
// Urine result shape
// ============================================================
export interface UrineData {
  protein: string;
  glucose: string;
  blood: string;
  ketones: string;
  ph: number;
  specific_gravity: number;
  interpretation: string;
}

// ============================================================
// Label maps
// ============================================================
export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Scheduled",
  in_progress: "In Progress",
  completed: "Completed",
  no_show: "No Show",
  cancelled: "Cancelled",
};

export const FITNESS_STATUS_LABELS: Record<FitnessStatus, string> = {
  fit: "Fit",
  fit_with_restrictions: "Fit with Restrictions",
  temporarily_unfit: "Temporarily Unfit",
  permanently_unfit: "Permanently Unfit",
};

export const FITNESS_STATUS_COLORS: Record<FitnessStatus, string> = {
  fit: "bg-green-100 text-green-800 border-green-200",
  fit_with_restrictions: "bg-amber-100 text-amber-800 border-amber-200",
  temporarily_unfit: "bg-orange-100 text-orange-800 border-orange-200",
  permanently_unfit: "bg-red-100 text-red-800 border-red-200",
};

export const TEST_TYPE_LABELS: Record<TestType, string> = {
  spirometry: "Spirometry",
  audiometry: "Audiometry",
  vision: "Vision",
  blood_pressure: "Blood Pressure",
  height_weight: "Height & Weight",
  urine: "Urine Analysis",
  ecg: "ECG",
  general: "General Examination",
};
