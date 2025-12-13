import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { LeaderboardClient } from '@/components/leaderboard-client';

// Bu satırı ekleyin
export const dynamic = 'force-dynamic';

type WalletStatusRow = {
  wallet_address: string;
  volume_monthly: number | null;
  net_worth: number | null;
  fid: string | null;
  volume_daily: number | null;
  volume_weekly: number | null;
  all_time_volume: number | null;
};

function sumNullable(a: number | null | undefined, b: number | null | undefined): number {
  const av = typeof a === 'number' && Number.isFinite(a) ? a : 0;
  const bv = typeof b === 'number' && Number.isFinite(b) ? b : 0;
  return av + bv;
}

/**
 * Aynı kullanıcıya (fid) ait birden fazla cüzdan varsa,
 * tüm metrikleri toplayarak tek bir satır haline getirir.
 * FID yoksa, wallet_address üzerinden benzersiz bırakılır.
 */
function aggregateWalletsByUser(rows: WalletStatusRow[] | null | undefined): WalletStatusRow[] {
  if (!rows) return [];

  const byKey = new Map<string, WalletStatusRow>();

  for (const raw of rows) {
    const row = raw as WalletStatusRow;
    const key = row.fid || row.wallet_address || '';

    // Eğer ne fid ne de wallet_address yoksa, satırı ayrı bir key ile ekle
    const effectiveKey = key || `__noid__${Math.random().toString(36).slice(2)}`;

    const existing = byKey.get(effectiveKey);
    if (!existing) {
      byKey.set(effectiveKey, { ...row });
    } else {
      byKey.set(effectiveKey, {
        ...existing,
        volume_daily:    sumNullable(existing.volume_daily,    row.volume_daily),
        volume_weekly:   sumNullable(existing.volume_weekly,   row.volume_weekly),
        volume_monthly:  sumNullable(existing.volume_monthly,  row.volume_monthly),
        net_worth:       sumNullable(existing.net_worth,       row.net_worth),
        all_time_volume: sumNullable(existing.all_time_volume, row.all_time_volume),
      });
    }
  }

  return Array.from(byKey.values());
}

async function getLeaderboardData() {
  try {
    const supabase = await createSupabaseClient();
    
    // Önce wallets_status verilerini çek (cüzdan bazında)
    const { data: walletsData, error: walletsError } = await supabase
      .from('wallets_status')
      .select('*')
      .order('volume_daily', { ascending: false })
      .limit(100);
    
    if (walletsError) {
      console.error("❌ Leaderboard error:", walletsError);
      return { data: [], error: "Failed to fetch leaderboard" };
    }

    // Aynı kullanıcıya (fid) ait cüzdanları birleştir
    const aggregatedWallets = aggregateWalletsByUser(walletsData);
    
    // FID'leri topla
    const fids = aggregatedWallets
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
    
    // Verileri birleştir (aggregatedWallets üzerine user_name ekle)
    const dataWithUserNames = aggregatedWallets.map(wallet => ({
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
