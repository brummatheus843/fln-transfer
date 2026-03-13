"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { FileText, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";

export default function NFPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRides = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*, client:clients(name, document), driver:drivers(full_name)")
        .eq("status", "completed")
        .is("nf_number", null)
        .order("scheduled_at", { ascending: false });
      
      if (error) {
        console.error("NF fetch error:", error);
        toast.error("Erro ao carregar corridas: " + error.message);
        return;
      }
      setRides(data ?? []);
    } catch (err: any) {
      console.error("NF unexpected error:", err);
      toast.error("Erro inesperado ao carregar notas fiscais");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchRides();
  }, [fetchRides]);

  async function generateNF(ride: Ride) {
    const nfNumber = `NF-${Date.now()}`;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("NOTA FISCAL DE SERVIÇO", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("FLN Transfer LTDA", 105, 30, { align: "center" });
    doc.text("CNPJ: 00.000.000/0001-00", 105, 36, { align: "center" });
    doc.line(14, 42, 196, 42);

    doc.setFontSize(11);
    let y = 52;
    doc.text(`NF Número: ${nfNumber}`, 14, y);
    doc.text(`Data: ${formatDate(new Date().toISOString())}`, 14, y + 8);
    
    y += 24;
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${ride.client?.name ?? "—"}`, 14, y + 8);
    doc.text(`Documento: ${ride.client?.document ?? "—"}`, 14, y + 16);

    y += 32;
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO SERVIÇO", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(`Descrição: Transporte executivo de ${ride.origin} para ${ride.destination}`, 14, y + 8);
    doc.text(`Data do Serviço: ${formatDate(ride.scheduled_at)}`, 14, y + 16);
    doc.text(`Motorista: ${ride.driver?.full_name ?? "—"}`, 14, y + 24);

    y += 40;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR TOTAL: ${formatCurrency(Number(ride.price))}`, 14, y);

    const { error } = await supabase
      .from("rides")
      .update({ nf_number: nfNumber })
      .eq("id", ride.id);

    if (error) {
      toast.error("Erro ao salvar número da NF no banco");
    }

    doc.save(`NF-${ride.id}.pdf`);
    toast.success("NF gerada e baixada com sucesso!");
    fetchRides();
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Gerar Notas Fiscais</h2>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {rides.map((ride) => (
              <div key={ride.id} className="stat-card !p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-admin-text">{ride.client?.name ?? "—"}</p>
                    <p className="text-[10px] text-admin-muted uppercase tracking-wider">{formatDate(ride.scheduled_at)}</p>
                  </div>
                  <p className="text-sm font-bold text-admin-silver whitespace-nowrap">{formatCurrency(Number(ride.price))}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-admin-muted">
                  <div>
                    <p className="mb-0.5 opacity-50">ID</p>
                    <p className="text-admin-text-dim">{ride.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="mb-0.5 opacity-50">Registrada em</p>
                    <p className="text-admin-text-dim">{formatDateTime(ride.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-admin-text-dim pt-3 border-t border-white/5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-admin-muted" />
                  <span className="truncate">{ride.origin} → {ride.destination}</span>
                </div>
                <button onClick={() => generateNF(ride)} className="btn-admin text-xs w-full py-2.5 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Gerar Nota Fiscal
                </button>
              </div>
            ))}
            {rides.length === 0 && (
              <p className="text-admin-muted text-center py-8">Nenhuma corrida finalizada pendente de NF.</p>
            )}
          </div>

          <div className="hidden md:block admin-table-container">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
                    <th>Data registrada</th>
                    <th>Cliente</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Valor</th>
                    <th className="w-[120px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride.id}>
                      <td className="text-admin-text font-medium">{ride.id}</td>
                      <td className="text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                      <td className="text-admin-text-dim">{formatDateTime(ride.created_at)}</td>
                      <td className="text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                      <td className="text-admin-text-dim">{ride.origin}</td>
                      <td className="text-admin-text-dim">{ride.destination}</td>
                      <td className="text-admin-silver font-bold">{formatCurrency(Number(ride.price))}</td>
                      <td>
                        <button onClick={() => generateNF(ride)} className="btn-admin text-[10px] px-3 py-1.5 flex items-center gap-1.5 uppercase tracking-wider font-bold">
                          <FileText className="h-3.5 w-3.5" />
                          Gerar NF
                        </button>
                      </td>
                    </tr>
                  ))}
                  {rides.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center text-admin-muted py-8">
                        Nenhuma corrida finalizada pendente de NF.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
