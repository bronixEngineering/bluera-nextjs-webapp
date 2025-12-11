/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
// Değiştir: getSupabaseServerClient yerine createClient kullan
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

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

async function getProfitUsd(days: number, baseUrl: string, headers: Record<string, string>, walletAddress: string, chain: string) {
  const url = `${baseUrl}/wallets/${walletAddress}/profitability/summary?days=${days}&chain=${chain}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) return 0;
  const json = await resp.json().catch(() => ({}));
  const v = json?.total_realized_profit_usd ?? json?.total_usd_pnl ?? 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function getAllTimeTradeVolumeUsd(baseUrl: string, headers: Record<string, string>, walletAddress: string, chain: string) {
  const url = `${baseUrl}/wallets/${walletAddress}/profitability/summary?chain=${chain}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) return 0;
  const json = await resp.json().catch(() => ({}));
  const v = json?.total_trade_volume ?? 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

async function getAllTimePnlUsd(baseUrl: string, headers: Record<string, string>, walletAddress: string, chain: string) {
  const url = `${baseUrl}/wallets/${walletAddress}/profitability/summary?chain=${chain}`;
  const resp = await fetch(url, { headers });
  if (!resp.ok) return 0;
  const json = await resp.json().catch(() => ({}));
  const v = json?.total_realized_profit_usd ?? json?.total_usd_pnl ?? 0;
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function getNetWorthUsd(baseUrl: string, headers: Record<string, string>, walletAddress: string, chain: string) {
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
    const v = typeof c?.networth_usd === 'string' ? parseFloat(c.networth_usd) : Number(c?.networth_usd ?? 0);
    return acc + (Number.isFinite(v) ? v : 0);
  }, 0);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || '').trim();
    const chain = String(body?.chain || 'base');
    const fid = body?.fid ? String(body.fid) : undefined;
    
    // Limit pages and tokens to reduce API I/O and improve latency
    const maxPages = Number.isFinite(body?.maxPages)
      ? Math.max(1, Math.min(100, Number(body.maxPages)))
      : 100;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ success: false, error: 'Invalid walletAddress' }, { status: 400 });
    }

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      console.error('❌ [wallet-status-moralis] MORALIS_API_KEY not set');
      return NextResponse.json({ success: false, error: 'MORALIS_API_KEY not set' }, { status: 500 });
    }
    
    const headers = { 'X-API-Key': apiKey, accept: 'application/json' };
    const baseUrl = 'https://deep-index.moralis.io/api/v2.2';
    // Değiştir: getSupabaseServerClient() yerine createSupabaseClient()
    const supabase = await createSupabaseClient();

    // Load tokens to filter one-by-one
    const { data: wl, error: wlErr } = await supabase
      .from('whitelisted_tokens')
      .select('token_address');
    
    if (wlErr) {
      console.error('❌ [wallet-status-moralis] Failed to load whitelisted tokens:', wlErr);
      return NextResponse.json({ success: false, error: `Failed to load tokens: ${wlErr.message}` }, { status: 500 });
    }

    const tokenAddressesAll: string[] = (wl || [])
      .map((r: any) => String(r?.token_address || '').toLowerCase())
      .filter(Boolean);
    const tokenAddresses: string[] = tokenAddressesAll;

    if (tokenAddresses.length === 0) {
      console.warn('⚠️ [wallet-status-moralis] No whitelisted tokens found');
      return NextResponse.json({ success: true, wallet: walletAddress, message: 'No whitelisted tokens', volume_daily: 0, volume_weekly: 0, volume_monthly: 0 });
    }

    // Setup time windows
    const now = new Date();
    const from30d = fromDaysAgo(30);
    const from7d = fromDaysAgo(7);
    const from1d = fromDaysAgo(1);

    const buckets: VolumeBuckets = {
      day: new Map(),
      week: new Map(),
      month: new Map(),
    };

    let totalSwapsProcessed = 0;
    let totalTokensProcessed = 0;

    // Fetch monthly range ONCE per token, then bucket by timestamp for day/week/month.
    for (const token of tokenAddresses) {
      totalTokensProcessed++;
      const url = new URL(`${baseUrl}/wallets/${walletAddress}/swaps`);
      url.searchParams.set('chain', chain);
      url.searchParams.set('tokenAddress', token);
      url.searchParams.set('order', 'DESC');
      url.searchParams.set('from_date', from30d.toISOString());

      let cursor: string | null = null;
      let pages = 0;
      let tokenSwapsCount = 0;

      while (pages < maxPages) {
        const pageUrl = new URL(url.toString());
        if (cursor) pageUrl.searchParams.set('cursor', cursor);

        let resp: Response;
        try {
          resp = await fetch(pageUrl.toString(), { headers });
        } catch (error) {
          console.error(`❌ [wallet-status-moralis] Network error for token ${token}:`, error);
          break;
        }
        
        if (!resp.ok) {
          console.warn(`⚠️ [wallet-status-moralis] API error for token ${token}:`, resp.status, resp.statusText);
          break;
        }

        let json: any;
        try {
          json = await resp.json();
        } catch (error) {
          console.error(`❌ [wallet-status-moralis] JSON parse error for token ${token}:`, error);
          break;
        }

        const arr: any[] = Array.isArray(json?.result) ? json.result : [];
        if (arr.length === 0) break;

        tokenSwapsCount += arr.length;

        for (const s of arr) {
          const ts = new Date(String(s?.blockTimestamp || s?.block_timestamp || now)).getTime();
          if (!Number.isFinite(ts) || ts < from30d.getTime() || ts > now.getTime()) continue;

          const usd = parseUsd(s?.totalValueUsd ?? s?.value_usd ?? 0);
          if (usd <= 0) continue;

          const hash = String(s?.transactionHash || s?.hash || '');
          if (!hash) continue;

          addToBucket(buckets.month, hash, usd);
          if (ts >= from7d.getTime()) addToBucket(buckets.week, hash, usd);
          if (ts >= from1d.getTime()) addToBucket(buckets.day, hash, usd);
        }

        cursor = json?.cursor ? String(json.cursor) : null;
        pages += 1;
        if (!cursor) break;
      }
      
      totalSwapsProcessed += tokenSwapsCount;
    }


    const volume_daily = Array.from(buckets.day.values()).reduce((a, b) => a + b, 0);
    const volume_weekly = Array.from(buckets.week.values()).reduce((a, b) => a + b, 0);
    const volume_monthly = Array.from(buckets.month.values()).reduce((a, b) => a + b, 0);
    
    const weekly_pnl = await getProfitUsd(7, baseUrl, headers, walletAddress, chain);
    const monthly_pnl = await getProfitUsd(30, baseUrl, headers, walletAddress, chain);
    const net_worth = await getNetWorthUsd(baseUrl, headers, walletAddress, chain);
    const all_time_volume = await getAllTimeTradeVolumeUsd(baseUrl, headers, walletAddress, chain);
    const all_time_pnl = await getAllTimePnlUsd(baseUrl, headers, walletAddress, chain);

    const dbWallet = walletAddress.toLowerCase();

    const updateFields: any = {
      volume_daily,
      volume_weekly,
      volume_monthly,
      weekly_pnl,
      monthly_pnl, 
      net_worth,
      all_time_volume,
      all_time_pnl,
    };
    if (fid) updateFields.fid = fid;
    
    const { data: upsertData, error: upErr } = await supabase
      .from('wallets_status')
      .upsert(
        { wallet_address: dbWallet, ...updateFields },
        { onConflict: 'wallet_address' }
      )
      .select();

    if (upErr) {
      console.error('❌ [wallet-status-moralis] Database upsert error:', {
        error: upErr.message,
        code: upErr.code,
        details: upErr.details,
        hint: upErr.hint
      });
    }

    const db = upErr ? { success: false, error: upErr.message } : { success: true, error: null };
    
    const response = {
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
      all_time_pnl,
      db,
      timestamp: new Date().toISOString(),
    };
        
    return NextResponse.json(response);
  } catch (e: any) {
    console.error('❌ [wallet-status-moralis] Fatal error:', {
      error: e?.message,
      stack: e?.stack,
      name: e?.name
    });
    return NextResponse.json({ success: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}