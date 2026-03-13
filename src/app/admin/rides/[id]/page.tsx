"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  formatDateTime,
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-admin-text text-sm break-words">{value || "—"}</p>
    </div>
  );
}

export default function RideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name), driver:drivers(full_name), agency:agencies(name)")
      .eq("id", id)
      .single();
    if (error) {
      toast.error("Erro ao carregar corrida");
      return;
    }
    setRide(data);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  async function handleCancel() {
    const { error } = await supabase
      .from("rides")
      .update({ status: "cancelled" })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao cancelar corrida");
      return;
    }
    toast.success("Corrida cancelada!");
    setRide((prev) => prev ? { ...prev, status: "cancelled" } : prev);
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;
  if (!ride) return <p className="text-admin-muted text-center py-8">Corrida não encontrada.</p>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">
          Corrida #{ride.id}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/admin/rides/${ride.id}/edit`)}
            className="btn-admin text-xs md:text-sm flex-1 sm:flex-none"
          >
            Editar
          </button>
          {ride.status !== "cancelled" && ride.status !== "completed" && (
            <button
              onClick={handleCancel}
              className="bg-admin-card border border-admin-red/20 text-admin-red hover:bg-admin-red/10 rounded-lg px-4 py-2 text-xs md:text-sm transition flex-1 sm:flex-none"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="bg-admin-card border border-admin-border rounded-xl p-4 md:p-6 mb-4 md:mb-6">
        <div className="flex items-center gap-3 mb-4 md:mb-6">
          <h3 className="text-admin-text font-semibold text-sm md:text-base">Detalhes</h3>
          <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
            {statusLabels[ride.status]}
          </span>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Cliente" value={ride.client?.name} />
          <DetailRow label="Motorista" value={ride.driver?.full_name} />
          <DetailRow label="Agência" value={ride.agency?.name} />
          <DetailRow label="Origem" value={ride.origin} />
          <DetailRow label="Destino" value={ride.destination} />
          <DetailRow label="Data e Hora" value={formatDateTime(ride.scheduled_at)} />
          <DetailRow label="Passageiros" value={ride.pax_count} />
          <DetailRow label="Valor" value={formatCurrency(ride.price, ride.currency)} />
          <DetailRow label="Moeda" value={ride.currency} />
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-admin-muted text-[10px] md:text-xs uppercase tracking-widest mb-1">Observações</p>
            <p className="text-admin-text text-sm break-words">{ride.notes || "—"}</p>
          </div>
        </div>
      </div>

      <div className="bg-admin-card border border-admin-border rounded-xl p-4 md:p-6">
        <h3 className="text-admin-text font-semibold mb-4 text-sm md:text-base">Mapa</h3>
        <div className="bg-admin-dark rounded-xl h-40 md:h-48 flex items-center justify-center text-admin-muted text-xs md:text-sm text-center px-4">
          Google Maps - {ride.origin} → {ride.destination}
        </div>
      </div>
    </div>
  );
}
