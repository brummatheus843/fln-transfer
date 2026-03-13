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
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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
    const { error } = await supabase.from("rides").update({ driver_status: newDriverStatus }).eq("id", rideId);
    if (error) { toast.error("Erro ao atualizar status"); return; }
    await logChange(`Alterou status para: ${newDriverStatus}`);
    toast.success("Status atualizado!");
    fetchRide();
    if (onUpdate) onUpdate();
  };

  const generateVoucher = async () => {
    if (!ride) return;
    const toastId = toast.loading("Gerando voucher 100% fiel...");

    try {
      // 1. Carregar o arquivo original do diretório public
      const templateUrl = "/voucher-template.pdf";
      const existingPdfBytes = await fetch(templateUrl).then(res => res.arrayBuffer());

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Função para apagar o texto original do modelo (caixa branca)
      const mask = (x: number, y: number, width: number, height: number) => {
        firstPage.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1) });
      };

      // Escreve o novo texto
      const write = (text: string, x: number, y: number, size = 9, font = helveticaFont, color = rgb(0, 0, 0)) => {
        firstPage.drawText(text, { x, y, size, font, color });
      };

      // --- MAPEAMENTO DE CAMPOS ---

      // 1. Dados do Cliente
      mask(40, 720, 250, 15); // Apaga "Beatriz Splendiani"
      write(ride.client?.name ?? "—", 45, 724, 10, helveticaBold);
      
      mask(40, 705, 150, 12); // Apaga o telefone original
      const clientPhone = (ride.client as { phone?: string })?.phone || "—";
      write(`Tel.: ${clientPhone}`, 45, 708, 9);
      
      // 2. Data (Topo Direito)
      mask(480, 705, 80, 15); // Apaga "12/03/2026"
      write(formatDate(new Date().toISOString()), 500, 708, 9);

      // 3. Nº Ordem de Serviço (No centro da barra cinza)
      // Como o fundo é cinza, vamos desenhar um retângulo cinza para limpar o número antigo
      firstPage.drawRectangle({ x: 330, y: 683, width: 100, height: 12, color: rgb(0.6, 0.6, 0.6) });
      write(`ORDEM DE SERVIÇO Nº ${ride.id}`, pageWidthCenter(330, 100, `ORDEM DE SERVIÇO Nº ${ride.id}`, 11, helveticaBold), 685, 11, helveticaBold, rgb(1, 1, 1));

      // 4. Tabela de Serviços (Linha 1)
      mask(40, 640, 520, 15); // Limpa a linha inteira da tabela
      const serviceName = `${ride.origin} / ${ride.destination}`;
      write(serviceName.substring(0, 60), 45, 643, 9);
      write("1", 315, 643, 9);
      write("un", 375, 643, 9);
      write(formatCurrency(ride.price, ride.currency), 435, 643, 9);
      write(formatCurrency(ride.price, ride.currency), 550, 643, 9, helveticaFont, rgb(0,0,0)); // Valor Total (alinhado direita)

      // 5. Totais (Lado Direito)
      mask(500, 610, 80, 15); // Total Serviços
      write(formatCurrency(ride.price, ride.currency), 550, 613, 9);
      mask(500, 590, 80, 15); // Subtotal
      write(formatCurrency(ride.price, ride.currency), 550, 593, 9);
      mask(500, 570, 80, 15); // Total Final
      write(formatCurrency(ride.price, ride.currency), 550, 576, 10, helveticaBold);

      // 6. Bloco de Pagamento
      mask(260, 510, 300, 30); // Limpa descrição e valores do pagamento
      write(serviceName.substring(0, 45), 260, 525, 8);
      write(`- ${formatDateTime(ride.scheduled_at)}`, 260, 515, 8);
      write(formatDate(ride.scheduled_at), 435, 525, 9);
      write(formatCurrency(ride.price, ride.currency), 550, 525, 9);

      // 7. Observações (Lista de detalhes)
      mask(40, 180, 520, 70); // Limpa o bloco de observações inteiro
      let obsY = 225;
      const addObsLine = (txt: string) => { write(txt, 45, obsY, 8.5); obsY -= 12; };
      addObsLine(`Transfer ${statusLabels[ride.status]}`);
      addObsLine(`Passageiro(a): ${ride.client?.name ?? "—"}`);
      addObsLine(`Data/Hora: ${formatDateTime(ride.scheduled_at)}`);
      addObsLine(`Motorista: ${ride.driver?.full_name ?? "A definir"}`);
      addObsLine(`Valor: ${formatCurrency(ride.price, ride.currency)}`);
      addObsLine(`Embarque: ${ride.origin}`);
      addObsLine(`Desembarque: ${ride.destination}`);
      addObsLine(`Pax: ${ride.pax_count}`);
      if (ride.notes) addObsLine(`Notas: ${ride.notes.substring(0, 80)}`);

      // 8. Assinatura do Cliente
      mask(400, 305, 180, 15); // Limpa o nome antigo sob a linha
      write(ride.client?.name ?? "—", 430, 308, 9, helveticaBold);

      // Helper para centralizar na barra
      function pageWidthCenter(startX: number, width: number, text: string, size: number, font: any) {
        const textWidth = font.widthOfTextAtSize(text, size);
        return startX + (width - textWidth) / 2;
      }

      const pdfBytes = await pdfDoc.save();
      // @ts-expect-error - Compatibilidade Blob
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `OrdemServico-${ride.id}.pdf`;
      link.click();

      toast.success("Voucher 100% fiel gerado!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar modelo original", { id: toastId });
    }
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
              <button onClick={() => router.push(`/admin/rides/${ride.id}/edit`)} className="text-admin-muted hover:text-admin-text transition flex items-center gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Editar
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
                    ride.driver_status === opt ? "bg-admin-silver text-admin-black border-admin-silver" : "bg-transparent text-admin-text-dim border-white/10 hover:border-white/20"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

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
                        <User className="h-3 w-3 opacity-50" /> {log.user_name}
                      </span>
                      <span className="text-admin-muted shrink-0">{formatDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-admin-text-dim text-[11px] leading-relaxed">{log.action}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/5 w-full">
            <button
              onClick={generateVoucher}
              className="w-full bg-admin-card border border-admin-border text-admin-silver hover:bg-white/5 hover:text-white rounded-xl py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <FileDown className="h-5 w-5" /> Gerar Voucher
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-admin-muted">Não foi possível carregar os dados.</div>
      )}
    </Modal>
  );
}
