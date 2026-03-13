export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "driver";
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  notes?: string;
  agency_id?: string;
  agency?: Agency;
  created_at: string;
}

export interface Agency {
  id: string;
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  commission_pct: number;
  created_at: string;
}

export interface Driver {
  id: string;
  profile_id?: string;
  full_name: string;
  phone?: string;
  cpf?: string;
  license_plate?: string;
  vehicle_model?: string;
  pix_key?: string;
  active: boolean;
  created_at: string;
}

export type FinancialStatus =
  | "pending"
  | "awaiting_approval"
  | "awaiting_payment"
  | "invoiced"
  | "in_progress"
  | "completed"
  | "paid_to_partner";

export interface Ride {
  id: string | number;
  client_id: string;
  client?: Client;
  driver_id?: string;
  driver?: Driver;
  agency_id?: string;
  agency?: Agency;
  origin: string;
  destination: string;
  scheduled_at: string;
  pax_count: number;
  price: number;
  currency: "BRL" | "USD" | "EUR";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  financial_status?: FinancialStatus;
  notes?: string;
  started_at?: string;
  finished_at?: string;
  nf_number?: string;
  created_at: string;
}
