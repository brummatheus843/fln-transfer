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
              <div key={ride.id} className="bg-admin-card border border-admin-border rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-admin-text">{ride.client?.name ?? "—"}</p>
                    <p className="text-xs text-admin-muted">{formatDate(ride.scheduled_at)}</p>
                  </div>
                  <p className="text-sm font-bold text-admin-gold whitespace-nowrap">{formatCurrency(Number(ride.price))}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-admin-text-dim">
                  <MapPin className="h-3 w-3 shrink-0 text-admin-muted" />
                  <span className="truncate">{ride.origin} → {ride.destination}</span>
                </div>
                <button onClick={() => generateNF(ride)} className="btn-admin text-xs w-full py-2 flex items-center justify-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Gerar NF
                </button>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-admin-card border border-admin-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-admin-border">
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">ID</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Data</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Cliente</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Origem</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Destino</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Valor</th>
                    <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest w-[120px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.map((ride) => (
                    <tr key={ride.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                      <td className="px-4 py-3 text-admin-text font-medium">{ride.id.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                      <td className="px-4 py-3 text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-admin-text-dim">{ride.origin}</td>
                      <td className="px-4 py-3 text-admin-text-dim">{ride.destination}</td>
                      <td className="px-4 py-3 text-admin-gold font-bold">{formatCurrency(Number(ride.price))}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => generateNF(ride)} className="btn-admin text-xs px-3 py-1.5 flex items-center gap-1.5">
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
