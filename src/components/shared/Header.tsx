"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X, Calendar, Activity, CheckCircle2 } from "lucide-react";
import { Sidebar } from "./Sidebar";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stats, setStats] = useState({ scheduled: 0, in_progress: 0, completed: 0 });

  const fetchTodayStats = useCallback(async () => {
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD local
    
    const { data, error } = await supabase
      .from("rides")
      .select("status")
      .gte("scheduled_at", `${today}T00:00:00`)
      .lte("scheduled_at", `${today}T23:59:59`);

    if (!error && data) {
      const counts = {
        scheduled: data.filter(r => r.status === "scheduled").length,
        in_progress: data.filter(r => r.status === "in_progress").length,
        completed: data.filter(r => r.status === "completed").length,
      };
      setStats(counts);
    }
  }, [supabase]);

  useEffect(() => {
    fetchTodayStats();
    // Poll every 30 seconds for real-time feel
    const interval = setInterval(fetchTodayStats, 30000);
    return () => clearInterval(interval);
  }, [fetchTodayStats]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop header */}
      <header className="hidden md:flex h-14 items-center gap-8 border-b border-admin-border bg-admin-dark px-6">
        <div className="flex-1 flex items-center gap-8">
          <div className="flex items-center gap-2 group">
            <Calendar className="h-4 w-4 text-admin-blue opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-[10px] uppercase tracking-widest text-admin-muted font-bold">Hoje:</span>
            <span className="text-sm font-black luminous-blue">
              {stats.scheduled} AGENDADAS
            </span>
          </div>

          <div className="flex items-center gap-2 group border-l border-white/5 pl-8">
            <Activity className="h-4 w-4 text-admin-orange opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-black luminous-orange uppercase">
              {stats.in_progress} EM ANDAMENTO
            </span>
          </div>

          <div className="flex items-center gap-2 group border-l border-white/5 pl-8">
            <CheckCircle2 className="h-4 w-4 text-admin-green opacity-70 group-hover:opacity-100 transition-opacity" />
            <span className="text-sm font-black luminous-green uppercase">
              {stats.completed} FINALIZADAS
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="text-admin-muted hover:text-admin-red text-sm transition flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs font-bold uppercase tracking-widest">Sair</span>
        </button>
      </header>

      {/* Mobile header */}
      <header className="flex md:hidden items-center justify-between px-4 py-3 bg-admin-dark border-b border-admin-border">
        <button
          onClick={() => setMobileOpen(true)}
          className="text-admin-text-dim hover:text-admin-text p-1"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-black shimmer-silver tracking-tight">
          FLN TRANSFER
        </h1>
        <button
          onClick={handleLogout}
          className="text-admin-muted hover:text-admin-red p-1"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-64 animate-slide-in">
            <Sidebar onClose={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-admin-muted hover:text-admin-text"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
