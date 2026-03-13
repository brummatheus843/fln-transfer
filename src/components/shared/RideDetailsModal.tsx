"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  formatDateTime,
  formatCurrency,
  statusLabels,
  statusColors,
  type RideStatus,
} from "@/lib/formatters";
import { MapPin, Phone, Users, FileText, X, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Client } from "@/lib/types";
import { Modal } from "./Modal";
import { useRouter } from "next/navigation";

const statusBadgeClasses: Record<RideStatus, string> = {
  scheduled: "bg-admin-blue/10 text-admin-blue border-admin-blue/20",
  in_progress: "bg-admin-orange/10 text-admin-orange border-admin-orange/20",
  completed: "bg-admin-green/10 text-admin-green border-admin-green/20",
  cancelled: "bg-admin-red/10 text-admin-red border-admin-red/20",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-admin-muted text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-admin-text text-sm break-words">{value || "—"}</p>
    </div>
  );
}

interface RideDetailsModalProps {
  rideId: string | number | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  view: "admin" | "driver";
}

export function RideDetailsModal({ rideId, open, onClose, onUpdate, view }: RideDetailsModalProps) {
  const supabase = createClient();
  const router = useRouter();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name, phone), driver:drivers(full_name), agency:agencies(name)")
      .eq("id", rideId)
      .single();
    
    if (error) {
      toast.error("Erro ao carregar detalhes");
      onClose();
    } else {
      setRide(data);
    }
    setLoading(false);
  }, [rideId, supabase, onClose]);

  useEffect(() => {
    if (open && rideId) {
      fetchRide();
    } else {
      setRide(null);
    }
  }, [open, rideId, fetchRide]);

  const handleUpdateStatus = async (newStatus: RideStatus, extra: any = {}) => {
    if (!rideId) return;
    const { error } = await supabase
      .from("rides")
      .update({ status: newStatus, ...extra })
      .eq("id", rideId);
    
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    
    toast.success("Status atualizado!");
    fetchRide();
    if (onUpdate) onUpdate();
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Corrida #${ride?.id || ""}`} maxWidth="max-w-xl">
      {loading ? (
        <div className="py-12 text-center">
          <p className="text-admin-muted animate-pulse text-sm">Carregando detalhes...</p>
        </div>
      ) : ride ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
              {statusLabels[ride.status]}
            </span>
            {view === "admin" && (
              <button 
                onClick={() => router.push(`/admin/rides/${ride.id}/edit`)}
                className="text-admin-muted hover:text-admin-text transition flex items-center gap-1.5 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </button>
            )}
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2">
            <DetailRow label="Cliente" value={ride.client?.name} />
            {view === "admin" && <DetailRow label="Motorista" value={ride.driver?.full_name} />}
            <DetailRow label="Data e Hora" value={formatDateTime(ride.scheduled_at)} />
            <DetailRow label="Passageiros" value={`${ride.pax_count} pax`} />
            <DetailRow label="Origem" value={ride.origin} />
            <DetailRow label="Destino" value={ride.destination} />
            {view === "admin" && (
              <>
                <DetailRow label="Agência" value={ride.agency?.name} />
                <DetailRow label="Valor" value={formatCurrency(ride.price, ride.currency)} />
              </>
            )}
          </div>

          {(ride.client as any)?.phone && (
            <div className="bg-white/5 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-admin-muted" />
                <span className="text-sm text-admin-text-dim">{(ride.client as any).phone}</span>
              </div>
              <a 
                href={`tel:${(ride.client as any).phone.replace(/\D/g, "")}`}
                className="text-xs font-bold text-admin-silver uppercase tracking-wider hover:underline"
              >
                Ligar
              </a>
            </div>
          )}

          {ride.notes && (
            <div className="space-y-1">
              <p className="text-admin-muted text-[10px] uppercase tracking-widest">Observações</p>
              <p className="text-admin-text text-sm italic">"{ride.notes}"</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            {view === "driver" && (
              <>
                {ride.status === "scheduled" && (
                  <button
                    onClick={() => handleUpdateStatus("in_progress", { started_at: new Date().toISOString() })}
                    className="btn-admin w-full py-3.5 font-bold shadow-lg"
                  >
                    Iniciar Corrida
                  </button>
                )}
                {ride.status === "in_progress" && (
                  <button
                    onClick={() => handleUpdateStatus("completed", { finished_at: new Date().toISOString() })}
                    className="bg-admin-green/20 border border-admin-green/30 text-admin-green hover:bg-admin-green/30 w-full py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-admin-green/5"
                  >
                    Finalizar Corrida
                  </button>
                )}
              </>
            )}
            
            {view === "admin" && ride.status !== "cancelled" && ride.status !== "completed" && (
              <button
                onClick={() => handleUpdateStatus("cancelled")}
                className="w-full py-3 border border-admin-red/20 text-admin-red hover:bg-admin-red/10 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
              >
                Cancelar Corrida
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-admin-muted">Não foi possível carregar os dados.</div>
      )}
    </Modal>
  );
}
