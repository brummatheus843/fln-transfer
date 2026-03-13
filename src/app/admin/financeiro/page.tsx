"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle2,
  HandCoins,
  DollarSign,
  Percent,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FinancialStatus } from "@/lib/formatters";
import { financialStatusLabels } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Agency } from "@/lib/types";
import { PeriodFilter, getDateRange, type PeriodKey } from "@/components/shared/PeriodFilter";

const statusIcons: Record<FinancialStatus, React.ElementType> = {
  pending: Clock,
  awaiting_approval: ShieldCheck,
  awaiting_payment: CreditCard,
  invoiced: FileText,
  in_progress: Loader2,
  completed: CheckCircle2,
  paid_to_partner: HandCoins,
};

const allStatuses: FinancialStatus[] = [
  "pending",
  "awaiting_approval",
  "awaiting_payment",
  "invoiced",
  "in_progress",
  "completed",
  "paid_to_partner",
];

export default function FinanceiroPage() {
  const supabase = createClient();
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30dias");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchRides = useCallback(async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name), agency:agencies(name, commission_pct)")
      .order("scheduled_at", { ascending: false }) as { data: Ride[] | null; error: import('@supabase/supabase-js').PostgrestError | null };
    if (error) {
      toast.error("Erro ao carregar dados financeiros");
      return;
    }
    setAllRides(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const range = getDateRange(period, customFrom, customTo);
  const rides = allRides.filter((r) => {
    const d = r.scheduled_at.slice(0, 10);
    return d >= range.from && d <= range.to;
  });

  const statCards = allStatuses.map((status) => {
    const matching = rides.filter((r) => r.financial_status === status);
    return {
      status,
      count: matching.length,
      total: matching.reduce((sum, r) => sum + Number(r.price), 0),
      icon: statusIcons[status],
    };
  });

  const totalRevenue = rides.reduce((sum, r) => sum + Number(r.price), 0);
  const totalCommissions = rides.reduce((sum, r) => {
    const agency = r.agency as Agency | null;
    const pct = agency?.commission_pct ?? 0;
    return sum + (Number(r.price) * Number(pct)) / 100;
  }, 0);
  const netRevenue = totalRevenue - totalCommissions;

  const recentRides = rides.slice(0, 20);

  async function handleStatusChange(rideId: string, newStatus: FinancialStatus) {
    const { error } = await supabase
      .from("rides")
      .update({ financial_status: newStatus })
      .eq("id", rideId);
    if (error) {
      toast.error("Erro ao atualizar status financeiro");
      return;
    }
    toast.success("Status financeiro atualizado!");
    setAllRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, financial_status: newStatus } : r))
    );
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg md:text-2xl font-bold text-admin-text mb-4 md:mb-6">Financeiro</h2>

      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4">
        <div className="stat-card !p-3 md:!p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <p className="text-admin-muted text-[9px] md:text-xs uppercase tracking-widest leading-tight truncate">Receita</p>
            <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-admin-silver opacity-50 shrink-0" />
          </div>
          <p className="text-sm md:text-2xl font-black text-admin-silver truncate">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card !p-3 md:!p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <p className="text-admin-muted text-[9px] md:text-xs uppercase tracking-widest leading-tight truncate">Comissões</p>
            <Percent className="w-3.5 h-3.5 md:w-4 md:h-4 text-admin-red opacity-50 shrink-0" />
          </div>
          <p className="text-sm md:text-2xl font-black text-admin-red truncate">{formatCurrency(totalCommissions)}</p>
        </div>
        <div className="stat-card !p-3 md:!p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <p className="text-admin-muted text-[9px] md:text-xs uppercase tracking-widest leading-tight truncate">Líquido</p>
            <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4 text-admin-green opacity-50 shrink-0" />
          </div>
          <p className="text-sm md:text-2xl font-black text-admin-green truncate">{formatCurrency(netRevenue)}</p>
        </div>
      </div>

      {/* Status cards — scroll horizontal no mobile */}
      <div className="overflow-x-auto pb-2 mb-6 scrollbar-hide">
        <div className="flex md:grid md:grid-cols-4 gap-2 md:gap-4 min-w-0">
          {statCards.map((s) => (
            <div key={s.status} className="stat-card !p-3 md:!p-5 min-w-[120px] md:min-w-0 shrink-0 overflow-hidden">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <p className="text-admin-muted text-[9px] md:text-xs uppercase tracking-widest leading-tight truncate mr-1">
                  {financialStatusLabels[s.status]}
                </p>
                <s.icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-admin-silver opacity-50 shrink-0" />
              </div>
              <p className="text-lg md:text-2xl font-black text-admin-silver">{s.count}</p>
              <p className="text-[10px] md:text-[11px] text-admin-muted mt-1 truncate">{formatCurrency(s.total)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        <h3 className="text-sm font-semibold text-admin-text mb-2">Corridas ({rides.length})</h3>
        {recentRides.length === 0 ? (
          <p className="text-admin-muted text-center py-6 text-sm">Nenhuma corrida no período.</p>
        ) : (
          recentRides.map((ride) => (
            <div key={ride.id} className="bg-admin-card border border-admin-border rounded-xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-admin-text">{ride.client?.name ?? "—"}</p>
                  <p className="text-xs text-admin-muted">{formatDate(ride.scheduled_at)}</p>
                </div>
                <p className="text-sm font-bold text-admin-silver whitespace-nowrap">{formatCurrency(Number(ride.price))}</p>
              </div>
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest block mb-1">Status Financeiro</label>
                <select
                  value={ride.financial_status ?? "pending"}
                  onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                  className="bg-admin-dark text-xs rounded-lg px-3 py-2 border border-admin-border text-admin-text focus:outline-none focus:border-admin-silver/50 w-full"
                >
                  {allStatuses.map((s) => (
                    <option key={s} value={s}>{financialStatusLabels[s]}</option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block admin-table-container">
        <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-admin-text">Corridas ({rides.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th className="text-right">Valor</th>
                <th>Status Financeiro</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-admin-muted py-8">Nenhuma corrida no período.</td>
                </tr>
              ) : (
                recentRides.map((ride) => (
                  <tr key={ride.id}>
                    <td className="text-admin-text font-medium">{ride.id}</td>
                    <td className="text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                    <td className="text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                    <td className="text-right text-admin-silver font-bold">{formatCurrency(Number(ride.price))}</td>
                    <td>
                      <select
                        value={ride.financial_status ?? "pending"}
                        onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                        className="bg-transparent text-xs rounded-lg px-2 py-1 border border-white/10 text-admin-text focus:outline-none focus:border-white/30"
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s}>{financialStatusLabels[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
