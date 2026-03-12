"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/formatters";
import { Plus, Pencil, Trash2, X, Building2, Phone, Mail } from "lucide-react";
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
      <div className="flex items-center justify-between mb-4 gap-2">
        <h2 className="text-lg md:text-2xl font-bold text-admin-text">Clientes</h2>
        <button onClick={() => setOpen(true)} className="btn-admin flex items-center gap-2 text-xs md:text-sm whitespace-nowrap">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Cliente</span>
          <span className="sm:hidden">Novo</span>
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-admin-card border border-admin-border rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3 border-b border-admin-border flex items-center justify-between sticky top-0 bg-admin-card z-10">
              <h3 className="text-lg font-bold text-admin-text">Novo Cliente</h3>
              <button onClick={() => setOpen(false)} className="text-admin-muted hover:text-admin-text transition p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Nome</label>
                <input className="admin-input w-full" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Email</label>
                  <input className="admin-input w-full" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">Telefone</label>
                  <input className="admin-input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 bg-admin-card border border-admin-border text-admin-text-dim hover:text-admin-text hover:bg-admin-card-hover rounded-lg px-4 py-2.5 text-sm transition">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-admin py-2.5">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-admin-muted text-center py-8">Carregando...</p>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="md:hidden space-y-3">
            {clients.length === 0 ? (
              <p className="text-admin-muted text-center py-8">Nenhum cliente cadastrado.</p>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="bg-admin-card border border-admin-border rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-admin-text text-sm">{client.name}</p>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-admin-card-hover transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-admin-text-dim">
                    {client.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-admin-muted shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-admin-muted shrink-0" />
                        <span>{formatPhone(client.phone)}</span>
                      </div>
                    )}
                    {client.agency?.name && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-admin-muted shrink-0" />
                        <span>{client.agency.name}</span>
                      </div>
                    )}
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
          </div>
        </>
      )}
    </div>
  );
}
