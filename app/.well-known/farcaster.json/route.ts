export async function GET() {
  const manifest_json_object = {
    accountAssociation: {
      header:
        "eyJmaWQiOjEzNzAzMDUsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhkNjM1ODk2MGU3MjUyNGI3NTlEM0Q5RjI1QjI3NjNBOWI1NEE1NjEwIn0",
      payload: "eyJkb21haW4iOiJibHVlcmEudmVyY2VsLmFwcCJ9",
      signature:
        "MHg4YWMwYTI4NGJhODdiMjYwYmVjMjE1NTBlZDZiOGMyYWMyZTNhMTAxMTU0NmUxNmZmMDE5YWRlN2IwYjgyYWViM2U4NTVjM2QwNDcxYmMwYzJiMDA0ZTc2YTdhOTlkNmMzMjMwNDdiOTVkMWU3MzZiN2NhY2QyNTNmYzhjMDUzMzFi",
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
