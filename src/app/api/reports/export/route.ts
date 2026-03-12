import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const start_date = searchParams.get("start_date") || "2026-03-01";
  const end_date = searchParams.get("end_date") || "2026-03-31";
  const format = searchParams.get("format") || "pdf";

  const summary = {
    period: { start_date, end_date },
    format,
    total_rides: 47,
    total_revenue: 6320.0,
    rides_by_status: {
      completed: 38,
      scheduled: 5,
      in_progress: 2,
      cancelled: 2,
    },
    rides_by_driver: [
      { driver: "Pedro Motorista", rides: 20, revenue: 2800.0 },
      { driver: "Lucas Motorista", rides: 15, revenue: 2100.0 },
      { driver: "Fernando Motorista", rides: 12, revenue: 1420.0 },
    ],
    top_routes: [
      { origin: "Aeroporto Hercílio Luz", destination: "Centro", count: 12 },
      { origin: "Aeroporto Hercílio Luz", destination: "Jurerê", count: 8 },
      { origin: "Lagoa da Conceição", destination: "Aeroporto Hercílio Luz", count: 6 },
    ],
  };

  return NextResponse.json(summary);
}
