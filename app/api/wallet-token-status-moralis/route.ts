// app/api/wallet-token-status-moralis/route.ts
import { NextResponse } from 'next/server';
// Değiştir: getSupabaseServerClient yerine createClient kullan
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

type SwapItem = {
  transactionHash?: string;
  transactionType?: string; // 'buy' | 'sell'
  totalValueUsd?: number | string;
  blockTimestamp?: string;
  block_timestamp?: string;
};

function fromHoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// Satır 18: any → unknown
function toNum(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || '').trim();
    const chain = 'base';
    const hours = Number.isFinite(body?.hours) ? Math.max(1, Math.min(168, Number(body.hours))) : 24;
    const maxPages = 20;

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ success: false, error: 'Invalid walletAddress' }, { status: 400 });
    }

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'MORALIS_API_KEY not set' }, { status: 500 });
    }
    const headers = { accept: 'application/json', 'X-API-Key': apiKey };
    const baseUrl = 'https://deep-index.moralis.io/api/v2.2';

    // Supabase client - Değiştir: getSupabaseServerClient yerine createSupabaseClient
    const supabase = await createSupabaseClient();

    // 1) Whitelist
    const { data: wl, error: wlErr } = await supabase
      .from('whitelisted_tokens')
      .select('token_address');
    if (wlErr) {
      return NextResponse.json({ success: false, error: `Failed to load whitelisted tokens: ${wlErr.message}` }, { status: 500 });
    }

    // Satır 54: any → proper type
    const tokenAddresses: string[] = (wl || [])
      .map((r: { token_address?: string }) => String(r?.token_address || '').toLowerCase())
      .filter(Boolean);

    if (tokenAddresses.length === 0) {
      return NextResponse.json({ success: true, updated: 0, message: 'No whitelisted tokens' });
    }

    const walletLc = walletAddress.toLowerCase();
    const fromDate = fromHoursAgo(hours);

    // 2) Holdings (tokens)
    const holdingUsdMap = new Map<string, number>();
    let cursor: string | null = null;
    let pagesTokens = 0;
    try {
      do {
        const url = new URL(`${baseUrl}/wallets/${walletAddress}/tokens`);
        url.searchParams.set('chain', chain);
        url.searchParams.set('limit', '100');
        if (cursor) url.searchParams.set('cursor', cursor);

        const resp = await fetch(url.toString(), { headers });
        if (!resp.ok) {
          break;
        }

        // Satır 80-81: any → proper types
        const json: { result?: Array<{ token_address?: string; usd_value?: number | string; cursor?: string }>; cursor?: string } = await resp.json().catch(() => ({}));
        const arr = Array.isArray(json?.result) ? json.result : [];
        for (const t of arr) {
          const addr = String(t?.token_address || '').toLowerCase();
          if (!addr) continue;
          holdingUsdMap.set(addr, toNum(t?.usd_value ?? 0));
        }

        cursor = json?.cursor ? String(json.cursor) : null;
        pagesTokens += 1;
      } while (cursor && pagesTokens < 5);
    } catch {
      // Satır 91: e kullanılmıyor, kaldır
      // Continue on error
    }

    // 3) Iterate whitelisted tokens
    const results: Array<{
      token: string;
      count: number;
      volume: number;
      holding_usd: number;
      updated: boolean;
      upErr?: string | null;
      insErr?: string | null;
    }> = [];

    for (const token of tokenAddresses) {

      const swapsUrl = new URL(`${baseUrl}/wallets/${walletAddress}/swaps`);
      swapsUrl.searchParams.set('chain', chain);
      swapsUrl.searchParams.set('order', 'DESC');
      swapsUrl.searchParams.set('tokenAddress', token);
      swapsUrl.searchParams.set('from_date', fromDate.toISOString());

      let pages = 0;
      let cur: string | null = null;
      let count = 0;
      let volume = 0;

      while (pages < maxPages) {
        const pageUrl = new URL(swapsUrl.toString());
        if (cur) pageUrl.searchParams.set('cursor', cur);

        let resp: Response;
        try {
          resp = await fetch(pageUrl.toString(), { headers });
        } catch {
          // Satır 127: e kullanılmıyor, kaldır
          break;
        }
        if (!resp.ok) {
          break;
        }

        // Satır 134: any → proper type
        let json: { result?: SwapItem[]; cursor?: string };
        try {
          json = await resp.json();
        } catch {
          // Satır 137: e kullanılmıyor, kaldır
          break;
        }

        const arr: SwapItem[] = Array.isArray(json?.result) ? json.result : [];
        if (arr.length === 0) break;

        for (const s of arr) {
          // Satır 145: any → SwapItem type'ı zaten var
          const v = toNum(s?.totalValueUsd ?? 0);
          if (v > 0) volume += Math.abs(v);
          count += 1;
        }

        cur = json?.cursor ? String(json.cursor) : null;
        pages += 1;
        if (!cur) break;
      }


      // API null/empty ise bu tokenı atla (yazma yok)
      if (count === 0) {
        results.push({ token, count, volume, holding_usd: holdingUsdMap.get(token) ?? 0, updated: false });
        continue;
      }

      const holdingUsd = holdingUsdMap.get(token) ?? 0;
      const updateFields = { token_transfer_count: count, token_volume: volume, holding_amount_usd: holdingUsd };
      const { data: upd, error: upErr } = await supabase
        .from('wallet_token_status')
        .update(updateFields)
        .eq('wallet_address', walletLc)
        .eq('token_address', token)
        .select('id');

      if (upErr) {
        // Insert dene
        const { error: insErr } = await supabase.from('wallet_token_status').insert({
          wallet_address: walletLc,
          token_address: token,
          ...updateFields,
        });
        if (insErr) {
          results.push({ token, count, volume, holding_usd: holdingUsd, updated: false, upErr: upErr.message, insErr: insErr.message });
        } else {
          results.push({ token, count, volume, holding_usd: holdingUsd, updated: true, upErr: upErr.message, insErr: null });
        }
      } else {
        if (!upd || upd.length === 0) {
          // Row yoksa insert
          const { error: insErr } = await supabase.from('wallet_token_status').insert({
            wallet_address: walletLc,
            token_address: token,
            ...updateFields,
          });
          if (insErr) {
            results.push({ token, count, volume, holding_usd: holdingUsd, updated: false, insErr: insErr.message });
          } else {
            results.push({ token, count, volume, holding_usd: holdingUsd, updated: true });
          }
        } else {
          results.push({ token, count, volume, holding_usd: holdingUsd, updated: true });
        }
      }
    }

    const updated = results.filter(r => r.updated).length;

    return NextResponse.json({
      success: true,
      wallet: walletAddress,
      chain,
      hours,
      updated,
      processed: results.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (e: unknown) { // Satır 216: any → unknown
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('[WTS][FATAL]', error);
    return NextResponse.json({ success: false, error: error ?? 'Unknown error' }, { status: 500 });
  }
}