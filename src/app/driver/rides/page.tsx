"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  formatDateTime,
  statusLabels,
  statusColors,
} from "@/lib/formatters";
import { MapPin, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";

export default function DriverRidesPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
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

      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name)")
        .eq("driver_id", driver.id)
        .order("scheduled_at", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar corridas");
        return;
      }
      setRides(data ?? []);
      setLoading(false);
    }
    fetch();
  }, [supabase]);

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="space-y-3 pb-20 animate-fade-in">
      <h2 className="text-xl font-bold text-admin-text">Minhas Corridas</h2>

      {rides.map((ride) => (
        <Link key={ride.id} href={`/driver/rides/${ride.id}`}>
          <div className="bg-admin-card border border-admin-border rounded-xl p-4 flex items-center gap-3 hover:bg-admin-card-hover transition-colors">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-admin-text">{ride.client?.name ?? "—"}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[ride.status]}`}
                >
                  {statusLabels[ride.status]}
                </span>
              </div>
              <div className="flex items-start gap-1.5 text-sm text-admin-text-dim">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  {ride.origin} &rarr; {ride.destination}
                </span>
              </div>
              <p className="text-xs text-admin-muted">
                {formatDateTime(ride.scheduled_at)}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-admin-muted" />
          </div>
        </Link>
      ))}
    </div>
  );
}
