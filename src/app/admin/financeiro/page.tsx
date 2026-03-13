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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import type { FinancialStatus } from "@/lib/formatters";
import { financialStatusLabels } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Agency } from "@/lib/types";
import { PeriodFilter, getDateRange, type PeriodKey } from "@/components/shared/PeriodFilter";
import { RideDetailsModal } from "@/components/shared/RideDetailsModal";

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

type SortField = "id" | "client" | "date" | "created_at" | "price" | "financial_status";
type SortOrder = "asc" | "desc";

export default function FinanceiroPage() {
  const supabase = createClient();
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>("30dias");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedRideId, setSelectedRideId] = useState<string | number | null>(null);
  
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: "created_at",
    order: "desc",
  });

  const fetchRides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name), agency:agencies(name, commission_pct)")
        .order("scheduled_at", { ascending: false });
      
      if (error) {
        console.error("Financeiro fetch error:", error);
        toast.error("Erro ao carregar dados: " + error.message);
        return;
      }
      setAllRides(data ?? []);
    } catch (err) {
      console.error("Financeiro unexpected error:", err);
      toast.error("Erro inesperado ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
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
    fetchRides(); // Atualiza para remover da lista de pendentes
  }

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const sortedPending = [...pendingRides].sort((a, b) => {
    const order = sortConfig.order === "asc" ? 1 : -1;
    
    switch (sortConfig.field) {
      case "id":
        return order * String(a.id).localeCompare(String(b.id));
      case "client":
        return order * (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
      case "date":
        return order * (new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      case "created_at":
        return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "price":
        return order * (Number(a.price) - Number(b.price));
      case "financial_status":
        return order * (financialStatusLabels[a.financial_status ?? "pending"] || "").localeCompare(financialStatusLabels[b.financial_status ?? "pending"] || "");
      default:
        return 0;
    }
  });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortConfig.order === "asc" ? <ArrowUp className="h-3 w-3 ml-1 text-admin-silver" /> : <ArrowDown className="h-3 w-3 ml-1 text-admin-silver" />;
  };

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

      <div className="md:hidden space-y-4 mb-8">
        <h3 className="text-lg font-bold text-admin-text px-1">Pendentes ({pendingRides.length})</h3>
        {pendingRides.length === 0 ? (
          <div className="stat-card py-10 text-center">
            <p className="text-admin-muted text-sm">Nenhuma pendência no período.</p>
          </div>
        ) : (
          sortedPending.map((ride) => (
            <div key={ride.id} className="stat-card !p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/5">
                <button onClick={() => setSelectedRideId(ride.id)} className="text-left">
                  <p className="font-bold text-admin-text text-base leading-tight mb-1 hover:text-admin-silver transition">{ride.client?.name ?? "—"}</p>
                  <p className="text-[10px] text-admin-muted uppercase tracking-wider">{formatDate(ride.scheduled_at)}</p>
                </button>
                <div className="text-right">
                  <p className="text-lg font-black text-admin-silver">{formatCurrency(Number(ride.price))}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-[10px] text-admin-muted uppercase tracking-widest">
                <div>
                  <p className="mb-1 text-white/40">ID</p>
                  <button onClick={() => setSelectedRideId(ride.id)} className="text-admin-silver font-bold hover:underline">#{ride.id}</button>
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

      <div className="hidden md:block admin-table-container">
        <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
          <h3 className="text-base font-bold text-admin-text">Pendentes ({pendingRides.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-6 cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("id")}>
                  <div className="flex items-center">ID <SortIcon field="id" /></div>
                </th>
                <th className="px-6 cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("client")}>
                  <div className="flex items-center">Cliente <SortIcon field="client" /></div>
                </th>
                <th className="px-6 cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("date")}>
                  <div className="flex items-center">Data Corrida <SortIcon field="date" /></div>
                </th>
                <th className="px-6 cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("created_at")}>
                  <div className="flex items-center">Data registrada <SortIcon field="created_at" /></div>
                </th>
                <th className="px-6 text-right cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("price")}>
                  <div className="flex items-center justify-end">Valor <SortIcon field="price" /></div>
                </th>
                <th className="px-6 cursor-pointer hover:text-admin-text transition" onClick={() => handleSort("financial_status")}>
                  <div className="flex items-center">Status Financeiro <SortIcon field="financial_status" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-admin-muted py-12">Nenhuma pendência no período.</td>
                </tr>
              ) : (
                sortedPending.map((ride) => (
                  <tr key={ride.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <button onClick={() => setSelectedRideId(ride.id)} className="text-admin-silver font-bold hover:underline">#{ride.id}</button>
                    </td>
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

      <RideDetailsModal
        rideId={selectedRideId}
        open={!!selectedRideId}
        onClose={() => setSelectedRideId(null)}
        onUpdate={() => fetchRides()}
        view="admin"
      />
    </div>
  );
}
