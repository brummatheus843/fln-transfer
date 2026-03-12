"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/formatters";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Client, Agency } from "@/lib/types";

export default function ClientsPage() {
  const supabase = createClient();
  const [clients, setClients] = useState<Client[]>([]);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    document: "",
    agency_id: "",
    notes: "",
  });

  async function fetchData() {
    const [clientsRes, agenciesRes] = await Promise.all([
      supabase.from("clients").select("*, agency:agencies(id, name)").order("created_at", { ascending: false }),
      supabase.from("agencies").select("*").order("name"),
    ]);
    if (clientsRes.error) {
      toast.error("Erro ao carregar clientes");
      return;
    }
    setClients(clientsRes.data ?? []);
    setAgencies(agenciesRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("clients").insert({
      name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      document: form.document || null,
      agency_id: form.agency_id || null,
      notes: form.notes || null,
    });
    if (error) {
      toast.error("Erro ao cadastrar cliente");
      return;
    }
    setForm({ name: "", email: "", phone: "", document: "", agency_id: "", notes: "" });
    setOpen(false);
    toast.success("Cliente cadastrado com sucesso!");
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover cliente");
      return;
    }
    toast.success("Cliente removido com sucesso!");
    fetchData();
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-admin-text">Clientes</h2>
        <button onClick={() => setOpen(true)} className="btn-admin flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-admin-border flex items-center justify-between">
              <h3 className="text-lg font-bold text-admin-text">Novo Cliente</h3>
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
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Email</label>
                  <input className="admin-input w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
                  <input className="admin-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Documento</label>
                  <input className="admin-input w-full" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Agência</label>
                  <select className="admin-input w-full" value={form.agency_id} onChange={(e) => setForm({ ...form, agency_id: e.target.value })}>
                    <option value="">Selecione</option>
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Observações</label>
                <textarea className="admin-input w-full min-h-[80px] resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Email</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Telefone</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest">Agência</th>
                <th className="text-left px-4 py-2.5 text-admin-muted text-xs uppercase tracking-widest w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-admin-border/50 hover:bg-admin-card-hover transition">
                  <td className="px-4 py-3 text-admin-text font-medium">{client.name}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{client.email}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{client.phone ? formatPhone(client.phone) : "—"}</td>
                  <td className="px-4 py-3 text-admin-text-dim">{client.agency?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card-hover transition">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(client.id)}>
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
