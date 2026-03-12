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
import {
  financialStatusLabels,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Agency } from "@/lib/types";

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

type PeriodKey = "hoje" | "semana" | "mes" | "todos";

const periodTabs: { key: PeriodKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mês" },
  { key: "todos", label: "Todos" },
];

function getDateRange(period: PeriodKey): { from: string; to: string } | null {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (period) {
    case "hoje":
      return { from: fmt(now), to: fmt(now) };
    case "semana": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { from: fmt(start), to: fmt(end) };
    }
    case "mes":
      return {
        from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
        to: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "todos":
      return null;
  }
}

export default function FinanceiroPage() {
  const supabase = createClient();
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("mes");

  async function fetchRides() {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name), agency:agencies(name, commission_pct)")
      .order("scheduled_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar dados financeiros");
      return;
    }
    setAllRides(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRides();
  }, []);

  // Filter by period
  const range = getDateRange(period);
  const rides = range
    ? allRides.filter((r) => {
        const d = r.scheduled_at.slice(0, 10);
        return d >= range.from && d <= range.to;
      })
    : allRides;

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

      {/* Period filter tabs */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {periodTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setPeriod(tab.key)}
            className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-medium transition whitespace-nowrap shrink-0 ${
              period === tab.key
                ? "bg-admin-gold/10 text-admin-gold border-admin-gold/20"
                : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="stat-card animate-count-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest leading-tight">Receita Total</p>
            <DollarSign className="w-4 h-4 text-admin-gold opacity-50 shrink-0" />
          </div>
          <p className="text-lg md:text-2xl font-black text-admin-gold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="stat-card animate-count-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest leading-tight">Comissões</p>
            <Percent className="w-4 h-4 text-admin-red opacity-50 shrink-0" />
          </div>
          <p className="text-lg md:text-2xl font-black text-admin-red">{formatCurrency(totalCommissions)}</p>
        </div>
        <div className="stat-card animate-count-up">
          <div className="flex items-center justify-between mb-2">
            <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest leading-tight">Receita Líq.</p>
            <DollarSign className="w-4 h-4 text-admin-green opacity-50 shrink-0" />
          </div>
          <p className="text-lg md:text-2xl font-black text-admin-green">{formatCurrency(netRevenue)}</p>
        </div>
      </div>

      {/* Status cards — horizontal scroll on mobile */}
      <div className="flex md:grid md:grid-cols-4 gap-3 md:gap-4 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {statCards.map((s) => (
          <div key={s.status} className="stat-card animate-count-up min-w-[140px] shrink-0 md:min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest leading-tight">
                {financialStatusLabels[s.status]}
              </p>
              <s.icon className="w-4 h-4 text-admin-gold opacity-50 shrink-0 ml-1" />
            </div>
            <p className="text-xl md:text-2xl font-black text-admin-gold">{s.count}</p>
            <p className="text-[11px] text-admin-muted mt-1">{formatCurrency(s.total)}</p>
          </div>
        ))}
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
                <p className="text-sm font-bold text-admin-gold whitespace-nowrap">{formatCurrency(Number(ride.price))}</p>
              </div>
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest block mb-1">Status Financeiro</label>
                <select
                  value={ride.financial_status ?? "pending"}
                  onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                  className="bg-admin-dark text-xs rounded-lg px-3 py-2 border border-admin-border text-admin-text focus:outline-none focus:border-admin-gold/50 w-full"
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
      <div className="hidden md:block bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border">
          <h3 className="text-sm font-semibold text-admin-text">Corridas ({rides.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">ID</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Cliente</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Data</th>
                <th className="text-right px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Valor</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Status Financeiro</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-admin-muted py-8">Nenhuma corrida no período.</td>
                </tr>
              ) : (
                recentRides.map((ride) => (
                  <tr key={ride.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                    <td className="px-4 py-3 text-admin-text font-medium">{ride.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                    <td className="px-4 py-3 text-right text-admin-gold font-bold">{formatCurrency(Number(ride.price))}</td>
                    <td className="px-4 py-3">
                      <select
                        value={ride.financial_status ?? "pending"}
                        onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                        className="bg-transparent text-xs rounded-lg px-2 py-1 border border-admin-border text-admin-text focus:outline-none focus:border-admin-gold/50"
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
