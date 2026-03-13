"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { Ride, Client, Driver, Agency } from "@/lib/types";
import { Modal } from "@/components/shared/Modal";

const inputClass =
  "w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-silver/50";

export default function EditRidePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
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
    status: "scheduled",
  });

  const fetchData = useCallback(async () => {
    const [rideRes, clientsRes, driversRes, agenciesRes] = await Promise.all([
      supabase.from("rides").select("*").eq("id", id).single(),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("drivers").select("id, full_name").eq("active", true).order("full_name"),
      supabase.from("agencies").select("id, name").order("name"),
    ]);

    if (rideRes.data) {
      const r = rideRes.data;
      setForm({
        client_id: r.client_id || "",
        driver_id: r.driver_id || "",
        agency_id: r.agency_id || "",
        origin: r.origin || "",
        destination: r.destination || "",
        scheduled_at: r.scheduled_at ? r.scheduled_at.slice(0, 16) : "",
        pax_count: r.pax_count || 1,
        price: r.price || 0,
        currency: r.currency || "BRL",
        notes: r.notes || "",
        status: r.status || "scheduled",
      });
    }
    
    setClients(clientsRes.data ?? []);
    setDrivers(driversRes.data ?? []);
    setAgencies(agenciesRes.data ?? []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase
      .from("rides")
      .update({
        client_id: form.client_id || null,
        driver_id: form.driver_id || null,
        agency_id: form.agency_id || null,
        origin: form.origin,
        destination: form.destination,
        scheduled_at: form.scheduled_at,
        pax_count: Number(form.pax_count),
        price: Number(form.price),
        currency: form.currency,
        notes: form.notes || null,
        status: form.status,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar corrida");
      return;
    }

    toast.success("Corrida atualizada com sucesso!");
    router.push(`/admin/rides/${id}`);
  }

  if (loading) return <p className="text-admin-muted text-center py-8">Carregando...</p>;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h2 className="text-xl md:text-2xl font-bold text-admin-text mb-6">Editar Corrida</h2>
      
      <form onSubmit={handleSubmit} className="bg-admin-card border border-admin-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Cliente</label>
            <select className={inputClass} value={form.client_id} onChange={(e) => handleChange("client_id", e.target.value)}>
              <option value="">Selecione</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Motorista</label>
            <select className={inputClass} value={form.driver_id} onChange={(e) => handleChange("driver_id", e.target.value)}>
              <option value="">Selecione</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Agência</label>
            <select className={inputClass} value={form.agency_id} onChange={(e) => handleChange("agency_id", e.target.value)}>
              <option value="">Sem agência</option>
              {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Status</label>
            <select className={inputClass} value={form.status} onChange={(e) => handleChange("status", e.target.value)}>
              <option value="scheduled">Agendada</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Finalizada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Origem</label>
            <input className={inputClass} value={form.origin} onChange={(e) => handleChange("origin", e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Destino</label>
            <input className={inputClass} value={form.destination} onChange={(e) => handleChange("destination", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Data e Hora</label>
            <input className={inputClass} type="datetime-local" value={form.scheduled_at} onChange={(e) => handleChange("scheduled_at", e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Passageiros</label>
            <input className={inputClass} type="number" value={form.pax_count} onChange={(e) => handleChange("pax_count", e.target.value)} required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Valor</label>
            <input className={inputClass} type="number" step="0.01" value={form.price} onChange={(e) => handleChange("price", e.target.value)} required />
          </div>
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Moeda</label>
            <select className={inputClass} value={form.currency} onChange={(e) => handleChange("currency", e.target.value)}>
              <option value="BRL">Real (BRL)</option>
              <option value="USD">Dólar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Observações</label>
          <textarea className={`${inputClass} min-h-[100px]`} value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={() => router.back()} className="flex-1 bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2.5 text-sm transition">
            Cancelar
          </button>
          <button type="submit" className="flex-1 btn-admin py-2.5">
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
