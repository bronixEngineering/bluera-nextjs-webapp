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
      .select("token_transfer_count_daily, token_transfer_count_weekly, token_transfer_count_monthly")
      .eq("wallet_address", wallet.toLowerCase());

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const dailyTrades = (data || []).reduce((sum, row) => {
      const n = Number((row as { token_transfer_count_daily?: number }).token_transfer_count_daily || 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const weeklyTrades = (data || []).reduce((sum, row) => {
      const n = Number((row as { token_transfer_count_weekly?: number }).token_transfer_count_weekly || 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    const monthlyTrades = (data || []).reduce((sum, row) => {
      const n = Number((row as { token_transfer_count_monthly?: number }).token_transfer_count_monthly || 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);

    return NextResponse.json({ dailyTrades, weeklyTrades, monthlyTrades });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}