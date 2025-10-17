// app/api/heatmap/route.ts
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseClient();
    
    // Fetch whitelisted tokens data
    const { data: tokens, error } = await supabase
      .from('whitelisted_tokens')
      .select('*')
      .order('total_volume_24h', { ascending: false })
      .limit(50); // Limit to top 50 tokens by volume

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch tokens data' }, { status: 500 });
    }

    // Transform data for heatmap
    const heatmapData = tokens?.map((token) => ({
      token_address: token.token_address,
      symbol: token.token_ticker || 'UNKNOWN',
      volume: token.total_volume_24h || 0,
      swaps: token.total_swaps_24h || 0,
      change24h: token.total_volume_changing_rate || 0,
      image_url: token.image_url,
      token_type: token.token_type,
      // Generate color based on volume change
      color: token.total_volume_changing_rate >= 0 
        ? `hsl(${120 + (token.total_volume_changing_rate * 2)}, 70%, 50%)` // Green for positive
        : `hsl(${0 + Math.abs(token.total_volume_changing_rate * 2)}, 70%, 50%)` // Red for negative
    })) || [];

    console.log(`✅ Fetched ${heatmapData.length} tokens for heatmap`);

    return NextResponse.json({
      data: heatmapData,
      totalTokens: heatmapData.length,
      totalVolume: heatmapData.reduce((sum, token) => sum + token.volume, 0)
    });

  } catch (error) {
    console.error('❌ Heatmap API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
