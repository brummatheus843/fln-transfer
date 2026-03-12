"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, Car, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const tabs = [
  { href: "/driver/agenda", label: "Agenda", icon: Calendar },
  { href: "/driver/rides", label: "Corridas", icon: Car },
];

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-admin-black">
      <header className="flex h-14 items-center justify-between bg-admin-dark border-b border-admin-border px-4 py-3">
        <h1 className="shimmer-gold text-lg font-black">FLN Transfer</h1>
        <button onClick={handleLogout} className="text-admin-muted hover:text-admin-text-dim transition-colors">
          <LogOut className="h-5 w-5" />
        </button>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 flex bg-admin-dark border-t border-admin-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
                active ? "text-admin-gold" : "text-admin-muted hover:text-admin-text-dim"
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
