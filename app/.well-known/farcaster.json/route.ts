export async function GET() {
  const manifest_json_object = {
    // accountAssociation: {
    //   header:
    //     "eyJmaWQiOjEzNzAzMDUsInR5cGUiOiJhdXRoIiwia2V5IjoiMHhFRkM3NDcxOEI3NjlBZjkyRjZhMjIzMURmMzZlRDQxNzI0NDk5NmEwIn0",
    //   payload: "eyJkb21haW4iOiJibHVlcmEudmVyY2VsLmFwcCJ9",
    //   signature:
    //     "uSEVguvxpx8Y0B5ZlgmV56/MrldCPfvcAiU3XgUw7to125wYPdrfgykhJbawwOqYYSan6KG1c3AAqBKgdsSrTRw=",
    // },

    baseBuilder: {
      allowedAddresses: ["0xEFC74718B769Af92F6a2231Df36eD417244996a0"],
    },
    miniapp: {
      version: "1",
      name: "Bluera - Base Analytics",
      homeUrl: "https://bluera.vercel.app",
      iconUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      splashImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      splashBackgroundColor: "#0f172a",
      webhookUrl: "https://bluera.vercel.app/api/webhook",
      subtitle: "Advanced crypto trading insights",
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
      ogTitle: "Bluera - Advanced Crypto Trading Analytics",
      ogDescription:
        "Comprehensive trading insights, performance tracking, and competitive leaderboards for crypto traders.",
      ogImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      noindex: false,
    },
  };

  return Response.json(manifest_json_object);
}
