"use client";

import { useState, useEffect } from "react";
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

const statusBadgeClasses: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border-admin-blue/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border-admin-green/20",
  cancelled: "bg-admin-red/10 text-admin-red border-admin-red/20",
};

const tabs = [
  { key: "todas", label: "Todas", status: null },
  { key: "agendadas", label: "Agendadas", status: "scheduled" as RideStatus },
  { key: "em_andamento", label: "Em andamento", status: "in_progress" as RideStatus },
  { key: "finalizadas", label: "Finalizadas", status: "completed" as RideStatus },
  { key: "canceladas", label: "Canceladas", status: "cancelled" as RideStatus },
];

function RidesTable({ items }: { items: Ride[] }) {
  return (
    <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-admin-border">
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Cliente</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Origem</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Destino</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Data</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Motorista</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Valor</th>
            <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((ride) => (
            <tr key={ride.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition cursor-pointer">
              <td className="px-4 py-3">
                <Link href={`/admin/rides/${ride.id}`} className="text-admin-text hover:text-admin-gold transition">
                  {ride.client?.name ?? "—"}
                </Link>
              </td>
              <td className="px-4 py-3 text-admin-text-dim">{ride.origin}</td>
              <td className="px-4 py-3 text-admin-text-dim">{ride.destination}</td>
              <td className="px-4 py-3 text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
              <td className="px-4 py-3 text-admin-text-dim">{ride.driver?.full_name ?? "—"}</td>
              <td className="px-4 py-3 text-admin-gold font-bold">{formatCurrency(ride.price, ride.currency)}</td>
              <td className="px-4 py-3">
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
  );
}

export default function RidesPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("todas");

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name), driver:drivers(full_name), agency:agencies(name)")
        .order("scheduled_at", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar corridas");
        return;
      }
      setRides(data ?? []);
      setLoading(false);
    }
    fetch();
  }, []);

  const activeStatus = tabs.find((t) => t.key === activeTab)?.status ?? null;
  const filtered = activeStatus ? rides.filter((r) => r.status === activeStatus) : rides;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-admin-text">Corridas</h2>
        <Link href="/admin/rides/new" className="btn-admin">
          Nova Corrida
        </Link>
      </div>

      <div className="flex items-center gap-1 mb-6 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium transition ${
              activeTab === tab.key
                ? "bg-admin-gold/10 text-admin-gold border-admin-gold/20"
                : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <RidesTable items={filtered} />
      )}
    </div>
  );
}
