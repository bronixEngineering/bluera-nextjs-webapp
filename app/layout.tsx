import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { TabNavigation } from "@/components/tab-navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { FarcasterProvider } from "@/components/farcaster-provider";

// Miniapp configuration
const miniapp = {
  version: "1",
  name: "Bluera - Base Analytics",
  homeUrl: "https://bluera.vercel.app",
  description: "Track your trading performance, analyze market trends, and compete with other traders in real-time.",
  heroImageUrl: "",
  iconUrl: "https://sbhcvcgwvbodsrsnufhk.supabase.co/storage/v1/object/public/public-assets/blueara-app-logo.png"
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: miniapp.name,
    description: miniapp.description,
    manifest: "/manifest.json",
    icons: {
      icon: miniapp.iconUrl,
      apple: miniapp.iconUrl,
    },
    other: {
      "fc:miniapp": JSON.stringify({
        version: miniapp.version,
        imageUrl: miniapp.heroImageUrl,
        button: {
          title: `Join the ${miniapp.name}`,
          action: {
            name: `Launch ${miniapp.name}`,
            url: `${miniapp.homeUrl}`
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
        </FarcasterProvider>
      </body>
    </html>
  );
}
