import { Header } from "@/components/header";
import { TabNavigation } from "@/components/tab-navigation";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-20 lg:pb-6 lg:ml-64">
        <div className="max-w-none mx-auto px-6 lg:px-8 xl:px-12">
          {children}
        </div>
      </main>
      <TabNavigation />
    </div>
  );
}
