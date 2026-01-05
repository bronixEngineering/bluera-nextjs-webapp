import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { HeatmapClient } from "@/components/heatmap-client";

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

interface HeatmapToken {
  token_address: string;
  symbol: string;
  liquidityUsd: number;
  volume24h: number;
  swaps24h: number;
  priceUsd: number;
  volumeChangePct24h: number;
  swapsChangePct24h: number;
  priceChangePct24h: number;
  image_url?: string;
  token_type?: string;
}

function toNum(v: unknown): number {
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizePct(v: unknown): number {
  const n = toNum(v);
  return Math.abs(n) <= 1.5 ? n * 100 : n;
}

function extractPriceChangePct24h(ppc: unknown): number {
  if (!ppc) return 0;
  // NOTE: price_percent_change values are already stored as "percent points"
  // (e.g. 0.20 means 0.20%), so we must NOT multiply by 100 here.
  const asPct = (v: unknown) => toNum(v);
  if (typeof ppc === "object") {
    const obj = ppc as Record<string, unknown>;
    const candidates = ["24h", "h24", "day", "1d", "24H", "h_24", "percent_24h"];
    for (const k of candidates) {
      if (k in obj) return asPct(obj[k]);
    }
    for (const v of Object.values(obj)) {
      const n = toNum(v);
      if (Number.isFinite(n) && n !== 0) return asPct(n);
    }
    return 0;
  }
  return asPct(ppc);
}

async function getHeatmapData(): Promise<{
  data: HeatmapToken[];
  error?: string;
}> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch whitelisted tokens data
    const { data: tokens, error } = await supabase
      .from("whitelisted_tokens")
      .select(
        "token_address, token_ticker, token_type, image_url, total_liquidity_usd, total_volume_24h, total_swaps_24h, usd_price, total_volume_changing_rate, total_swap_changing_rate, price_percent_change"
      )
      .limit(200);

    if (error) {
      console.error("❌ Supabase error:", error);
      return {
        data: [],
        error: "Failed to fetch tokens data",
      };
    }

    const heatmapData: HeatmapToken[] =
      tokens?.map((t: any) => ({
        token_address: String(t.token_address),
        symbol: String(t.token_ticker || "UNKNOWN"),
        liquidityUsd: toNum(t.total_liquidity_usd),
        volume24h: toNum(t.total_volume_24h),
        swaps24h: toNum(t.total_swaps_24h),
        priceUsd: toNum(t.usd_price),
        volumeChangePct24h: normalizePct(t.total_volume_changing_rate),
        swapsChangePct24h: normalizePct(t.total_swap_changing_rate),
        priceChangePct24h: extractPriceChangePct24h(t.price_percent_change),
        image_url: t.image_url ?? undefined,
        token_type: t.token_type ?? undefined,
      })) || [];

    // If no data from database, return empty
    const filtered = heatmapData
      .filter((x) => x.liquidityUsd > 0)
      .sort((a, b) => b.liquidityUsd - a.liquidityUsd)
      .slice(0, 15);

    if (filtered.length === 0) {
      return {
        data: [],
        error: "No data available",
      };
    }

    return {
      data: filtered,
    };
  } catch (error) {
    console.error("❌ Heatmap data fetch error:", error);
    return {
      data: [],
      error: "Internal server error",
    };
  }
}

export default async function HeatmapPage() {
  const { data, error } = await getHeatmapData();

  return (
    <HeatmapClient
      initialData={data}
      isLoading={false}
      error={error || null}
    />
  );
}
