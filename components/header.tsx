'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockUser } from '@/lib/mock-data';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={mockUser.avatar} alt={mockUser.username} />
            <AvatarFallback>{mockUser.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">FID #{mockUser.fid}</span>
              <Badge variant="secondary" className="text-xs">
                {mockUser.basename}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {mockUser.username}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            Aura: 87
          </Badge>
          <div className="hidden lg:flex items-center space-x-4 ml-4">
            <span className="text-sm text-muted-foreground">Trading Score: 92</span>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">Rank: #1,234</span>
          </div>
        </div>
      </div>
    </header>
  );
}
