"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Wallet,
  Car,
  MoreHorizontal,
  Users,
  Building2,
  UserCog,
  FileText,
  Receipt,
  X,
} from "lucide-react";

const mainTabs = [
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/rides", label: "Corridas", icon: Car },
  { href: "/admin/clients", label: "Clientes", icon: Users },
];

const moreTabs = [
  { href: "/admin/agencies", label: "Agências", icon: Building2 },
  { href: "/admin/drivers", label: "Motoristas", icon: UserCog },
  { href: "/admin/reports", label: "Relatórios", icon: FileText },
  { href: "/admin/nf", label: "Notas Fiscais", icon: Receipt },
];

export function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const moreActive = moreTabs.some((t) => pathname.startsWith(t.href));

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute bottom-16 left-0 right-0 bg-admin-dark border-t border-admin-border rounded-t-2xl p-4 space-y-1 animate-slide-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-admin-muted uppercase tracking-wider">Mais opções</span>
              <button onClick={() => setShowMore(false)} className="text-admin-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            {moreTabs.map((tab) => {
              const Icon = tab.icon;
              const active = pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setShowMore(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-admin-silver/10 text-admin-silver"
                      : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex bg-admin-dark border-t border-admin-border md:hidden">
        {mainTabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                active ? "text-admin-silver" : "text-admin-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(!showMore)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
            moreActive ? "text-admin-silver" : "text-admin-muted"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          Mais
        </button>
      </nav>
    </>
  );
}
