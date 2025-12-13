// app/api/wallet-status-moralis/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

// ... existing helper types ...
type VolumeBuckets = {
  day: Map<string, number>;
  week: Map<string, number>;
  month: Map<string, number>;
};

function fromDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function addToBucket(map: Map<string, number>, hash: string, usd: number) {
  const prev = map.get(hash) ?? 0;
  // Use max to avoid double-counting the same tx when it appears via multiple tokens
  if (usd > prev) map.set(hash, Math.abs(usd));
}

function parseUsd(v: any): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

// ✅ Moralis net worth helper'ı (önceki implementasyondan)
async function getNetWorthUsd(
  baseUrl: string,
  headers: Record<string, string>,
  walletAddress: string,
  chain: string
) {
  const url = new URL(`${baseUrl}/wallets/${walletAddress}/net-worth`);
  url.searchParams.append('chains[]', chain);
  const resp = await fetch(url.toString(), { headers });
  if (!resp.ok) return 0;
  const json = await resp.json().catch(() => ({}));
  const total = json?.total_networth_usd ?? 0;
  const totalNum = typeof total === 'string' ? parseFloat(total) : Number(total);
  if (Number.isFinite(totalNum) && totalNum > 0) return totalNum;
  const chains = Array.isArray(json?.chains) ? json.chains : [];
  return chains.reduce((acc: number, c: any) => {
    const v =
      typeof c?.networth_usd === 'string'
        ? parseFloat(c.networth_usd)
        : Number(c?.networth_usd ?? 0);
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);
}

// ✅ Mobula transaction tipi
type MobulaTx = {
  timestamp?: number;
  asset?: {
    contract?: string | null;
    symbol?: string | null;
    name?: string | null;
  };
  hash?: string;
  amount_usd?: number | string | null;
  blockchain?: string | null;
  type?: string | null;
};

/**
 * ✅ Belirli bir cüzdan için Mobula üzerinden son 30 günlük tüm işlemleri çeker.
 *  - blockchains parametresi ile zinciri filtreler (örn: 'base')
 *  - limit/offset ile sayfalar
 */
async function fetchMobulaTransactions(
  walletAddress: string,
  chain: string,
  from: Date,
  to: Date,
  maxPages = 10,
  pageSize = 500
): Promise<MobulaTx[]> {
  const apiKey = process.env.MOBULA_API_KEY;
  if (!apiKey) {
    console.error('❌ [wallet-status-mobula] MOBULA_API_KEY not set');
    return [];
  }

  const baseUrl = 'https://api.mobula.io/api/1/wallet/transactions';
  const headers = { Authorization: `Bearer ${apiKey}` };

  const fromMs = from.getTime().toString();
  const toMs = to.getTime().toString();

  const all: MobulaTx[] = [];
  let offset = 0;
  let page = 0;

  while (page < maxPages) {
    const url = new URL(baseUrl);
    url.searchParams.set('wallet', walletAddress);
    url.searchParams.set('from', fromMs);
    url.searchParams.set('to', toMs);
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('order', 'desc');
    url.searchParams.set('blockchains', chain); // örn: 'base'

    let resp: Response;
    try {
      resp = await fetch(url.toString(), { headers });
    } catch (err) {
      console.error('❌ [wallet-status-mobula] Network error:', err);
      break;
    }

    if (!resp.ok) {
      console.error('❌ [wallet-status-mobula] API error:', resp.status, await resp.text());
      break;
    }

    const json: any = await resp.json().catch(() => ({}));
    const txs: MobulaTx[] = Array.isArray(json?.data?.transactions)
      ? json.data.transactions
      : [];

    if (txs.length === 0) break;

    all.push(...txs);

    if (txs.length < pageSize) break;
    offset += pageSize;
    page += 1;
  }

  return all;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || '').trim();
    const chain = String(body?.chain || 'base');
    // fid artık zorunlu: SDK'den gelmesini bekliyoruz, null/boş olmamalı
    const rawFid = body?.fid;
    const fid = typeof rawFid === 'string'
      ? rawFid.trim()
      : String(rawFid ?? '').trim();

    const maxPages = Number.isFinite(body?.maxPages)
      ? Math.max(1, Math.min(100, Number(body.maxPages)))
      : 100;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ success: false, error: 'Invalid walletAddress' }, { status: 400 });
    }

    if (!fid) {
      return NextResponse.json({ success: false, error: 'fid is required' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // 1) Whitelisted token adreslerini çek
    const { data: wl, error: wlErr } = await supabase
      .from('whitelisted_tokens')
      .select('token_address');

    if (wlErr) {
      console.error('❌ [wallet-status-mobula] Failed to load whitelisted tokens:', wlErr);
      return NextResponse.json(
        { success: false, error: `Failed to load tokens: ${wlErr.message}` },
        { status: 500 }
      );
    }

    const tokenAddresses: string[] = (wl || [])
      .map((r: any) => String(r?.token_address || '').toLowerCase())
      .filter(Boolean);

    if (tokenAddresses.length === 0) {
      console.warn('⚠️ [wallet-status-mobula] No whitelisted tokens found');
      return NextResponse.json({
        success: true,
        wallet: walletAddress,
        message: 'No whitelisted tokens',
        volume_daily: 0,
        volume_weekly: 0,
        volume_monthly: 0,
      });
    }

    const whitelistSet = new Set(tokenAddresses);

    // 2) Zaman pencereleri
    const now = new Date();
    const from30d = fromDaysAgo(30);
    const from7d = fromDaysAgo(7);
    const from1d = fromDaysAgo(1);

    const buckets: VolumeBuckets = {
      day: new Map(),
      week: new Map(),
      month: new Map(),
    };

    // 3) Mobula'dan son 30 günlük tüm işlemleri çek
    const maxMobulaPages = Math.min(maxPages, 20); // güvenli limit
    const txs = await fetchMobulaTransactions(walletAddress, chain, from30d, now, maxMobulaPages);

    // 4) whitelist'e göre filtrele + daily/weekly/monthly volume hesapla
    for (const tx of txs) {
      const ts = typeof tx.timestamp === 'number' ? tx.timestamp : NaN;
      if (!Number.isFinite(ts)) continue;
      if (ts < from30d.getTime() || ts > now.getTime()) continue;

      const contract = String(tx.asset?.contract || '').toLowerCase();
      if (!contract || !whitelistSet.has(contract)) continue;

      const usd = parseUsd(tx.amount_usd ?? 0);
      if (usd <= 0) continue;

      const hash = String(tx.hash || '');
      if (!hash) continue;

      // Monthly (30d)
      addToBucket(buckets.month, hash, usd);
      // Weekly (7d)
      if (ts >= from7d.getTime()) addToBucket(buckets.week, hash, usd);
      // Daily (1d)
      if (ts >= from1d.getTime()) addToBucket(buckets.day, hash, usd);
    }

    const volume_daily = Array.from(buckets.day.values()).reduce((a, b) => a + b, 0);
    const volume_weekly = Array.from(buckets.week.values()).reduce((a, b) => a + b, 0);
    const volume_monthly = Array.from(buckets.month.values()).reduce((a, b) => a + b, 0);

    // 5) Net worth Moralis'ten, all_time_volume şimdilik 0
    const moralisKey = process.env.MORALIS_API_KEY;
    if (!moralisKey) {
      console.error('❌ [wallet-status-moralis] MORALIS_API_KEY not set');
      return NextResponse.json(
        { success: false, error: 'MORALIS_API_KEY not set' },
        { status: 500 }
      );
    }
    const moralisHeaders = { 'X-API-Key': moralisKey, accept: 'application/json' };
    const moralisBaseUrl = 'https://deep-index.moralis.io/api/v2.2';

    const net_worth = await getNetWorthUsd(
      moralisBaseUrl,
      moralisHeaders,
      walletAddress,
      chain
    );
    const all_time_volume = 0;

    const dbWallet = walletAddress.toLowerCase();

    const updateFields: any = {
      volume_daily,
      volume_weekly,
      volume_monthly,
      net_worth,
      all_time_volume,
      fid,
    };

    const { error: upErr } = await supabase
      .from('wallets_status')
      .upsert({ wallet_address: dbWallet, ...updateFields }, { onConflict: 'wallet_address' });

    if (upErr) {
      console.error('❌ [wallet-status-mobula] Database upsert error:', upErr);
    }

    return NextResponse.json({
      success: true,
      wallet: walletAddress,
      chain,
      counts: {
        txs_day: buckets.day.size,
        txs_week: buckets.week.size,
        txs_month: buckets.month.size,
      },
      volume_daily,
      volume_weekly,
      volume_monthly,
      all_time_volume,
      db: upErr ? { success: false, error: upErr.message } : { success: true, error: null },
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    console.error('❌ [wallet-status-mobula] Fatal error:', e);
    return NextResponse.json(
      { success: false, error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}