"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, addDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale/pt-BR";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus, ChevronLeft, ChevronRight, MapPin, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { statusLabels, statusColors, formatCurrency } from "@/lib/formatters";
import type { RideStatus } from "@/lib/formatters";
import { createClient } from "@/lib/supabase/client";
import type { Ride } from "@/lib/types";
import { NewRideModal } from "@/components/shared/NewRideModal";

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

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

type CalendarEvent = { title: string; start: Date; end: Date; status: RideStatus };

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ── Mobile Calendar ──
function MobileAgenda({
  rides,
  selectedDate,
  onSelectDate,
}: {
  rides: Ride[];
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const dayRides = useMemo(
    () =>
      rides
        .filter((r) => isSameDay(new Date(r.scheduled_at), selectedDate))
        .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [rides, selectedDate]
  );

  const daysWithRides = useMemo(() => {
    const set = new Set<string>();
    rides.forEach((r) => set.add(r.scheduled_at.slice(0, 10)));
    return set;
  }, [rides]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setWeekStart((p) => addDays(p, -7))} className="p-2 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card transition">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-admin-text">
          {format(weekDays[0], "dd MMM", { locale: ptBR })} — {format(weekDays[6], "dd MMM yyyy", { locale: ptBR })}
        </span>
        <button onClick={() => setWeekStart((p) => addDays(p, 7))} className="p-2 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card transition">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          const hasRides = daysWithRides.has(format(day, "yyyy-MM-dd"));
          return (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`flex flex-col items-center py-2 rounded-xl transition text-center ${
                isSelected
                  ? "bg-admin-silver/15 border border-admin-silver/30"
                  : isToday
                  ? "bg-admin-card border border-admin-border"
                  : "border border-transparent hover:bg-admin-card"
              }`}
            >
              <span className="text-[10px] text-admin-muted uppercase">{WEEKDAYS[day.getDay()]}</span>
              <span className={`text-sm font-bold mt-0.5 ${isSelected ? "text-admin-silver" : isToday ? "text-admin-text" : "text-admin-text-dim"}`}>
                {day.getDate()}
              </span>
              {hasRides && <span className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? "bg-admin-silver" : "bg-admin-muted"}`} />}
            </button>
          );
        })}
      </div>

      <h3 className="text-xs text-admin-muted uppercase tracking-widest mb-3">
        {isSameDay(selectedDate, today) ? "Hoje" : format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        {" "}— {dayRides.length} corrida{dayRides.length !== 1 ? "s" : ""}
      </h3>

      {dayRides.length === 0 ? (
        <div className="bg-admin-card border border-admin-border rounded-xl p-6 text-center">
          <p className="text-admin-muted text-sm">Nenhuma corrida agendada</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {dayRides.map((ride) => (
            <div key={ride.id} className="bg-admin-card border border-admin-border rounded-xl p-3.5 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3.5 w-3.5 text-admin-silver" />
                    <span className="text-sm font-bold text-admin-silver">{format(new Date(ride.scheduled_at), "HH:mm")}</span>
                  </div>
                  <span className="text-sm font-medium text-admin-text truncate">{ride.client?.name ?? "—"}</span>
                </div>
                <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium whitespace-nowrap shrink-0 ${statusColors[ride.status]}`}>
                  {statusLabels[ride.status]}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-admin-text-dim">
                <MapPin className="h-3 w-3 shrink-0 text-admin-muted" />
                <span className="truncate">{ride.origin} → {ride.destination}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 text-admin-muted">
                  <Users className="h-3 w-3" />
                  <span>{ride.pax_count} pax</span>
                </div>
                {Number(ride.price) > 0 && (
                  <span className="font-bold text-admin-silver">{formatCurrency(Number(ride.price), ride.currency)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──
export default function AgendaPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [showRideModal, setShowRideModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  async function fetchData() {
    const { data, error } = await supabase
      .from("rides")
      .select("*, client:clients(name)")
      .order("scheduled_at");
    if (error) {
      toast.error("Erro ao carregar agenda");
      return;
    }
    setRides(data ?? []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calEvents: CalendarEvent[] = (data ?? []).map((r: any) => {
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
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const eventStyleGetter = useCallback(
    (event: CalendarEvent) => ({
      style: {
        background: statusEventColors[event.status],
        border: `1px solid ${statusBorderColors[event.status]}`,
        color: "#e0e0e0",
        borderRadius: "4px",
        fontSize: "11px",
      },
    }),
    []
  );

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

      {/* Mobile */}
      <div className="md:hidden">
        <MobileAgenda rides={rides} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-admin-card border border-admin-border rounded-xl p-5 overflow-hidden">
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
        <div style={{ minHeight: 600 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            culture="pt-BR"
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day"]}
            defaultView="month"
          />
        </div>
      </div>

      <NewRideModal
        open={showRideModal}
        onClose={() => setShowRideModal(false)}
        onCreated={() => fetchData()}
      />
    </div>
  );
}
