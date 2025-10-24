// app/api/aura-card-holder-tag/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");
    const network = (searchParams.get("network") || "base").toLowerCase();

    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("aura_card")
      .select("holder_tag")
      .eq("wallet_address", wallet.toLowerCase())
      .eq("network", network)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data || data.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ holder_tag: data[0].holder_tag });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}