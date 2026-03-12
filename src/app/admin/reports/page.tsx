"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { FileText, FileSpreadsheet, Car, DollarSign, Receipt, Percent } from "lucide-react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Agency } from "@/lib/types";

export default function ReportsPage() {
  const supabase = createClient();
  const [startDate, setStartDate] = useState("2026-03-01");
  const [endDate, setEndDate] = useState("2026-03-31");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRides() {
    setLoading(true);
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name), driver:drivers(full_name), agency:agencies(name, commission_pct)")
      .gte("scheduled_at", `${startDate}T00:00:00`)
      .lte("scheduled_at", `${endDate}T23:59:59`)
      .order("scheduled_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar relatório");
      return;
    }
    setRides(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRides();
  }, [startDate, endDate]);

  const totalRides = rides.length;
  const totalRevenue = rides.reduce((sum, r) => sum + Number(r.price), 0);
  const avgTicket = totalRides > 0 ? totalRevenue / totalRides : 0;
  const totalCommissions = rides.reduce((sum, r) => {
    const agency = r.agency as Agency | null;
    const pct = agency?.commission_pct ?? 0;
    return sum + (Number(r.price) * Number(pct)) / 100;
  }, 0);

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Corridas - FLN Transfer", 14, 22);
    doc.setFontSize(10);
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 32);

    doc.setFontSize(12);
    doc.text(`Total de Corridas: ${totalRides}`, 14, 44);
    doc.text(`Receita Total: ${formatCurrency(totalRevenue)}`, 14, 52);
    doc.text(`Ticket Médio: ${formatCurrency(avgTicket)}`, 14, 60);
    doc.text(`Comissões: ${formatCurrency(totalCommissions)}`, 14, 68);

    let y = 84;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Data", 14, y);
    doc.text("Cliente", 40, y);
    doc.text("Origem", 80, y);
    doc.text("Destino", 120, y);
    doc.text("Valor", 165, y);
    doc.setFont("helvetica", "normal");

    rides.forEach((r) => {
      y += 8;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(formatDate(r.scheduled_at), 14, y);
      doc.text(r.client?.name ?? "—", 40, y);
      doc.text(r.origin, 80, y);
      doc.text(r.destination, 120, y);
      doc.text(formatCurrency(Number(r.price)), 165, y);
    });

    doc.save("relatorio-fln-transfer.pdf");
    toast.success("PDF exportado com sucesso!");
  }

  function exportExcel() {
    const rows = rides.map((r) => ({
      Data: formatDate(r.scheduled_at),
      Cliente: r.client?.name ?? "—",
      Origem: r.origin,
      Destino: r.destination,
      Motorista: r.driver?.full_name ?? "—",
      Agência: r.agency?.name ?? "—",
      Valor: Number(r.price),
      Comissão: (Number(r.price) * Number((r.agency as Agency | null)?.commission_pct ?? 0)) / 100,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, "relatorio-fln-transfer.xlsx");
    toast.success("Excel exportado com sucesso!");
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Relatórios</h2>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Data Início</label>
          <input className="admin-input w-full" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Data Fim</label>
          <input className="admin-input w-full" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={exportPDF} className="btn-admin flex items-center gap-2" disabled={loading}>
          <FileText className="h-4 w-4" />
          Exportar PDF
        </button>
        <button onClick={exportExcel} className="bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2 text-sm transition flex items-center gap-2" disabled={loading}>
          <FileSpreadsheet className="h-4 w-4" />
          Exportar Excel
        </button>
      </div>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-admin-muted text-xs uppercase tracking-widest">Total Corridas</span>
              <Car className="h-4 w-4 text-admin-muted" />
            </div>
            <div className="text-2xl font-black text-admin-gold">{totalRides}</div>
          </div>
          <div className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-admin-muted text-xs uppercase tracking-widest">Receita Total</span>
              <DollarSign className="h-4 w-4 text-admin-muted" />
            </div>
            <div className="text-2xl font-black text-admin-gold">{formatCurrency(totalRevenue)}</div>
          </div>
          <div className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-admin-muted text-xs uppercase tracking-widest">Ticket Médio</span>
              <Receipt className="h-4 w-4 text-admin-muted" />
            </div>
            <div className="text-2xl font-black text-admin-gold">{formatCurrency(avgTicket)}</div>
          </div>
          <div className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-admin-muted text-xs uppercase tracking-widest">Comissões</span>
              <Percent className="h-4 w-4 text-admin-muted" />
            </div>
            <div className="text-2xl font-black text-admin-gold">{formatCurrency(totalCommissions)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
