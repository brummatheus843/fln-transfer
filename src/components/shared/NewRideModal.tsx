"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Agency, Driver } from "@/lib/types";
import { Modal } from "./Modal";

const inputClass =
  "w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-silver/50";

interface NewRideModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function NewRideModal({ open, onClose, onCreated }: NewRideModalProps) {
  const supabase = createClient();
  const [agencies, setAgencies] = useState<Pick<Agency, "id" | "name">[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [showDriverSuggestions, setShowDriverSuggestions] = useState(false);
  const [form, setForm] = useState({
    client_name: "", 
    agency_id: "", 
    driver_name: "",
    driver_phone: "",
    origin: "", 
    destination: "",
    date: "", 
    time: "", 
    pax_count: "1", 
    currency: "BRL", 
    price: "", 
    notes: "",
  });

  const suggestionsRef = useRef<HTMLDivElement>(null);

  function setField(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  useEffect(() => {
    if (!open) return;
    supabase.from("agencies").select("id, name").order("name").then(({ data }) => setAgencies(data ?? []));
    supabase.from("drivers").select("*").order("full_name").then(({ data }) => setDrivers(data ?? []));
  }, [open, supabase]);

  const filteredDrivers = drivers.filter(d => 
    d.full_name.toLowerCase().includes(form.driver_name.toLowerCase())
  );

  const handleCreate = useCallback(async () => {
    // 1. Find or create Client
    let clientId: string | null = null;
    const clientName = form.client_name.trim();
    if (clientName) {
      const { data: existing } = await supabase.from("clients").select("id").ilike("name", clientName).limit(1).single();
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase.from("clients").insert({ 
          name: clientName, 
          agency_id: form.agency_id || null 
        }).select("id").single();
        if (clientErr) { toast.error("Erro ao criar cliente"); return; }
        clientId = newClient.id;
      }
    }

    // 2. Find or create Driver
    let driverId: string | null = null;
    const drName = form.driver_name.trim();
    if (drName) {
      const existing = drivers.find(d => d.full_name.toLowerCase() === drName.toLowerCase());
      if (existing) {
        driverId = existing.id;
      } else {
        const { data: newDr, error: drErr } = await supabase.from("drivers").insert({ 
          full_name: drName,
          phone: form.driver_phone || null,
          active: true
        }).select("id").single();
        if (drErr) { toast.error("Erro ao cadastrar novo motorista"); return; }
        driverId = newDr.id;
      }
    }

    let scheduled_at: string;
    if (form.date && form.time) scheduled_at = `${form.date}T${form.time}:00`;
    else if (form.date) scheduled_at = `${form.date}T00:00:00`;
    else scheduled_at = new Date().toISOString();

    const { error } = await supabase.from("rides").insert({
      client_id: clientId,
      driver_id: driverId,
      agency_id: form.agency_id || null,
      origin: form.origin || "",
      destination: form.destination || "",
      scheduled_at,
      pax_count: Number(form.pax_count) || 1,
      currency: form.currency || "BRL",
      price: Number(form.price) || 0,
      notes: form.notes || null,
      status: "scheduled",
      financial_status: "pending",
    });

    if (error) { toast.error("Erro ao criar corrida: " + error.message); return; }
    
    toast.success("Corrida criada!");
    setForm({ client_name: "", agency_id: "", driver_name: "", driver_phone: "", origin: "", destination: "", date: "", time: "", pax_count: "1", currency: "BRL", price: "", notes: "" });
    onCreated();
    onClose();
  }, [form, onClose, onCreated, supabase, drivers]);

  return (
    <Modal open={open} onClose={onClose} title="Nova Corrida" maxWidth="max-w-lg">
      <div className="space-y-4">
        {/* Cliente */}
        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Cliente</label>
          <input value={form.client_name} onChange={(e) => setField("client_name", e.target.value)} className={inputClass} placeholder="Nome do cliente" />
        </div>

        {/* Motorista com Auto-complete */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Motorista</label>
            <input 
              value={form.driver_name} 
              onChange={(e) => {
                setField("driver_name", e.target.value);
                setShowDriverSuggestions(true);
              }}
              onFocus={() => setShowDriverSuggestions(true)}
              onBlur={() => setTimeout(() => setShowDriverSuggestions(false), 200)}
              className={inputClass} 
              placeholder="Nome do motorista" 
            />
            {showDriverSuggestions && form.driver_name && filteredDrivers.length > 0 && (
              <div ref={suggestionsRef} className="absolute z-50 w-full mt-1 bg-admin-dark border border-admin-border rounded-xl shadow-2xl overflow-hidden">
                {filteredDrivers.map(d => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setField("driver_name", d.full_name);
                      setField("driver_phone", d.phone || "");
                      setShowDriverSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-admin-text hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  >
                    {d.full_name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone Motorista</label>
            <input 
              value={form.driver_phone} 
              onChange={(e) => setField("driver_phone", e.target.value)} 
              className={inputClass} 
              placeholder="(00) 00000-0000" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Agência</label>
            <select value={form.agency_id} onChange={(e) => setField("agency_id", e.target.value)} className={inputClass}>
              <option value="">Sem agência</option>
              {agencies.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Data</label>
            <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Hora</label>
            <input type="time" value={form.time} onChange={(e) => setField("time", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Origem</label>
            <input value={form.origin} onChange={(e) => setField("origin", e.target.value)} className={inputClass} placeholder="Ex: Aeroporto FLN" />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Destino</label>
            <input value={form.destination} onChange={(e) => setField("destination", e.target.value)} className={inputClass} placeholder="Ex: Jurerê Internacional" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Pax</label>
            <input type="number" min={1} value={form.pax_count} onChange={(e) => setField("pax_count", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Moeda</label>
            <select value={form.currency} onChange={(e) => setField("currency", e.target.value)} className={inputClass}>
              <option value="BRL">R$</option>
              <option value="USD">US$</option>
              <option value="EUR">€</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Valor</label>
            <input type="number" value={form.price} onChange={(e) => setField("price", e.target.value)} className={inputClass} placeholder="0.00" />
          </div>
        </div>

        <button onClick={handleCreate} className="btn-admin w-full py-3 mt-4 font-bold text-sm uppercase tracking-widest">
          Agendar Corrida
        </button>
      </div>
    </Modal>
  );
}
