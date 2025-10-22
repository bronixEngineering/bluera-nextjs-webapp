"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import Image from "next/image";
// html2canvas removed - using native Canvas API instead

type ShareableAuraCardProps = {
  username?: string;
  fid?: number;
  pfpUrl?: string;
  holderTag: string;
  traderTag: string;
  allTimeVolume: number;
  pnl: number;
  networth: number;
  followers: number;
  following: number;
};

export function ShareableAuraCard({
  username,
  fid,
  pfpUrl,
  holderTag,
  traderTag,
  allTimeVolume,
  pnl,
  networth,
  followers,
  following,
}: ShareableAuraCardProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const generateImage = async () => {
    try {
      // Create canvas - minimalist aura card
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Square canvas for better social media sharing
      const width = 1000;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      // Background - subtle gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height);
      bgGradient.addColorStop(0, 'rgba(168, 85, 247, 0.1)');
      bgGradient.addColorStop(0.5, 'rgba(0, 0, 0, 1)');
      bgGradient.addColorStop(1, 'rgba(234, 179, 8, 0.1)');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // Card border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, 60, width - 120, height - 120, 40);
      ctx.stroke();

      // Header with Profile
      const pfpSize = 120;
      const pfpX = 120;
      const pfpY = 120;

      // Profile picture circle
      ctx.strokeStyle = '#a78bfa';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Load profile picture
      if (pfpUrl) {
        try {
          const img = document.createElement('img');
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = pfpUrl;
          });
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 - 4, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, pfpX, pfpY, pfpSize, pfpSize);
          ctx.restore();
        } catch {
          // Placeholder
          ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
          ctx.beginPath();
          ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 - 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Username and FID
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(username || 'Trader', 280, 170);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`FID #${fid || '11222'}`, 280, 210);


      // Tags - Holder and Trader
      const tagsY = 400;
      const tagWidth = 180;
      const tagSpacing = 20;
      const tagsStartX = (width - (tagWidth * 2 + tagSpacing)) / 2;
      
      // Holder tag (purple)
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tagsStartX, tagsY, tagWidth, 50, 25);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#c084fc';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(holderTag, tagsStartX + tagWidth / 2, tagsY + 32);
      
      // Trader tag (yellow)
      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.beginPath();
      ctx.roundRect(tagsStartX + tagWidth + tagSpacing, tagsY, tagWidth, 50, 25);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#facc15';
      ctx.fillText(traderTag, tagsStartX + tagWidth + tagSpacing + tagWidth / 2, tagsY + 32);

      // Stats grid (3x2 - 6 stats total)
      const statsY = 500;
      const statBoxWidth = 350;
      const statBoxHeight = 90;
      const statSpacing = 30;
      const statsStartX = (width - (statBoxWidth * 2 + statSpacing)) / 2;

      const drawStatBox = (x: number, y: number, label: string, value: string, color?: string) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, y, statBoxWidth, statBoxHeight, 15);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#9ca3af';
        ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x + statBoxWidth / 2, y + 30);

        ctx.fillStyle = color || '#ffffff';
        ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(value, x + statBoxWidth / 2, y + 65);
      };

      // Row 1
      drawStatBox(statsStartX, statsY, 'All-time Volume', `$${(allTimeVolume / 1000000).toFixed(1)}M`);
      drawStatBox(statsStartX + statBoxWidth + statSpacing, statsY, 'PnL', `${pnl >= 0 ? '+' : ''}$${(pnl / 1000).toFixed(0)}K`, pnl >= 0 ? '#22c55e' : '#ef4444');
      
      // Row 2
      drawStatBox(statsStartX, statsY + statBoxHeight + statSpacing, 'Net Worth', `$${(networth / 1000).toFixed(0)}K`);
      drawStatBox(statsStartX + statBoxWidth + statSpacing, statsY + statBoxHeight + statSpacing, 'FID', `#${fid || '11222'}`);
      
      // Row 3
      drawStatBox(statsStartX, statsY + (statBoxHeight + statSpacing) * 2, 'Followers', `${followers?.toLocaleString()}`);
      drawStatBox(statsStartX + statBoxWidth + statSpacing, statsY + (statBoxHeight + statSpacing) * 2, 'Following', `${following?.toLocaleString()}`);

      // Footer
      ctx.fillStyle = '#6b7280';
      ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generated by Bluera', width / 2, height - 50);

      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Image generation failed:', error);
      return null;
    }
  };

  const handlePreview = async () => {
    setIsGenerating(true);
    const dataUrl = await generateImage();
    if (dataUrl) {
      setPreviewUrl(dataUrl);
      setShowPreview(true);
    }
    setIsGenerating(false);
  };

  const handleShare = async () => {
    if (!previewUrl) return;
    
    try {
      // Convert data URL to blob
      const base64Data = previewUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Try Web Share API first (mobile native share)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `bluera-card-${username || fid || Date.now()}.png`, { 
          type: 'image/png' 
        });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Bluera Aura Card',
            text: 'Check out my trading aura on Bluera! 🚀',
          });
          console.log('✅ Shared successfully via Web Share API');
          return;
        }
      }
      
      // Fallback 1: Try Clipboard API
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          alert('✅ Image copied to clipboard! You can now paste it anywhere.');
          console.log('✅ Copied to clipboard');
          return;
        } catch (clipboardError) {
          console.log('Clipboard failed, trying next method...');
        }
      }
      
      // Fallback 2: Open in new tab for manual save
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, '_blank');
      
      if (newWindow) {
        alert('💡 Tip: Long press on the image and select "Save Image" to download it to your device.');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); // Cleanup after 1 min
      } else {
        // Fallback 3: Try direct download (may crash on mini apps)
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `bluera-card-${username || fid || Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('❌ Failed to share. Try taking a screenshot instead!');
    }
  };


  return (
    <div className="space-y-6">
      {/* Minimalist Aura Card */}
      <div
        ref={cardRef}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-purple-500/10 via-background to-yellow-500/10 p-8 mx-auto backdrop-blur-sm"
        style={{
          maxWidth: "500px",
          background: "linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(0, 0, 0, 0) 50%, rgba(234, 179, 8, 0.1) 100%)",
        }}
      >
        {/* Header with Profile */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-purple-400 overflow-hidden bg-muted relative">
            {pfpUrl ? (
              <Image src={pfpUrl} alt="Profile" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-400/20" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{username || 'Trader'}</h3>
            <p className="text-sm text-muted-foreground">FID #{fid || '11222'}</p>
          </div>
        </div>


        {/* Tags */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-xs font-medium">
            {holderTag}
          </span>
          <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/20 text-xs font-medium">
            {traderTag}
          </span>
        </div>

        {/* Stats Grid - 3 rows x 2 cols */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">All-time Volume</p>
            <p className="font-semibold text-sm">${(allTimeVolume / 1000000).toFixed(1)}M</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">PnL</p>
            <p className={`font-semibold text-sm ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {pnl >= 0 ? '+' : ''}${(pnl / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Net Worth</p>
            <p className="font-semibold text-sm">${(networth / 1000).toFixed(0)}K</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">FID</p>
            <p className="font-semibold text-sm">#{fid || '11222'}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Followers</p>
            <p className="font-semibold text-sm">{followers?.toLocaleString()}</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-background/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Following</p>
            <p className="font-semibold text-sm">{following?.toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-xs text-muted-foreground">Generated by Bluera</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={handlePreview}
          disabled={isGenerating}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all"
        >
          {isGenerating ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-5 w-5 mr-2" />
              Share Your Aura
            </>
          )}
        </Button>
      </div>

      {/* Preview Modal */}
      {showPreview && previewUrl && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="bg-background rounded-lg p-6 max-w-2xl w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Trading Aura Card</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="border rounded-lg overflow-hidden relative w-full aspect-[5/6]">
              <Image src={previewUrl} alt="Trading Aura Card" fill className="object-contain" />
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button
                onClick={handleShare}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Share / Save
              </Button>
            </div>
            
            <p className="text-xs text-center text-muted-foreground">
              💡 Tip: Long press on the image to save to your device
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
