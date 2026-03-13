"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  formatDate,
  formatCurrency,
  formatDateTime,
  statusLabels,
  financialStatusLabels,
  type RideStatus,
  type FinancialStatus,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";
import { ChevronRight, MapPin, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { PeriodFilter, getDateRange, type PeriodKey } from "@/components/shared/PeriodFilter";
import { NewRideModal } from "@/components/shared/NewRideModal";

const statusBadgeClasses: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border-admin-blue/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border-admin-green/20",
  cancelled: "bg-admin-red/10 text-admin-red border-admin-red/20",
};

const allFinancialStatuses: FinancialStatus[] = [
  "pending",
  "awaiting_approval",
  "awaiting_payment",
  "invoiced",
  "in_progress",
  "completed",
  "paid_to_partner",
];

const statusTabs = [
  { key: "todas", label: "Todas", status: null },
  { key: "agendadas", label: "Agendadas", status: "scheduled" as RideStatus },
  { key: "em_andamento", label: "Em andamento", status: "in_progress" as RideStatus },
  { key: "finalizadas", label: "Finalizadas", status: "completed" as RideStatus },
  { key: "canceladas", label: "Canceladas", status: "cancelled" as RideStatus },
];

type SortField = "client" | "origin" | "destination" | "date" | "created_at" | "price";
type SortOrder = "asc" | "desc";

function RideCard({ ride, onStatusChange }: { ride: Ride; onStatusChange: (id: string | number, status: FinancialStatus) => void }) {
  return (
    <div className="stat-card !p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link href={`/admin/rides/${ride.id}`} className="font-semibold text-admin-text text-sm truncate hover:text-admin-silver transition">
          {ride.client?.name ?? "—"}
        </Link>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium whitespace-nowrap ${statusBadgeClasses[ride.status]}`}>
          {statusLabels[ride.status]}
        </span>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-admin-text-dim mb-1">
        <MapPin className="h-3 w-3 shrink-0 text-admin-muted" />
        <span className="truncate">{ride.origin} → {ride.destination}</span>
      </div>
      <div className="text-[10px] text-admin-muted mb-2">
        Registrada em: {formatDateTime(ride.created_at)}
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
        <span className="text-xs text-admin-muted">{formatDate(ride.scheduled_at)}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-admin-silver">{formatCurrency(ride.price, ride.currency)}</span>
          <Link href={`/admin/rides/${ride.id}`}>
            <ChevronRight className="h-4 w-4 text-admin-muted" />
          </Link>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
        <label className="text-[10px] text-admin-muted uppercase tracking-widest block">Status Financeiro</label>
        <select
          value={ride.financial_status ?? "pending"}
          onChange={(e) => onStatusChange(ride.id, e.target.value as FinancialStatus)}
          className="bg-admin-dark text-xs rounded-lg px-3 py-2 border border-admin-border text-admin-text focus:outline-none focus:border-admin-silver/50 w-full"
        >
          {allFinancialStatuses.map((s) => (
            <option key={s} value={s}>{financialStatusLabels[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function RidesTable({ 
  items, 
  onStatusChange, 
  sortConfig, 
  onSort 
}: { 
  items: Ride[]; 
  onStatusChange: (id: string | number, status: FinancialStatus) => void;
  sortConfig: { field: SortField; order: SortOrder };
  onSort: (field: SortField) => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortConfig.order === "asc" ? <ArrowUp className="h-3 w-3 ml-1 text-admin-silver" /> : <ArrowDown className="h-3 w-3 ml-1 text-admin-silver" />;
  };

  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-admin-muted py-8">Nenhuma corrida encontrada.</p>
        ) : (
          items.map((ride) => <RideCard key={ride.id} ride={ride} onStatusChange={onStatusChange} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block admin-table-container">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="cursor-pointer hover:text-admin-text transition" onClick={() => onSort("client")}>
                  <div className="flex items-center">Cliente <SortIcon field="client" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition" onClick={() => onSort("origin")}>
                  <div className="flex items-center">Origem <SortIcon field="origin" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition" onClick={() => onSort("destination")}>
                  <div className="flex items-center">Destino <SortIcon field="destination" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition" onClick={() => onSort("date")}>
                  <div className="flex items-center">Data Corrida <SortIcon field="date" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition" onClick={() => onSort("created_at")}>
                  <div className="flex items-center">Data Registrada <SortIcon field="created_at" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition text-right" onClick={() => onSort("price")}>
                  <div className="flex items-center justify-end">Valor <SortIcon field="price" /></div>
                </th>
                <th>Status Financeiro</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ride) => (
                <tr key={ride.id}>
                  <td>
                    <Link href={`/admin/rides/${ride.id}`} className="text-admin-text font-medium hover:text-admin-silver transition">
                      {ride.client?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="text-admin-text-dim">{ride.origin}</td>
                  <td className="text-admin-text-dim">{ride.destination}</td>
                  <td className="text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                  <td className="text-admin-text-dim">{formatDateTime(ride.created_at)}</td>
                  <td className="text-admin-silver font-bold text-right">{formatCurrency(ride.price, ride.currency)}</td>
                  <td>
                    <select
                      value={ride.financial_status ?? "pending"}
                      onChange={(e) => onStatusChange(ride.id, e.target.value as FinancialStatus)}
                      className="bg-transparent text-xs rounded-lg px-2 py-1 border border-white/10 text-admin-text focus:outline-none focus:border-white/30"
                    >
                      {allFinancialStatuses.map((s) => (
                        <option key={s} value={s}>{financialStatusLabels[s]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
                      {statusLabels[ride.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-admin-muted py-8">
                    Nenhuma corrida encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function RidesPage() {
  const supabase = createClient();
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todas");
  const [period, setPeriod] = useState<PeriodKey>("30dias");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [showNewRide, setShowNewRide] = useState(false);
  
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: "date",
    order: "desc",
  });

  const fetchRides = useCallback(async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name), driver:drivers(full_name), agency:agencies(name)")
      .order("scheduled_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar corridas");
      return;
    }
    setAllRides(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleStatusChange = async (rideId: string | number, newStatus: FinancialStatus) => {
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
      prev.map((r) => r.id === rideId ? { ...r, financial_status: newStatus } : r)
    );
  };

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const range = getDateRange(period, customFrom, customTo);
  const periodFiltered = allRides.filter((r) => {
    const d = r.scheduled_at.slice(0, 10);
    return d >= range.from && d <= range.to;
  });

  const activeStatus = statusTabs.find((t) => t.key === activeTab)?.status ?? null;
  const filtered = activeStatus ? periodFiltered.filter((r) => r.status === activeStatus) : periodFiltered;

  // Manual sorting logic
  const sorted = [...filtered].sort((a, b) => {
    const order = sortConfig.order === "asc" ? 1 : -1;
    
    switch (sortConfig.field) {
      case "client":
        return order * (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
      case "origin":
        return order * (a.origin ?? "").localeCompare(b.origin ?? "");
      case "destination":
        return order * (a.destination ?? "").localeCompare(b.destination ?? "");
      case "date":
        return order * (new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
      case "created_at":
        return order * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "price":
        return order * (Number(a.price) - Number(b.price));
      default:
        return 0;
    }
  });

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">Corridas</h2>
        <button onClick={() => setShowNewRide(true)} className="btn-admin flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <Plus className="w-4 h-4" />
          Nova Corrida
        </button>
      </div>

      <PeriodFilter
        period={period}
        onPeriodChange={setPeriod}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      {/* Status filter */}
      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
        {statusTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-[10px] px-2.5 py-1.5 rounded-full border uppercase tracking-widest font-medium transition whitespace-nowrap shrink-0 ${
              activeTab === tab.key
                ? "bg-admin-card text-admin-text border-admin-border"
                : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <span className="text-[10px] text-admin-muted ml-1 shrink-0">{filtered.length} resultado{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <RidesTable 
          items={sorted} 
          onStatusChange={handleStatusChange} 
          sortConfig={sortConfig}
          onSort={handleSort}
        />
      )}

      <NewRideModal
        open={showNewRide}
        onClose={() => setShowNewRide(false)}
        onCreated={() => fetchRides()}
      />
    </div>
  );
}
