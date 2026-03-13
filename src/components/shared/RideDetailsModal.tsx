"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  formatDateTime,
  statusLabels,
  type RideStatus,
  driverStatusOptions,
} from "@/lib/formatters";
import { Pencil, History, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride, RideLog } from "@/lib/types";
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
  const [logs, setLogs] = useState<RideLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRide = useCallback(async () => {
    if (!rideId) return;
    setLoading(true);
    const [rideRes, logRes] = await Promise.all([
      supabase
        .from("rides")
        .select("*, client:clients(name, phone), driver:drivers(full_name), agency:agencies(name)")
        .eq("id", rideId)
        .single(),
      supabase
        .from("ride_logs")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false })
    ]);
    
    if (rideRes.error) {
      toast.error("Erro ao carregar detalhes");
      onClose();
    } else {
      setRide(rideRes.data);
      setLogs(logRes.data ?? []);
    }
    setLoading(false);
  }, [rideId, supabase, onClose]);

  useEffect(() => {
    if (open && rideId) {
      fetchRide();
    } else {
      setRide(null);
      setLogs([]);
    }
  }, [open, rideId, fetchRide]);

  const logChange = async (action: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Tenta pegar o nome do perfil, se não existir usa o email ( fallback )
    const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
    
    await supabase.from("ride_logs").insert({
      ride_id: rideId,
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      action
    });
  };

  const handleDriverStatusChange = async (newDriverStatus: string) => {
    if (!rideId) return;
    const { error } = await supabase
      .from("rides")
      .update({ driver_status: newDriverStatus })
      .eq("id", rideId);
    
    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    
    await logChange(`Alterou status para: ${newDriverStatus}`);
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
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${statusBadgeClasses[ride.status]}`}>
                {statusLabels[ride.status]}
              </span>
              <span className="text-[10px] px-2.5 py-1 rounded-full border border-admin-silver/30 bg-admin-silver/10 text-admin-silver uppercase tracking-widest font-medium">
                {ride.driver_status || "Pendente"}
              </span>
            </div>
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
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] text-admin-muted uppercase tracking-widest block font-bold">Status da Operação</label>
            <div className="grid grid-cols-1 gap-2">
              {driverStatusOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleDriverStatusChange(opt)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                    ride.driver_status === opt
                      ? "bg-admin-silver text-admin-black border-admin-silver"
                      : "bg-transparent text-admin-text-dim border-white/10 hover:border-white/20"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Logs / Registro de Alterações - Optimized for width */}
          <div className="pt-6 border-t border-white/5 w-full">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-admin-muted" />
              <h4 className="text-xs font-bold text-admin-text uppercase tracking-widest">Registro de Alterações</h4>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 scrollbar-hide">
              {logs.length === 0 ? (
                <p className="text-[10px] text-admin-muted italic px-2">Nenhuma alteração registrada.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="text-[10px] space-y-1 bg-white/[0.03] p-3 rounded-xl border border-white/5 w-[95%] mx-auto">
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-admin-silver font-bold flex items-center gap-1.5 truncate">
                        <User className="h-3 w-3 opacity-50" /> 
                        {log.user_name}
                      </span>
                      <span className="text-admin-muted shrink-0">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-admin-text-dim text-[11px] leading-relaxed">{log.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-admin-muted">Não foi possível carregar os dados.</div>
      )}
    </Modal>
  );
}
