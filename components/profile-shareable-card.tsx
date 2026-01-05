"use client";

import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export type ProfileTag =
  | { kind: "holder"; label: string }
  | { kind: "whale"; label: string }
  | { kind: "active"; label: string };

export type FavByVolume = {
  symbol: string; // e.g. $ETH
  volume: number;
  imageUrl?: string | null;
};

export type FavByTrades = {
  symbol: string; // e.g. $DEGEN
  trades: number;
  imageUrl?: string | null;
};

export type StatsData = {
  daily: { volume: number; trades: number };
  weekly: { volume: number; trades: number };
  monthly: { volume: number; trades: number };
  favCoinByVolume?: FavByVolume | null;
  favCoinByTrades?: FavByTrades | null;
};

type ProfileShareableCardProps = {
  stats: StatsData;
  userName?: string;
  userId?: string; // e.g. #1148020
  avatarUrl?: string | null;
  tags?: ProfileTag[];
  /**
   * - profile: shows dashboard-style UI (no Bluera footer/date, no action buttons)
   * - share: (reserved) could render a share-ready preview UI later
   */
  mode?: "profile" | "share";
  className?: string;
};

function formatMoney(num: number): string {
  const n = Math.abs(Number(num) || 0);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}

function formatTradesCount(num: number): string {
  const n = Math.abs(Number(num) || 0);
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

function tagStyles(tag: ProfileTag) {
  switch (tag.kind) {
    case "active":
      return {
        style: {
          backgroundColor: "rgba(147, 51, 234, 0.20)",
          color: "#E9D5FF",
        } as React.CSSProperties,
      };
    case "whale":
      return {
        style: {
          backgroundColor: "rgba(234, 179, 8, 0.18)",
          color: "#FEF3C7",
        } as React.CSSProperties,
      };
    case "holder":
      return {
        style: {
          backgroundColor: "rgba(34, 211, 238, 0.16)",
          color: "#CFFAFE",
        } as React.CSSProperties,
      };
  }
}

export function ProfileShareableCard({
  stats,
  userName = "Trader",
  userId = "#0",
  avatarUrl,
  tags = [],
  mode = "profile",
  className,
}: ProfileShareableCardProps) {
  const [generatedOn, setGeneratedOn] = React.useState<string | null>(null);

  React.useEffect(() => {
    setGeneratedOn(new Date().toLocaleDateString());
  }, []);

  const generatePngDataUrl = React.useCallback(async () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = 1000;
    const height = 1180;
    canvas.width = width;
    canvas.height = height;

    const roundRectPath = (
      x: number,
      y: number,
      w: number,
      h: number,
      r: number
    ) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.lineTo(x + w - rr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
      ctx.lineTo(x + w, y + h - rr);
      ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
      ctx.lineTo(x + rr, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
      ctx.lineTo(x, y + rr);
      ctx.quadraticCurveTo(x, y, x + rr, y);
      ctx.closePath();
    };

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("image load failed"));
        img.src = src;
      });

    // Background
    ctx.fillStyle = "#0B1020";
    ctx.fillRect(0, 0, width, height);

    // Outer gradient border
    const outerX = 40;
    const outerY = 40;
    const outerW = width - 80;
    const outerH = height - 80;
    const outerR = 44;

    const borderGrad = ctx.createLinearGradient(outerX, outerY, outerX + outerW, outerY + outerH);
    borderGrad.addColorStop(0, "#4F46E5");
    borderGrad.addColorStop(0.45, "#7C3AED");
    borderGrad.addColorStop(1, "#DB2777");

    roundRectPath(outerX, outerY, outerW, outerH, outerR);
    ctx.fillStyle = borderGrad;
    ctx.fill();

    // Inner card
    const inset = 4;
    const innerX = outerX + inset;
    const innerY = outerY + inset;
    const innerW = outerW - inset * 2;
    const innerH = outerH - inset * 2;
    const innerR = outerR - 10;

    roundRectPath(innerX, innerY, innerW, innerH, innerR);
    ctx.fillStyle = "#111827";
    ctx.fill();

    // Header avatar + name + fid
    const headerY = innerY + 70;
    const avatarSize = 120;
    const avatarX = innerX + 70;
    const avatarY = headerY - 20;

    // Avatar ring glow
    const glowGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
    glowGrad.addColorStop(0, "rgba(124,58,237,0.9)");
    glowGrad.addColorStop(0.5, "rgba(219,39,119,0.9)");
    glowGrad.addColorStop(1, "rgba(37,99,235,0.9)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 6, 0, Math.PI * 2);
    ctx.fill();

    // Avatar circle
    ctx.fillStyle = "#1F2937";
    ctx.beginPath();
    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.fill();

    // Avatar image or fallback
    if (avatarUrl) {
      try {
        const img = await loadImg(avatarUrl);
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 3, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } catch {}
    } else {
      ctx.fillStyle = "rgba(168,85,247,0.25)";
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(userName?.charAt(0)?.toUpperCase?.() || "T", avatarX + avatarSize / 2, avatarY + avatarSize / 2);
    }

    // Name gradient
    const nameX = avatarX + avatarSize + 32;
    const nameY = avatarY + 42;
    const nameGrad = ctx.createLinearGradient(nameX, 0, nameX + 260, 0);
    nameGrad.addColorStop(0, "#D8B4FE");
    nameGrad.addColorStop(0.45, "#F9A8D4");
    nameGrad.addColorStop(1, "#93C5FD");
    ctx.fillStyle = nameGrad;
    ctx.font = "bold 44px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(userName || "Trader", nameX, nameY);

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(`FID ${userId || "#0"}`, nameX, nameY + 40);

    // Tag pills (no icons in PNG for simplicity)
    const pillStartY = nameY + 70;
    let pillX = nameX;
    const pillY = pillStartY;
    const pillH = 38;
    const pillPadX = 16;
    ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.textBaseline = "middle";
    tags.slice(0, 3).forEach((t) => {
      const label = t.label;
      const textW = ctx.measureText(label).width;
      const w = textW + pillPadX * 2;
      const bg =
        t.kind === "active"
          ? "rgba(147,51,234,0.25)"
          : t.kind === "whale"
          ? "rgba(234,179,8,0.22)"
          : "rgba(34,211,238,0.20)";
      const fg =
        t.kind === "active"
          ? "#E9D5FF"
          : t.kind === "whale"
          ? "#FEF3C7"
          : "#CFFAFE";
      roundRectPath(pillX, pillY, w, pillH, 20);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.fillStyle = fg;
      ctx.fillText(label, pillX + pillPadX, pillY + pillH / 2 + 1);
      pillX += w + 12;
    });

    // Fav cards
    const favY = innerY + 260;
    const favW = (innerW - 60) / 2;
    const favH = 160;
    const favX1 = innerX + 30;
    const favX2 = favX1 + favW + 30;

    const drawFav = async (
      x: number,
      y: number,
      title: string,
      titleColor: string,
      borderColor: string,
      symbol: string,
      value: string,
      imgUrl?: string | null
    ) => {
      roundRectPath(x, y, favW, favH, 24);
      ctx.fillStyle = "rgba(255,255,255,0.04)";
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = titleColor;
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(title, x + 28, y + 52);

      const symGrad = ctx.createLinearGradient(x + 28, 0, x + 220, 0);
      symGrad.addColorStop(0, "#E5E7EB");
      symGrad.addColorStop(1, "#BFDBFE");
      ctx.fillStyle = symGrad;
      ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(symbol, x + 28, y + 96);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "26px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(value, x + 28, y + 136);

      if (imgUrl) {
        try {
          const img = await loadImg(imgUrl);
          const s = 44;
          const cx = x + favW - 28 - s / 2;
          const cy = y + 62;
          ctx.save();
          ctx.beginPath();
          ctx.arc(cx, cy, s / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, cx - s / 2, cy - s / 2, s, s);
          ctx.restore();
        } catch {}
      }
    };

    if (stats.favCoinByVolume) {
      await drawFav(
        favX1,
        favY,
        "FAV BY VOLUME",
        "#67E8F9",
        "rgba(34,211,238,0.35)",
        stats.favCoinByVolume.symbol,
        formatMoney(stats.favCoinByVolume.volume),
        stats.favCoinByVolume.imageUrl
      );
    }
    if (stats.favCoinByTrades) {
      await drawFav(
        favX2,
        favY,
        "FAV BY TRADES",
        "#6EE7B7",
        "rgba(16,185,129,0.35)",
        stats.favCoinByTrades.symbol,
        `${formatTradesCount(stats.favCoinByTrades.trades)} trades`,
        stats.favCoinByTrades.imageUrl
      );
    }

    // Stats tiles
    const tileY = favY + favH + 40;
    const tileW = (innerW - 60) / 3;
    const tileH = 240;
    const tileX1 = innerX + 30;
    const tileX2 = tileX1 + tileW + 15;
    const tileX3 = tileX2 + tileW + 15;

    const drawTile = (
      x: number,
      y: number,
      label: string,
      labelColor: string,
      borderColor: string,
      gradA: string,
      gradB: string,
      volume: number,
      trades: number
    ) => {
      const g = ctx.createLinearGradient(x, y, x + tileW, y + tileH);
      g.addColorStop(0, gradA);
      g.addColorStop(1, gradB);
      roundRectPath(x, y, tileW, tileH, 28);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = labelColor;
      ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(label, x + 28, y + 58);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "26px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText("Volume", x + 28, y + 118);

      const volGrad = ctx.createLinearGradient(x + 28, 0, x + tileW - 28, 0);
      volGrad.addColorStop(0, "#E5E7EB");
      volGrad.addColorStop(1, "#FBCFE8");
      ctx.fillStyle = volGrad;
      ctx.font = "bold 34px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(formatMoney(volume), x + 28, y + 164);

      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "26px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      ctx.fillText(`${formatTradesCount(trades)} trades`, x + 28, y + 208);
    };

    drawTile(
      tileX1,
      tileY,
      "DAILY",
      "#E9D5FF",
      "rgba(168,85,247,0.35)",
      "rgba(168,85,247,0.20)",
      "rgba(0,0,0,0)",
      stats.daily.volume,
      stats.daily.trades
    );
    drawTile(
      tileX2,
      tileY,
      "WEEKLY",
      "#FBCFE8",
      "rgba(236,72,153,0.35)",
      "rgba(236,72,153,0.20)",
      "rgba(0,0,0,0)",
      stats.weekly.volume,
      stats.weekly.trades
    );
    drawTile(
      tileX3,
      tileY,
      "MONTHLY",
      "#BFDBFE",
      "rgba(59,130,246,0.35)",
      "rgba(59,130,246,0.20)",
      "rgba(0,0,0,0)",
      stats.monthly.volume,
      stats.monthly.trades
    );

    // Footer
    const footerY = tileY + tileH + 40;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(innerX + 30, footerY);
    ctx.lineTo(innerX + innerW - 30, footerY);
    ctx.stroke();

    // Logo block
    const logoX = innerX + 30;
    const logoY = footerY + 28;
    roundRectPath(logoX, logoY, 56, 56, 14);
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fill();
    try {
      const logoImg = await loadImg("/original.webp");
      ctx.drawImage(logoImg, logoX + 8, logoY + 8, 40, 40);
    } catch {}

    const brandX = logoX + 70;
    const brandGrad = ctx.createLinearGradient(brandX, 0, brandX + 180, 0);
    brandGrad.addColorStop(0, "#22D3EE");
    brandGrad.addColorStop(0.5, "#38BDF8");
    brandGrad.addColorStop(1, "#2563EB");
    ctx.fillStyle = brandGrad;
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText("Bluera", brandX, logoY + 40);

    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "24px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText("Aura Card", brandX + 170, logoY + 40);

    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(`Generated on ${generatedOn ?? ""}`, innerX + innerW - 30, logoY + 40);
    ctx.textAlign = "left";

    return canvas.toDataURL("image/png");
  }, [avatarUrl, generatedOn, stats, tags, userId, userName]);

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden",
          mode === "profile" ? "" : "rounded-3xl p-[2px] shadow-2xl"
        )}
        style={
          mode === "profile"
            ? undefined
            : {
                backgroundImage:
                  "linear-gradient(135deg, #4f46e5 0%, #7c3aed 45%, #db2777 100%)",
              }
        }
      >
        <div
          className={cn(
            "relative",
            mode === "profile"
              ? "p-4 sm:p-6 md:p-8"
              : "rounded-[22px] p-8 backdrop-blur-xl"
          )}
          style={
            mode === "profile"
              ? undefined
              : {
                  backgroundImage:
                    "linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(17,24,39,0.96) 55%, rgba(17,24,39,1) 100%)",
                }
          }
        >
          {/* Header */}
          <div className="relative z-10 mb-4 flex flex-col items-start gap-3 sm:mb-6 sm:flex-row sm:items-center sm:gap-5">
            {/* Avatar */}
            <div className="relative">
              <div
                className="absolute -inset-1 animate-pulse rounded-full opacity-75 blur"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #7c3aed 0%, #db2777 50%, #2563eb 100%)",
                }}
              />
              <div
                className="relative size-16 overflow-hidden rounded-full border-4 sm:size-20 md:size-24"
                style={{
                  borderColor: "rgba(31, 41, 55, 1)",
                  backgroundImage:
                    "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
                }}
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={userName}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <div
                    className="flex size-full items-center justify-center"
                    style={{
                      backgroundImage:
                        "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
                    }}
                  >
                    <span className="text-lg font-semibold text-white sm:text-xl">
                      {userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* User details */}
            <div className="flex-1">
              <h2
                className="mb-1 text-2xl font-semibold bg-clip-text text-transparent sm:text-3xl"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #d8b4fe 0%, #f9a8d4 45%, #93c5fd 100%)",
                }}
              >
                {userName}
              </h2>
              <p className="text-sm text-white/60 sm:text-base">FID {userId}</p>

              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {tags.map((t) => {
                    const s = tagStyles(t);
                    return (
                      <div
                        key={`${t.kind}:${t.label}`}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-3 py-1 text-xs backdrop-blur-sm sm:text-sm"
                        )}
                        style={s.style}
                      >
                        <span>{t.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Favorite Coins */}
          <div className="relative z-10 mb-2 grid grid-cols-2 gap-2 sm:mb-3 sm:gap-2.5">
            {/* Fav Coin by Volume (always keep slot) */}
            <div
              className="overflow-hidden rounded-2xl border p-3.5 backdrop-blur-sm sm:p-4"
              style={{
                borderColor: "rgba(34, 211, 238, 0.3)",
                backgroundImage:
                  "linear-gradient(135deg, rgba(34, 211, 238, 0.10) 0%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#67E8F9" }}
                  >
                    FAV BY VOLUME
                  </p>
                  <p
                    className="mb-1 text-lg font-semibold bg-clip-text text-transparent sm:text-2xl truncate max-w-[11ch]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #a5f3fc 0%, #bfdbfe 100%)",
                    }}
                  >
                    {stats.favCoinByVolume?.symbol ?? "$—"}
                  </p>
                  <p className="text-xs text-white/60 sm:text-base">
                    {formatMoney(stats.favCoinByVolume?.volume ?? 0)}
                  </p>
                </div>

                {stats.favCoinByVolume?.imageUrl ? (
                  <div
                    className="relative size-9 shrink-0 overflow-hidden rounded-full border sm:size-10"
                    style={{
                      borderColor: "rgba(34, 211, 238, 0.3)",
                      backgroundColor: "rgba(34, 211, 238, 0.1)",
                    }}
                  >
                    <Image
                      src={stats.favCoinByVolume.imageUrl}
                      alt={stats.favCoinByVolume.symbol}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Fav Coin by Trades (always keep slot) */}
            <div
              className="overflow-hidden rounded-2xl border p-3.5 backdrop-blur-sm sm:p-4"
              style={{
                borderColor: "rgba(16, 185, 129, 0.3)",
                backgroundImage:
                  "linear-gradient(135deg, rgba(16, 185, 129, 0.10) 0%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="mb-1 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "#6EE7B7" }}
                  >
                    FAV BY TRADES
                  </p>
                  <p
                    className="mb-1 text-lg font-semibold bg-clip-text text-transparent sm:text-2xl truncate max-w-[11ch]"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, #a7f3d0 0%, #a5f3fc 100%)",
                    }}
                  >
                    {stats.favCoinByTrades?.symbol ?? "$—"}
                  </p>
                  <p className="text-xs text-white/60 sm:text-base">
                    {formatTradesCount(stats.favCoinByTrades?.trades ?? 0)} trades
                  </p>
                </div>

                {stats.favCoinByTrades?.imageUrl ? (
                  <div
                    className="relative size-9 shrink-0 overflow-hidden rounded-full border sm:size-10"
                    style={{
                      borderColor: "rgba(16, 185, 129, 0.3)",
                      backgroundColor: "rgba(16, 185, 129, 0.1)",
                    }}
                  >
                    <Image
                      src={stats.favCoinByTrades.imageUrl}
                      alt={stats.favCoinByTrades.symbol}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="relative z-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
            {/* Daily */}
            <div
              className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-sm"
              style={{
                borderColor: "rgba(168, 85, 247, 0.3)",
                backgroundImage:
                  "linear-gradient(135deg, rgba(168,85,247,0.20) 0%, rgba(168,85,247,0.10) 50%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div
                className="absolute -right-4 -top-4 size-24 rounded-full blur-2xl"
                style={{ backgroundColor: "rgba(168,85,247,0.20)" }}
              />
              <div className="relative">
                <p
                  className="uppercase tracking-wider font-semibold"
                  style={{ color: "#E9D5FF" }}
                >
                  DAILY
                </p>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <p className="mb-1 text-white/60">Volume</p>
                    <p
                      className="text-xl font-semibold bg-clip-text text-transparent sm:text-2xl"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #e9d5ff 0%, #fbcfe8 100%)",
                      }}
                    >
                      {formatMoney(stats.daily.volume)}
                    </p>
                  </div>
                  <p className="text-sm text-white/60 sm:text-base">
                    {formatTradesCount(stats.daily.trades)} trades
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly */}
            <div
              className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-sm"
              style={{
                borderColor: "rgba(236, 72, 153, 0.3)",
                backgroundImage:
                  "linear-gradient(135deg, rgba(236,72,153,0.20) 0%, rgba(236,72,153,0.10) 50%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div
                className="absolute -right-4 -top-4 size-24 rounded-full blur-2xl"
                style={{ backgroundColor: "rgba(236,72,153,0.20)" }}
              />
              <div className="relative">
                <p
                  className="uppercase tracking-wider font-semibold"
                  style={{ color: "#FBCFE8" }}
                >
                  WEEKLY
                </p>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <p className="mb-1 text-white/60">Volume</p>
                    <p
                      className="text-xl font-semibold bg-clip-text text-transparent sm:text-2xl"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #fbcfe8 0%, #bfdbfe 100%)",
                      }}
                    >
                      {formatMoney(stats.weekly.volume)}
                    </p>
                  </div>
                  <p className="text-sm text-white/60 sm:text-base">
                    {formatTradesCount(stats.weekly.trades)} trades
                  </p>
                </div>
              </div>
            </div>

            {/* Monthly */}
            <div
              className="relative overflow-hidden rounded-2xl border p-4 sm:p-5 backdrop-blur-sm col-span-2 sm:col-span-1"
              style={{
                borderColor: "rgba(59, 130, 246, 0.3)",
                backgroundImage:
                  "linear-gradient(135deg, rgba(59,130,246,0.20) 0%, rgba(59,130,246,0.10) 50%, rgba(0,0,0,0) 100%)",
              }}
            >
              <div
                className="absolute -right-4 -top-4 size-24 rounded-full blur-2xl"
                style={{ backgroundColor: "rgba(59,130,246,0.20)" }}
              />
              <div className="relative">
                <p
                  className="uppercase tracking-wider font-semibold"
                  style={{ color: "#BFDBFE" }}
                >
                  MONTHLY
                </p>
                <div className="mt-2 space-y-1.5">
                  <div>
                    <p className="mb-1 text-white/60">Volume</p>
                    <p
                      className="text-xl font-semibold bg-clip-text text-transparent sm:text-2xl"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, #bfdbfe 0%, #e9d5ff 100%)",
                      }}
                    >
                      {formatMoney(stats.monthly.volume)}
                    </p>
                  </div>
                  <p className="text-sm text-white/60 sm:text-base">
                    {formatTradesCount(stats.monthly.trades)} trades
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer intentionally NOT shown in profile UI.
              It remains inside the generated PNG via generatePngDataUrl(). */}
        </div>
      </div>
    </div>
  );
}


