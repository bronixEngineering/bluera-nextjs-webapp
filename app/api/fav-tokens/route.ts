import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";

type WalletTokenRow = {
  token_address: string;
  token_volume_daily: number | string | null;
  token_transfer_count_daily: number | string | null;
};

type WhitelistedTokenRow = {
  token_address: string;
  token_ticker: string | null;
  image_url: string | null;
};

function toNumber(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = (searchParams.get("wallet") || "").trim().toLowerCase();

    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return NextResponse.json({ error: "wallet required" }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    const { data: topVol } = await supabase
      .from("wallet_token_status")
      .select("token_address, token_volume_daily, token_transfer_count_daily")
      .eq("wallet_address", wallet)
      .order("token_volume_daily", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: topTrades } = await supabase
      .from("wallet_token_status")
      .select("token_address, token_volume_daily, token_transfer_count_daily")
      .eq("wallet_address", wallet)
      .order("token_transfer_count_daily", { ascending: false })
      .limit(1)
      .maybeSingle();

    const volRow = (topVol as WalletTokenRow | null) ?? null;
    const tradesRow = (topTrades as WalletTokenRow | null) ?? null;

    const addresses = Array.from(
      new Set(
        [volRow?.token_address, tradesRow?.token_address]
          .map((a) => (a ? String(a).toLowerCase() : ""))
          .filter(Boolean)
      )
    );

    let tokenMetaMap = new Map<string, WhitelistedTokenRow>();
    if (addresses.length > 0) {
      const { data: metas } = await supabase
        .from("whitelisted_tokens")
        .select("token_address, token_ticker, image_url")
        .in("token_address", addresses);

      tokenMetaMap = new Map(
        (metas as WhitelistedTokenRow[] | null | undefined)?.map((m) => [
          String(m.token_address).toLowerCase(),
          m,
        ]) ?? []
      );
    }

    const favByVolume = volRow?.token_address
      ? {
          token_address: String(volRow.token_address).toLowerCase(),
          symbol:
            tokenMetaMap.get(String(volRow.token_address).toLowerCase())
              ?.token_ticker ?? null,
          image_url:
            tokenMetaMap.get(String(volRow.token_address).toLowerCase())
              ?.image_url ?? null,
          volume: toNumber(volRow.token_volume_daily),
        }
      : null;

    const favByTrades = tradesRow?.token_address
      ? {
          token_address: String(tradesRow.token_address).toLowerCase(),
          symbol:
            tokenMetaMap.get(String(tradesRow.token_address).toLowerCase())
              ?.token_ticker ?? null,
          image_url:
            tokenMetaMap.get(String(tradesRow.token_address).toLowerCase())
              ?.image_url ?? null,
          trades: toNumber(tradesRow.token_transfer_count_daily),
        }
      : null;

    return NextResponse.json({ favByVolume, favByTrades });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error }, { status: 500 });
  }
}


