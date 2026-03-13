"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  formatDateTime,
  statusLabels,
  type RideStatus,
  driverStatusOptions,
  formatDate,
  formatCurrency
} from "@/lib/formatters";
import { Pencil, History, User, FileDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Ride, RideLog } from "@/lib/types";
import { Modal } from "./Modal";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";

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

  const generateVoucher = () => {
    if (!ride) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FLN TRANSFER EXECUTIVO & TURISMO", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("50.890.100/0001-09", 14, 26);
    doc.text("Florianópolis / Santa Catarina", 14, 32);

    doc.text("Tel.: (48) 98822-2934", pageWidth - 14, 20, { align: "right" });
    doc.text("contato@flntransferexecutivo.com.br", pageWidth - 14, 26, { align: "right" });
    doc.text("Contato: +55 48 99967-2557", pageWidth - 14, 32, { align: "right" });

    // Client Info
    doc.setFontSize(12);
    doc.text("Dados do Cliente", 14, 45);
    doc.line(14, 47, pageWidth - 14, 47);

    doc.setFontSize(10);
    doc.text(ride.client?.name ?? "—", 14, 54);
    const clientPhone = (ride.client as { phone?: string })?.phone || "—";
    doc.text(`Tel.: ${clientPhone}`, 14, 60);
    doc.text(`Data: ${formatDate(new Date().toISOString())}`, pageWidth - 14, 60, { align: "right" });

    // OS Header
    doc.setFillColor(200, 200, 200);
    doc.rect(14, 66, pageWidth - 28, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.text(`ORDEM DE SERVIÇO Nº ${ride.id}`, pageWidth / 2, 71, { align: "center" });

    // Services Table
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Serviços", 14, 84);
    doc.line(14, 86, pageWidth - 14, 86);

    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 88, pageWidth - 28, 6, "F");
    doc.text("Nome", 16, 92);
    doc.text("Quantidade", 110, 92);
    doc.text("Unidade", 135, 92);
    doc.text("Valor Unitário", 160, 92);
    doc.text("Valor Total", 190, 92, { align: "right" });

    doc.text(`${ride.origin} / ${ride.destination}`, 16, 100);
    doc.text("1", 118, 100);
    doc.text("un", 140, 100);
    doc.text(formatCurrency(ride.price, ride.currency), 160, 100);
    doc.text(formatCurrency(ride.price, ride.currency), 190, 100, { align: "right" });

    doc.line(140, 105, pageWidth - 14, 105);
    doc.text("Total Serviços", 140, 111);
    doc.text(formatCurrency(ride.price, ride.currency), 190, 111, { align: "right" });

    doc.text("Subtotal", 140, 120);
    doc.text(formatCurrency(ride.price, ride.currency), 190, 120, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text("Total", 140, 126);
    doc.text(formatCurrency(ride.price, ride.currency), 190, 126, { align: "right" });

    // Payments
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Pagamento(s)", 90, 140);
    doc.line(90, 142, pageWidth - 14, 142);

    doc.setFontSize(9);
    doc.setFillColor(240, 240, 240);
    doc.rect(90, 144, pageWidth - 104, 6, "F");
    doc.text("Pagamento", 92, 148);
    doc.text("Vencimento", 160, 148);
    doc.text("Valor", 190, 148, { align: "right" });

    doc.text(`${ride.origin} / ${ride.destination}`, 92, 156);
    doc.text(`- ${formatDateTime(ride.scheduled_at)}`, 92, 161);
    doc.text(formatDate(ride.scheduled_at), 160, 156);
    doc.text(formatCurrency(ride.price, ride.currency), 190, 156, { align: "right" });

    // Observations
    doc.setFontSize(12);
    doc.text("Observações", 14, 175);
    doc.line(14, 177, pageWidth - 14, 177);

    doc.setFontSize(9);
    doc.text(`Transfer ${statusLabels[ride.status]}`, 14, 185);
    doc.text(`Passageiro(a): ${ride.client?.name ?? "—"}`, 14, 190);
    doc.text(`Data/Hora: ${formatDateTime(ride.scheduled_at)}`, 14, 195);
    doc.text(`Motorista: ${ride.driver?.full_name ?? "A definir"}`, 14, 200);
    doc.text(`Valor: ${formatCurrency(ride.price, ride.currency)}`, 14, 205);
    doc.text(`Embarque: ${ride.origin}`, 14, 210);
    doc.text(`Desembarque: ${ride.destination}`, 14, 215);
    doc.text(`Passageiros: ${ride.pax_count} Pax`, 14, 220);
    if (ride.notes) {
      const splitNotes = doc.splitTextToSize(`Notas: ${ride.notes}`, pageWidth - 28);
      doc.text(splitNotes, 14, 225);
    }

    // Signatures
    doc.line(20, 260, 90, 260);
    doc.setFont("helvetica", "bold");
    doc.text("FLN TRANSFER EXECUTIVO & TURISMO", 55, 265, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.text("+55 48 99967-2557", 55, 270, { align: "center" });

    doc.line(120, 260, 190, 260);
    doc.text(ride.client?.name ?? "—", 155, 265, { align: "center" });

    // Policy (Page 2 if needed, or small at bottom)
    doc.addPage();
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("POLÍTICA DE CANCELAMENTO, MODIFICAÇÃO E NÃO COMPARECIMENTO", 14, 20);
    doc.setFont("helvetica", "normal");
    const policyText = `Valorizamos a organização e a qualidade do serviço. Por isso, estabelecemos a seguinte política:

Cancelamentos e alterações de dados ou horários:
- Solicitados com 24 horas de antecedência: sem custo.
- Solicitados com até 12 horas de antecedência: será cobrado 50% do valor do serviço.
- Solicitados com até 6 horas de antecedência: será cobrado 100% do valor do serviço.

Não comparecimento (no-show):
Se o cliente não comparecer ao local e hora combinados sem aviso prévio, será considerado no-show e cobrado 100% do valor do serviço.

Atraso ou cancelamento de voo:
Em casos de atraso ou cancelamento do voo, não será cobrada taxa de no-show. Acompanhamos e ajustamos os horários sempre que possível.

Agradecemos a compreensão e ficamos à disposição.`;

    const splitPolicy = doc.splitTextToSize(policyText, pageWidth - 28);
    doc.text(splitPolicy, 14, 28);

    doc.save(`OrdemServico-${ride.id}.pdf`);
    toast.success("Voucher gerado com sucesso!");
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

          {/* Botão VOUCHER */}
          <div className="pt-6 mt-6 border-t border-white/5 w-full">
            <button
              onClick={generateVoucher}
              className="w-full bg-admin-card border border-admin-border text-admin-silver hover:bg-white/5 hover:text-white rounded-xl py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <FileDown className="h-5 w-5" />
              Gerar Voucher
            </button>
          </div>

        </div>
      ) : (
        <div className="py-8 text-center text-admin-muted">Não foi possível carregar os dados.</div>
      )}
    </Modal>
  );
}
