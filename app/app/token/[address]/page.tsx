import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface TokenData {
  token_address: string;
  token_ticker: string;
  total_swaps_24h: number;
  total_volume_24h: number;
  last_update: string;
  token_type: string;
  image_url: string;
  total_volume_changing_rate: number;
  usd_price: string;
  total_liquidity_usd: string;
  total_fully_diluted_valuation: string;
  price_percent_change: {
    "1h": number;
    "5m": number;
    "6h": number;
    "24h": number;
  };
}

interface TokenHolder {
  id: string;
  wallet_address: string;
  token_address: string;
  token_transfer_count: number;
  token_volume: number;
  holding_amount_usd: number;
  created_at: string;
}

interface TokenDetailPageProps {
  params: {
    address: string;
  };
}

async function getTokenData(address: string): Promise<{
  token: TokenData | null;
  holders: TokenHolder[];
  error?: string;
}> {
  try {
    const supabase = await createSupabaseClient();

    // Fetch both token data and holders in parallel
    const [tokenResult, holdersResult] = await Promise.allSettled([
      supabase
        .from("whitelisted_tokens")
        .select("*")
        .eq("token_address", address)
        .single(),
      supabase
        .from("wallet_token_status")
        .select("*")
        .eq("token_address", address)
        .order("holding_amount_usd", { ascending: false })
        .limit(50) // Top 50 holders
    ]);

    // Handle token result
    const tokenData = tokenResult.status === "fulfilled" ? tokenResult.value : null;
    const token = tokenData?.data;
    const tokenError = tokenData?.error;

    if (tokenError) {
      console.error("❌ Token fetch error:", tokenError);
      return {
        token: null,
        holders: [],
        error: "Token not found",
      };
    }

    // Handle holders result
    const holdersData = holdersResult.status === "fulfilled" ? holdersResult.value : null;
    const holders = holdersData?.data || [];
    const holdersError = holdersData?.error;

    if (holdersError) {
      console.error("❌ Holders fetch error:", holdersError);
      // Still return token data even if holders fail
      return {
        token,
        holders: [],
        error: "Failed to fetch holders",
      };
    }

    return {
      token,
      holders,
    };
  } catch (error) {
    console.error("❌ Token detail fetch error:", error);
    return {
      token: null,
      holders: [],
      error: "Internal server error",
    };
  }
}

function formatValue(value: number | null) {
  if (!value || value === 0) return "$0.00";
  
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  if (absValue >= 1e9) { // Billions
    const billions = (absValue / 1e9).toFixed(2);
    return isNegative ? `-$${billions}B` : `$${billions}B`;
  } else if (absValue >= 1e6) { // Millions
    const millions = (absValue / 1e6).toFixed(2);
    return isNegative ? `-$${millions}M` : `$${millions}M`;
  } else if (absValue >= 1e3) { // Thousands
    const thousands = (absValue / 1e3).toFixed(2);
    return isNegative ? `-$${thousands}K` : `$${thousands}K`;
  } else { // Regular numbers
    return isNegative ? `-$${absValue.toFixed(2)}` : `$${absValue.toFixed(2)}`;
  }
}


export default async function TokenDetailPage({ params }: TokenDetailPageProps) {
  const resolvedParams = await params;
  const { token, holders, error } = await getTokenData(resolvedParams.address);

  if (error || !token) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/app" className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Token Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">The requested token could not be found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          {token.image_url && (
            <Image
              src={token.image_url}
              alt={token.token_ticker}
              width={40}
              height={40}
              className="rounded-full"
              unoptimized
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{token.token_ticker}</h1>
            <p className="text-sm text-muted-foreground font-mono">
              {token.token_address.slice(0, 8)}...{token.token_address.slice(-8)}
            </p>
          </div>
        </div>
        <Badge variant={token.token_type === "meme" ? "default" : "secondary"}>
          {token.token_type || "Unknown"}
        </Badge>
      </div>

      {/* Price Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-white/10 p-6 shadow-xl">
        {/* Animated gradient orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-sm font-medium text-muted-foreground">Current Price</div>
                <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-xs font-medium text-blue-500">
                  Live
                </div>
              </div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                ${token.usd_price ? parseFloat(token.usd_price).toFixed(6) : "N/A"}
              </div>
            </div>
            {token.price_percent_change && (
              <div className="text-right">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${
                  token.price_percent_change["24h"] >= 0 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <span className={`text-2xl ${
                    token.price_percent_change["24h"] >= 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {token.price_percent_change["24h"] >= 0 ? "↗" : "↘"}
                  </span>
                  <div>
                    <div className={`text-xl font-bold ${
                      token.price_percent_change["24h"] >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {token.price_percent_change["24h"] >= 0 ? "+" : ""}
                      {token.price_percent_change["24h"].toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground">24h</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Price Performance Pills */}
          {token.price_percent_change && (
            <div className="flex gap-2 mt-5 flex-wrap">
              {Object.entries(token.price_percent_change)
                .filter(([period]) => period !== "24h")
                .sort(([a], [b]) => {
                  const order: Record<string, number> = { "5m": 1, "1h": 2, "6h": 3 };
                  return (order[a] || 99) - (order[b] || 99);
                })
                .map(([period, change]) => (
                  <div key={period} className={`group px-3 py-1.5 rounded-full backdrop-blur-sm border transition-all hover:scale-105 ${
                    change >= 0 
                      ? "bg-green-500/5 border-green-500/20 hover:bg-green-500/10" 
                      : "bg-red-500/5 border-red-500/20 hover:bg-red-500/10"
                  }`}>
                    <span className="text-xs text-muted-foreground mr-1.5 font-medium">{period}</span>
                    <span className={`text-xs font-bold ${
                      change >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics - Modern Grid with Icons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volume Card */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-500/5 to-transparent p-5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-blue-500/20 transition-all" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl -ml-8 -mb-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">24h</div>
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Volume</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
              {formatValue(token.total_volume_24h)}
            </div>
          </div>
        </div>

        {/* Liquidity Card */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-purple-500/5 to-transparent p-5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-purple-500/20 transition-all" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-500/5 rounded-full blur-xl -ml-8 -mb-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Liquidity</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-transparent">
              {formatValue(parseFloat(token.total_liquidity_usd || "0"))}
            </div>
          </div>
        </div>

        {/* Market Cap Card */}
        <div className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-pink-500/5 to-transparent p-5 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-pink-500/20 transition-all" />
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-500/5 rounded-full blur-xl -ml-8 -mb-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 rounded-xl bg-pink-500/10 group-hover:bg-pink-500/20 transition-colors">
                <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-medium text-pink-500 bg-pink-500/10 px-2 py-1 rounded-full">FDV</div>
            </div>
            <div className="text-sm font-medium text-muted-foreground mb-1">Market Cap</div>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
              {formatValue(parseFloat(token.total_fully_diluted_valuation || "0"))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">24h Swaps:</span>
          <span className="text-sm font-semibold">{token.total_swaps_24h?.toLocaleString() || "0"}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {new Date(token.last_update).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* Top Wallets */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent border-b">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-lg">Top Wallets</div>
              <div className="text-xs font-normal text-muted-foreground">Most active traders</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {holders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p>No wallet data available</p>
            </div>
          ) : (
            <div className="divide-y">
              {holders.slice(0, 20).map((holder, index) => (
                <div
                  key={holder.id}
                  className="group flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-muted/50 hover:to-transparent transition-all duration-200"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 ${
                      index === 0 
                        ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 text-yellow-600 border border-yellow-500/30 shadow-lg shadow-yellow-500/20" 
                        : index === 1 
                        ? "bg-gradient-to-br from-gray-400/20 to-gray-500/20 text-gray-400 border border-gray-400/30" 
                        : index === 2 
                        ? "bg-gradient-to-br from-orange-600/20 to-orange-700/20 text-orange-600 border border-orange-600/30" 
                        : "bg-muted/50 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 animate-pulse" />
                        </div>
                      )}
                      #{index + 1}
                    </div>
                    
                    {/* Wallet Info */}
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm font-semibold group-hover:text-primary transition-colors">
                          {holder.wallet_address.slice(0, 8)}...{holder.wallet_address.slice(-6)}
                        </div>
                        {index < 3 && (
                          <div className="px-2 py-0.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
                            Top {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                          {holder.token_transfer_count?.toLocaleString() || 0} transfers
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Value Info */}
                  <div className="text-right">
                    <div className="text-base font-bold group-hover:scale-105 transition-transform">
                      {formatValue(holder.holding_amount_usd)}
                    </div>
                    <div className="flex items-center gap-1 justify-end text-xs text-muted-foreground mt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {formatValue(holder.token_volume)} vol
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
