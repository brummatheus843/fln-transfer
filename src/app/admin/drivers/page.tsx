"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Phone,
  Car,
  FileText,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Driver, Profile } from "@/lib/types";
import { Modal } from "@/components/shared/Modal";

const inputClass =
  "w-full bg-admin-card border border-admin-border rounded-lg px-3 py-2 text-sm text-admin-text focus:outline-none focus:border-admin-silver/50";

export default function DriversPage() {
  const supabase = createClient();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    license_plate: "",
    vehicle_model: "",
    profile_id: "",
    active: true,
  });

  const fetchData = useCallback(async () => {
    const [drRes, prRes] = await Promise.all([
      supabase.from("drivers").select("*").order("full_name"),
      supabase.from("profiles").select("*").eq("role", "driver").order("full_name")
    ]);
    
    if (drRes.error) toast.error("Erro ao carregar motoristas");
    else setDrivers(drRes.data ?? []);
    
    if (prRes.error) toast.error("Erro ao carregar contas");
    else setProfiles(prRes.data ?? []);
    
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      cpf: form.cpf || null,
      license_plate: form.license_plate || null,
      vehicle_model: form.vehicle_model || null,
      profile_id: form.profile_id || null,
      active: form.active,
    };

    if (editingId) {
      const { error } = await supabase.from("drivers").update(payload).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
      toast.success("Motorista atualizado!");
    } else {
      const { error } = await supabase.from("drivers").insert(payload);
      if (error) { toast.error("Erro ao cadastrar: " + error.message); return; }
      toast.success("Motorista cadastrado!");
    }

    setForm({ full_name: "", phone: "", cpf: "", license_plate: "", vehicle_model: "", profile_id: "", active: true });
    setEditingId(null);
    setOpen(false);
    fetchData();
  }

  function handleEdit(driver: Driver) {
    setEditingId(driver.id);
    setForm({
      full_name: driver.full_name,
      phone: driver.phone || "",
      cpf: driver.cpf || "",
      license_plate: driver.license_plate || "",
      vehicle_model: driver.vehicle_model || "",
      profile_id: driver.profile_id || "",
      active: driver.active,
    });
    setOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("⚠️ ATENÇÃO: Tem certeza que deseja excluir este motorista? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("drivers").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir motorista");
      return;
    }
    toast.success("Motorista excluído!");
    fetchData();
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-admin-text">Motoristas</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setForm({ full_name: "", phone: "", cpf: "", license_plate: "", vehicle_model: "", profile_id: "", active: true });
            setOpen(true);
          }}
          className="btn-admin flex items-center gap-2 text-xs md:text-sm"
        >
          <Plus className="h-4 w-4" />
          Novo Motorista
        </button>
      </div>

      <Modal 
        open={open} 
        onClose={() => setOpen(false)} 
        title={editingId ? "Editar Motorista" : "Novo Motorista"} 
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Nome Completo</label>
            <input
              required
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
              <input
                className={inputClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">CPF</label>
              <input
                className={inputClass}
                value={form.cpf}
                onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Veículo (Opcional)</label>
              <input
                className={inputClass}
                value={form.vehicle_model}
                onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Placa (Opcional)</label>
              <input
                className={inputClass}
                value={form.license_plate}
                onChange={(e) => setForm({ ...form, license_plate: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Vincular Conta de Acesso</label>
            <select 
              className={inputClass}
              value={form.profile_id}
              onChange={(e) => setForm({ ...form, profile_id: e.target.value })}
            >
              <option value="">Nenhuma conta vinculada</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
              ))}
            </select>
            <p className="text-[9px] text-admin-muted mt-1 italic">* O motorista verá apenas as corridas atribuídas a ele.</p>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
              className="rounded border-admin-border bg-admin-card text-admin-silver focus:ring-admin-silver/20"
            />
            <label htmlFor="active" className="text-sm text-admin-text">Motorista Ativo</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text rounded-lg py-3 text-sm transition"
            >
              Cancelar
            </button>
            <button type="submit" className="flex-1 btn-admin py-3 text-sm font-bold">
              {editingId ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </Modal>

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <>
          <div className="md:hidden space-y-3">
            {drivers.length === 0 ? (
              <p className="text-admin-muted text-center py-8">Nenhum motorista cadastrado.</p>
            ) : (
              drivers.map((driver) => (
                <div key={driver.id} className="stat-card !p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-admin-text text-sm">{driver.full_name}</p>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border uppercase tracking-widest font-medium ${
                        driver.active
                          ? "bg-admin-green/10 text-admin-green border-admin-green/20"
                          : "bg-admin-red/10 text-admin-red border-admin-red/20"
                      }`}>
                        {driver.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition"
                        onClick={() => handleEdit(driver)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-admin-text-dim pt-3 border-t border-white/5">
                    {driver.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span>{driver.phone}</span>
                      </div>
                    )}
                    {driver.cpf && (
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span>CPF: {driver.cpf}</span>
                      </div>
                    )}
                    {driver.profile_id && (
                      <div className="flex items-center gap-2 text-admin-silver/70">
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span>Conta vinculada</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block admin-table-container">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Telefone</th>
                    <th>CPF</th>
                    <th>Conta Acesso</th>
                    <th>Status</th>
                    <th className="w-[100px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.map((driver) => (
                    <tr key={driver.id}>
                      <td className="text-admin-text font-medium">{driver.full_name}</td>
                      <td className="text-admin-text-dim">{driver.phone || "—"}</td>
                      <td className="text-admin-text-dim">{driver.cpf || "—"}</td>
                      <td className="text-admin-text-dim">
                        {profiles.find(p => p.id === driver.profile_id)?.full_name || "Não vinculada"}
                      </td>
                      <td>
                        <span className={`text-[10px] px-2.5 py-1 rounded-full border uppercase tracking-widest font-medium ${
                          driver.active
                            ? "bg-admin-green/10 text-admin-green border-admin-green/20"
                            : "bg-admin-red/10 text-admin-red border-admin-red/20"
                        }`}>
                          {driver.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button 
                            className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition"
                            onClick={() => handleEdit(driver)}
                          >
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
          </div>
        </>
      )}
    </div>
  );
}
