"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-admin-text">Agências</h2>
        <button onClick={() => setOpen(true)} className="btn-admin flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Agência
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-admin-text">Nova Agência</h3>
              <button onClick={() => setOpen(false)} className="text-admin-muted hover:text-admin-text transition">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-3">
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Nome</label>
                <input className="admin-input w-full" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Contato</label>
                  <input className="admin-input w-full" required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Email</label>
                  <input className="admin-input w-full" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
                  <input className="admin-input w-full" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Comissão (%)</label>
                  <input className="admin-input w-full" type="number" min={0} max={100} required value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2 text-sm transition">
                  Cancelar
                </button>
                <button type="submit" className="btn-admin">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-admin-card border border-admin-border rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-admin-muted text-center py-8">Carregando...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-admin-border">
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Nome</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Contato</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Telefone</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Comissão%</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {agencies.map((agency) => (
                <tr key={agency.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                  <td className="px-4 py-3 text-admin-text font-medium">{agency.name}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{agency.contact_name}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{agency.email}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{agency.phone}</td>
                  <td className="px-4 py-3 text-admin-gold font-bold">{agency.commission_pct}%</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card-hover transition">
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
        )}
      </div>
    </div>
  );
}
