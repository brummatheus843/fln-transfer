"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import {
  formatDate,
  formatTime,
  statusLabels,
  statusColors,
} from "@/lib/formatters";
import { MapPin, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";

function RideCard({ ride }: { ride: Ride }) {
  return (
    <Link href={`/driver/rides/${ride.id}`} className="block">
      <div className="bg-admin-card border border-admin-border rounded-xl p-4 space-y-2 hover:bg-admin-card-hover transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-admin-silver">
            {formatTime(ride.scheduled_at)}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ride.status]}`}
          >
            {statusLabels[ride.status]}
          </span>
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
    </Link>
  );
}

export default function DriverAgendaPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    async function fetchData() {
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

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name)")
        .eq("driver_id", driver.id)
        .gte("scheduled_at", today.toISOString().slice(0, 10) + "T00:00:00")
        .lte("scheduled_at", nextWeek.toISOString().slice(0, 10) + "T23:59:59")
        .order("scheduled_at");
      if (error) {
        toast.error("Erro ao carregar agenda");
        return;
      }
      setRides(data ?? []);
      setLoading(false);
    }
    fetchData();
  }, [supabase]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRides = rides.filter((r) => r.scheduled_at.slice(0, 10) === today);
  const upcomingRides = rides.filter((r) => r.scheduled_at.slice(0, 10) > today);

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <section>
        <h2 className="mb-3 text-xl font-bold text-admin-text">Hoje</h2>
        {todayRides.length === 0 ? (
          <p className="text-sm text-admin-muted">
            Nenhuma corrida agendada para hoje.
          </p>
        ) : (
          <div className="space-y-3">
            {todayRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-admin-text">Próximos 7 dias</h2>
        {upcomingRides.length === 0 ? (
          <p className="text-sm text-admin-muted">
            Nenhuma corrida nos próximos dias.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingRides.map((ride) => (
              <div key={ride.id}>
                <p className="mb-1 text-xs font-medium text-admin-muted">
                  {formatDate(ride.scheduled_at)}
                </p>
                <RideCard ride={ride} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
