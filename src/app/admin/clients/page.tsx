"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatPhone } from "@/lib/formatters";
import { Plus, Pencil, Trash2, Building2, Phone, Mail } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
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

  const fetchData = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

      <Modal open={open} onClose={() => setOpen(false)} title="Novo Cliente">
        <form onSubmit={handleSubmit} className="space-y-3">
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
      </Modal>

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
                <div key={client.id} className="stat-card !p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p className="font-semibold text-admin-text text-sm">{client.name}</p>
                    <div className="flex gap-1 shrink-0">
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-red hover:bg-admin-red/10 transition" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-admin-text-dim pt-3 border-t border-white/5">
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span>{formatPhone(client.phone)}</span>
                      </div>
                    )}
                    {client.agency?.name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-admin-muted shrink-0" />
                        <span>{client.agency.name}</span>
                      </div>
                    )}
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
                    <th>Email</th>
                    <th>Telefone</th>
                    <th>Agência</th>
                    <th className="w-[100px]">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td className="text-admin-text font-medium">{client.name}</td>
                      <td className="text-admin-text-dim">{client.email}</td>
                      <td className="text-admin-text-dim">{client.phone ? formatPhone(client.phone) : "—"}</td>
                      <td className="text-admin-text-dim">{client.agency?.name ?? "—"}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="p-1.5 rounded-lg text-admin-muted hover:text-admin-text hover:bg-white/5 transition">
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
          </div>
        </>
      )}
    </div>
  );
}
