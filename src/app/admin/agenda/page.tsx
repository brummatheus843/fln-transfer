"use client";

import { useState, useCallback, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { RideStatus } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Agency } from "@/lib/types";

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

const inputClass =
  "w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-gold/50";

export default function AgendaPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [agencies, setAgencies] = useState<Pick<Agency, "id" | "name">[]>([]);
  const [loading, setLoading] = useState(true);

  const [rideForm, setRideForm] = useState({
    client_name: "",
    agency_id: "",
    origin: "",
    destination: "",
    date: "",
    time: "",
    pax_count: "1",
    currency: "BRL",
    price: "",
    notes: "",
  });

  function setField(field: string, value: string) {
    setRideForm((p) => ({ ...p, [field]: value }));
  }

  async function fetchData() {
    const [ridesRes, agenciesRes] = await Promise.all([
      supabase.from("rides").select("*, client:clients(name)").order("scheduled_at"),
      supabase.from("agencies").select("id, name").order("name"),
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
        title: `${r.client?.name ?? "—"} — ${r.origin} → ${r.destination}`,
        start,
        end,
        status: r.status as RideStatus,
      };
    });
    setEvents(calEvents);
    setAgencies(agenciesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRide = useCallback(async () => {
    if (!rideForm.client_name.trim() || !rideForm.origin || !rideForm.destination || !rideForm.date || !rideForm.time) {
      toast.error("Preencha os campos obrigatórios: Cliente, Origem, Destino, Data e Hora");
      return;
    }

    // Auto-create client by name
    let clientId: string | null = null;
    const name = rideForm.client_name.trim();

    // Check if client already exists
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .ilike("name", name)
      .limit(1)
      .single();

    if (existing) {
      clientId = existing.id;
    } else {
      // Create new client
      const { data: newClient, error: clientErr } = await supabase
        .from("clients")
        .insert({ name, agency_id: rideForm.agency_id || null })
        .select("id")
        .single();
      if (clientErr) {
        toast.error("Erro ao criar cliente");
        return;
      }
      clientId = newClient.id;
    }

    const scheduled_at = `${rideForm.date}T${rideForm.time}:00`;
    const { error } = await supabase.from("rides").insert({
      client_id: clientId,
      agency_id: rideForm.agency_id || null,
      origin: rideForm.origin,
      destination: rideForm.destination,
      scheduled_at,
      pax_count: Number(rideForm.pax_count) || 1,
      currency: rideForm.currency,
      price: Number(rideForm.price) || 0,
      notes: rideForm.notes || null,
      status: "scheduled",
      financial_status: "pending",
    });
    if (error) {
      toast.error("Erro ao criar corrida");
      return;
    }
    toast.success("Corrida criada!");
    setRideForm({ client_name: "", agency_id: "", origin: "", destination: "", date: "", time: "", pax_count: "1", currency: "BRL", price: "", notes: "" });
    setShowRideModal(false);
    fetchData();
  }, [rideForm]);

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

      {/* Modal Nova Corrida */}
      {showRideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowRideModal(false)}>
          <div className="bg-admin-dark border border-admin-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 md:p-6 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-admin-text">Nova Corrida</h3>
              <button onClick={() => setShowRideModal(false)} className="text-admin-muted hover:text-admin-text p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* 1 — Cliente (texto livre) */}
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Cliente *</label>
                <input
                  value={rideForm.client_name}
                  onChange={(e) => setField("client_name", e.target.value)}
                  className={inputClass}
                  placeholder="Digite o nome do cliente"
                />
                <p className="text-[10px] text-admin-muted mt-0.5">Se não existir, será cadastrado automaticamente</p>
              </div>

              {/* 2 — Agência + Data/Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Agência</label>
                  <select
                    value={rideForm.agency_id}
                    onChange={(e) => setField("agency_id", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sem agência</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Data *</label>
                  <input type="date" value={rideForm.date} onChange={(e) => setField("date", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Hora *</label>
                  <input type="time" value={rideForm.time} onChange={(e) => setField("time", e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* 3 — Origem + Destino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Origem *</label>
                  <input value={rideForm.origin} onChange={(e) => setField("origin", e.target.value)} className={inputClass} placeholder="Ex: Aeroporto FLN" />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Destino *</label>
                  <input value={rideForm.destination} onChange={(e) => setField("destination", e.target.value)} className={inputClass} placeholder="Ex: Jurerê Internacional" />
                </div>
              </div>

              {/* 4 — Passageiros + Moeda/Valor */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Passageiros</label>
                  <input type="number" min={1} value={rideForm.pax_count} onChange={(e) => setField("pax_count", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Moeda</label>
                  <select value={rideForm.currency} onChange={(e) => setField("currency", e.target.value)} className={inputClass}>
                    <option value="BRL">R$</option>
                    <option value="USD">US$</option>
                    <option value="EUR">€</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Valor</label>
                  <input type="number" min={0} step={0.01} value={rideForm.price} onChange={(e) => setField("price", e.target.value)} className={inputClass} placeholder="0,00" />
                </div>
              </div>

              {/* 5 — Observações */}
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Observações</label>
                <textarea value={rideForm.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Informações adicionais..." />
              </div>

              {/* Botão */}
              <button onClick={handleCreateRide} className="btn-admin w-full py-2.5 mt-1">
                Criar Corrida
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
