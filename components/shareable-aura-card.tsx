// components/shareable-aura-card.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import Image from "next/image";
import { useAccount, useConnect, useSwitchChain, useChainId, useSendCalls } from "wagmi";
import { base } from "wagmi/chains";
import type { Abi } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import auraAbi from "@/components/ABI/aura_nft_contract_abi";
import usdcAbi from "@/components/ABI/usdc_contract_abi";

type ShareableAuraCardProps = {
  username?: string;
  fid?: number;
  pfpUrl?: string;
  holderTag: string;
  traderTag: string;
  allTimeVolume: number;
  pnl: number;
  networth: number;
  weeklyVolume?: number;
  monthlyVolume?: number;
  totalTrades?: number;
  weeklyPnl?: number;
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
  weeklyVolume,
  monthlyVolume,
  totalTrades = 0,
  weeklyPnl,
}: ShareableAuraCardProps) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendCalls } = useSendCalls();
  const AURA_NFT_ADDRESS = "0x0BDDf09e207B0303f3F5CA5Af69C9b2ECF74b453";
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // API'den gelen değerleri tutan state'ler (prop'lardan başlatılır)
  const [allTimeVolumeState, setAllTimeVolumeState] = React.useState<number | undefined>(allTimeVolume);
  const [networthState, setNetworthState] = React.useState<number | undefined>(networth);
  const [weeklyVolumeState, setWeeklyVolumeState] = React.useState<number | undefined>(weeklyVolume);
  const [monthlyVolumeState, setMonthlyVolumeState] = React.useState<number | undefined>(monthlyVolume);
  const [weeklyPnlState, setWeeklyPnlState] = React.useState<number | undefined>(weeklyPnl);
  const [pnlState, setPnlState] = React.useState<number | undefined>(pnl);
  const [totalTradesState, setTotalTradesState] = React.useState<number>(totalTrades || 0);
  const [isGenratingAuraCard, setIsGenratingAuraCard] = React.useState(false);
  const [isAuraCardGenerated, setIsAuraCardGenerated] = React.useState(false);

  // Para formatlayıcı: $X.X, $X.XK, $X.XM
  const fmtMoney = (v: number) => {
    const n = Math.abs(Number(v) || 0);
    if (n < 1000) return `$${n.toFixed(1)}`;
    if (n < 1_000_000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${(n / 1_000_000).toFixed(1)}M`;
  };

  const fmtMoneyOrNA = (v: number | undefined | null) => {
    if (v == null) return "N/A";
    return fmtMoney(v);
  };

  // Supabase'den verileri çek
  React.useEffect(() => {
    const n = (v: unknown) => (v == null ? undefined : Number(v));

    const load = async () => {
      try {
        const qs =
          fid != null
            ? `fid=${encodeURIComponent(String(fid))}`
            : address
            ? `wallet=${encodeURIComponent(address)}`
            : "";

        if (!qs) return;

        // volumes, pnl, networth
        const res = await fetch(`/api/wallet-status?${qs}`);
        if (res.ok) {
          const json = await res.json();
          setAllTimeVolumeState(n(json.all_time_volume) ?? allTimeVolume);
          setNetworthState(n(json.net_worth) ?? networth);
          setWeeklyVolumeState(n(json.volume_weekly) ?? weeklyVolume);
          setMonthlyVolumeState(n(json.volume_monthly) ?? monthlyVolume);
          setWeeklyPnlState(n(json.weekly_pnl) ?? weeklyPnl);
          setPnlState(n(json.monthly_pnl) ?? pnl);
        }

        // totalTrades (wallet gerekiyor)
        if (address) {
          const resTrades = await fetch(`/api/wallet-token-status?wallet=${encodeURIComponent(address)}`);
          if (resTrades.ok) {
            const { totalTrades } = await resTrades.json();
            const tn = Number(totalTrades) || 0;
            setTotalTradesState(tn);
          }
        }
      } catch {
        // sessiz geç
      }
    };

    load();
  }, [fid, address, allTimeVolume, networth, weeklyVolume, monthlyVolume, weeklyPnl, pnl]);

  const handleGenerateAuraCard = async () => {
    if (isAuraCardGenerated) return; // already generated, do nothing
    try {
      setIsGenratingAuraCard(true);
  
      if (!isConnected) await connect({ connector: connectors[0] });
      if (!address) throw new Error("Wallet not connected");
  
      const walletAddress = address.toLowerCase();
      const res = await fetch("/api/generate-aura-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });
  
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Request failed");
      }
  
      setIsAuraCardGenerated(true); // disable button after success
      alert("✅ Aura card generated!");
    } catch (err) {
      console.error("Generate error:", err);
      alert("❌ Failed to generate aura card.");
    } finally {
      setIsGenratingAuraCard(false);
    }
  };

  const generateImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;

      const width = 1000;
      const height = 1050;
      canvas.width = width;
      canvas.height = height;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(20, 20, width - 40, height - 40, 32);
      } else {
        ctx.rect(20, 20, width - 40, height - 40);
      }
      ctx.clip();

      const bgGradient = ctx.createLinearGradient(20, 20, width - 20, height - 20);
      bgGradient.addColorStop(0, "rgba(168, 85, 247, 0.1)");
      bgGradient.addColorStop(0.5, "rgba(0, 0, 0, 1)");
      bgGradient.addColorStop(1, "rgba(234, 179, 8, 0.1)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(20, 20, width - 40, height - 40);
      ctx.restore();

      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(20, 20, width - 40, height - 40, 32);
      } else {
        ctx.rect(20, 20, width - 40, height - 40);
      }
      ctx.stroke();

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
        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(logoX, logoY, logoSize, logoSize, 10);
        } else {
            ctx.rect(logoX, logoY, logoSize, logoSize);
        }
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } catch {}

      const textGradient = ctx.createLinearGradient(logoX + logoSize + 20, 0, logoX + logoSize + 200, 0);
      textGradient.addColorStop(0, "#c084fc");
      textGradient.addColorStop(1, "#facc15");
      ctx.fillStyle = textGradient;
      ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("BLUERA", logoX + logoSize + 20, logoY + 28);

      ctx.fillStyle = "#9ca3af";
      ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText("Aura Card", logoX + logoSize + 20, logoY + 48);

      const pfpSize = 85;
      const pfpX = 110;
      const pfpY = 170;

      ctx.strokeStyle = "#a78bfa";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2, 0, Math.PI * 2);
      ctx.stroke();

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
          ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 - 4, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, pfpX, pfpY, pfpSize, pfpSize);
          ctx.restore();
        } catch {
          ctx.fillStyle = "rgba(168, 85, 247, 0.2)";
          ctx.beginPath();
          ctx.arc(pfpX + pfpSize / 2, pfpY + pfpSize / 2, pfpSize / 2 - 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText(username || "Trader", pfpX + pfpSize + 22, pfpY + 25);

      ctx.fillStyle = "#9ca3af";
      ctx.font = '17px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(`FID #${fid || "11222"}`, pfpX + pfpSize + 22, pfpY + 50);

      const tagWidth = 160;
      const tagHeight = 35;
      const tagSpacing = 12;
      const tagsX = width - 240;
      const tagsY = pfpY + 10;

      ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
      ctx.strokeStyle = "rgba(168, 85, 247, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(tagsX, tagsY, tagWidth, tagHeight, 18);
      } else {
        console.error("roundRect is not supported in this context");
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#c084fc";
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText(holderTag, tagsX + tagWidth / 2, tagsY + 22);

      ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
      ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(tagsX, tagsY + tagHeight + tagSpacing, tagWidth, tagHeight, 18);
      } else {
        console.error("roundRect is not supported in this context");
      }
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#facc15";
      ctx.fillText(traderTag, tagsX + tagWidth / 2, tagsY + tagHeight + tagSpacing + 22);

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
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, statBoxWidth, statBoxHeight, 12);
        } else {
            console.error("roundRect is not supported in this context");
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#9ca3af";
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = "center";
        ctx.fillText(label, x + statBoxWidth / 2, y + 25);

        ctx.fillStyle = color || "#ffffff";
        ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.fillText(value, x + statBoxWidth / 2, y + 52);
      };

      // Row 1
      drawStatBox(statsStartX, statsY, "All-Time Vol", fmtMoney(allTimeVolumeState ?? 0));
      drawStatBox(statsStartX + statBoxWidth + statSpacing, statsY, "Weekly Vol", fmtMoney(weeklyVolumeState ?? 0));
      drawStatBox(statsStartX + (statBoxWidth + statSpacing) * 2, statsY, "Monthly Vol", fmtMoney(monthlyVolumeState ?? 0));

      // Row 2
      drawStatBox(
        statsStartX,
        statsY + statBoxHeight + statSpacing,
        "Monthly PnL",
        `${(pnlState ?? 0) >= 0 ? "+" : "-"}${fmtMoney(Math.abs(pnlState ?? 0))}`,
        (pnlState ?? 0) >= 0 ? "#22c55e" : "#ef4444"
      );
      drawStatBox(
        statsStartX + statBoxWidth + statSpacing,
        statsY + statBoxHeight + statSpacing,
        "Weekly PnL",
        `${(weeklyPnlState ?? 0) >= 0 ? "+" : "-"}${fmtMoney(Math.abs(weeklyPnlState ?? 0))}`,
        (weeklyPnlState ?? 0) >= 0 ? "#22c55e" : "#ef4444"
      );
      drawStatBox(
        statsStartX + (statBoxWidth + statSpacing) * 2,
        statsY + statBoxHeight + statSpacing,
        "Net Worth",
        fmtMoney(networthState ?? 0)
      );

      // Row 3
      drawStatBox(
        statsStartX,
        statsY + (statBoxHeight + statSpacing) * 2,
        "Total Trades",
        `${totalTradesState}`
      );

      const chartY = statsY + (statBoxHeight + statSpacing) * 3 + 18;
      const chartWidth = 800;
      const chartHeight = 80;
      const chartX = (width - chartWidth) / 2;

      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.rect(chartX, chartY, chartWidth, chartHeight + 50);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#9ca3af";
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";

      const barData = [65, 72, 68, 85, 90, 82, 95];
      const barWidth = (chartWidth - 100) / barData.length;
      const barSpacing = 10;
      const barStartX = chartX + 50;
      const barStartY = chartY + 45;
      const barMaxHeight = 70;

      barData.forEach((value) => {
        const barHeight = (value / 100) * barMaxHeight;
        const x = barStartX + barData.indexOf(value) * barWidth + (barWidth - barSpacing) / 2;
        const y = barStartY + barMaxHeight - barHeight;

        const barGradient = ctx.createLinearGradient(x, y + barHeight, x, y);
        barGradient.addColorStop(0, "#a78bfa");
        barGradient.addColorStop(1, "#facc15");
        ctx.fillStyle = barGradient;
        ctx.beginPath();
        // Using a rectangle with rounded corners without using roundRect
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + barWidth - barSpacing - 5, y);
        ctx.quadraticCurveTo(x + barWidth - barSpacing, y, x + barWidth - barSpacing, y + 5);
        ctx.lineTo(x + barWidth - barSpacing, y + barHeight - 5);
        ctx.quadraticCurveTo(x + barWidth - barSpacing, y + barHeight, x + barWidth - barSpacing - 5, y + barHeight);
        ctx.lineTo(x + 5, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - 5);
        ctx.lineTo(x, y + 5);
        ctx.quadraticCurveTo(x, y, x + 5, y);
        ctx.closePath();
        ctx.fill();
      });

      const footerY = height - 130;

      ctx.fillStyle = "#ffffff";
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "left";
      ctx.fillText("Scan to Follow", 150, footerY);

      ctx.fillStyle = "#9ca3af";
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(username ? `@${username}` : "on Farcaster", 150, footerY + 25);

      if (username) {
        try {
          const qrSize = 100;
          const qrX = width - 200;
          const qrY = footerY - 30;

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.moveTo(qrX + 15, qrY);
          ctx.lineTo(qrX + qrSize - 15, qrY);
          ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + 15);
          ctx.lineTo(qrX + qrSize, qrY + qrSize - 15);
          ctx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - 15, qrY + qrSize);
          ctx.lineTo(qrX + 15, qrY + qrSize);
          ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - 15);
          ctx.lineTo(qrX, qrY + 15);
          ctx.quadraticCurveTo(qrX, qrY, qrX + 15, qrY);
          ctx.closePath();
          ctx.fill();

          const qrImg = document.createElement("img");
          qrImg.crossOrigin = "anonymous";
          await new Promise<void>((resolve, reject) => {
            qrImg.onload = () => resolve();
            qrImg.onerror = () => reject();
            qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://farcaster.xyz/${username}`;
          });

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(qrX + 15, qrY);
          ctx.lineTo(qrX + qrSize - 15, qrY);
          ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + 15);
          ctx.lineTo(qrX + qrSize, qrY + qrSize - 15);
          ctx.quadraticCurveTo(qrX + qrSize, qrY + qrSize, qrX + qrSize - 15, qrY + qrSize);
          ctx.lineTo(qrX + 15, qrY + qrSize);
          ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - 15);
          ctx.lineTo(qrX, qrY + 15);
          ctx.quadraticCurveTo(qrX, qrY, qrX + 15, qrY);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          ctx.restore();
        } catch {}
      }

      ctx.fillStyle = "#6b7280";
      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";
      ctx.fillText("Generated by Bluera • Track. Trade. Dominate.", width / 2, footerY + 60);

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
      const base64Data = previewUrl.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/png" });

      if (navigator.share && navigator.canShare) {
        const file = new File(
          [blob],
          `bluera-card-${username || fid || Date.now()}.png`,
          { type: "image/png" }
        );

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "My Bluera Aura Card",
            text: "Check out my trading aura on Bluera! 🚀",
          });
          return;
        }
      }

      if (navigator.clipboard && "write" in navigator.clipboard) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          alert("✅ Image copied to clipboard! You can now paste it anywhere.");
          return;
        } catch {}
      }

      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      if (newWindow) {
        alert('💡 Tip: Long press on the image and select "Save Image" to download it to your device.');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
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

      if (!isConnected) {
        await connect({ connector: connectors[0] });
      }

      if (chainId !== base.id) {
        await switchChainAsync({ chainId: base.id });
      }

      const aura = { address: AURA_NFT_ADDRESS as `0x${string}`, abi: auraAbi as Abi };
      const usdc = { address: USDC_ADDRESS as `0x${string}`, abi: usdcAbi as Abi };

      if (!address) throw new Error("Wallet not connected");

      const latestRes = await fetch(`/api/aura-card?wallet=${address}&network=base`);
      if (!latestRes.ok) throw new Error("Latest aura_card id not found");
      const { id: auraCardId } = await latestRes.json();

      const amount = parseUnits("1", 6); // 1 USDC
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
              args: [auraCardId],
            }),
          },
        ],
      });

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
        style={{ maxWidth: "500px" }}
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
            <p className="text-xs text-muted-foreground">Aura Card</p>
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
              FID #{fid || "11222"}
            </p>
          </div>
        </div>

        {/* Tags */}
        {(holderTag || traderTag) && (
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {holderTag && (
              <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-xs font-medium">
                {holderTag}
              </span>
            )}
            {traderTag && (
              <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/20 text-xs font-medium">
                {traderTag}
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-6">
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">All-Time Vol</p>
            <p className="font-bold text-xs">{fmtMoneyOrNA(allTimeVolumeState)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Weekly Vol</p>
            <p className="font-bold text-xs">{fmtMoneyOrNA(weeklyVolumeState)}</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Monthly Vol</p>
            <p className="font-bold text-xs">{fmtMoneyOrNA(monthlyVolumeState)}</p>
          </div>

          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Monthly PnL</p>
            <p
              className={`font-bold text-xs ${
                (pnlState ?? 0) >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {(pnlState ?? 0) >= 0 ? "+" : "-"}
              {fmtMoney(Math.abs(pnlState ?? 0))}
            </p>
          </div>

          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Weekly PnL</p>
            <p
              className={`font-bold text-xs ${
                (weeklyPnlState ?? 0) >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {(weeklyPnlState ?? 0) >= 0 ? "+" : "-"}
              {fmtMoney(Math.abs(weeklyPnlState ?? 0))}
            </p>
          </div>

          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Net Worth</p>
            <p className="font-bold text-xs">{fmtMoneyOrNA(networthState)}</p>
          </div>

          <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
            <p className="text-[10px] text-muted-foreground mb-0.5">Total Trades</p>
            <p className="font-bold text-xs">{totalTradesState}</p>
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
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=64x64&data=https://farcaster.xyz/${username}`}
                  alt="QR Code"
                  width={64}
                  height={64}
                  className="w-full h-full"
                  unoptimized
                />
              </div>
            )}
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3">
            Generated by Bluera • Track. Trade. Dominate.
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
      <Button
        onClick={handleGenerateAuraCard}
        disabled={isGenratingAuraCard || isAuraCardGenerated}
        size="lg"
        className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all"
      >
        {isGenratingAuraCard ? (
          <>
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2" />
            Generating...
          </>
        ) : isAuraCardGenerated ? (
          <>Generated</>
        ) : (
          <>Generate Your Aura Card</>
        )}
      </Button>
    </div>

      {/* Actions Row */}
      <div className="flex justify-center gap-3">
        <Button
          onClick={handleMint}
          disabled={isMinting}
          size="lg"
          className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all"
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
              <h3 className="text-lg font-semibold">Aura Card</h3>
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
                alt="Aura Card"
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