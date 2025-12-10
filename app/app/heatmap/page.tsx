import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { HeatmapClient } from "@/components/heatmap-client";

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

interface HeatmapToken {
  token_address: string;
  symbol: string;
  volume: number;
  swaps: number;
  change24h: number;
  image_url?: string;
  token_type?: string;
  color: string;
}

async function getHeatmapData(): Promise<{
  data: HeatmapToken[];
  totalVolume: number;
  error?: string;
}> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch whitelisted tokens data
    const { data: tokens, error } = await supabase
      .from("whitelisted_tokens")
      .select("*")
      .order("total_volume_24h", { ascending: false })
      .limit(20); // Limit to top 100 tokens by volume

    if (error) {
      console.error("❌ Supabase error:", error);
      return {
        data: [],
        totalVolume: 0,
        error: "Failed to fetch tokens data",
      };
    }

    // Transform data for heatmap
    const heatmapData: HeatmapToken[] =
      tokens?.map((token) => ({
        token_address: token.token_address,
        symbol: token.token_ticker || "UNKNOWN",
        volume: token.total_volume_24h || 0,
        swaps: token.total_swaps_24h || 0,
        change24h: token.total_volume_changing_rate || 0,
        image_url: token.image_url, // Use image from database
        token_type: token.token_type,
        // Generate color based on volume change
        color:
          token.total_volume_changing_rate >= 0
            ? `hsl(${120 + token.total_volume_changing_rate * 2}, 50%, 35%)` // Green for positive - more muted
            : `hsl(${
                0 + Math.abs(token.total_volume_changing_rate * 2)
              }, 50%, 35%)`, // Red for negative - more muted
      })) || [];

    // If no data from database, return empty
    if (heatmapData.length === 0) {
      return {
        data: [],
        totalVolume: 0,
        error: "No data available",
      };
    }

    const totalVolume = heatmapData.reduce(
      (sum, token) => sum + token.volume,
      0
    );

    return {
      data: heatmapData,
      totalVolume,
    };
  } catch (error) {
    console.error("❌ Heatmap data fetch error:", error);
    return {
      data: [],
      totalVolume: 0,
      error: "Internal server error",
    };
  }
}

export default async function HeatmapPage() {
  const { data, totalVolume, error } = await getHeatmapData();

  return (
    <HeatmapClient
      initialData={data}
      totalVolume={totalVolume}
      isLoading={false}
      error={error || null}
    />
  );
}
