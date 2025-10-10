import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { TabNavigation } from "@/components/tab-navigation";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bluera - Crypto Analysis",
  description: "Mobile-first crypto analysis app with trading insights and leaderboards",
};

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
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-background">
            <Header />
            <main className="pb-20 lg:pb-6 lg:pt-20 lg:ml-64">
              <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {children}
              </div>
            </main>
            <TabNavigation />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
