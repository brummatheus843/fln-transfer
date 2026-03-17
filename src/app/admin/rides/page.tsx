"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  formatDate,
  formatCurrency,
  formatDateTime,
  statusLabels,
  financialStatusLabels,
  type RideStatus,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";
import { ChevronRight, MapPin, Plus, ArrowUpDown, ArrowUp, ArrowDown, User, CheckCircle2, Trash2, X } from "lucide-react";
import { PeriodFilter, getDateRange, type PeriodKey } from "@/components/shared/PeriodFilter";
import { NewRideModal } from "@/components/shared/NewRideModal";
import { RideDetailsModal } from "@/components/shared/RideDetailsModal";

const statusBadgeClasses: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border-admin-blue/20",
  displacing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border-admin-green/20",
};

type SortField = "id" | "client" | "driver" | "origin" | "destination" | "date" | "created_at" | "price" | "status" | "financial_status";
type SortOrder = "asc" | "desc";

const statusTabs = [
  { key: "todas", label: "Todas", status: null },
  { key: "agendadas", label: "Agendadas", status: "scheduled" as RideStatus },
  { key: "deslocamento", label: "Deslocamento", status: "displacing" as RideStatus },
  { key: "em_andamento", label: "Em andamento", status: "in_progress" as RideStatus },
  { key: "concluidas", label: "Concluídas", status: "completed" as RideStatus },
];

function RideCard({ 
  ride, 
  onSelect,
  isSelected,
  onToggleSelect
}: { 
  ride: Ride; 
  onSelect: (id: string | number) => void;
  isSelected: boolean;
  onToggleSelect: (id: string | number) => void;
}) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-4 z-10">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelect(ride.id);
          }}
          className="h-4 w-4 rounded border-white/10 bg-white/5 text-admin-silver focus:ring-admin-silver focus:ring-offset-admin-black"
        />
      </div>
      <button onClick={() => onSelect(ride.id)} className="block w-full text-left">
        <div className={`stat-card !p-4 pl-12 ${isSelected ? "ring-2 ring-admin-silver/50" : ""}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <p className="text-[10px] text-admin-silver font-bold uppercase tracking-widest mb-0.5">#{ride.id}</p>
              <span className="font-semibold text-admin-text text-sm truncate">{ride.client?.name ?? "—"}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium whitespace-nowrap ${statusBadgeClasses[ride.status]}`}>
              {statusLabels[ride.status]}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-admin-text-dim mb-1">
            <User className="h-3 w-3 shrink-0 text-admin-muted" />
            <span className={ride.driver?.full_name ? "" : "text-admin-red/70 font-medium"}>
              {ride.driver?.full_name ?? "Sem motorista"}
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
              <ChevronRight className="h-4 w-4 text-admin-muted" />
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

function RidesTable({ 
  items, 
  onSelect,
  sortConfig, 
  onSort,
  selectedIds,
  onToggleSelect,
  onToggleAll
}: { 
  items: Ride[]; 
  onSelect: (id: string | number) => void;
  sortConfig: { field: SortField; order: SortOrder };
  onSort: (field: SortField) => void;
  selectedIds: Set<string | number>;
  onToggleSelect: (id: string | number) => void;
  onToggleAll: () => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortConfig.order === "asc" ? <ArrowUp className="h-3 w-3 ml-1 text-admin-silver" /> : <ArrowDown className="h-3 w-3 ml-1 text-admin-silver" />;
  };

  const allSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));

  return (
    <>
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-admin-muted py-8">Nenhuma corrida encontrada.</p>
        ) : (
          items.map((ride) => (
            <RideCard 
              key={ride.id} 
              ride={ride} 
              onSelect={onSelect} 
              isSelected={selectedIds.has(ride.id)}
              onToggleSelect={onToggleSelect}
            />
          ))
        )}
      </div>

      <div className="hidden md:block admin-table-container">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-admin-silver focus:ring-admin-silver focus:ring-offset-admin-black"
                  />
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("id")}>
                  <div className="flex items-center">ID <SortIcon field="id" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("client")}>
                  <div className="flex items-center">Cliente <SortIcon field="client" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("driver")}>
                  <div className="flex items-center">Motorista <SortIcon field="driver" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("origin")}>
                  <div className="flex items-center">Origem <SortIcon field="origin" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("destination")}>
                  <div className="flex items-center">Destino <SortIcon field="destination" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("date")}>
                  <div className="flex items-center">Data Corrida <SortIcon field="date" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("created_at")}>
                  <div className="flex items-center">Data Registrada <SortIcon field="created_at" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4 text-right" onClick={() => onSort("price")}>
                  <div className="flex items-center justify-end">Valor <SortIcon field="price" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("financial_status")}>
                  <div className="flex items-center">Financ. <SortIcon field="financial_status" /></div>
                </th>
                <th className="cursor-pointer hover:text-admin-text transition px-4" onClick={() => onSort("status")}>
                  <div className="flex items-center">Status da Corrida <SortIcon field="status" /></div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((ride) => (
                <tr key={ride.id} className={selectedIds.has(ride.id) ? "bg-white/[0.02]" : ""}>
                  <td className="px-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(ride.id)}
                      onChange={() => onToggleSelect(ride.id)}
                      className="h-4 w-4 rounded border-white/10 bg-white/5 text-admin-silver focus:ring-admin-silver focus:ring-offset-admin-black"
                    />
                  </td>
                  <td className="px-4">
                    <button onClick={() => onSelect(ride.id)} className="text-admin-silver font-bold hover:underline">#{ride.id}</button>
                  </td>
                  <td className="px-4" onClick={() => onSelect(ride.id)}>
                    <span className="text-admin-text font-medium hover:text-admin-silver transition cursor-pointer">
                      {ride.client?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-4">
                    <span className={ride.driver?.full_name ? "text-admin-text-dim" : "text-admin-red/70 font-bold"}>
                      {ride.driver?.full_name ?? "Sem motorista"}
                    </span>
                  </td>
                  <td className="text-admin-text-dim px-4">{ride.origin}</td>
                  <td className="text-admin-text-dim px-4">{ride.destination}</td>
                  <td className="text-admin-text-dim px-4">{formatDate(ride.scheduled_at)}</td>
                  <td className="text-admin-text-dim px-4">{formatDateTime(ride.created_at)}</td>
                  <td className="text-admin-silver font-bold text-right px-4">{formatCurrency(ride.price, ride.currency)}</td>
                  <td className="px-4">
                    <span className="text-[10px] text-admin-text-dim uppercase">{financialStatusLabels[ride.financial_status ?? "pending"]}</span>
                  </td>
                  <td className="px-4">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
                      {statusLabels[ride.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center text-admin-muted py-8">
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
  const [selectedRideId, setSelectedRideId] = useState<string | number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  
  const [sortConfig, setSortConfig] = useState<{ field: SortField; order: SortOrder }>({
    field: "date",
    order: "desc",
  });

  const fetchRides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name), driver:drivers(full_name), agency:agencies(name)")
        .order("scheduled_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error:", error);
        toast.error("Erro ao carregar corridas: " + error.message);
        return;
      }
      setAllRides(data ?? []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Erro inesperado ao carregar corridas");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  const handleSort = (field: SortField) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const handleToggleSelect = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(i => i.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    const confirm = window.confirm(`Deseja realmente excluir ${selectedIds.size} corrida(s)? Esta ação não pode ser desfeita.`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("rides")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`${selectedIds.size} corrida(s) excluída(s) com sucesso.`);
      fetchRides();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao excluir corridas: " + message);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: RideStatus) => {
    if (selectedIds.size === 0) return;

    const confirm = window.confirm(`Deseja alterar o status de ${selectedIds.size} corrida(s) para "${statusLabels[newStatus]}"?`);
    if (!confirm) return;

    try {
      const { error } = await supabase
        .from("rides")
        .update({ status: newStatus })
        .in("id", Array.from(selectedIds));

      if (error) throw error;
      
      toast.success(`Status de ${selectedIds.size} corrida(s) atualizado.`);
      fetchRides();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao atualizar status: " + message);
    }
  };

  const range = getDateRange(period, customFrom, customTo);
  const periodFiltered = allRides.filter((r) => {
    const d = r.scheduled_at.slice(0, 10);
    return d >= range.from && d <= range.to;
  });

  const activeStatus = statusTabs.find((t) => t.key === activeTab)?.status ?? null;
  const filtered = activeStatus ? periodFiltered.filter((r) => r.status === activeStatus) : periodFiltered;

  const sorted = [...filtered].sort((a, b) => {
    const order = sortConfig.order === "asc" ? 1 : -1;
    
    switch (sortConfig.field) {
      case "id":
        return order * String(a.id).localeCompare(String(b.id));
      case "client":
        return order * (a.client?.name ?? "").localeCompare(b.client?.name ?? "");
      case "driver":
        if (!a.driver?.full_name && b.driver?.full_name) return -1 * order;
        if (a.driver?.full_name && !b.driver?.full_name) return 1 * order;
        return order * (a.driver?.full_name ?? "").localeCompare(b.driver?.full_name ?? "");
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
      case "status":
        return order * (statusLabels[a.status] || "").localeCompare(statusLabels[b.status] || "");
      case "financial_status":
        return order * (financialStatusLabels[a.financial_status ?? "pending"] || "").localeCompare(financialStatusLabels[b.financial_status ?? "pending"] || "");
      default:
        return 0;
    }
  });

  return (
    <div className="animate-fade-in relative pb-20">
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
          onSelect={setSelectedRideId}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          onToggleAll={handleToggleAll}
        />
      )}

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-admin-card border border-admin-border shadow-2xl rounded-2xl p-4 flex items-center gap-6 backdrop-blur-md">
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <button onClick={() => setSelectedIds(new Set())} className="text-admin-muted hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
              <span className="text-sm font-bold text-admin-text whitespace-nowrap">
                {selectedIds.size} selecionada(s)
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleBulkStatusUpdate("completed")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-green/10 text-admin-green hover:bg-admin-green/20 transition text-xs font-bold uppercase tracking-widest"
              >
                <CheckCircle2 className="h-4 w-4" /> Concluída
              </button>
              
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-red/10 text-admin-red hover:bg-admin-red/20 transition text-xs font-bold uppercase tracking-widest"
              >
                <Trash2 className="h-4 w-4" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <NewRideModal
        open={showNewRide}
        onClose={() => setShowNewRide(false)}
        onCreated={() => fetchRides()}
      />

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
