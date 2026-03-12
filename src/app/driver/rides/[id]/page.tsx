"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { formatDateTime, statusLabels, statusColors } from "@/lib/formatters";
import type { RideStatus } from "@/lib/formatters";
import { toast } from "sonner";
import { MapPin, Phone, Users, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Client } from "@/lib/types";

export default function DriverRideDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = createClient();
  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<RideStatus>("scheduled");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name, phone)")
        .eq("id", id)
        .single();
      if (error) {
        toast.error("Erro ao carregar corrida");
        return;
      }
      setRide(data);
      setStatus(data.status);
      setLoading(false);
    }
    fetch();
  }, [id]);

  async function handleStart() {
    const { error } = await supabase
      .from("rides")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao iniciar corrida");
      return;
    }
    setStatus("in_progress");
    toast.success("Corrida iniciada!");
  }

  async function handleFinish() {
    const { error } = await supabase
      .from("rides")
      .update({ status: "completed", finished_at: new Date().toISOString() })
      .eq("id", id);
    if (error) {
      toast.error("Erro ao finalizar corrida");
      return;
    }
    setStatus("completed");
    toast.success("Corrida finalizada!");
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  if (!ride) {
    return (
      <div className="flex items-center justify-center pt-20">
        <p className="text-admin-muted">Corrida não encontrada.</p>
      </div>
    );
  }

  const clientPhone = (ride.client as Client & { phone?: string })?.phone ?? "";
  const clientName = ride.client?.name ?? "—";

  return (
    <div className="space-y-4 pb-20 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-admin-text">Detalhes da Corrida</h2>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>

      <div className="bg-admin-card border border-admin-border rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-admin-text">{clientName}</h3>
        <div className="space-y-3">
          {clientPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-admin-muted" />
              <a
                href={`tel:${clientPhone.replace(/\D/g, "")}`}
                className="text-admin-gold underline"
              >
                {clientPhone}
              </a>
            </div>
          )}
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-admin-muted" />
            <div className="text-admin-text-dim">
              <p>
                <span className="font-medium text-admin-text">Origem:</span> {ride.origin}
              </p>
              <p>
                <span className="font-medium text-admin-text">Destino:</span>{" "}
                {ride.destination}
              </p>
            </div>
          </div>
          <p className="text-sm text-admin-text-dim">
            <span className="font-medium text-admin-text">Data/Hora:</span>{" "}
            {formatDateTime(ride.scheduled_at)}
          </p>
          <div className="flex items-center gap-2 text-sm text-admin-text-dim">
            <Users className="h-4 w-4 text-admin-muted" />
            <span>
              {ride.pax_count} passageiro{ride.pax_count > 1 ? "s" : ""}
            </span>
          </div>
          {ride.notes && (
            <div className="flex items-start gap-2 text-sm text-admin-text-dim">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-admin-muted" />
              <p>{ride.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-admin-dark rounded-xl h-48 flex items-center justify-center text-admin-muted text-sm">
        Google Maps - Rota de {ride.origin} para {ride.destination}
      </div>

      <div className="space-y-2">
        {status === "scheduled" && (
          <button
            onClick={handleStart}
            className="btn-admin w-full py-3 font-bold"
          >
            Iniciar Corrida
          </button>
        )}
        {status === "in_progress" && (
          <button
            onClick={handleFinish}
            className="bg-green-600 py-3 w-full rounded-lg text-white font-bold active:opacity-80 transition-opacity"
          >
            Finalizar Corrida
          </button>
        )}
        {status === "completed" && (
          <p className="text-center text-sm text-admin-muted">
            Esta corrida já foi finalizada.
          </p>
        )}
      </div>
    </div>
  );
}
