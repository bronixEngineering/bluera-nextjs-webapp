import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { HeatmapClient } from "@/components/heatmap-client";

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
      .limit(20); // Limit to top 20 tokens by volume

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
        change24h: (token.total_volume_changing_rate || 0) * 100, // Convert to percentage
        image_url: token.image_url, // Use image from database
        token_type: token.token_type,
        // Generate softer, more modern colors based on volume change intensity
        color: (() => {
          const change = token.total_volume_changing_rate * 100; // Convert to percentage
          
          if (change === 0) {
            return `hsl(0, 0%, 45%)`; // Softer gray for zero
          }
          
          // Calculate intensity (0-1) based on absolute change
          const intensity = Math.min(Math.abs(change) / 50, 1); // More sensitive to changes
          
          if (change > 0) {
            // Softer green spectrum: emerald to forest green
            const hue = 140 + intensity * 20; // 140-160 (emerald to forest)
            const saturation = Math.min(60, 30 + intensity * 30); // 30-60% (softer)
            const lightness = Math.max(35, 55 - intensity * 20); // 35-55% (warmer)
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          } else {
            // More intense red spectrum: light red to dark red
            const hue = 0; // Pure red (0 degrees)
            const saturation = Math.min(70, 40 + intensity * 30); // 40-70% (more saturated)
            const lightness = Math.max(35, 55 - intensity * 20); // 35-55% (darker for intensity)
            return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
          }
        })()
      })) || [];

    // If no data from database, return empty
    if (heatmapData.length === 0) {
      console.log("No data from database");
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

    console.log(`✅ Fetched ${heatmapData.length} tokens for heatmap`);

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

export default async function Home() {
  const { data, totalVolume, error } = await getHeatmapData();

  return (
    <div className="py-6 space-y-4">
      {/* Welcome Section */}
      <div className="text-center space-y-3">
        <h1 className="text-xl font-semibold text-foreground">
          Market Overview
        </h1>
        
        {/* Compact Stats */}
        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-muted-foreground">
              {data.filter(token => token.change24h > 0).length} Rising
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-muted-foreground">
              {data.filter(token => token.change24h < 0).length} Declining
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-muted-foreground">
              {data.length} Total
            </span>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <HeatmapClient
        initialData={data}
        totalVolume={totalVolume}
        isLoading={false}
        error={error || null}
      />
    </div>
  );
}
