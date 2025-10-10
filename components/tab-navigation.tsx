'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, Trophy, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  {
    name: 'Home',
    href: '/',
    icon: Home
  },
  {
    name: 'Heatmap',
    href: '/heatmap',
    icon: BarChart3
  },
  {
    name: 'Leaderboard',
    href: '/leaderboard',
    icon: Trophy
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User
  }
];

export function TabNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Navigation - Bottom */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    'flex flex-col items-center space-y-1 rounded-lg px-3 py-2 transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Navigation - Sidebar */}
      <nav className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40">
        <div className="flex flex-col h-full">
          <div className="p-4 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname === tab.href;
              
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-3 transition-colors',
                    isActive
                      ? 'text-primary bg-primary/10 border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.name}</span>
                </Link>
              );
            })}
          </div>
          
          {/* Desktop sidebar footer */}
          <div className="mt-auto p-4 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Bluera v1.0</div>
              <div>Dark Mode Active</div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
