"use client";

export type PeriodKey = "hoje" | "ontem" | "semana" | "30dias" | "personalizado";

export const periodTabs: { key: PeriodKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "ontem", label: "Ontem" },
  { key: "semana", label: "Última semana" },
  { key: "30dias", label: "Últimos 30 dias" },
  { key: "personalizado", label: "Personalizado" },
];

const fmt = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function getDateRange(
  period: PeriodKey,
  customFrom?: string,
  customTo?: string
): { from: string; to: string } {
  const now = new Date();
  switch (period) {
    case "hoje":
      return { from: fmt(now), to: fmt(now) };
    case "ontem": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "semana": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(end.getDate() - 6);
      return { from: fmt(start), to: fmt(end) };
    }
    case "30dias": {
      const end = new Date(now);
      const start = new Date(now);
      start.setDate(end.getDate() - 29);
      return { from: fmt(start), to: fmt(end) };
    }
    case "personalizado":
      return {
        from: customFrom || fmt(now),
        to: customTo || fmt(now),
      };
  }
}

export function PeriodFilter({
  period,
  onPeriodChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: {
  period: PeriodKey;
  onPeriodChange: (p: PeriodKey) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {periodTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onPeriodChange(tab.key)}
            className={`text-[10px] px-3 py-1.5 rounded-full border uppercase tracking-widest font-medium transition whitespace-nowrap shrink-0 ${
              period === tab.key
                ? "bg-admin-silver/10 text-admin-silver border-admin-silver/20"
                : "text-admin-text-dim hover:text-admin-text hover:bg-admin-card border-transparent"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {period === "personalizado" && (
        <div className="flex items-center gap-2 animate-fade-in">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="admin-input text-xs py-1.5 px-2"
          />
          <span className="text-admin-muted text-xs">até</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="admin-input text-xs py-1.5 px-2"
          />
        </div>
      )}
    </div>
  );
}
