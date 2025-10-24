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

  const risingCount = data.filter(token => token.change24h > 0).length;
  const decliningCount = data.filter(token => token.change24h < 0).length;

  return (
    <div className="py-6 space-y-4">
      {/* Simple Header */}
      <div className="space-y-3">
        <h1 className="text-xl font-bold">Market Overview</h1>
        
        {/* Stats Pills */}
        <div className="flex flex-wrap gap-2">
          {/* Rising */}
          <div className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-600">
                {risingCount} Rising
              </span>
              <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>

          {/* Declining */}
          <div className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              <span className="text-xs font-medium text-red-600">
                {decliningCount} Declining
              </span>
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>

          {/* Total Tokens */}
          <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-medium text-muted-foreground">
                {data.length} Tokens
              </span>
            </div>
          </div>

          {/* Total Volume */}
          <div className="px-3 py-1.5 rounded-lg bg-muted/50 border border-white/5">
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium text-muted-foreground">
                {(() => {
                  const value = totalVolume;
                  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
                  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
                  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
                  return `$${value.toFixed(2)}`;
                })()}
              </span>
            </div>
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
