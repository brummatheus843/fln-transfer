"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone, Car } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Driver } from "@/lib/types";

export default function DriversPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    license_plate: "",
    vehicle_model: "",
    active: true,
  });

  async function fetchDrivers() {
    const { data, error } = await supabase
      .from("drivers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar motoristas");
      return;
    }
    setDrivers(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("drivers").insert({
      full_name: form.full_name,
      phone: form.phone,
      license_plate: form.license_plate,
      vehicle_model: form.vehicle_model,
      active: form.active,
    });
    if (error) {
      toast.error("Erro ao cadastrar motorista");
      return;
    }
    setForm({ full_name: "", phone: "", license_plate: "", vehicle_model: "", active: true });
    setOpen(false);
    toast.success("Motorista cadastrado com sucesso!");
    fetchDrivers();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover motorista");
      return;
    }
    toast.success("Motorista removido com sucesso!");
    fetchDrivers();
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">Motoristas</h2>
        <button onClick={() => setOpen(true)} className="btn-admin flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Motorista</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Motorista">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Nome</label>
            <input className="admin-input w-full" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
              <input className="admin-input w-full" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Placa</label>
              <input className="admin-input w-full" required value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Veículo</label>
              <input className="admin-input w-full" required value={form.vehicle_model} onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Status</label>
              <select className="admin-input w-full" value={form.active ? "active" : "inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2.5 text-sm transition">
              Cancelar
            </button>
            <button type="submit" className="flex-1 btn-admin py-2.5">Salvar</button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {drivers.length === 0 ? (
              <p className="text-admin-muted text-center py-8">Nenhum motorista cadastrado.</p>
            ) : (
              drivers.map((driver) => (
                <div key={driver.id} className="bg-admin-card border border-admin-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-admin-text text-sm">{driver.full_name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium ${
                        driver.active
                          ? "bg-admin-green/10 text-admin-green border-admin-green/20"
                          : "bg-admin-red/10 text-admin-red border-admin-red/20"
                      }`}>
                        {driver.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card-hover transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-admin-text-dim">
                    {driver.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-admin-muted shrink-0" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Car className="h-3 w-3 text-admin-muted shrink-0" />
                      <span>{driver.vehicle_model} — {driver.license_plate}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block bg-admin-card border border-admin-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-admin-border">
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Nome</th>
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Telefone</th>
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Placa</th>
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Veículo</th>
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Status</th>
                  <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest w-[100px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                    <td className="px-4 py-3 text-admin-text font-medium">{driver.full_name}</td>
                    <td className="px-4 py-3 text-admin-text-dim">{driver.phone}</td>
                    <td className="px-4 py-3 text-admin-text-dim">{driver.license_plate}</td>
                    <td className="px-4 py-3 text-admin-text-dim">{driver.vehicle_model}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${
                        driver.active
                          ? "bg-admin-green/10 text-admin-green border-admin-green/20"
                          : "bg-admin-red/10 text-admin-red border-admin-red/20"
                      }`}>
                        {driver.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card-hover transition">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(driver.id)}>
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
