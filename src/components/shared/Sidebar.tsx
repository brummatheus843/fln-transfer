"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  Wallet,
  Car,
  Users,
  Building2,
  UserCog,
  FileText,
  Receipt,
} from "lucide-react";

const links = [
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/admin/rides", label: "Corridas", icon: Car },
  { href: "/admin/clients", label: "Clientes", icon: Users },
  { href: "/admin/agencies", label: "Agências", icon: Building2 },
  { href: "/admin/drivers", label: "Motoristas", icon: UserCog },
  { href: "/admin/reports", label: "Relatórios", icon: FileText },
  { href: "/admin/nf", label: "Notas Fiscais", icon: Receipt },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col bg-admin-dark border-r border-admin-border p-5">
      {/* Logo */}
      <div className="mb-6">
        <h1 className="text-xl font-black shimmer-gold tracking-tight">
          FLN TRANSFER
        </h1>
        <p className="text-[10px] text-admin-muted uppercase tracking-widest mt-1">
          Painel Administrativo
        </p>
      </div>

      {/* Gold separator */}
      <div className="gold-separator mb-4" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {links.map((link, i) => {
          const Icon = link.icon;
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all animate-slide-in border",
                active
                  ? "bg-admin-gold/10 text-admin-gold border-admin-gold/20"
                  : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card border-transparent"
              )}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer separator + version */}
      <div className="gold-separator mb-3 mt-4" />
      <p className="text-[10px] text-admin-muted text-center">
        FLN Transfer v1.0
      </p>
    </aside>
  );
}
