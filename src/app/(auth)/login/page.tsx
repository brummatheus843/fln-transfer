"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciais inválidas");
      setLoading(false);
      return;
    }

    // Middleware will redirect based on role
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-admin-black flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-admin-card border border-admin-border rounded-2xl w-full max-w-sm p-8">
        <h1 className="shimmer-gold text-2xl font-black tracking-tight text-center mb-1">
          FLN Transfer
        </h1>
        <p className="text-admin-muted text-xs text-center uppercase tracking-widest mb-6">
          Entre com suas credenciais
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="admin-input w-full"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-[10px] text-admin-muted uppercase tracking-widest mb-1.5 block">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="admin-input w-full"
            />
          </div>
          {error && (
            <p className="text-admin-red text-xs">{error}</p>
          )}
          <button type="submit" className="btn-admin w-full py-2.5" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
