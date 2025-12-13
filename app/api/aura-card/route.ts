/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/aura-card/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const network = (searchParams.get("network") || "base").toLowerCase();

    if (!wallet) return NextResponse.json({ error: "Missing wallet" }, { status: 400 });

    const { data, error } = await supabase
      .from("aura_card")
      .select("id, image_url, holder_tag")
      .eq("wallet_address", wallet.toLowerCase())
      .eq("network", network)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const row = data[0];

    return NextResponse.json({
      id: row.id,
      image_url: row.image_url ?? null,
      holder_tag: row.holder_tag ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}