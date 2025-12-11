import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { LeaderboardClient } from '@/components/leaderboard-client';

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

// Yardımcı: null/undefined sayıların toplanması
function add(a: number | null, b: number | null): number {
  return (a ?? 0) + (b ?? 0);
}

// Aynı kullanıcıya (fid) ait birden fazla cüzdanı toplu hale getir
function aggregateWalletsByUser(rows: any[]) {
  const map = new Map<string, any>();

  for (const row of rows || []) {
    // Bir kullanıcıyı fid ile tanımla; fid yoksa wallet_address ile ayır
    const key: string | null =
      (row.fid as string | null) ?? (row.wallet_address as string | null);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...row });
    } else {
      map.set(key, {
        ...existing,
        volume_daily: add(existing.volume_daily, row.volume_daily),
        volume_weekly: add(existing.volume_weekly, row.volume_weekly),
        volume_monthly: add(existing.volume_monthly, row.volume_monthly),
        weekly_pnl: add(existing.weekly_pnl, row.weekly_pnl),
        monthly_pnl: add(existing.monthly_pnl, row.monthly_pnl),
        net_worth: add(existing.net_worth, row.net_worth),
        all_time_volume: add(existing.all_time_volume, row.all_time_volume),
        all_time_pnl: add(existing.all_time_pnl, row.all_time_pnl),
      });
    }
  }

  return Array.from(map.values());
}

async function getLeaderboardData() {
  try {
    const supabase = await createSupabaseClient();
    
    // wallets_status verilerini çek (tüm satırlar), sonra kullanıcı bazında topla
    const { data: walletsData, error: walletsError } = await supabase
      .from('wallets_status')
      .select('*');
    
    if (walletsError) {
      console.error("❌ Leaderboard error:", walletsError);
      return { data: [], error: "Failed to fetch leaderboard" };
    }

    const aggregatedWallets = aggregateWalletsByUser(walletsData || []);

    // All-time volume'a göre sıralayıp ilk 100 kullanıcıyı al
    const sortedAggregated = aggregatedWallets
      .sort(
        (a, b) =>
          (b.all_time_volume ?? 0) - (a.all_time_volume ?? 0)
      )
      .slice(0, 100);
    
    // FID'leri topla
    const fids = (sortedAggregated || [])
      .map((w) => w.fid as string | null)
      .filter((fid): fid is string => fid !== null && fid !== undefined);
    
    // users_fid tablosundan user_name'leri çek
    const { data: usersData } = await supabase
      .from('users_fid')
      .select('fid, user_name')
      .in('fid', fids);
    
    // user_name'leri map'le
    const userMap = new Map(
      (usersData || []).map((u) => [u.fid, u.user_name])
    );
    
    // Verileri birleştir (her kullanıcı tek satır)
    const dataWithUserNames = (sortedAggregated || []).map((wallet) => ({
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
