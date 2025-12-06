import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { LeaderboardClient } from '@/components/leaderboard-client';

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

async function getLeaderboardData() {
  try {
    const supabase = await createSupabaseClient();
    
    const { data, error } = await supabase
      .from('wallets_status')
      .select('*')
      .order('all_time_volume', { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("❌ Leaderboard error:", error);
      return { data: [], error: "Failed to fetch leaderboard" };
    }
    
    return { data: data || [], error: null };
  } catch (error) {
    console.error("❌ Leaderboard fetch error:", error);
    return { data: [], error: "Internal server error" };
  }
}

export default async function LeaderboardPage() {
  const { data, error } = await getLeaderboardData();
  
  return (
    <LeaderboardClient 
      initialData={data}
      error={error}
    />
  );
}
