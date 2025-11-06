import { NextResponse } from "next/server";

export async function GET() {
  // Endpoint placeholder/diagnostico: ritorna 200 per far passare la build.
  return NextResponse.json({ ok: true, info: "views route active" });
}
