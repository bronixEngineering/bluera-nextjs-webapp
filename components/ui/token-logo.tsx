import { getTokenLogoUrl } from '@/lib/token-logos';
import { cn } from '@/lib/utils';

interface TokenLogoProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export function TokenLogo({ 
  symbol, 
  size = 'md', 
  className,
  showFallback = true 
}: TokenLogoProps) {
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (showFallback) {
      const target = e.target as HTMLImageElement;
      // Try alternative CDN if main one fails
      const currentSrc = target.src;
      if (!currentSrc.includes('placeholder')) {
        target.src = `https://via.placeholder.com/32x32/1f2937/ffffff?text=${symbol.charAt(0)}`;
      }
    }
  };

  return (
    <img 
      src={getTokenLogoUrl(symbol)} 
      alt={`${symbol} logo`}
      className={cn(
        'rounded-full object-cover',
        sizeClasses[size],
        className
      )}
      onError={handleError}
      loading="lazy"
    />
  );
}
