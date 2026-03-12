"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { CurrencySelector } from "./CurrencySelector";

export function Header() {
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop header */}
      <header className="hidden md:flex h-14 items-center gap-4 border-b border-admin-border bg-admin-dark px-6">
        <div className="flex-1" />
        <CurrencySelector />
        <button
          onClick={handleLogout}
          className="text-admin-muted hover:text-admin-red text-sm transition flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-xs">Sair</span>
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
