/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

type TokenStats = {
  dailyCount: number;
  dailyVolume: number;
  weeklyCount: number;
  weeklyVolume: number;
  monthlyCount: number;
  monthlyVolume: number;
};

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

type MobulaPortfolioAsset = {
  price?: number | string | null;
  cross_chain_balances?: Record<
    string,
    {
      address?: string | null;
      balance?: number | string | null;
      balanceRaw?: string | null;
      chainId?: number | null;
    }
  >;
};

function fromDaysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function toNum(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseUsd(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? Math.abs(n) : 0;
}

/**
 * Mobula /wallet/portfolio endpoint'inden holdings çeker.
 * Her contract address için USD cinsinden holding_amount_usd hesaplar.
 */
async function fetchMobulaPortfolioHoldings(
  walletAddress: string
): Promise<Map<string, number>> {
  const apiKey = process.env.MOBULA_API_KEY;
  if (!apiKey) {
    console.error('❌ [wallet-token-status-mobula] MOBULA_API_KEY not set');
    return new Map();
  }

  const url = new URL('https://api.mobula.io/api/1/wallet/portfolio');
  url.searchParams.set('wallet', walletAddress);

  let resp: Response;
  try {
    resp = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
  } catch (err) {
    console.error('❌ [wallet-token-status-mobula] Portfolio network error:', err);
    return new Map();
  }

  if (!resp.ok) {
    console.error(
      '❌ [wallet-token-status-mobula] Portfolio API error:',
      resp.status,
      await resp.text()
    );
    return new Map();
  }

  const json: any = await resp.json().catch(() => ({}));
  const assets: MobulaPortfolioAsset[] = Array.isArray(json?.data?.assets)
    ? json.data.assets
    : [];

  const map = new Map<string, number>();

  for (const a of assets) {
    const price = toNum(a?.price); // token USD fiyatı
    if (price <= 0) continue;

    const ccBalances = a?.cross_chain_balances;
    if (!ccBalances || typeof ccBalances !== 'object') continue;

    for (const entry of Object.values(ccBalances) as Array<{
      address?: string | null;
      balance?: number | string | null;
    }>) {
      const addr = String(entry?.address || '').toLowerCase();
      if (!addr) continue;

      const balance = toNum(entry?.balance ?? 0);
      if (balance <= 0) continue;

      const usd = price * balance;
      if (usd <= 0) continue;

      const prev = map.get(addr) ?? 0;
      map.set(addr, prev + usd);
    }
  }

  return map;
}

/**
 * Cüzdanın son 30 günlük işlemlerini Mobula transactions endpoint'inden çeker.
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
    console.error('❌ [wallet-token-status-mobula] MOBULA_API_KEY not set');
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
      console.error('❌ [wallet-token-status-mobula] Transactions network error:', err);
      break;
    }

    if (!resp.ok) {
      console.error(
        '❌ [wallet-token-status-mobula] Transactions API error:',
        resp.status,
        await resp.text()
      );
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

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { success: false, error: 'Invalid walletAddress' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseClient();

    // 1) Whitelist
    const { data: wl, error: wlErr } = await supabase
      .from('whitelisted_tokens')
      .select('token_address');

    if (wlErr) {
      console.error('❌ [wallet-token-status-mobula] Failed to load whitelisted tokens:', wlErr);
      return NextResponse.json(
        { success: false, error: `Failed to load whitelisted tokens: ${wlErr.message}` },
        { status: 500 }
      );
    }

    const tokenAddresses: string[] = (wl || [])
      .map((r: { token_address?: string }) =>
        String(r?.token_address || '').toLowerCase()
      )
      .filter(Boolean);

    if (tokenAddresses.length === 0) {
      return NextResponse.json({
        success: true,
        updated: 0,
        processed: 0,
        message: 'No whitelisted tokens',
      });
    }

    const whitelistSet = new Set(tokenAddresses);
    const walletLc = walletAddress.toLowerCase();

    // 2) Holdings (Mobula portfolio)
    const holdingUsdMap = await fetchMobulaPortfolioHoldings(walletAddress);

    // 3) Zaman pencereleri (1 / 7 / 30 gün)
    const now = new Date();
    const from30d = fromDaysAgo(30);
    const from7d = fromDaysAgo(7);
    const from1d = fromDaysAgo(1);

    // 4) Tüm işlemleri çek ve token bazında daily/weekly/monthly stats hesapla
    const maxPages = 20;
    const txs = await fetchMobulaTransactions(
      walletAddress,
      chain,
      from30d,
      now,
      maxPages
    );

    const statsMap = new Map<string, TokenStats>();

    for (const tx of txs) {
      const ts = typeof tx.timestamp === 'number' ? tx.timestamp : NaN;
      if (!Number.isFinite(ts)) continue;
      if (ts < from30d.getTime() || ts > now.getTime()) continue;

      const contract = String(tx.asset?.contract || '').toLowerCase();
      if (!contract || !whitelistSet.has(contract)) continue;

      const usd = parseUsd(tx.amount_usd ?? 0);
      if (usd <= 0) continue;

      let stats = statsMap.get(contract);
      if (!stats) {
        stats = {
          dailyCount: 0,
          dailyVolume: 0,
          weeklyCount: 0,
          weeklyVolume: 0,
          monthlyCount: 0,
          monthlyVolume: 0,
        };
        statsMap.set(contract, stats);
      }

      // Monthly (30d)
      stats.monthlyCount += 1;
      stats.monthlyVolume += usd;

      // Weekly (7d)
      if (ts >= from7d.getTime()) {
        stats.weeklyCount += 1;
        stats.weeklyVolume += usd;
      }

      // Daily (1d)
      if (ts >= from1d.getTime()) {
        stats.dailyCount += 1;
        stats.dailyVolume += usd;
      }
    }

    // 5) Supabase'e yaz: wallet_token_status
    const results: Array<{
      token: string;
      updated: boolean;
      dailyCount: number;
      dailyVolume: number;
      weeklyCount: number;
      weeklyVolume: number;
      monthlyCount: number;
      monthlyVolume: number;
      holding_usd: number;
      upErr?: string | null;
      insErr?: string | null;
    }> = [];

    for (const token of tokenAddresses) {
      const stats = statsMap.get(token) ?? {
        dailyCount: 0,
        dailyVolume: 0,
        weeklyCount: 0,
        weeklyVolume: 0,
        monthlyCount: 0,
        monthlyVolume: 0,
      };

      const holdingUsd = holdingUsdMap.get(token) ?? 0;

      const hasActivity =
        stats.dailyCount > 0 ||
        stats.weeklyCount > 0 ||
        stats.monthlyCount > 0 ||
        holdingUsd > 0;

      if (!hasActivity) {
        results.push({
          token,
          updated: false,
          dailyCount: stats.dailyCount,
          dailyVolume: stats.dailyVolume,
          weeklyCount: stats.weeklyCount,
          weeklyVolume: stats.weeklyVolume,
          monthlyCount: stats.monthlyCount,
          monthlyVolume: stats.monthlyVolume,
          holding_usd: holdingUsd,
        });
        continue;
      }

      const updateFields = {
        token_transfer_count_daily: stats.dailyCount,
        token_volume_daily: stats.dailyVolume,
        token_transfer_count_weekly: stats.weeklyCount,
        token_volume_weekly: stats.weeklyVolume,
        token_transfer_count_monthly: stats.monthlyCount,
        token_volume_monthly: stats.monthlyVolume,
        holding_amount_usd: holdingUsd,
        last_updated: new Date().toISOString(),
      };

      const { data: upd, error: upErr } = await supabase
        .from('wallet_token_status')
        .update(updateFields)
        .eq('wallet_address', walletLc)
        .eq('token_address', token)
        .select('id');

      if (upErr) {
        const { error: insErr } = await supabase
          .from('wallet_token_status')
          .insert({
            wallet_address: walletLc,
            token_address: token,
            ...updateFields,
          });

        if (insErr) {
          results.push({
            token,
            updated: false,
            dailyCount: stats.dailyCount,
            dailyVolume: stats.dailyVolume,
            weeklyCount: stats.weeklyCount,
            weeklyVolume: stats.weeklyVolume,
            monthlyCount: stats.monthlyCount,
            monthlyVolume: stats.monthlyVolume,
            holding_usd: holdingUsd,
            upErr: upErr.message,
            insErr: insErr.message,
          });
        } else {
          results.push({
            token,
            updated: true,
            dailyCount: stats.dailyCount,
            dailyVolume: stats.dailyVolume,
            weeklyCount: stats.weeklyCount,
            weeklyVolume: stats.weeklyVolume,
            monthlyCount: stats.monthlyCount,
            monthlyVolume: stats.monthlyVolume,
            holding_usd: holdingUsd,
            upErr: upErr.message,
            insErr: null,
          });
        }
      } else {
        if (!upd || upd.length === 0) {
          const { error: insErr } = await supabase
            .from('wallet_token_status')
            .insert({
              wallet_address: walletLc,
              token_address: token,
              ...updateFields,
            });

          if (insErr) {
            results.push({
              token,
              updated: false,
              dailyCount: stats.dailyCount,
              dailyVolume: stats.dailyVolume,
              weeklyCount: stats.weeklyCount,
              weeklyVolume: stats.weeklyVolume,
              monthlyCount: stats.monthlyCount,
              monthlyVolume: stats.monthlyVolume,
              holding_usd: holdingUsd,
              insErr: insErr.message,
            });
          } else {
            results.push({
              token,
              updated: true,
              dailyCount: stats.dailyCount,
              dailyVolume: stats.dailyVolume,
              weeklyCount: stats.weeklyCount,
              weeklyVolume: stats.weeklyVolume,
              monthlyCount: stats.monthlyCount,
              monthlyVolume: stats.monthlyVolume,
              holding_usd: holdingUsd,
            });
          }
        } else {
          results.push({
            token,
            updated: true,
            dailyCount: stats.dailyCount,
            dailyVolume: stats.dailyVolume,
            weeklyCount: stats.weeklyCount,
            weeklyVolume: stats.weeklyVolume,
            monthlyCount: stats.monthlyCount,
            monthlyVolume: stats.monthlyVolume,
            holding_usd: holdingUsd,
          });
        }
      }
    }

    const updated = results.filter((r) => r.updated).length;

    return NextResponse.json({
      success: true,
      wallet: walletAddress,
      chain,
      updated,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[wallet-token-status-mobula][FATAL]', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

 
