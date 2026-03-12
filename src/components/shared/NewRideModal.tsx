"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Agency } from "@/lib/types";
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
  const [form, setForm] = useState({
    client_name: "", agency_id: "", origin: "", destination: "",
    date: "", time: "", pax_count: "1", currency: "BRL", price: "", notes: "",
  });

  function setField(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  useEffect(() => {
    if (!open) return;
    supabase.from("agencies").select("id, name").order("name").then(({ data }) => setAgencies(data ?? []));
  }, [open]);

  const handleCreate = useCallback(async () => {
    let clientId: string | null = null;
    const name = form.client_name.trim();
    if (name) {
      const { data: existing } = await supabase.from("clients").select("id").ilike("name", name).limit(1).single();
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: newClient, error: clientErr } = await supabase.from("clients").insert({ name, agency_id: form.agency_id || null }).select("id").single();
        if (clientErr) { toast.error("Erro ao criar cliente"); return; }
        clientId = newClient.id;
      }
    }

    let scheduled_at: string;
    if (form.date && form.time) scheduled_at = `${form.date}T${form.time}:00`;
    else if (form.date) scheduled_at = `${form.date}T00:00:00`;
    else scheduled_at = new Date().toISOString();

    const { error } = await supabase.from("rides").insert({
      client_id: clientId,
      agency_id: form.agency_id || null,
      origin: form.origin || "",
      destination: form.destination || "",
      scheduled_at,
      pax_count: Number(form.pax_count) || 1,
      currency: form.currency || "BRL",
      price: Number(form.price) || 0,
      notes: form.notes || null,
      status: "scheduled",
    });
    if (error) { toast.error("Erro ao criar corrida: " + error.message); return; }
    toast.success("Corrida criada!");
    setForm({ client_name: "", agency_id: "", origin: "", destination: "", date: "", time: "", pax_count: "1", currency: "BRL", price: "", notes: "" });
    onCreated();
    onClose();
  }, [form, onClose, onCreated]);

  return (
    <Modal open={open} onClose={onClose} title="Nova Corrida" maxWidth="max-w-lg">
      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Cliente</label>
          <input value={form.client_name} onChange={(e) => setField("client_name", e.target.value)} className={inputClass} placeholder="Digite o nome do cliente" />
          <p className="text-[10px] text-admin-muted mt-0.5">Se não existir, será cadastrado automaticamente</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Agência</label>
            <select value={form.agency_id} onChange={(e) => setField("agency_id", e.target.value)} className={inputClass}>
              <option value="">Sem agência</option>
              {agencies.map((a) => (<option key={a.id} value={a.id}>{a.name}</option>))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Data</label>
            <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Hora</label>
            <input type="time" value={form.time} onChange={(e) => setField("time", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Origem</label>
            <input value={form.origin} onChange={(e) => setField("origin", e.target.value)} className={inputClass} placeholder="Ex: Aeroporto FLN" />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Destino</label>
            <input value={form.destination} onChange={(e) => setField("destination", e.target.value)} className={inputClass} placeholder="Ex: Jurerê Internacional" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Passageiros</label>
            <input type="number" min={1} value={form.pax_count} onChange={(e) => setField("pax_count", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Moeda</label>
            <select value={form.currency} onChange={(e) => setField("currency", e.target.value)} className={inputClass}>
              <option value="BRL">R$</option>
              <option value="USD">US$</option>
              <option value="EUR">€</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Valor</label>
            <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setField("price", e.target.value)} className={inputClass} placeholder="0,00" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1 block">Observações</label>
          <textarea value={form.notes} onChange={(e) => setField("notes", e.target.value)} rows={2} className={`${inputClass} resize-none`} placeholder="Informações adicionais..." />
        </div>
        <button onClick={handleCreate} className="btn-admin w-full py-2.5 mt-1">Criar Corrida</button>
      </div>
    </Modal>
  );
}
