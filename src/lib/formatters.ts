export function formatCurrency(
  value: number,
  currency: "BRL" | "USD" | "EUR" = "BRL"
): string {
  const locales: Record<string, string> = {
    BRL: "pt-BR",
    USD: "en-US",
    EUR: "de-DE",
  };
  return new Intl.NumberFormat(locales[currency], {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export type RideStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export const statusLabels: Record<RideStatus, string> = {
  scheduled: "Agendada",
  in_progress: "Em andamento",
  completed: "Finalizada",
  cancelled: "Cancelada",
};

export const statusColors: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border border-admin-blue/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border border-admin-green/20",
  cancelled: "bg-admin-red/10 text-admin-red border border-admin-red/20",
};

export type FinancialStatus =
  | "pending"
  | "awaiting_approval"
  | "awaiting_payment"
  | "invoiced"
  | "in_progress"
  | "completed"
  | "paid_to_partner";

export const financialStatusLabels: Record<FinancialStatus, string> = {
  pending: "Pendente",
  awaiting_approval: "Aguardando Aprovação",
  awaiting_payment: "Aguardando Pagamento",
  invoiced: "Faturada",
  in_progress: "Em Andamento",
  completed: "Concluída",
  paid_to_partner: "Pago ao Parceiro",
};

export const financialStatusColors: Record<FinancialStatus, string> = {
  pending: "bg-admin-muted/10 text-admin-muted border border-admin-muted/20",
  awaiting_approval: "bg-admin-orange/10 text-admin-orange border border-admin-orange/20",
  awaiting_payment: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  invoiced: "bg-admin-blue/10 text-admin-blue border border-admin-blue/20",
  in_progress: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  completed: "bg-admin-green/10 text-admin-green border border-admin-green/20",
  paid_to_partner: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
};
