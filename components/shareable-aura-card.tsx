"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import Image from "next/image";
// html2canvas removed - using native Canvas API instead
import { useAccount, useConnect, useSwitchChain, useChainId, useSendCalls } from "wagmi";
import { base } from "wagmi/chains";
import type { Abi } from "viem";
import { encodeFunctionData, parseUnits } from "viem";

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
  streak?: number; // Days active
  weeklyVolume?: number;
  monthlyVolume?: number;
  totalTrades?: number;
  weeklyPnl?: number;
  rank?: number;
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
  streak = 7,
  weeklyVolume = 50000,
  monthlyVolume = 200000,
  totalTrades = 45,
  weeklyPnl = 5000,
  rank = 1234,
}: ShareableAuraCardProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendCalls } = useSendCalls();

  const generateImage = async () => {
    try {
      // Create canvas - enhanced aura card
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      // Compact portrait canvas
      const width = 1000;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;

      // Fill entire canvas with black first
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      // Rounded card background with gradient (clipped to rounded rect)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(20, 20, width - 40, height - 40, 32);
      ctx.clip();

      // Background - subtle gradient (inside rounded rect)
      const bgGradient = ctx.createLinearGradient(
        20,
        20,
        width - 20,
        height - 20
      );
      bgGradient.addColorStop(0, "rgba(168, 85, 247, 0.1)");
      bgGradient.addColorStop(0.5, "rgba(0, 0, 0, 1)");
      bgGradient.addColorStop(1, "rgba(234, 179, 8, 0.1)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(20, 20, width - 40, height - 40);
      ctx.restore();

      // Card border with rounded corners
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(20, 20, width - 40, height - 40, 32);
      ctx.stroke();

      // Bluera Logo Header (centered)
      const logoSize = 50;
      const logoX = width / 2 - logoSize / 2 - 70;
      const logoY = 90;

      try {
        const logoImg = document.createElement("img");
        logoImg.crossOrigin = "anonymous";
        await new Promise<void>((resolve, reject) => {
          logoImg.onload = () => resolve();
          logoImg.onerror = () => reject();
          logoImg.src = "/original.webp";
        });

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, 10);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {
        console.log("Logo loading failed");
      }

      // Bluera text
      const textGradient = ctx.createLinearGradient(
        logoX + logoSize + 20,
        0,
        logoX + logoSize + 200,
        0
      );
      textGradient.addColorStop(0, "#c084fc");
      textGradient.addColorStop(1, "#facc15");
      ctx.fillStyle = textGradient;
      ctx.font =
        'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("BLUERA", logoX + logoSize + 20, logoY + 28);

      ctx.fillStyle = "#9ca3af";
      ctx.font =
        '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Trading Aura Card", logoX + logoSize + 20, logoY + 48);

      // Profile section
      const pfpSize = 85;
      const pfpX = 110;
      const pfpY = 170;

      // Profile picture circle
      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(
        pfpX + pfpSize / 2,
        pfpY + pfpSize / 2,
        pfpSize / 2,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Load profile picture
      if (pfpUrl) {
        try {
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = pfpUrl;
          });

          ctx.save();
          ctx.beginPath();
          ctx.arc(
            pfpX + pfpSize / 2,
            pfpY + pfpSize / 2,
            pfpSize / 2 - 4,
            0,
            Math.PI * 2
          );
          ctx.clip();
          ctx.drawImage(img, pfpX, pfpY, pfpSize, pfpSize);
          ctx.restore();
        } catch {
          // Placeholder
          ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
          ctx.beginPath();
          ctx.arc(
            pfpX + pfpSize / 2,
            pfpY + pfpSize / 2,
            pfpSize / 2 - 4,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      // Username and info
      ctx.fillStyle = "#ffffff";
      ctx.font =
        'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(username || "Trader", pfpX + pfpSize + 22, pfpY + 25);

      ctx.fillStyle = "#9ca3af";
      ctx.font =
        '17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(
        `FID #${fid || "11222"} • Rank #${rank}`,
        pfpX + pfpSize + 22,
        pfpY + 50
      );

      // Streak
      ctx.fillStyle = "#ffffff";
      ctx.font =
        'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("🔥", pfpX + pfpSize + 22, pfpY + 77);
      ctx.fillStyle = "#ffffff";
      ctx.font =
        '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`${streak} Day Streak`, pfpX + pfpSize + 50, pfpY + 77);

      // Tags - Holder and Trader (aligned to right, stacked)
      const tagWidth = 160;
      const tagHeight = 35;
      const tagSpacing = 12;
      const tagsX = width - 240; // Inside border with margin
      const tagsY = pfpY + 10;

      // Holder tag (purple) - top
      ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
      ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tagsX, tagsY, tagWidth, tagHeight, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#c084fc";
      ctx.font =
        'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(holderTag, tagsX + tagWidth / 2, tagsY + 22);

      // Trader tag (yellow) - bottom
      ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
      ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
      ctx.beginPath();
      ctx.roundRect(
        tagsX,
        tagsY + tagHeight + tagSpacing,
        tagWidth,
        tagHeight,
        18
      );
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.fillText(
        traderTag,
        tagsX + tagWidth / 2,
        tagsY + tagHeight + tagSpacing + 22
      );

      // Stats grid (3x3 - 9 stats total)
      const statsY = 370;
      const statBoxWidth = 250;
      const statBoxHeight = 68;
      const statSpacing = 18;
      const statsStartX = (width - (statBoxWidth * 3 + statSpacing * 2)) / 2;

      const drawStatBox = (
        x: number,
        y: number,
        label: string,
        value: string,
        color?: string
      ) => {
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, y, statBoxWidth, statBoxHeight, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#9ca3af";
        ctx.font =
          '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(label, x + statBoxWidth / 2, y + 25);

        ctx.fillStyle = color || "#ffffff";
        ctx.font =
          'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(value, x + statBoxWidth / 2, y + 52);
      };

      // Row 1
      drawStatBox(
        statsStartX,
        statsY,
        "All-Time Vol",
        `$${(allTimeVolume / 1000000).toFixed(1)}M`
      );
      drawStatBox(
        statsStartX + statBoxWidth + statSpacing,
        statsY,
        "Weekly Vol",
        `$${(weeklyVolume / 1000).toFixed(0)}K`
      );
      drawStatBox(
        statsStartX + (statBoxWidth + statSpacing) * 2,
        statsY,
        "Monthly Vol",
        `$${(monthlyVolume / 1000).toFixed(0)}K`
      );

      // Row 2
      drawStatBox(
        statsStartX,
        statsY + statBoxHeight + statSpacing,
        "Total PnL",
        `${pnl >= 0 ? "+" : ""}$${(pnl / 1000).toFixed(0)}K`,
        pnl >= 0 ? "#22c55e" : "#ef4444"
      );
      drawStatBox(
        statsStartX + statBoxWidth + statSpacing,
        statsY + statBoxHeight + statSpacing,
        "Weekly PnL",
        `${weeklyPnl >= 0 ? "+" : ""}$${(weeklyPnl / 1000).toFixed(1)}K`,
        weeklyPnl >= 0 ? "#22c55e" : "#ef4444"
      );
      drawStatBox(
        statsStartX + (statBoxWidth + statSpacing) * 2,
        statsY + statBoxHeight + statSpacing,
        "Net Worth",
        `$${(networth / 1000).toFixed(0)}K`
      );

      // Row 3
      drawStatBox(
        statsStartX,
        statsY + (statBoxHeight + statSpacing) * 2,
        "Total Trades",
        `${totalTrades}`
      );
      drawStatBox(
        statsStartX + statBoxWidth + statSpacing,
        statsY + (statBoxHeight + statSpacing) * 2,
        "Followers",
        `${followers?.toLocaleString()}`
      );
      drawStatBox(
        statsStartX + (statBoxWidth + statSpacing) * 2,
        statsY + (statBoxHeight + statSpacing) * 2,
        "Following",
        `${following?.toLocaleString()}`
      );

      // Mini Performance Chart (7-day bar chart)
      const chartY = statsY + (statBoxHeight + statSpacing) * 3 + 18;
      const chartWidth = 800;
      const chartHeight = 80;
      const chartX = (width - chartWidth) / 2;

      // Chart container
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(chartX, chartY, chartWidth, chartHeight + 50, 15);
      ctx.fill();
      ctx.stroke();

      // Chart title
      ctx.fillStyle = "#9ca3af";
      ctx.font =
        '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("7-Day Performance", width / 2, chartY + 25);

      // 7-day bar chart
      const barData = [65, 72, 68, 85, 90, 82, 95];
      const barWidth = (chartWidth - 100) / barData.length;
      const barSpacing = 10;
      const barStartX = chartX + 50;
      const barStartY = chartY + 45;
      const barMaxHeight = 70;

      barData.forEach((value, i) => {
        const barHeight = (value / 100) * barMaxHeight;
        const x = barStartX + i * barWidth + (barWidth - barSpacing) / 2;
        const y = barStartY + barMaxHeight - barHeight;

        // Bar gradient
        const barGradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        barGradient.addColorStop(0, "#a78bfa");
        barGradient.addColorStop(1, "#facc15");
        ctx.fillStyle = barGradient;

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth - barSpacing, barHeight, 5);
        ctx.fill();
      });

      // Footer with QR Code (at bottom)
      const footerY = height - 130;

      // Scan to Follow text (left side)
      ctx.fillStyle = "#ffffff";
      ctx.font =
        'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Scan to Follow", 150, footerY);

      ctx.fillStyle = "#9ca3af";
      ctx.font =
        '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(
        username ? `@${username}` : "on Farcaster",
        150,
        footerY + 25
      );

      // QR Code (right side) with rounded border
      if (username) {
        try {
          const qrSize = 100;
          const qrX = width - 200;
          const qrY = footerY - 30;

          // QR Code background (white rounded)
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(qrX, qrY, qrSize, qrSize, 15);
          ctx.fill();

          // Load QR code from API
          const qrImg = document.createElement("img");
          qrImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = () => reject();
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://farcaster.xyz/${username}`;
          });

          // Draw QR with rounded corners
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(qrX, qrY, qrSize, qrSize, 15);
          ctx.clip();
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          ctx.restore();
        } catch {
          console.log("QR code loading failed");
        }
      }

      // Tagline
      ctx.fillStyle = "#6b7280";
      ctx.font =
        '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(
        "Generated by Bluera • Track. Trade. Dominate.",
        width / 2,
        footerY + 60
      );

      return canvas.toDataURL("image/png");
    } catch (error) {
      console.error("Image generation failed:", error);
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
      const base64Data = previewUrl.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      // Try Web Share API first (mobile native share)
      if (navigator.share && navigator.canShare) {
        const file = new File(
          [blob],
          `bluera-card-${username || fid || Date.now()}.png`,
          {
            type: "image/png",
          }
        );

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My Bluera Aura Card",
            text: "Check out my trading aura on Bluera! 🚀",
          });
          console.log("✅ Shared successfully via Web Share API");
          return;
        }
      }

      // Fallback 1: Try Clipboard API
      if (navigator.clipboard && "write" in navigator.clipboard) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          alert("✅ Image copied to clipboard! You can now paste it anywhere.");
          console.log("✅ Copied to clipboard");
          return;
        } catch (clipboardError) {
          console.log("Clipboard failed, trying next method...");
        }
      }

      // Fallback 2: Open in new tab for manual save
      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      if (newWindow) {
        alert(
          '💡 Tip: Long press on the image and select "Save Image" to download it to your device.'
        );
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000); // Cleanup after 1 min
      } else {
        // Fallback 3: Try direct download (may crash on mini apps)
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `bluera-card-${username || fid || Date.now()}.png`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error("Share error:", error);
      alert("❌ Failed to share. Try taking a screenshot instead!");
    }
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);

      // 1) Ensure connected (Mini App connector auto-connects if available)
      if (!isConnected) {
        await connect({ connector: connectors[0] });
      }

      // 2) Ensure Base chain
      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      // 3) Fetch contracts from server
            const [auraRes, usdcRes] = await Promise.all([
              fetch("/api/contracts?name=aura-nft&is_test=false"),
              fetch("/api/contracts?name=usdc&is_test=false"),
            ]);
            if (!auraRes.ok) throw new Error("Aura contract not found");
            if (!usdcRes.ok) throw new Error("USDC contract not found");
      
            const aura = (await auraRes.json()) as { id: string; address: `0x${string}`; abi: Abi };
            const usdc = (await usdcRes.json()) as { address: `0x${string}`; abi: Abi };
      
            // 4) Build batched calls: approve USDC -> mint (with Supabase UUID)
            const amount = parseUnits("1", 6); // TODO: set actual mint price amount in USDC (6 decimals)
            await sendCalls({
              chainId: base.id,
              calls: [
                {
                  to: usdc.address,
                  data: encodeFunctionData({
                    abi: usdc.abi,
                    functionName: "approve",
                    args: [aura.address, amount],
                  }),
                },
                {
                  to: aura.address,
                  data: encodeFunctionData({
                    abi: aura.abi,
                    functionName: "mint",
                    args: [aura.id], // Supabase UUID from contracts table
                  }),
                },
              ],
            });
      
            console.log("✅ Batched approve + mint sent");
            alert("✅ Transaction sent! Check your wallet/notification.");
    } catch (error) {
      console.error("Mint error:", error);
      alert("❌ Failed to mint. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Just the content, no card wrapper */}
      <div
        ref={cardRef}
        className="mx-auto"
        style={{
          maxWidth: "500px",
        }}
      >
        {/* Bluera Logo Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image
            src="/original.webp"
            alt="Bluera Logo"
            width={40}
            height={40}
            className="rounded-lg"
            unoptimized
          />
          <div className="text-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
              BLUERA
            </h2>
            <p className="text-xs text-muted-foreground">Trading Aura Card</p>
          </div>
        </div>

        {/* Header with Profile */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-purple-400 overflow-hidden bg-muted relative">
            {pfpUrl ? (
              <Image
                src={pfpUrl}
                alt="Profile"
                fill
                className="object-cover"
                unoptimized
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-purple-400/20" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">{username || "Trader"}</h3>
            <p className="text-xs text-muted-foreground">
              FID #{fid || "11222"} • Rank #{rank}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-orange-500 text-lg">🔥</span>
              <span className="text-xs font-semibold">{streak} Day Streak</span>
            </div>
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

        {/* Stats Grid - 3x3 */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              All-Time Vol
            </p>
            <p className="font-bold text-xs">
              ${(allTimeVolume / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Weekly Vol
            </p>
            <p className="font-bold text-xs">
              ${(weeklyVolume / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Monthly Vol
            </p>
            <p className="font-bold text-xs">
              ${(monthlyVolume / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Total PnL
            </p>
            <p
              className={`font-bold text-xs ${
                pnl >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {pnl >= 0 ? "+" : ""}${(pnl / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Weekly PnL
            </p>
            <p
              className={`font-bold text-xs ${
                weeklyPnl >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {weeklyPnl >= 0 ? "+" : ""}${(weeklyPnl / 1000).toFixed(1)}K
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Net Worth
            </p>
            <p className="font-bold text-xs">
              ${(networth / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Total Trades
            </p>
            <p className="font-bold text-xs">{totalTrades}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Followers
            </p>
            <p className="font-bold text-xs">{followers?.toLocaleString()}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">
              Following
            </p>
            <p className="font-bold text-xs">{following?.toLocaleString()}</p>
          </div>
        </div>

        {/* Mini Performance Chart */}
        <div className="mt-6 p-3 rounded-xl bg-background/50 border border-border">
          <p className="text-xs text-muted-foreground mb-2 text-center">
            7-Day Performance
          </p>
          <div className="flex items-end justify-between gap-1 h-12">
            {[65, 72, 68, 85, 90, 82, 95].map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-purple-500 to-yellow-500 rounded-t opacity-80"
                style={{ height: `${value}%` }}
              />
            ))}
          </div>
        </div>

        {/* Footer with QR Code */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold mb-1">Scan to Follow</p>
              <p className="text-[10px] text-muted-foreground">
                {username ? `@${username}` : "on Farcaster"}
              </p>
            </div>
            {username && (
              <div className="w-16 h-16 bg-white rounded-lg p-1 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=https://farcaster.xyz/${username}`}
                  alt="QR Code"
                  className="w-full h-full"
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Generated by Bluera • Track. Trade. Dominate.
          </p>
        </div>
      </div>

      {/* Mint Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleMint}
          disabled={isMinting}
          size="lg"
          className="bg-gradient-to-r from-yellow-500 to-purple-500 hover:from-yellow-600 hover:to-purple-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all mb-3"
        >
          {isMinting ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2" />
              Minting...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-2" />
              Mint Aura NFT
            </>
          )}
        </Button>
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

            <div className="overflow-hidden relative w-full aspect-[5/6]">
              <Image
                src={previewUrl}
                alt="Trading Aura Card"
                fill
                className="object-contain rounded-3xl"
              />
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
