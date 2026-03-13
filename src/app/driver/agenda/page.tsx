"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  formatDate,
  formatTime,
  statusLabels,
  statusColors,
} from "@/lib/formatters";
import { MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";
import { RideDetailsModal } from "@/components/shared/RideDetailsModal";

function RideCard({ ride, onClick }: { ride: Ride; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full text-left">
      <div className="bg-admin-card border border-admin-border rounded-xl p-4 space-y-2 hover:bg-admin-card-hover transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-admin-silver">
            {formatTime(ride.scheduled_at)}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-admin-silver/30 bg-admin-silver/10 text-admin-silver uppercase font-bold">
              {ride.driver_status || "Pendente"}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-widest border ${statusColors[ride.status]}`}
            >
              {statusLabels[ride.status]}
            </span>
          </div>
        </div>
        <p className="font-medium text-admin-text">{ride.client?.name ?? "—"}</p>
        <div className="flex items-start gap-2 text-sm text-admin-text-dim">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {ride.origin} &rarr; {ride.destination}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-admin-text-dim">
          <Users className="h-4 w-4" />
          <span>
            {ride.pax_count} passageiro{ride.pax_count > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </button>
  );
}

export default function DriverAgendaPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRideId, setSelectedRideId] = useState<string | number | null>(null);

  const fetch = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", user.id)
      .single();
    
    if (!driver) {
      setLoading(false);
      return;
    }

    // Buscamos TODAS as corridas do motorista sem limites de data aqui
    // para que apareçam tanto na agenda quanto na lista
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name)")
      .eq("driver_id", driver.id)
      .order("scheduled_at", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar agenda");
      return;
    }
    setRides(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Lógica de data baseada apenas no dia (YYYY-MM-DD)
  const todayStr = new Date().toLocaleDateString("en-CA"); // Formato YYYY-MM-DD local
  
  const pastRides = rides.filter((r) => r.scheduled_at.slice(0, 10) < todayStr);
  const todayRides = rides.filter((r) => r.scheduled_at.slice(0, 10) === todayStr);
  const upcomingRides = rides.filter((r) => r.scheduled_at.slice(0, 10) > todayStr);

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      <section>
        <h2 className="mb-3 text-xl font-bold text-admin-text flex items-center justify-between">
          Hoje
          <span className="text-[10px] bg-admin-silver/10 text-admin-silver px-2 py-1 rounded-full uppercase tracking-widest">{todayRides.length}</span>
        </h2>
        {todayRides.length === 0 ? (
          <p className="text-sm text-admin-muted py-4 bg-white/5 rounded-xl text-center border border-dashed border-white/10">
            Nenhuma corrida para hoje.
          </p>
        ) : (
          <div className="space-y-3">
            {todayRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} onClick={() => setSelectedRideId(ride.id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-admin-text">Próximas Corridas</h2>
        {upcomingRides.length === 0 ? (
          <p className="text-sm text-admin-muted">Sem agendamentos futuros.</p>
        ) : (
          <div className="space-y-4">
            {upcomingRides.map((ride) => (
              <div key={ride.id}>
                <p className="mb-1 text-[10px] font-bold text-admin-muted uppercase tracking-widest">
                  {formatDate(ride.scheduled_at)}
                </p>
                <RideCard ride={ride} onClick={() => setSelectedRideId(ride.id)} />
              </div>
            ))}
          </div>
        )}
      </section>

      {pastRides.length > 0 && (
        <section className="opacity-60">
          <h2 className="mb-3 text-sm font-bold text-admin-muted uppercase tracking-widest">Corridas Passadas</h2>
          <div className="space-y-3">
            {pastRides.slice(-5).map((ride) => ( // Mostra apenas as últimas 5 passadas por performance
              <div key={ride.id}>
                <p className="mb-1 text-[10px] font-bold text-admin-muted uppercase tracking-widest">
                  {formatDate(ride.scheduled_at)}
                </p>
                <RideCard ride={ride} onClick={() => setSelectedRideId(ride.id)} />
              </div>
            ))}
          </div>
        </section>
      )}

      <RideDetailsModal
        rideId={selectedRideId}
        open={!!selectedRideId}
        onClose={() => setSelectedRideId(null)}
        onUpdate={fetch}
        view="driver"
      />
    </div>
  );
}
