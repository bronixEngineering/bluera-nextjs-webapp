import { NextResponse } from 'next/server';
// Değiştir: getSupabaseServerClient yerine createClient kullan
import { createClient as createSupabaseClient } from '@/utils/supabase/server';

function toNum(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : 0;
}

type Holding = { usd: number; symbol?: string | null };

// Mobula /wallet/portfolio response tipini sadeleştirilmiş haliyle tanımlıyoruz
type MobulaPortfolioAsset = {
  asset?: {
    symbol?: string | null;
  };
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

// ❗ Eski getWalletHoldings (Moralis /tokens veya Mobula /transactions kullanan) fonksiyonu komple sil
// ve yerine bunu koy:
async function getWalletHoldings(walletAddress: string): Promise<Map<string, Holding>> {
  const apiKey = process.env.MOBULA_API_KEY;
  if (!apiKey) {
    console.error('❌ [generate-aura-card] MOBULA_API_KEY not set');
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
    console.error('❌ [generate-aura-card] Portfolio network error:', err);
    return new Map();
  }

  if (!resp.ok) {
    console.error(
      '❌ [generate-aura-card] Portfolio API error:',
      resp.status,
      await resp.text()
    );
    return new Map();
  }

  type MobulaPortfolioResponse = {
    data?: {
      assets?: MobulaPortfolioAsset[];
    };
  };

  const json: MobulaPortfolioResponse = await resp
    .json()
    .catch(() => ({} as MobulaPortfolioResponse));

  const assets: MobulaPortfolioAsset[] = Array.isArray(json.data?.assets)
    ? json.data!.assets!
    : [];

  const map = new Map<string, Holding>();

  for (const a of assets) {
    const price = toNum(a?.price); // token USD fiyatı
    if (price <= 0) continue;

    const sym = a?.asset?.symbol ?? null;
    const ccBalances = a?.cross_chain_balances;
    if (!ccBalances || typeof ccBalances !== 'object') continue;

    // Her chain için contract address + balance
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

      const prev = map.get(addr)?.usd ?? 0;
      // Eski Moralis sürümündeki gibi: en büyük USD exposure'ı tut
      if (usd > prev) {
        map.set(addr, { usd, symbol: sym });
      }
    }
  }

  return map;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const walletAddress = String(body?.walletAddress || '').trim();
    const chain = String(body?.chain || 'base');

    if (!walletAddress || !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json({ success: false, error: 'Invalid walletAddress' }, { status: 400 });
    }

    const supabase = await createSupabaseClient();

    // 1) Holdings (whitelisted tokenler için balance bazlı holder etiketi) - Mobula portfolio
    const holdings = await getWalletHoldings(walletAddress);

    // 2) Whitelist (token_address [+ token_symbol] varsa)
    let whitelistRows: Array<{ token_address: string; token_symbol?: string | null }> | null = null;
    let whitelistError: string | null = null;

    // Önce symbol ile dene
    {
      const { data, error } = await supabase
        .from('whitelisted_tokens')
        .select('token_address, token_symbol');
      if (!error) {
        whitelistRows = (data || []).map((r: { token_address?: string; token_symbol?: string | null }) => ({
          token_address: String(r?.token_address || ''),
          token_symbol: r?.token_symbol ?? null,
        }));
      } else {
        whitelistError = error.message;
      }
    }

    // Tablo şemasında token_symbol yoksa yalnızca address ile tekrar çek
    if (!whitelistRows) {
      const { data, error } = await supabase
        .from('whitelisted_tokens')
        .select('token_address');
      if (error) {
        return NextResponse.json({ success: false, error: `Failed to load whitelisted tokens: ${error.message}` }, { status: 500 });
      }
      whitelistRows = (data || []).map((r: { token_address?: string }) => ({
        token_address: String(r?.token_address || ''),
        token_symbol: null,
      }));
    }

    // 3) Intersection + max holding token'ı bul
    let bestAddr: string | null = null;
    let bestUsd = 0;
    let bestTicker: string | null = null;

    const whitelistMap = new Map<string, { symbol?: string | null }>();
    for (const r of whitelistRows) {
      const lc = r.token_address?.toLowerCase();
      if (lc) whitelistMap.set(lc, { symbol: r.token_symbol ?? null });
    }

    // Debug: Holdings ve whitelist bilgilerini logla
    const holdingsList = Array.from(holdings.entries()).map(([addr, h]) => ({
      addr,
      usd: h.usd,
      symbol: h.symbol || 'N/A',
      isWhitelisted: whitelistMap.has(addr),
    }));

    const whitelistList = Array.from(whitelistMap.keys());

    // USD değeri 0'dan büyük veya eşit olanları kontrol et
    for (const [addr, h] of holdings.entries()) {
      if (!whitelistMap.has(addr)) {
        continue;
      }
            
      // USD değeri kontrolünü >= 0 yapalım (0 değerleri de dahil)
      if (h.usd >= bestUsd) {
        bestUsd = h.usd;
        bestAddr = addr;
        // Öncelik: Supabase token_symbol -> Moralis symbol -> token ticker -> address kısa versiyonu
        const whitelistSymbol = whitelistMap.get(addr)?.symbol;
        const moralisSymbol = h.symbol;
        
        bestTicker = whitelistSymbol || moralisSymbol || null;
              }
    }

    // Fallback: Eğer hala ticker yoksa ve bestAddr varsa, token ticker'ı kullan
    if (!bestTicker && bestAddr) {
      const holding = holdings.get(bestAddr);
      if (holding?.symbol) {
        bestTicker = holding.symbol;
      } else {
        // Son çare: Address'in kısa versiyonu
        bestTicker = `${bestAddr.slice(0, 6)}...${bestAddr.slice(-4)}`;
      }
    }

    const dbWallet = walletAddress.toLowerCase();

    // Boş string kontrolü: Eğer bestTicker boş string ise null yap
    const holderTagValue = bestTicker && bestTicker.trim() !== '' ? bestTicker.trim() : null;

    // 4) aura_card insert (HER çağrıda yeni satır)
    const insertData = {
      wallet_address: dbWallet,
      holder_tag: holderTagValue,
      // network, created_at, minted: DB default
    };

    const { data: insertedData, error: auraInsErr } = await supabase
      .from('aura_card')
      .insert(insertData)
      .select('holder_tag');

    if (auraInsErr) {
      console.error('❌ [generate-aura-card] Insert error:', auraInsErr);
      return NextResponse.json({ success: false, error: auraInsErr.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        wallet: walletAddress,
        chain,
        data: {
          holder_tag: holderTagValue,
          holder_tag_source: bestAddr ? 'whitelist∩holdings' : 'none',
        },
        debug: {
          whitelistError: whitelistError || undefined,
          top_holding_usd: bestUsd,
          top_holding_address: bestAddr || undefined,
          holdingsCount: holdings.size,
          whitelistCount: whitelistMap.size,
          intersectionFound: bestAddr !== null,
          bestTicker,
          sampleHoldings: holdingsList.slice(0, 3),
          sampleWhitelist: whitelistList.slice(0, 3),
          insertedHolderTag: insertedData?.[0]?.holder_tag,
          insertedHolderTagType: typeof insertedData?.[0]?.holder_tag,
          insertedHolderTagIsNull: insertedData?.[0]?.holder_tag === null,
        },
        timestamp: new Date().toISOString(),
      });
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'Unknown error';
    console.error('❌ [generate-aura-card] Fatal error:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
