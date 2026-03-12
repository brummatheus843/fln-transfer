import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { ride_id } = body;

  if (!ride_id) {
    return NextResponse.json(
      { error: "ride_id é obrigatório" },
      { status: 400 }
    );
  }

  const nf_number = `NF-${Date.now().toString().slice(-8)}`;

  return NextResponse.json({
    ride_id,
    nf_number,
    issued_at: new Date().toISOString(),
    status: "emitida",
  });
}
