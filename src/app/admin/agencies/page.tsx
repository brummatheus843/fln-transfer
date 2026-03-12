"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Phone, Mail, Percent } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { createClient } from "@/lib/supabase/client";
import type { Agency } from "@/lib/types";

export default function AgenciesPage() {
  const supabase = createClient();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    email: "",
    phone: "",
    commission_pct: "",
  });

  async function fetchAgencies() {
    const { data, error } = await supabase
      .from("agencies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar agências");
      return;
    }
    setAgencies(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchAgencies();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("agencies").insert({
      name: form.name,
      contact_name: form.contact_name,
      email: form.email,
      phone: form.phone,
      commission_pct: Number(form.commission_pct),
    });
    if (error) {
      toast.error("Erro ao cadastrar agência");
      return;
    }
    setForm({ name: "", contact_name: "", email: "", phone: "", commission_pct: "" });
    setOpen(false);
    toast.success("Agência cadastrada com sucesso!");
    fetchAgencies();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("agencies").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover agência");
      return;
    }
    toast.success("Agência removida com sucesso!");
    fetchAgencies();
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">Agências</h2>
        <button onClick={() => setOpen(true)} className="btn-admin flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Agência</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nova Agência">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Nome</label>
            <input className="admin-input w-full" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Contato</label>
              <input className="admin-input w-full" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Email</label>
              <input className="admin-input w-full" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
              <input className="admin-input w-full" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Comissão (%)</label>
              <input className="admin-input w-full" type="number" min={0} max={100} required value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
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
            {agencies.length === 0 ? (
              <p className="text-admin-muted text-center py-8">Nenhuma agência cadastrada.</p>
            ) : (
              agencies.map((agency) => (
                <div key={agency.id} className="stat-card !p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-admin-text text-sm">{agency.name}</p>
                      {agency.contact_name && <p className="text-xs text-admin-muted">{agency.contact_name}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(agency.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-admin-text-dim pt-3 border-t border-white/5">
                    {agency.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span className="truncate">{agency.email}</span>
                      </div>
                    )}
                    {agency.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span>{agency.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Percent className="h-3.5 w-3.5 text-admin-silver shrink-0" />
                      <span className="text-admin-silver font-bold">{agency.commission_pct}% comissão</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block admin-table-container">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Contato</th>
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Comissão%</th>
                    <th className="w-[100px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {agencies.map((agency) => (
                    <tr key={agency.id}>
                      <td className="text-admin-text font-medium">{agency.name}</td>
                      <td className="text-admin-text-dim">{agency.contact_name}</td>
                      <td className="text-admin-text-dim">{agency.email}</td>
                      <td className="text-admin-text-dim">{agency.phone}</td>
                      <td className="text-admin-silver font-bold">{agency.commission_pct}%</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(agency.id)}>
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
