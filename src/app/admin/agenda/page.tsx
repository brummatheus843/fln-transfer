"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, X, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { RideStatus } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types";

const locales = { "pt-BR": ptBR };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const statusEventColors: Record<RideStatus, string> = {
  scheduled: "rgba(59,130,246,0.25)",
  in_progress: "rgba(249,115,22,0.25)",
  completed: "rgba(34,197,94,0.25)",
  cancelled: "rgba(239,68,68,0.25)",
};

const statusBorderColors: Record<RideStatus, string> = {
  scheduled: "rgba(59,130,246,0.5)",
  in_progress: "rgba(249,115,22,0.5)",
  completed: "rgba(34,197,94,0.5)",
  cancelled: "rgba(239,68,68,0.5)",
};

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  status: RideStatus;
};

export default function AgendaPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clients, setClients] = useState<Pick<Client, "id" | "name">[]>([]);
  const [loading, setLoading] = useState(true);

  const [rideForm, setRideForm] = useState({
    client_id: "",
    origin: "",
    destination: "",
    date: "",
    time: "",
    price: "",
    notes: "",
  });

  const [clientForm, setClientForm] = useState({ name: "", phone: "" });

  async function fetchData() {
    const [ridesRes, clientsRes] = await Promise.all([
      supabase.from("rides").select("*, client:clients(name)").order("scheduled_at"),
      supabase.from("clients").select("id, name").order("name"),
    ]);
    if (ridesRes.error) {
      toast.error("Erro ao carregar agenda");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calEvents: CalendarEvent[] = (ridesRes.data ?? []).map((r: any) => {
      const start = new Date(r.scheduled_at);
      const end = new Date(start);
      end.setHours(end.getHours() + 1);
      return {
        title: `${r.client?.name ?? "—"} - ${r.origin} → ${r.destination}`,
        start,
        end,
        status: r.status as RideStatus,
      };
    });
    setEvents(calEvents);
    setClients(clientsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRide = useCallback(async () => {
    if (!rideForm.client_id || !rideForm.origin || !rideForm.destination || !rideForm.date || !rideForm.time) return;
    const scheduled_at = `${rideForm.date}T${rideForm.time}:00`;
    const { error } = await supabase.from("rides").insert({
      client_id: rideForm.client_id,
      origin: rideForm.origin,
      destination: rideForm.destination,
      scheduled_at,
      price: Number(rideForm.price) || 0,
      notes: rideForm.notes || null,
      status: "scheduled",
      financial_status: "pending",
      pax_count: 1,
      currency: "BRL",
    });
    if (error) {
      toast.error("Erro ao criar corrida");
      return;
    }
    toast.success("Corrida criada!");
    setRideForm({ client_id: "", origin: "", destination: "", date: "", time: "", price: "", notes: "" });
    setShowRideModal(false);
    fetchData();
  }, [rideForm]);

  const handleCreateClient = useCallback(async () => {
    if (!clientForm.name) return;
    const { data, error } = await supabase
      .from("clients")
      .insert({ name: clientForm.name, phone: clientForm.phone || null })
      .select("id, name")
      .single();
    if (error) {
      toast.error("Erro ao criar cliente");
      return;
    }
    toast.success("Cliente criado!");
    setClients((prev) => [...prev, data]);
    setRideForm((prev) => ({ ...prev, client_id: data.id }));
    setClientForm({ name: "", phone: "" });
    setShowClientModal(false);
  }, [clientForm]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => ({
    style: {
      background: statusEventColors[event.status],
      border: `1px solid ${statusBorderColors[event.status]}`,
      color: "#e0e0e0",
      borderRadius: "4px",
      fontSize: "11px",
    },
  }), []);

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">Agenda</h2>
        <button onClick={() => setShowRideModal(true)} className="btn-admin flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Lançar Nova Corrida</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      <div className="bg-admin-card border border-admin-border rounded-xl p-3 md:p-5 overflow-hidden">
        <style jsx global>{`
          .rbc-calendar { background: transparent; color: #e0e0e0; }
          .rbc-toolbar button { color: #999; border: 1px solid #2a2a2a; background: #1a1a1a; }
          .rbc-toolbar button:hover, .rbc-toolbar button.rbc-active { background: rgba(212,168,67,0.1); color: #d4a843; border-color: rgba(212,168,67,0.2); }
          .rbc-header { border-bottom: 1px solid #2a2a2a; color: #6b6b6b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; padding: 8px; }
          .rbc-month-view, .rbc-time-view { border: 1px solid #2a2a2a; }
          .rbc-day-bg { background: #0a0a0a; }
          .rbc-off-range-bg { background: #111111; }
          .rbc-today { background: rgba(212,168,67,0.05) !important; }
          .rbc-event { border-radius: 4px; font-size: 11px; }
          .rbc-month-row + .rbc-month-row { border-top: 1px solid #2a2a2a; }
          .rbc-date-cell { color: #999; padding: 4px 8px; }
          .rbc-date-cell.rbc-now { color: #d4a843; font-weight: bold; }
          .rbc-time-slot { border-top: 1px solid #1a1a1a; }
          .rbc-timeslot-group { border-bottom: 1px solid #2a2a2a; }
          .rbc-time-content { border-top: 1px solid #2a2a2a; }
          .rbc-time-header-content { border-left: 1px solid #2a2a2a; }
          .rbc-time-gutter .rbc-label { color: #6b6b6b; font-size: 10px; }
        `}</style>
        <div className="min-h-[400px] md:min-h-[600px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%", minHeight: "inherit" }}
            culture="pt-BR"
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day"]}
            defaultView="month"
          />
        </div>
      </div>

      {showRideModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60">
          <div className="bg-admin-dark border border-admin-border rounded-t-2xl md:rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 md:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-admin-text">Nova Corrida</h3>
              <button onClick={() => setShowRideModal(false)} className="text-admin-muted hover:text-admin-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Cliente</label>
                <div className="flex gap-2">
                  <select
                    value={rideForm.client_id}
                    onChange={(e) => setRideForm((p) => ({ ...p, client_id: e.target.value }))}
                    className="flex-1 bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50"
                  >
                    <option value="">Selecionar cliente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="p-2 bg-admin-card border border-admin-border rounded-lg text-admin-gold hover:bg-admin-gold/10 transition"
                    title="Novo Cliente"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Origem</label>
                  <input value={rideForm.origin} onChange={(e) => setRideForm((p) => ({ ...p, origin: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" placeholder="Ex: Aeroporto FLN" />
                </div>
                <div>
                  <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Destino</label>
                  <input value={rideForm.destination} onChange={(e) => setRideForm((p) => ({ ...p, destination: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" placeholder="Ex: Jurerê Internacional" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Data</label>
                  <input type="date" value={rideForm.date} onChange={(e) => setRideForm((p) => ({ ...p, date: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" />
                </div>
                <div>
                  <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Horário</label>
                  <input type="time" value={rideForm.time} onChange={(e) => setRideForm((p) => ({ ...p, time: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" />
                </div>
              </div>
              <div>
                <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Valor (R$)</label>
                <input type="number" value={rideForm.price} onChange={(e) => setRideForm((p) => ({ ...p, price: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" placeholder="0,00" />
              </div>
              <div>
                <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Observação</label>
                <textarea value={rideForm.notes} onChange={(e) => setRideForm((p) => ({ ...p, notes: e.target.value }))} rows={2} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50 resize-none" />
              </div>
              <button onClick={handleCreateRide} className="btn-admin w-full">
                Criar Corrida
              </button>
            </div>
          </div>
        </div>
      )}

      {showClientModal && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60">
          <div className="bg-admin-dark border border-admin-border rounded-t-2xl md:rounded-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-5 md:p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-admin-text">Novo Cliente</h3>
              <button onClick={() => setShowClientModal(false)} className="text-admin-muted hover:text-admin-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Nome</label>
                <input value={clientForm.name} onChange={(e) => setClientForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-xs text-admin-muted uppercase tracking-widest mb-1 block">Telefone</label>
                <input value={clientForm.phone} onChange={(e) => setClientForm((p) => ({ ...p, phone: e.target.value }))} className="w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50" placeholder="(48) 99999-9999" />
              </div>
              <button onClick={handleCreateClient} className="btn-admin w-full">
                Criar e Selecionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
