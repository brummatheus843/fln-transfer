"use client";

import {
  Clock,
  ShieldCheck,
  CreditCard,
  FileText,
  Loader2,
  CheckCircle2,
  HandCoins,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FinancialStatus } from "@/lib/formatters";
import {
  financialStatusLabels,
  financialStatusColors,
} from "@/lib/formatters";

const statCards: {
  status: FinancialStatus;
  count: number;
  total: number;
  icon: React.ElementType;
}[] = [
  { status: "pending", count: 18, total: 8420, icon: Clock },
  { status: "awaiting_approval", count: 7, total: 3150, icon: ShieldCheck },
  { status: "awaiting_payment", count: 12, total: 6890, icon: CreditCard },
  { status: "invoiced", count: 5, total: 2340, icon: FileText },
  { status: "in_progress", count: 9, total: 4560, icon: Loader2 },
  { status: "completed", count: 42, total: 22780, icon: CheckCircle2 },
  { status: "paid_to_partner", count: 31, total: 16400, icon: HandCoins },
];

const recentRides = [
  { id: "TR-1041", client: "Carlos Silva", date: "2026-03-11T14:30:00", value: 189, financial_status: "completed" as FinancialStatus },
  { id: "TR-1040", client: "Ana Beatriz", date: "2026-03-11T11:00:00", value: 95, financial_status: "awaiting_payment" as FinancialStatus },
  { id: "TR-1039", client: "Roberto Mendes", date: "2026-03-11T09:15:00", value: 145, financial_status: "pending" as FinancialStatus },
  { id: "TR-1038", client: "Juliana Costa", date: "2026-03-10T18:00:00", value: 120, financial_status: "invoiced" as FinancialStatus },
  { id: "TR-1037", client: "Pedro Augusto", date: "2026-03-10T15:45:00", value: 210, financial_status: "paid_to_partner" as FinancialStatus },
  { id: "TR-1036", client: "Maria Fernanda", date: "2026-03-10T13:00:00", value: 175, financial_status: "awaiting_approval" as FinancialStatus },
  { id: "TR-1035", client: "Lucas Almeida", date: "2026-03-09T10:30:00", value: 310, financial_status: "in_progress" as FinancialStatus },
];

export default function FinanceiroPage() {
  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Financeiro</h2>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {statCards.map((s) => (
          <div key={s.status} className="stat-card animate-count-up">
            <div className="flex items-center justify-between mb-2">
              <p className="text-admin-muted text-xs uppercase tracking-widest">
                {financialStatusLabels[s.status]}
              </p>
              <s.icon className="w-4 h-4 text-admin-gold opacity-50" />
            </div>
            <p className="text-2xl font-black text-admin-gold">{s.count}</p>
            <p className="text-xs text-admin-muted mt-1">{formatCurrency(s.total)}</p>
          </div>
        ))}
      </div>

      {/* Recent rides table */}
      <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-admin-border">
          <h3 className="text-sm font-semibold text-admin-text">Corridas Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">ID</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Cliente</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Data</th>
                <th className="text-right px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Valor</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Status Financeiro</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.map((ride) => (
                <tr key={ride.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                  <td className="px-4 py-3 text-admin-text font-medium">{ride.id}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{ride.client}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{formatDate(ride.date)}</td>
                  <td className="px-4 py-3 text-right text-admin-gold font-bold">{formatCurrency(ride.value)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full uppercase tracking-widest font-medium ${financialStatusColors[ride.financial_status]}`}>
                      {financialStatusLabels[ride.financial_status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
