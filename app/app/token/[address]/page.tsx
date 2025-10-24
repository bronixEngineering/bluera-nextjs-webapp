import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowLeft } from "lucide-react";
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

function formatPercentage(value: number | null) {
  if (!value) return "0.00%";
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(2)}%`;
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

  const change24h = token.total_volume_changing_rate * 100; // Convert to percentage
  const isPositive = change24h > 0;

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

      {/* Token Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              24h Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(token.total_volume_24h)}</div>
            <div className={`text-sm flex items-center gap-1 ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}>
              {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercentage(token.total_volume_changing_rate)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              24h Swaps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {token.total_swaps_24h?.toLocaleString() || "0"}
            </div>
            <div className="text-sm text-muted-foreground">
              Total transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Holders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{holders.length}</div>
            <div className="text-sm text-muted-foreground">
              Active holders
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Last Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {new Date(token.last_update).toLocaleDateString()}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(token.last_update).toLocaleTimeString()}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Updates every 24 hours
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Infos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Wallet Infos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {holders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No holder data available
            </div>
          ) : (
            <div className="space-y-2">
              {holders.slice(0, 20).map((holder, index) => (
                <div
                  key={holder.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-mono text-sm">
                        {holder.wallet_address.slice(0, 8)}...{holder.wallet_address.slice(-6)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {holder.token_transfer_count?.toLocaleString() || 0} transfers
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatValue(holder.holding_amount_usd)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatValue(holder.token_volume)} volume
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
