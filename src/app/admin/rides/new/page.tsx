"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Client, Driver, Agency } from "@/lib/types";

export default function NewRidePage() {
  const supabase = createClient();
  const router = useRouter();
  const [clients, setClients] = useState<Pick<Client, "id" | "name">[]>([]);
  const [drivers, setDrivers] = useState<Pick<Driver, "id" | "full_name">[]>([]);
  const [agencies, setAgencies] = useState<Pick<Agency, "id" | "name">[]>([]);
  const [form, setForm] = useState({
    client_id: "",
    driver_id: "",
    agency_id: "",
    origin: "",
    destination: "",
    scheduled_at: "",
    pax_count: 1,
    price: 0,
    currency: "BRL",
    notes: "",
  });

  useEffect(() => {
    async function fetchOptions() {
      const [c, d, a] = await Promise.all([
        supabase.from("clients").select("id, name").order("name"),
        supabase.from("drivers").select("id, full_name").eq("active", true).order("full_name"),
        supabase.from("agencies").select("id, name").order("name"),
      ]);
      setClients(c.data ?? []);
      setDrivers(d.data ?? []);
      setAgencies(a.data ?? []);
    }
    fetchOptions();
  }, []);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("rides").insert({
      client_id: form.client_id || null,
      driver_id: form.driver_id || null,
      agency_id: form.agency_id || null,
      origin: form.origin,
      destination: form.destination,
      scheduled_at: form.scheduled_at,
      pax_count: form.pax_count,
      price: form.price,
      currency: form.currency,
      notes: form.notes || null,
      status: "scheduled",
      financial_status: "pending",
    });
    if (error) {
      toast.error("Erro ao criar corrida");
      return;
    }
    toast.success("Corrida criada!");
    router.push("/admin/rides");
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Nova Corrida</h2>

      <div className="bg-admin-card border border-admin-border rounded-xl p-6">
        <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="client" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Cliente</label>
            <select id="client" value={form.client_id} onChange={(e) => handleChange("client_id", e.target.value)} className="admin-input w-full">
              <option value="">Selecione o cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="driver" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Motorista</label>
            <select id="driver" value={form.driver_id} onChange={(e) => handleChange("driver_id", e.target.value)} className="admin-input w-full">
              <option value="">Selecione o motorista</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="agency" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Agência (opcional)</label>
            <select id="agency" value={form.agency_id} onChange={(e) => handleChange("agency_id", e.target.value)} className="admin-input w-full">
              <option value="">Selecione a agência</option>
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="origin" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Origem</label>
            <input id="origin" type="text" value={form.origin} onChange={(e) => handleChange("origin", e.target.value)} placeholder="Ex: Aeroporto de Florianópolis" className="admin-input w-full" />
          </div>

          <div>
            <label htmlFor="destination" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Destino</label>
            <input id="destination" type="text" value={form.destination} onChange={(e) => handleChange("destination", e.target.value)} placeholder="Ex: Hotel Majestic Palace" className="admin-input w-full" />
          </div>

          <div>
            <label htmlFor="scheduled_at" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Data e Hora</label>
            <input id="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={(e) => handleChange("scheduled_at", e.target.value)} className="admin-input w-full" />
          </div>

          <div>
            <label htmlFor="pax_count" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Passageiros</label>
            <input id="pax_count" type="number" min={1} value={form.pax_count} onChange={(e) => handleChange("pax_count", Number(e.target.value))} className="admin-input w-full" />
          </div>

          <div>
            <label htmlFor="price" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Valor</label>
            <input id="price" type="number" min={0} step={0.01} value={form.price} onChange={(e) => handleChange("price", Number(e.target.value))} className="admin-input w-full" />
          </div>

          <div>
            <label htmlFor="currency" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Moeda</label>
            <select id="currency" value={form.currency} onChange={(e) => handleChange("currency", e.target.value)} className="admin-input w-full">
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="notes" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Observações</label>
            <textarea id="notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Observações sobre a corrida..." rows={3} className="admin-input w-full" />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => router.back()} className="bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2 text-sm transition">
              Cancelar
            </button>
            <button type="submit" className="btn-admin">
              Criar Corrida
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
