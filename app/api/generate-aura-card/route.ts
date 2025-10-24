// app/api/generate-aura-card/route.ts
import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://bluera-backend.vercel.app/api/aura_card";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const r = await fetch(BACKEND, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // credentials/cookies not forwarded unless you add them explicitly
  });
  const text = await r.text();
  try {
    return NextResponse.json(JSON.parse(text), { status: r.status });
  } catch {
    return new NextResponse(text, { status: r.status, headers: { "Content-Type": "text/plain" } });
  }
}

// If you ever need CORS here (cross-origin callers), add:
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "*";
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}