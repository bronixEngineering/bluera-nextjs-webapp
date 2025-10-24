import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("wallet_token_status")
      .select("token_transfer_count")
      .eq("wallet_address", wallet.toLowerCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const totalTrades = (data || []).reduce((sum, row) => {
      const n = Number((row as { token_transfer_count?: number }).token_transfer_count || 0);
      return sum + (isFinite(n) ? n : 0);
    }, 0);

    return NextResponse.json({ totalTrades });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}