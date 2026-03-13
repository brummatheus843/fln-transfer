"use client";

import { useState, useEffect, useCallback } from "react";
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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
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

  const pendingRides = rides.filter(r => (r.financial_status ?? "pending") === "pending");

  async function handleStatusChange(rideId: string | number, newStatus: FinancialStatus) {
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
    <div className="animate-fade-in max-w-full overflow-hidden">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-4 md:mb-6 px-1">Financeiro</h2>

      <div className="mb-6">
        <PeriodFilter
          period={period}
          onPeriodChange={setPeriod}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </div>

      {/* Summary cards - Stack on mobile, 3 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="stat-card !p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-xs uppercase tracking-widest font-medium">Receita</p>
            <DollarSign className="w-4 h-4 text-admin-silver opacity-50" />
          </div>
          <p className="text-2xl font-black text-admin-silver">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card !p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-xs uppercase tracking-widest font-medium">Comissões</p>
            <Percent className="w-4 h-4 text-admin-red opacity-50" />
          </div>
          <p className="text-2xl font-black text-admin-red">{formatCurrency(totalCommissions)}</p>
        </div>
        <div className="stat-card !p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-xs uppercase tracking-widest font-medium">Líquido</p>
            <DollarSign className="w-4 h-4 text-admin-green opacity-50" />
          </div>
          <p className="text-2xl font-black text-admin-green">{formatCurrency(netRevenue)}</p>
        </div>
      </div>

      {/* Status cards - Responsive grid instead of scroll */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
        {statCards.map((s) => (
          <div key={s.status} className="stat-card !p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-admin-muted text-[10px] uppercase tracking-widest font-medium truncate mr-1">
                {financialStatusLabels[s.status]}
              </p>
              <s.icon className="w-3.5 h-3.5 text-admin-silver opacity-40 shrink-0" />
            </div>
            <p className="text-xl font-black text-admin-silver">{s.count}</p>
            <p className="text-[10px] text-admin-muted mt-1 truncate">{formatCurrency(s.total)}</p>
          </div>
        ))}
      </div>

      {/* Mobile: card list for Pendentes */}
      <div className="md:hidden space-y-4 mb-8">
        <h3 className="text-lg font-bold text-admin-text px-1">Pendentes ({pendingRides.length})</h3>
        {pendingRides.length === 0 ? (
          <div className="stat-card py-10 text-center">
            <p className="text-admin-muted text-sm">Nenhuma pendência no período.</p>
          </div>
        ) : (
          pendingRides.map((ride) => (
            <div key={ride.id} className="stat-card !p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                <div>
                  <p className="font-bold text-admin-text text-base leading-tight mb-1">{ride.client?.name ?? "—"}</p>
                  <p className="text-[10px] text-admin-muted uppercase tracking-wider">{formatDate(ride.scheduled_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-admin-silver">{formatCurrency(Number(ride.price))}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[10px] text-admin-muted uppercase tracking-widest">
                <div>
                  <p className="mb-1 text-white/40">ID</p>
                  <p className="text-admin-text-dim font-medium">{ride.id}</p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-white/40">Data Registro</p>
                  <p className="text-admin-text-dim font-medium">{formatDateTime(ride.created_at)}</p>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-[10px] text-admin-muted uppercase tracking-widest block mb-2 font-bold">Alterar Status Financeiro</label>
                <select
                  value={ride.financial_status ?? "pending"}
                  onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                  className="bg-black/40 text-sm rounded-xl px-4 py-3 border border-white/10 text-admin-text focus:outline-none focus:border-admin-silver/50 w-full transition-all"
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

      {/* Desktop: table for Pendentes */}
      <div className="hidden md:block admin-table-container">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-base font-bold text-admin-text">Pendentes ({pendingRides.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-6">ID</th>
                <th className="px-6">Cliente</th>
                <th className="px-6">Data Corrida</th>
                <th className="px-6">Data registrada</th>
                <th className="px-6 text-right">Valor</th>
                <th className="px-6">Status Financeiro</th>
              </tr>
            </thead>
            <tbody>
              {pendingRides.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-admin-muted py-12">Nenhuma pendência no período.</td>
                </tr>
              ) : (
                pendingRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5 text-admin-text font-medium">{ride.id}</td>
                    <td className="px-6 py-5 text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                    <td className="px-6 py-5 text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                    <td className="px-6 py-5 text-admin-text-dim">{formatDateTime(ride.created_at)}</td>
                    <td className="px-6 py-5 text-right text-admin-silver font-bold">{formatCurrency(Number(ride.price))}</td>
                    <td className="px-6 py-5">
                      <select
                        value={ride.financial_status ?? "pending"}
                        onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                        className="bg-transparent text-xs rounded-lg px-3 py-1.5 border border-white/10 text-admin-text focus:outline-none focus:border-white/30 cursor-pointer"
                      >
                        {allStatuses.map((s) => (
                          <option key={s} value={s} className="bg-admin-dark">{financialStatusLabels[s]}</option>
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
