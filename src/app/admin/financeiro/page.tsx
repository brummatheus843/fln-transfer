"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
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
} from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";

const statusIcons: Record<FinancialStatus, React.ElementType> = {
  pending: Clock,
  awaiting_approval: ShieldCheck,
  awaiting_payment: CreditCard,
  invoiced: FileText,
  in_progress: Loader2,
  completed: CheckCircle2,
  paid_to_partner: HandCoins,
};

const allStatuses: FinancialStatus[] = [
  "pending",
  "awaiting_approval",
  "awaiting_payment",
  "invoiced",
  "in_progress",
  "completed",
  "paid_to_partner",
];

export default function FinanceiroPage() {
  const supabase = createClient();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchRides() {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name)")
      .order("scheduled_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar dados financeiros");
      return;
    }
    setRides(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchRides();
  }, []);

  const statCards = allStatuses.map((status) => {
    const matching = rides.filter((r) => r.financial_status === status);
    return {
      status,
      count: matching.length,
      total: matching.reduce((sum, r) => sum + Number(r.price), 0),
      icon: statusIcons[status],
    };
  });

  const recentRides = rides.slice(0, 10);

  async function handleStatusChange(rideId: string, newStatus: FinancialStatus) {
    const { error } = await supabase
      .from("rides")
      .update({ financial_status: newStatus })
      .eq("id", rideId);
    if (error) {
      toast.error("Erro ao atualizar status financeiro");
      return;
    }
    toast.success("Status financeiro atualizado!");
    setRides((prev) =>
      prev.map((r) => (r.id === rideId ? { ...r, financial_status: newStatus } : r))
    );
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Financeiro</h2>

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
                  <td className="px-4 py-3 text-admin-text font-medium">{ride.id.slice(0, 8)}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{ride.client?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{formatDate(ride.scheduled_at)}</td>
                  <td className="px-4 py-3 text-right text-admin-gold font-bold">{formatCurrency(Number(ride.price))}</td>
                  <td className="px-4 py-3">
                    <select
                      value={ride.financial_status ?? "pending"}
                      onChange={(e) => handleStatusChange(ride.id, e.target.value as FinancialStatus)}
                      className="bg-transparent text-xs rounded-lg px-2 py-1 border border-admin-border text-admin-text focus:outline-none focus:border-admin-gold/50"
                    >
                      {allStatuses.map((s) => (
                        <option key={s} value={s}>{financialStatusLabels[s]}</option>
                      ))}
                    </select>
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
