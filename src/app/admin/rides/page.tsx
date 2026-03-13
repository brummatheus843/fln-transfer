"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  formatDate,
  formatCurrency,
  statusLabels,
  type RideStatus,
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import { PeriodFilter, getDateRange, type PeriodKey } from "@/components/shared/PeriodFilter";
import { NewRideModal } from "@/components/shared/NewRideModal";

const statusBadgeClasses: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border-admin-blue/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border-admin-green/20",
  cancelled: "bg-admin-red/10 text-admin-red border-admin-red/20",
};

const statusTabs = [
  { key: "todas", label: "Todas", status: null },
  { key: "agendadas", label: "Agendadas", status: "scheduled" as RideStatus },
  { key: "em_andamento", label: "Em andamento", status: "in_progress" as RideStatus },
  { key: "finalizadas", label: "Finalizadas", status: "completed" as RideStatus },
  { key: "canceladas", label: "Canceladas", status: "cancelled" as RideStatus },
];

function RideCard({ ride }: { ride: Ride }) {
  return (
    <Link href={`/admin/rides/${ride.id}`}>
      <div className="stat-card !p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-semibold text-admin-text text-sm truncate">{ride.client?.name ?? "—"}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium whitespace-nowrap ${statusBadgeClasses[ride.status]}`}>
            {statusLabels[ride.status]}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-admin-text-dim mb-1">
          <MapPin className="h-3 w-3 shrink-0 text-admin-muted" />
          <span className="truncate">{ride.origin} → {ride.destination}</span>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
          <span className="text-xs text-admin-muted">{formatDate(ride.scheduled_at)}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-admin-silver">{formatCurrency(ride.price, ride.currency)}</span>
            <ChevronRight className="h-4 w-4 text-admin-muted" />
          </div>
        </div>
        {ride.driver?.full_name && (
          <p className="text-[10px] text-admin-muted mt-2 px-2 py-1 bg-white/5 rounded-lg inline-block">Motorista: {ride.driver.full_name}</p>
        )}
      </div>
    </Link>
  );
}

function RidesTable({ items }: { items: Ride[] }) {
  return (
    <>
      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-admin-muted py-8">Nenhuma corrida encontrada.</p>
        ) : (
          items.map((ride) => <RideCard key={ride.id} ride={ride} />)
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block admin-table-container">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Data</th>
                <th>Motorista</th>
                <th>Valor</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ride) => (
                <tr key={ride.id} onClick={() => window.location.href = `/admin/rides/${ride.id}`} className="cursor-pointer">
                  <td>
                    <span className="text-admin-text font-medium hover:text-admin-silver transition">
                      {ride.client?.name ?? "—"}
                    </span>
                  </td>
                  <td className="text-admin-text-dim">{ride.origin}</td>
                  <td className="text-admin-text-dim">{ride.destination}</td>
                  <td className="text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                  <td className="text-admin-text-dim">{ride.driver?.full_name ?? "—"}</td>
                  <td className="text-admin-silver font-bold">{formatCurrency(ride.price, ride.currency)}</td>
                  <td>
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
                      {statusLabels[ride.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-admin-muted py-8">
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

  const range = getDateRange(period, customFrom, customTo);
  const periodFiltered = allRides.filter((r) => {
    const d = r.scheduled_at.slice(0, 10);
    return d >= range.from && d <= range.to;
  });

  const activeStatus = statusTabs.find((t) => t.key === activeTab)?.status ?? null;
  const filtered = activeStatus ? periodFiltered.filter((r) => r.status === activeStatus) : periodFiltered;

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
        <RidesTable items={filtered} />
      )}

      <NewRideModal
        open={showNewRide}
        onClose={() => setShowNewRide(false)}
        onCreated={() => fetchRides()}
      />
    </div>
  );
}
