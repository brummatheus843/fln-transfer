"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FileText, MapPin } from "lucide-react";
import jsPDF from "jspdf";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Client } from "@/lib/types";

export default function NFPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRides() {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name, document), driver:drivers(full_name)")
      .eq("status", "completed")
      .is("nf_number", null)
      .order("scheduled_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar corridas");
      return;
    }
    setRides(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRides();
  }, []);

  async function generateNF(ride: Ride) {
    const nfNumber = `NF-${Date.now()}`;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("NOTA FISCAL DE SERVIÇO", 105, 25, { align: "center" });
    doc.setFontSize(12);
    doc.text("FLN Transfer - Serviços de Transporte", 105, 35, { align: "center" });
    doc.text("CNPJ: 00.000.000/0001-00", 105, 42, { align: "center" });
    doc.line(14, 48, 196, 48);

    doc.setFontSize(11);
    let y = 58;
    doc.setFont("helvetica", "bold");
    doc.text("NF Número:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(nfNumber, 55, y);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Data:", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(formatDate(ride.scheduled_at), 55, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO CLIENTE", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${ride.client?.name ?? "—"}`, 14, y);
    y += 7;
    const clientDoc = (ride.client as Client & { document?: string })?.document ?? "—";
    doc.text(`Documento: ${clientDoc}`, 14, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO SERVIÇO", 14, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.text(`Origem: ${ride.origin}`, 14, y);
    y += 7;
    doc.text(`Destino: ${ride.destination}`, 14, y);
    y += 7;
    doc.text(`Motorista: ${ride.driver?.full_name ?? "—"}`, 14, y);

    y += 14;
    doc.line(14, y, 196, y);
    y += 10;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`VALOR TOTAL: ${formatCurrency(Number(ride.price))}`, 14, y);

    doc.save(`${nfNumber}.pdf`);

    const { error } = await supabase
      .from("rides")
      .update({ nf_number: nfNumber })
      .eq("id", ride.id);
    if (error) {
      toast.error("Erro ao salvar NF no banco");
      return;
    }

    toast.success(`${nfNumber} gerada com sucesso!`);
    setRides((prev) => prev.filter((r) => r.id !== ride.id));
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-lg md:text-2xl font-bold text-admin-text mb-4 md:mb-6">Notas Fiscais</h2>

      {rides.length === 0 ? (
        <p className="text-admin-text-dim">
          Todas as corridas já possuem nota fiscal gerada.
        </p>
      ) : (
        <>
          {/* Mobile: cards */}
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
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block admin-table-container">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Data</th>
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
                      <td className="text-admin-text font-medium">{ride.id.slice(0, 8)}</td>
                      <td className="text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
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
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
