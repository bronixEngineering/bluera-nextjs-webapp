import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get("fid");
    const wallet = searchParams.get("wallet");

    if (!fid && !wallet) {
      return NextResponse.json({ error: "fid or wallet required" }, { status: 400 });
    }

    let query = supabase
      .from("wallets_status")
      .select(
        "volume_monthly, net_worth, weekly_pnl, volume_daily, volume_weekly, monthly_pnl, all_time_volume"
      )
      .limit(1);

    if (fid) query = query.eq("fid", fid);
    if (!fid && wallet) query = query.eq("wallet_address", wallet.toLowerCase());

    const { data, error } = await query.single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(data);
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}