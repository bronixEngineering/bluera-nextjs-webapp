import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { TabNavigation } from "@/components/tab-navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { FarcasterProvider } from "@/components/farcaster-provider";
import { OnboardingGuard } from "@/components/onboarding-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Farcaster.json'dan bilgileri al
  const manifest_json_object = {
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
      ogTitle: "Bluera",
      ogDescription:
        "Base Analytics",
      ogImageUrl:
        "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png",
      noindex: false,
    },
  };

  const miniapp = manifest_json_object.miniapp;

  return {
    title: miniapp.name,
    description: miniapp.description,
    other: {
      "fc:miniapp": JSON.stringify({
        version: miniapp.version,
        imageUrl: miniapp.iconUrl, // iconUrl kullanıyorum çünkü heroImageUrl boş
        button: {
          title: `Launch ${miniapp.name}`,
          action: {
            type: "launch_miniapp",
            name: miniapp.name,
            url: miniapp.homeUrl,
            splashImageUrl: miniapp.splashImageUrl,
            splashBackgroundColor: miniapp.splashBackgroundColor,
          },
        },
      }),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FarcasterProvider>
          <OnboardingGuard>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem={false}
              disableTransitionOnChange
            >
              <div className="min-h-screen bg-background">
                <Header />
                <main className="pb-20 lg:pb-6 lg:ml-64">
                  <div className="max-w-none mx-auto px-6 lg:px-8 xl:px-12">
                    {children}
                  </div>
                </main>
                <TabNavigation />
              </div>
            </ThemeProvider>
          </OnboardingGuard>
        </FarcasterProvider>
      </body>
    </html>
  );
}
