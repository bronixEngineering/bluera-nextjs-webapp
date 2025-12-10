import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { LeaderboardClient } from '@/components/leaderboard-client';

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

async function getLeaderboardData() {
  try {
    const supabase = await createSupabaseClient();
    
    // Önce wallets_status verilerini çek
    const { data: walletsData, error: walletsError } = await supabase
      .from('wallets_status')
      .select('*')
      .order('all_time_volume', { ascending: false })
      .limit(100);
    
    if (walletsError) {
      console.error("❌ Leaderboard error:", walletsError);
      return { data: [], error: "Failed to fetch leaderboard" };
    }
    
    // FID'leri topla
    const fids = (walletsData || [])
      .map(w => w.fid)
      .filter((fid): fid is string => fid !== null && fid !== undefined);
    
    // users_fid tablosundan user_name'leri çek
    const { data: usersData } = await supabase
      .from('users_fid')
      .select('fid, user_name')
      .in('fid', fids);
    
    // user_name'leri map'le
    const userMap = new Map(
      (usersData || []).map(u => [u.fid, u.user_name])
    );
    
    // Verileri birleştir
    const dataWithUserNames = (walletsData || []).map(wallet => ({
      ...wallet,
      user_name: wallet.fid ? userMap.get(wallet.fid) || null : null,
    }));
    
    return { data: dataWithUserNames, error: null };
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
