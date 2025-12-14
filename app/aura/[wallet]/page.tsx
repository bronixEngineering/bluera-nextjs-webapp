import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";

async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (!host) return "https://bluera.vercel.app";
  return `${proto}://${host}`;
}

const FALLBACK_OG_IMAGE =
  "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png";

async function getAuraCardImageUrl(baseUrl: string, wallet: string) {
  try {
    const res = await fetch(
      `${baseUrl}/api/aura-card?wallet=${encodeURIComponent(wallet)}&network=base`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { image_url?: string | null };
    return json?.image_url ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wallet: string }>;
}): Promise<Metadata> {
  const { wallet } = await params;
  const baseUrl = await getBaseUrlFromHeaders();
  const imageUrl = (await getAuraCardImageUrl(baseUrl, wallet)) ?? FALLBACK_OG_IMAGE;
  const shareUrl = `${baseUrl}/aura/${encodeURIComponent(wallet)}`;

  return {
    title: "Bluera Aura Card",
    description: "Share your onchain trading aura on Bluera.",
    openGraph: {
      title: "Bluera Aura Card",
      description: "Share your onchain trading aura on Bluera.",
      url: shareUrl,
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: "Bluera Aura Card",
      description: "Share your onchain trading aura on Bluera.",
      images: [imageUrl],
    },
    other: {
      // Required for rich embeds in Farcaster/Base when sharing this URL.
      "fc:frame": "vNext",
      "fc:frame:image": imageUrl,
      "fc:frame:button:1": "Open Bluera",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": "https://bluera.vercel.app",
    },
  };
}

export default async function AuraCardSharePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const baseUrl = await getBaseUrlFromHeaders();
  const imageUrl = (await getAuraCardImageUrl(baseUrl, wallet)) ?? FALLBACK_OG_IMAGE;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Bluera Aura Card</h1>
          <p className="text-sm text-white/70 break-all">{wallet}</p>
        </div>

        <div className="relative w-full aspect-[20/21] overflow-hidden rounded-3xl border border-white/10 bg-white/5">
          <Image
            src={imageUrl}
            alt="Bluera Aura Card"
            fill
            className="object-contain"
            unoptimized
            priority
          />
        </div>

        <div className="flex justify-center">
          <a
            href="https://bluera.vercel.app"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-yellow-500 px-6 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
          >
            Open Bluera
          </a>
        </div>
      </div>
    </main>
  );
}
