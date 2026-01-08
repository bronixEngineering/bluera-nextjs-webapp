export async function GET() {
  const manifest_json_object = {
    accountAssociation: {
      header: "eyJmaWQiOjExNDgwMjAsInR5cGUiOiJhdXRoIiwia2V5IjoiMHg3RTczRTUxNDgxNzMyNzc1MTZjMzQxRTMwZTJCQzAyNUZCNDUzMjI0In0",
      payload: "eyJkb21haW4iOiJibHVlcmEuYXBwIn0",
      signature: "CqEhEijp1ogItti83pTSQZevSciqon+S7ElLBXVcH8pO3BpK9k+rr8/M/tabc/cepaDKZmjwCrceo6Ot0qIKUhs="
    },

    baseBuilder: {
      allowedAddresses: ["0xccFA4a7BE08eC57eD5F9A5689c1DafcEB541fD5f"],
      ownerAddress: "0x1E151D61CB2a75a813A3a5EF2b4BCCb70dcdCdD8"
    },
    miniapp: {
      version: "1",
      name: "Bluera - Base Analytics",
      homeUrl: "https://bluera.app",
      iconUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      splashImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      splashBackgroundColor: "#0f172a",
      webhookUrl: "https://bluera.app/api/webhook",
      subtitle: "Base Analytics",
      description:
        "Track your trading performance, analyze market trends, and compete with other traders in real-time.",
      screenshotUrls: [
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/App%20Screenshots/IMG_3871.PNG",
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/App%20Screenshots/IMG_3872.PNG",
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/App%20Screenshots/IMG_3873.PNG",
      ],
      primaryCategory: "finance",
      tags: ["crypto", "trading", "analytics", "defi", "leaderboard"],
      heroImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      tagline: "Master Your Trading Journey",
      ogTitle: "Bluera",
      ogDescription: "Base Analytics",
      ogImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      noindex: false,
    },
  };

  return Response.json(manifest_json_object);
}
