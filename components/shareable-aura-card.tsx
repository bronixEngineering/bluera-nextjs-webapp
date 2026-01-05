// components/shareable-aura-card.tsx
"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Download, Sparkles } from "lucide-react";
import Image from "next/image";
import html2canvas from "html2canvas";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useChainId,
  useSendCalls,
  useWaitForCallsStatus,
} from "wagmi";
import { base } from "wagmi/chains";
import type { Abi } from "viem";
import { encodeFunctionData, parseUnits } from "viem";
import auraAbi from "@/components/ABI/aura_nft_contract_abi";
import usdcAbi from "@/components/ABI/usdc_contract_abi";
import { sdk } from "@farcaster/miniapp-sdk";
import type { ProfileTag, StatsData } from "@/components/profile-shareable-card";

type ShareableAuraCardProps = {
  username?: string;
  fid?: number;
  pfpUrl?: string;
  /**
   * Optional richer data for the new 1080x1080 share-card canvas renderer
   * (matches `ShareableTradingCard` UI). When provided, we bypass html2canvas
   * and deterministically draw the new design via Canvas API for webview stability.
   */
  stats?: StatsData;
  tags?: ProfileTag[];
  userId?: string; // e.g. "#1148020"
  avatarUrl?: string | null;
  holderTag: string;
  traderTag: string;
  activeTraderTag?: string;
  allTimeVolume: number;
  networth: number;
  weeklyVolume?: number;
  monthlyVolume?: number;
  dailyTrades?: number;
  weeklyTrades?: number;
  monthlyTrades?: number;
  showActions?: boolean;
  mode?: "inline" | "modal";
  /**
   * Controls whether the "Share on Base" button is shown in modal mode.
   * Useful for flows where you only want Mint (or just want to show image_url debug info).
   */
  showShareButton?: boolean;
  /**
   * When false, renders only the actions section (e.g. Mint/Share buttons).
   * Useful when embedding actions under a different card UI.
   */
  showCard?: boolean;
  /**
   * Optional external ref to a card DOM element. If provided, image generation
   * will capture this node via html2canvas so the uploaded/share image matches
   * the actual UI shown to the user.
   */
  externalCardRef?: React.RefObject<HTMLElement | null>;
  /**
   * If true, uploads the card image to Supabase (via /api/aura-card-image)
   * automatically after mount. Useful to ensure aura_card.image_url matches
   * the latest share-card design even before mint.
   */
  autoUploadImage?: boolean;
};

export function ShareableAuraCard({
  username,
  fid,
  pfpUrl,
  stats,
  tags,
  userId,
  avatarUrl,
  holderTag,
  traderTag,
  activeTraderTag,
  allTimeVolume,
  networth,
  weeklyVolume,
  monthlyVolume,
  dailyTrades = 0,
  weeklyTrades = 0,
  monthlyTrades = 0,
  showActions = true,
  mode = "inline",
  showShareButton = true,
  showCard = true,
  externalCardRef,
  autoUploadImage = false,
}: ShareableAuraCardProps) {
  // Bu satırları kaldır: isGenratingAuraCard, isAuraCardGenerated
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isMinting, setIsMinting] = React.useState(false);
  const [hasMinted, setHasMinted] = React.useState(false);
  const [pendingCallsId, setPendingCallsId] = React.useState<string | null>(null);
  const [isConfirmingMint, setIsConfirmingMint] = React.useState(false);
  const [isUploadingImage, setIsUploadingImage] = React.useState(false);
  const [lastUploadError, setLastUploadError] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const cardRef = React.useRef<HTMLDivElement>(null);
  
  // Wagmi hooks'ları ekle:
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { sendCallsAsync } = useSendCalls();
  const {
    data: callsStatusData,
    status: waitCallsStatus,
    error: waitCallsError,
  } = useWaitForCallsStatus({
    id: pendingCallsId ?? undefined,
    pollingInterval: 1000,
    query: { enabled: !!pendingCallsId },
  });
  const AURA_NFT_ADDRESS = "0x7A4Fdf55F2236E12137B6F85e5ecCa6F7F78E8C6";
  const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Para formatlayıcı: $X.X, $X.XK, $X.XM
  const fmtMoney = React.useCallback((v: number) => {
    const n = Math.abs(Number(v) || 0);
    if (n < 1000) return `$${n.toFixed(1)}`;
    if (n < 1_000_000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }, []);

  const fmtMoneyOrNA = React.useCallback((v: number | undefined | null) => {
    if (v == null) return "N/A";
    return fmtMoney(v);
  }, [fmtMoney]);

  // TanStack Query ile wallet-status endpoint'ini her zaman wallet address ile çağır
  const { data: walletStatusData } = useQuery({
    queryKey: ['wallet-status-shareable', address?.toLowerCase()],
    queryFn: async () => {
      if (!address) return null;

      const wallet = address.toLowerCase();
      const response = await fetch(`/api/wallet-status?wallet=${encodeURIComponent(wallet)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet status');
      }
      return response.json();
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 saniye cache
  });

  // TanStack Query ile wallet-token-status endpoint'ini çağır
  const { data: walletTokenStatusData } = useQuery({
    queryKey: ['wallet-token-status-shareable', address],
    queryFn: async () => {
      if (!address) return null;
      
      const response = await fetch(`/api/wallet-token-status?wallet=${encodeURIComponent(address)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch wallet token status');
      }
      return response.json();
    },
    enabled: !!address,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 saniye cache
  });

  // API'den gelen verileri kullan, yoksa prop'ları kullan
  const n = (v: unknown) => (v == null ? undefined : Number(v));
  // Artık burada da günlük volume'ü birincil metric olarak kullanıyoruz
  const allTimeVolumeState = n(walletStatusData?.volume_daily) ?? allTimeVolume;
  const networthState = n(walletStatusData?.net_worth) ?? networth;
  const weeklyVolumeState = n(walletStatusData?.volume_weekly) ?? weeklyVolume;
  const monthlyVolumeState = n(walletStatusData?.volume_monthly) ?? monthlyVolume;
  const dailyTradesState = n(walletTokenStatusData?.dailyTrades) ?? dailyTrades;
  const weeklyTradesState = n(walletTokenStatusData?.weeklyTrades) ?? weeklyTrades;
  const monthlyTradesState = n(walletTokenStatusData?.monthlyTrades) ?? monthlyTrades;

  // handleGenerateAuraCard fonksiyonunu tamamen kaldır (satır 141-169)

  const sleep = React.useCallback((ms: number) => new Promise((r) => setTimeout(r, ms)), []);

  const withTimeout = React.useCallback(
    async <T,>(p: Promise<T>, ms: number, label: string) => {
      return await Promise.race([
        p,
        new Promise<T>((_, rej) =>
          setTimeout(() => rej(new Error(`${label} timed out after ${ms}ms`)), ms)
        ),
      ]);
    },
    []
  );

  const dataUrlToBlob = React.useCallback((dataUrl: string) => {
    const [meta, b64] = dataUrl.split(",");
    const mime =
      meta?.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64$/)?.[1] ?? "image/jpeg";
    const binary = atob(b64 || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }, []);

  const waitForImages = React.useCallback(async (root: HTMLElement, timeoutMs = 4000) => {
    const imgs = Array.from(root.querySelectorAll("img")) as HTMLImageElement[];
    const pending = imgs.filter((img) => !img.complete);
    if (pending.length === 0) return;

    await Promise.race([
      Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener("load", done, { once: true });
              img.addEventListener("error", done, { once: true });
            })
        )
      ),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
  }, []);

  const waitForExternalCard = React.useCallback(async (timeoutMs = 15_000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const node = externalCardRef?.current;
      if (node) return node;
      await new Promise((r) => setTimeout(r, 100));
    }
    return null;
  }, [externalCardRef]);

  const generateImage = React.useCallback(async () => {
    try {
      // Preferred deterministic renderer for the new share-card design (1080x1080).
      // This avoids html2canvas timeouts/parsing issues in Base/Farcaster webviews.
      const maybeStats = stats;
      if (maybeStats) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas context not available");

        const W = 1080;
        const H = 1080;
        canvas.width = W;
        canvas.height = H;

        const roundRectPath = (
          c: CanvasRenderingContext2D,
          x: number,
          y: number,
          w: number,
          h: number,
          r: number
        ) => {
          const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
          c.beginPath();
          c.moveTo(x + rr, y);
          c.lineTo(x + w - rr, y);
          c.quadraticCurveTo(x + w, y, x + w, y + rr);
          c.lineTo(x + w, y + h - rr);
          c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
          c.lineTo(x + rr, y + h);
          c.quadraticCurveTo(x, y + h, x, y + h - rr);
          c.lineTo(x, y + rr);
          c.quadraticCurveTo(x, y, x + rr, y);
          c.closePath();
        };

        const fillRoundRect = (
          c: CanvasRenderingContext2D,
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
          fill: string
        ) => {
          roundRectPath(c, x, y, w, h, r);
          c.fillStyle = fill;
          c.fill();
        };

        const strokeRoundRect = (
          c: CanvasRenderingContext2D,
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
          stroke: string,
          lineWidth = 2
        ) => {
          roundRectPath(c, x, y, w, h, r);
          c.strokeStyle = stroke;
          c.lineWidth = lineWidth;
          c.stroke();
        };

        const ellipsize = (text: string, maxWidth: number) => {
          if (ctx.measureText(text).width <= maxWidth) return text;
          const ellipsis = "…";
          let t = text;
          while (t.length > 0 && ctx.measureText(t + ellipsis).width > maxWidth) {
            t = t.slice(0, -1);
          }
          return t.length ? t + ellipsis : ellipsis;
        };

        const formatUsd = (num: number): string => {
          const n = Number(num) || 0;
          if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
          if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
          return `$${n.toFixed(2)}`;
        };

        const formatTradesCount = (num: number): string => {
          const n = Number(num) || 0;
          if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
          return `${Math.round(n)}`;
        };

        const proxyUrl = (url: string) =>
          `/api/image-proxy?url=${encodeURIComponent(url)}`;
        const normalizeImageUrl = (url: string) => {
          const u = url.trim();
          if (!u) return u;
          if (u.startsWith("data:") || u.startsWith("blob:") || u.startsWith("/"))
            return u;
          return proxyUrl(u);
        };

        const loadImage = async (url: string): Promise<HTMLImageElement | null> => {
          const src = normalizeImageUrl(url);
          if (!src) return null;
          const img = document.createElement("img");
          img.crossOrigin = "anonymous";
          return await new Promise((resolve) => {
            const done = (ok: boolean) => resolve(ok ? img : null);
            img.onload = () => done(true);
            img.onerror = () => done(false);
            img.src = src;
          });
        };

        // Base background
        ctx.fillStyle = "#05070b";
        ctx.fillRect(0, 0, W, H);

        // Outer gradient border
        const outerPad = 28;
        const outerR = 72;
        const outerX = outerPad;
        const outerY = outerPad;
        const outerW = W - outerPad * 2;
        const outerH = H - outerPad * 2;
        const borderGrad = ctx.createLinearGradient(outerX, outerY, outerX + outerW, outerY + outerH);
        borderGrad.addColorStop(0, "#4f46e5");
        borderGrad.addColorStop(0.5, "#7c3aed");
        borderGrad.addColorStop(1, "#ec4899");

        ctx.save();
        ctx.shadowColor = "rgba(236, 72, 153, 0.35)";
        ctx.shadowBlur = 18;
        fillRoundRect(ctx, outerX, outerY, outerW, outerH, outerR, borderGrad as unknown as string);
        ctx.restore();

        // Inner card background
        const innerPad = 6;
        const innerX = outerX + innerPad;
        const innerY = outerY + innerPad;
        const innerW = outerW - innerPad * 2;
        const innerH = outerH - innerPad * 2;
        const innerR = outerR - 10;
        const innerGrad = ctx.createLinearGradient(innerX, innerY, innerX + innerW, innerY + innerH);
        innerGrad.addColorStop(0, "#0b1220");
        innerGrad.addColorStop(0.6, "rgba(11, 18, 32, 0.96)");
        innerGrad.addColorStop(1, "#0b1220");
        fillRoundRect(ctx, innerX, innerY, innerW, innerH, innerR, innerGrad as unknown as string);

        // Header layout
        const contentPad = 48;
        const cx = innerX + contentPad;
        const cy = innerY + contentPad;
        const cw = innerW - contentPad * 2;

        const avatarSize = 170;
        const avatarX = cx;
        const avatarY = cy + 10;
        const avatarCenterX = avatarX + avatarSize / 2;
        const avatarCenterY = avatarY + avatarSize / 2;

        // Avatar glow
        const glow = ctx.createRadialGradient(
          avatarCenterX,
          avatarCenterY,
          avatarSize * 0.45,
          avatarCenterX,
          avatarCenterY,
          avatarSize * 0.85
        );
        glow.addColorStop(0, "rgba(168, 85, 247, 0.55)");
        glow.addColorStop(0.55, "rgba(236, 72, 153, 0.35)");
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarSize * 0.85, 0, Math.PI * 2);
        ctx.fill();

        // Avatar border ring
        ctx.lineWidth = 10;
        ctx.strokeStyle = "rgba(17, 24, 39, 0.9)";
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2 + 6, 0, Math.PI * 2);
        ctx.stroke();

        // Avatar image
        const avatarSrc = (avatarUrl || pfpUrl || "").trim();
        const avatarImg = avatarSrc ? await loadImage(avatarSrc) : null;
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarCenterX, avatarCenterY, avatarSize / 2, 0, Math.PI * 2);
        ctx.clip();
        if (avatarImg) {
          ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
        } else {
          const fallbackGrad = ctx.createLinearGradient(avatarX, avatarY, avatarX + avatarSize, avatarY + avatarSize);
          fallbackGrad.addColorStop(0, "#7c3aed");
          fallbackGrad.addColorStop(1, "#ec4899");
          ctx.fillStyle = fallbackGrad;
          ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = '700 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((username || "T").slice(0, 1).toUpperCase(), avatarCenterX, avatarCenterY);
        }
        ctx.restore();

        // User name + fid
        const nameX = avatarX + avatarSize + 46;
        const nameY = avatarY + 58;
        const nameMaxW = cx + cw - nameX;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";

        // Name gradient
        const nameGrad = ctx.createLinearGradient(nameX, nameY - 56, nameX + 320, nameY);
        nameGrad.addColorStop(0, "#d8b4fe");
        nameGrad.addColorStop(0.5, "#f9a8d4");
        nameGrad.addColorStop(1, "#93c5fd");
        ctx.fillStyle = nameGrad as unknown as string;
        ctx.font = '700 64px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const safeName = ellipsize(username || "Trader", nameMaxW);
        ctx.fillText(safeName, nameX, nameY);

        ctx.fillStyle = "rgba(156, 163, 175, 0.95)";
        ctx.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        const fidText = (() => {
          const u = (userId || "").trim();
          if (u) return `FID ${u.startsWith("#") ? u : `#${u}`}`;
          return `FID #${fid ?? "—"}`;
        })();
        ctx.fillText(fidText, nameX, nameY + 46);

        // Tags (pill row under header, left aligned to name block)
        const pills = (tags && tags.length > 0 ? tags : []).slice(0, 2);
        const pillY = nameY + 78;
        const pillH = 54;
        const pillGap = 14;
        const pillR = 26;
        let pillX = nameX;

        const drawSparkleIcon = (
          c: CanvasRenderingContext2D,
          x: number,
          y: number,
          size: number,
          color: string
        ) => {
          const cx = x + size / 2;
          const cy = y + size / 2;
          const r1 = size * 0.48;
          const r2 = size * 0.18;
          c.save();
          c.fillStyle = color;
          c.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI / 4) * i - Math.PI / 2;
            const r = i % 2 === 0 ? r1 : r2;
            const px = cx + Math.cos(a) * r;
            const py = cy + Math.sin(a) * r;
            if (i === 0) c.moveTo(px, py);
            else c.lineTo(px, py);
          }
          c.closePath();
          c.fill();
          c.restore();
        };

        const drawArrowUpRightIcon = (
          c: CanvasRenderingContext2D,
          x: number,
          y: number,
          size: number,
          color: string
        ) => {
          // Simple ↗ icon: diagonal arrow with corner
          const pad = size * 0.18;
          const x1 = x + pad;
          const y1 = y + size - pad;
          const x2 = x + size - pad;
          const y2 = y + pad;
          c.save();
          c.strokeStyle = color;
          c.lineWidth = Math.max(2, Math.round(size * 0.12));
          c.lineCap = "round";
          c.lineJoin = "round";
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          // arrow head
          c.moveTo(x2 - size * 0.34, y2);
          c.lineTo(x2, y2);
          c.lineTo(x2, y2 + size * 0.34);
          c.stroke();
          c.restore();
        };

        const tagStyle = (t: ProfileTag) => {
          if (t.kind === "holder")
            return {
              fill: "rgba(34, 211, 238, 0.14)",
              stroke: "rgba(34, 211, 238, 0.35)",
              text: "rgba(207, 250, 254, 0.98)",
            };
          if (t.kind === "whale")
            return {
              fill: "rgba(234, 179, 8, 0.16)",
              stroke: "rgba(234, 179, 8, 0.35)",
              text: "rgba(254, 243, 199, 0.98)",
            };
          return {
            fill: "rgba(147, 51, 234, 0.22)",
            stroke: "rgba(147, 51, 234, 0.35)",
            text: "rgba(233, 213, 255, 0.98)",
          };
        };

        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        for (const t of pills) {
          const cfg = tagStyle(t);
          const label = `${t.label}`.trim();
          const padX = 22;
          const iconSize = 20;
          const iconGap = 12;
          const leftPad = padX + iconSize + iconGap;
          const w = Math.min(
            nameMaxW,
            Math.max(220, Math.ceil(ctx.measureText(label).width) + leftPad + padX)
          );
          fillRoundRect(ctx, pillX, pillY, w, pillH, pillR, cfg.fill);
          strokeRoundRect(ctx, pillX, pillY, w, pillH, pillR, cfg.stroke, 2);

          // Icon
          const ix = pillX + padX;
          const iy = pillY + (pillH - iconSize) / 2;
          if (t.kind === "holder") {
            drawSparkleIcon(ctx, ix, iy, iconSize, cfg.text);
          } else if (t.kind === "active") {
            drawArrowUpRightIcon(ctx, ix, iy, iconSize, cfg.text);
          } else if (t.kind === "whale") {
            // keep whale simple (use sparkle icon variant)
            drawSparkleIcon(ctx, ix, iy, iconSize, cfg.text);
          }

          ctx.fillStyle = cfg.text;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText(label, pillX + leftPad, pillY + pillH / 2 + 1);
          pillX += w + pillGap;
        }

        // Favorite cards row
        const favY = cy + 320;
        const favGap = 28;
        const favW = Math.floor((cw - favGap) / 2);
        const favH = 220;

        const drawFavCard = async (opts: {
          x: number;
          y: number;
          title: string;
          symbol: string;
          value: string;
          accentFill: string;
          accentStroke: string;
          accentText: string;
          iconUrl?: string | null;
        }) => {
          // base
          const baseFill = "rgba(17, 24, 39, 0.68)";
          fillRoundRect(ctx, opts.x, opts.y, favW, favH, 34, baseFill);
          strokeRoundRect(ctx, opts.x, opts.y, favW, favH, 34, opts.accentStroke, 3);

          // subtle accent gradient overlay
          const g = ctx.createLinearGradient(opts.x, opts.y, opts.x + favW, opts.y + favH);
          g.addColorStop(0, opts.accentFill);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          fillRoundRect(ctx, opts.x, opts.y, favW, favH, 34, g as unknown as string);
          ctx.restore();

          const pad = 26;
          const tx = opts.x + pad;
          const ty = opts.y + pad + 8;

          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = opts.accentText;
          ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(opts.title.toUpperCase(), tx, ty);

          // Symbol gradient text
          const symY = ty + 74;
          const symGrad = ctx.createLinearGradient(tx, symY - 50, tx + 200, symY);
          symGrad.addColorStop(0, "rgba(224, 231, 255, 0.95)");
          symGrad.addColorStop(1, "rgba(186, 230, 253, 0.95)");
          ctx.fillStyle = symGrad as unknown as string;
          ctx.font = '700 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(ellipsize(opts.symbol || "$—", favW - pad * 2 - 96), tx, symY);

          ctx.fillStyle = "rgba(156, 163, 175, 0.95)";
          ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(opts.value, tx, symY + 64);

          // Icon circle (top-right)
          if (opts.iconUrl) {
            const iconSize = 84;
            const ix = opts.x + favW - pad - iconSize;
            const iy = opts.y + pad + 18;
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.beginPath();
            ctx.arc(ix + iconSize / 2, iy + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = opts.accentStroke;
            ctx.lineWidth = 3;
            ctx.stroke();

            const iconImg = await loadImage(opts.iconUrl);
            if (iconImg) {
              ctx.save();
              ctx.beginPath();
              ctx.arc(ix + iconSize / 2, iy + iconSize / 2, iconSize / 2 - 2, 0, Math.PI * 2);
              ctx.clip();
              ctx.drawImage(iconImg, ix, iy, iconSize, iconSize);
              ctx.restore();
            }
          }
        };

        await drawFavCard({
          x: cx,
          y: favY,
          title: "Fav by Volume",
          symbol: maybeStats.favCoinByVolume?.symbol ?? "$—",
          value: formatUsd(maybeStats.favCoinByVolume?.volume ?? 0),
          accentFill: "rgba(34, 211, 238, 0.14)",
          accentStroke: "rgba(34, 211, 238, 0.35)",
          accentText: "rgba(103, 232, 249, 0.95)",
          iconUrl: maybeStats.favCoinByVolume?.imageUrl ?? null,
        });

        await drawFavCard({
          x: cx + favW + favGap,
          y: favY,
          title: "Fav by Trades",
          symbol: maybeStats.favCoinByTrades?.symbol ?? "$—",
          value: `${formatTradesCount(maybeStats.favCoinByTrades?.trades ?? 0)} trades`,
          accentFill: "rgba(16, 185, 129, 0.14)",
          accentStroke: "rgba(16, 185, 129, 0.35)",
          accentText: "rgba(110, 231, 183, 0.95)",
          iconUrl: maybeStats.favCoinByTrades?.imageUrl ?? null,
        });

        // Stats row (3 cards)
        const statY = favY + favH + 44;
        const statGap = 26;
        const statW = Math.floor((cw - statGap * 2) / 3);
        const statH = 260;

        const drawStatCard = (opts: {
          x: number;
          y: number;
          label: string;
          accent: { fill: string; stroke: string; title: string; gradA: string; gradB: string };
          volume: number;
          trades: number;
        }) => {
          fillRoundRect(ctx, opts.x, opts.y, statW, statH, 34, "rgba(17, 24, 39, 0.62)");
          strokeRoundRect(ctx, opts.x, opts.y, statW, statH, 34, opts.accent.stroke, 3);

          const pad = 26;
          const tx = opts.x + pad;
          const ty = opts.y + pad + 12;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = opts.accent.title;
          ctx.font = '700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(opts.label.toUpperCase(), tx, ty);

          ctx.fillStyle = "rgba(156,163,175,0.95)";
          ctx.font = '500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText("Volume", tx, ty + 44);

          const numY = ty + 110;
          const numGrad = ctx.createLinearGradient(tx, numY - 60, tx + 240, numY);
          numGrad.addColorStop(0, opts.accent.gradA);
          numGrad.addColorStop(1, opts.accent.gradB);
          ctx.fillStyle = numGrad as unknown as string;
          ctx.font = '700 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(formatUsd(opts.volume), tx, numY);

          ctx.fillStyle = "rgba(156,163,175,0.95)";
          ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillText(`${formatTradesCount(opts.trades)} trades`, tx, numY + 56);
        };

        drawStatCard({
          x: cx,
          y: statY,
          label: "Daily",
          accent: {
            fill: "rgba(168, 85, 247, 0.10)",
            stroke: "rgba(168, 85, 247, 0.35)",
            title: "rgba(216, 180, 254, 0.95)",
            gradA: "rgba(216, 180, 254, 0.95)",
            gradB: "rgba(249, 168, 212, 0.95)",
          },
          volume: maybeStats.daily.volume,
          trades: maybeStats.daily.trades,
        });

        drawStatCard({
          x: cx + statW + statGap,
          y: statY,
          label: "Weekly",
          accent: {
            fill: "rgba(236, 72, 153, 0.10)",
            stroke: "rgba(236, 72, 153, 0.35)",
            title: "rgba(253, 164, 175, 0.95)",
            gradA: "rgba(253, 164, 175, 0.95)",
            gradB: "rgba(147, 197, 253, 0.95)",
          },
          volume: maybeStats.weekly.volume,
          trades: maybeStats.weekly.trades,
        });

        drawStatCard({
          x: cx + (statW + statGap) * 2,
          y: statY,
          label: "Monthly",
          accent: {
            fill: "rgba(59, 130, 246, 0.10)",
            stroke: "rgba(59, 130, 246, 0.35)",
            title: "rgba(147, 197, 253, 0.95)",
            gradA: "rgba(147, 197, 253, 0.95)",
            gradB: "rgba(216, 180, 254, 0.95)",
          },
          volume: maybeStats.monthly.volume,
          trades: maybeStats.monthly.trades,
        });

        // Footer
        const footerY = innerY + innerH - 160;

        // Logo box
        const logoBox = 72;
        const logoX = cx;
        const logoY = footerY + 42;
        fillRoundRect(ctx, logoX, logoY, logoBox, logoBox, 18, "rgba(31, 41, 55, 0.55)");
        const logoImg = await loadImage("/original.webp");
        if (logoImg) {
          ctx.save();
          roundRectPath(ctx, logoX + 10, logoY + 10, logoBox - 20, logoBox - 20, 10);
          ctx.clip();
          ctx.drawImage(logoImg, logoX + 10, logoY + 10, logoBox - 20, logoBox - 20);
          ctx.restore();
        }

        const brandX = logoX + logoBox + 22;
        const brandY = logoY + 50;
        const brandGrad = ctx.createLinearGradient(brandX, brandY - 32, brandX + 220, brandY);
        brandGrad.addColorStop(0, "#22d3ee");
        brandGrad.addColorStop(0.5, "#38bdf8");
        brandGrad.addColorStop(1, "#60a5fa");
        ctx.fillStyle = brandGrad as unknown as string;
        ctx.font = '800 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Bluera", brandX, brandY);

        ctx.fillStyle = "rgba(156,163,175,0.7)";
        ctx.font = '500 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        ctx.textAlign = "right";
        const dateStr = new Date().toLocaleDateString("en-GB");
        ctx.fillText(`Generated on ${dateStr}`, cx + cw, brandY);

        return canvas.toDataURL("image/png");
      }

      // Prefer capturing the actual rendered card if an external ref is provided.
      // IMPORTANT: If externalCardRef is provided but not mounted, do NOT fall back
      // to the legacy canvas renderer (would upload the old design).
      const wantsExternal = !!externalCardRef;
      if (wantsExternal) {
        const captureNode = await waitForExternalCard();
        if (!captureNode) {
          throw new Error("Card UI not ready (ref is null)");
        }
        try {
          // Ensure token logos / avatar have a chance to load before capture.
          await waitForImages(captureNode, 12_000);
          const canvas = await withTimeout(
            html2canvas(captureNode, {
              backgroundColor: null,
              // Keep size reasonable for mobile webviews to avoid huge base64 payloads/timeouts.
              // (scale is the #1 knob for performance here)
              scale: 1,
              useCORS: true,
              // Prefer not tainting so we can reliably export via toDataURL.
              // Cross-origin images are fetched through the proxy below.
              allowTaint: false,
              // Use our server-side image proxy to avoid CORS issues with avatars/token icons.
              proxy: "/api/image-proxy",
              // html2canvas defaults to 15s; bump to reduce flaky failures on slow mobile networks.
              imageTimeout: 60_000,
              removeContainer: true,
              logging: false,
              onclone: (doc) => {
                // html2canvas cannot parse modern CSS color functions like `lab()` / `oklch()`
                // (Tailwind v4 theme vars may serialize to those). In the cloned DOM only,
                // force a few key theme variables/classes to plain rgb/rgba so capture succeeds.
                const style = doc.createElement("style");
                style.textContent = `
                  :root, .dark {
                    --background: #0b0b0f !important;
                    --foreground: #ffffff !important;
                    --muted: rgba(255,255,255,.08) !important;
                    --muted-foreground: rgba(255,255,255,.72) !important;
                    --border: rgba(255,255,255,.14) !important;
                  }

                  /* Tailwind classes used in the share card */
                  .bg-background { background-color: #0b0b0f !important; }
                  .text-foreground { color: #ffffff !important; }
                  .text-muted-foreground { color: rgba(255,255,255,.72) !important; }
                  .border-border { border-color: rgba(255,255,255,.14) !important; }
                  .bg-muted { background-color: rgba(255,255,255,.08) !important; }

                  /* Slash opacity utilities */
                  .bg-background\\/50 { background-color: rgba(11,11,15,.5) !important; }
                  .bg-black\\/80 { background-color: rgba(0,0,0,.8) !important; }

                  /* Performance: expensive effects can stall html2canvas on mobile webviews */
                  * {
                    -webkit-backdrop-filter: none !important;
                    backdrop-filter: none !important;
                    filter: none !important;
                    animation: none !important;
                    transition: none !important;
                  }
                `;
                doc.head.appendChild(style);

                // Rewrite remote <img> URLs through our proxy in the cloned DOM only
                // (does not affect the visible UI).
                const imgs = Array.from(doc.querySelectorAll("img")) as HTMLImageElement[];
                for (const img of imgs) {
                  const src = (img.getAttribute("src") || "").trim();
                  if (!src) continue;
                  if (src.startsWith("data:") || src.startsWith("blob:")) continue;
                  // Relative URLs are same-origin already.
                  if (src.startsWith("/")) continue;
                  img.setAttribute("crossorigin", "anonymous");
                  img.setAttribute(
                    "src",
                    `/api/image-proxy?url=${encodeURIComponent(src)}`
                  );
                }
              },
            }),
            60_000,
            "html2canvas"
          );
          return canvas.toDataURL("image/jpeg", 0.88);
        } catch (e) {
          console.warn(
            "[shareable-aura-card] html2canvas capture failed; falling back to canvas renderer:",
            e
          );
          // Fall through to legacy canvas renderer below.
        }
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

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

      // Tags (up to 3): Holder / Whale Trader / Active Base Trader
      const tagItems = [
        holderTag
          ? {
              text: holderTag,
              fill: "rgba(168, 85, 247, 0.15)",
              stroke: "rgba(168, 85, 247, 0.3)",
              textColor: "#c084fc",
            }
          : null,
        traderTag
          ? {
              text: traderTag,
              fill: "rgba(234, 179, 8, 0.15)",
              stroke: "rgba(234, 179, 8, 0.3)",
              textColor: "#facc15",
            }
          : null,
        activeTraderTag
          ? {
              text: activeTraderTag,
              fill: "rgba(59, 130, 246, 0.15)",
              stroke: "rgba(59, 130, 246, 0.3)",
              textColor: "#60a5fa",
            }
          : null,
      ].filter(Boolean) as Array<{
        text: string;
        fill: string;
        stroke: string;
        textColor: string;
      }>;

      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.textAlign = "center";

      tagItems.forEach((t, idx) => {
        const y = tagsY + idx * (tagHeight + tagSpacing);
        ctx.fillStyle = t.fill;
        ctx.strokeStyle = t.stroke;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(tagsX, y, tagWidth, tagHeight, 18);
        } else {
          ctx.rect(tagsX, y, tagWidth, tagHeight);
        }
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = t.textColor;
        ctx.fillText(t.text, tagsX + tagWidth / 2, y + 22);
      });

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
      drawStatBox(statsStartX, statsY, "Daily Vol", fmtMoney(allTimeVolumeState ?? 0));
      drawStatBox(statsStartX + statBoxWidth + statSpacing, statsY, "Weekly Vol", fmtMoney(weeklyVolumeState ?? 0));
      drawStatBox(statsStartX + (statBoxWidth + statSpacing) * 2, statsY, "Monthly Vol", fmtMoney(monthlyVolumeState ?? 0));

      // Row 2 (Net Worth / Trades)
      drawStatBox(
        statsStartX + (statBoxWidth + statSpacing) * 2,
        statsY + statBoxHeight + statSpacing,
        "Monthly Trades",
        `${monthlyTradesState ?? 0}`
      );
      drawStatBox(
        statsStartX,
        statsY + (statBoxHeight + statSpacing),
        "Daily Trades",
        `${dailyTradesState ?? 0}`
      );
      drawStatBox(
        statsStartX + statBoxWidth + statSpacing,
        statsY + (statBoxHeight + statSpacing),
        "Weekly Trades",
        `${weeklyTradesState ?? 0}`
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

      return canvas.toDataURL("image/jpeg", 0.88);
    } catch (error) {
      console.error("Image generation failed:", error);
      // Propagate a useful error message up to the uploader UI.
      const msg = error instanceof Error ? error.message : "Unknown image generation error";
      throw new Error(msg);
    }
  }, [
    allTimeVolumeState,
    dailyTradesState,
    avatarUrl,
    externalCardRef,
    waitForExternalCard,
    waitForImages,
    withTimeout,
    activeTraderTag,
    fid,
    fmtMoney,
    holderTag,
    monthlyTradesState,
    monthlyVolumeState,
    pfpUrl,
    stats,
    tags,
    traderTag,
    userId,
    username,
    weeklyTradesState,
    weeklyVolumeState,
  ]);

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

      const blobUrl = URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");

      if (newWindow) {
        alert(
          '💡 Tip: Long press on the image and select "Save Image".\n\nNote: Some composers (Base/Warpcast) do not support pasting images from clipboard yet.'
        );
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
      alert("❌ Failed to share. Try saving the image and uploading it, or use Share on Base.");
    }
  };

  const uploadAuraCardImage = React.useCallback(async (): Promise<{
    ok: boolean;
    imageUrl?: string;
    error?: string;
  }> => {
    try {
      if (!address) return { ok: false, error: "Wallet not connected" };

      // If we're wired to an external card, ensure it's available before upload.
      if (typeof externalCardRef !== "undefined") {
        const node = await waitForExternalCard();
        if (!node) {
          console.warn("[aura-card-image] external card ref not ready; skipping upload");
          return { ok: false, error: "Card UI not ready" };
        }
      }

      // Always resolve the latest aura_card id first, then update by id (deterministic).
      const latestRes = await fetch(
        `/api/aura-card?wallet=${address}&network=base`,
        { cache: "no-store" }
      );
      if (!latestRes.ok) {
        const t = await latestRes.text().catch(() => "");
        console.error("[aura-card-image] could not fetch latest aura_card id:", latestRes.status, t);
        return { ok: false, error: "Could not fetch latest aura card" };
      }
      const latestJson = (await latestRes.json().catch(() => null)) as null | { id?: string };
      const auraCardId = latestJson?.id;
      if (!auraCardId) {
        return { ok: false, error: "Missing aura card id" };
      }

      setIsUploadingImage(true);
      setLastUploadError(null);
      const dataUrl =
        previewUrl ||
        (await withTimeout(generateImage(), 90_000, "generateImage"));

      // Convert data URL -> Blob, then send as multipart to avoid huge base64 JSON bodies.
      const blob = dataUrlToBlob(dataUrl);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);
      const uploadRes = await fetch("/api/aura-card-image", {
        method: "POST",
        signal: controller.signal,
        body: (() => {
          const form = new FormData();
          form.set("walletAddress", address.toLowerCase());
          form.set("network", "base");
          form.set("auraCardId", auraCardId);
          const type = blob.type || "image/jpeg";
          const ext = type === "image/jpeg" ? "jpg" : "png";
          form.set(
            "file",
            new File([blob], `aura-card-${auraCardId}.${ext}`, { type })
          );
          return form;
        })(),
      });
      clearTimeout(timeout);

      if (!uploadRes.ok) {
        const text = await uploadRes.text().catch(() => "");
        console.error("[aura-card-image] upload failed:", uploadRes.status, text);
        return { ok: false, error: `Upload failed (${uploadRes.status})` };
      }
      const json = (await uploadRes.json().catch(() => null)) as
        | null
        | { imageUrl?: string; error?: string };
      const imageUrl = json?.imageUrl;
      setLastUploadError(null);
      return { ok: true, imageUrl };
    } catch (e) {
      console.error("Aura card image upload failed:", e);
      const msg =
        e instanceof DOMException && e.name === "AbortError"
          ? "Upload timed out"
          : e instanceof Error
            ? e.message
            : "Unknown upload error";
      return { ok: false, error: msg };
    } finally {
      setIsUploadingImage(false);
    }
  }, [
    address,
    dataUrlToBlob,
    externalCardRef,
    generateImage,
    previewUrl,
    waitForExternalCard,
    withTimeout,
  ]);

  const uploadAuraCardImageWithRetry = React.useCallback(
    async (attempts = 3) => {
      let lastErr: string | undefined;
      for (let i = 0; i < attempts; i++) {
        const res = await uploadAuraCardImage();
        if (res.ok) return true;
        lastErr = res.error;
        // backoff: 0.8s, 1.6s, 3.2s...
        await sleep(800 * Math.pow(2, i));
      }
      setLastUploadError(lastErr ?? "Upload failed");
      return false;
    },
    [sleep, uploadAuraCardImage]
  );

  const interpretCallsStatus = React.useCallback((data: unknown) => {
    const statusStr = (() => {
      if (!data || typeof data !== "object") return undefined;
      if (!("status" in data)) return undefined;
      const s = (data as { status?: unknown }).status;
      return typeof s === "string" ? s : undefined;
    })();
    const normalized = statusStr ? statusStr.toUpperCase() : undefined;

    const receipts = (() => {
      if (!data || typeof data !== "object") return undefined;
      if (!("receipts" in data)) return undefined;
      const r = (data as { receipts?: unknown }).receipts;
      return Array.isArray(r) ? (r as unknown[]) : undefined;
    })();

    const allSuccess =
      !receipts ||
      receipts.length === 0 ||
      receipts.every((r) => {
        if (!r || typeof r !== "object") return true;
        if (!("status" in r)) return true;
        const s = (r as { status?: unknown }).status;
        return s === "success" || s === 1;
      });

    return {
      normalizedStatus: normalized,
      receipts,
      allSuccess,
    };
  }, []);

  const finalizeMint = React.useCallback(() => {
    // Never block UI state transitions on image generation/upload. In some webviews
    // html2canvas or the upload request can be slow/hang, which would otherwise
    // keep the UI stuck in "Confirming...".
    setHasMinted(true);
    setIsConfirmingMint(false);
    setPendingCallsId(null);

    // Upload in background with retries (so /aura/[wallet] preview stays updated).
    void uploadAuraCardImageWithRetry(3);

    alert("✅ Mint confirmed! You can now share on Base.");
  }, [uploadAuraCardImageWithRetry]);

  // Ensure Supabase image_url matches the currently rendered share card.
  // Note: externalCardRef.current might become available after initial render,
  // so we poll briefly.
  const hasAutoUploadedRef = React.useRef(false);
  React.useEffect(() => {
    if (!autoUploadImage) return;
    if (hasAutoUploadedRef.current) return;
    if (!address) return;

    let tries = 0;
    const maxTries = 10; // ~2s
    const interval = setInterval(() => {
      tries += 1;
      const nodeReady = !externalCardRef || !!externalCardRef.current;
      if (nodeReady) {
        hasAutoUploadedRef.current = true;
        clearInterval(interval);
        void uploadAuraCardImageWithRetry(2);
        return;
      }
      if (tries >= maxTries) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [address, autoUploadImage, externalCardRef, uploadAuraCardImageWithRetry]);

  React.useEffect(() => {
    if (!pendingCallsId || !isConfirmingMint) return;
    if (waitCallsStatus === "error") {
      console.error("[mint] waitForCallsStatus error:", waitCallsError);
      setIsConfirmingMint(false);
      setPendingCallsId(null);
      alert("❌ Could not confirm the transaction. Please try again.");
      return;
    }
    // Note: Some connectors/webviews never flip `waitCallsStatus` to "success"
    // even though `callsStatusData` is populated. So we primarily rely on the
    // data payload when present, and only early-return when there's no signal.

    // Some wagmi connectors return a call status payload with a `status` field.
    // We've seen variants like: 'PENDING' | 'CONFIRMED' | 'FAILED' and also lowercase / 'success'.
    const { normalizedStatus: normalizedBundleStatus, receipts: callsReceipts, allSuccess } =
      interpretCallsStatus(callsStatusData);

    // If we have neither a bundle status nor receipts, there's nothing to act on yet.
    if (!normalizedBundleStatus && (!callsReceipts || callsReceipts.length === 0)) {
      // If wagmi never resolves, the timeout effect will reset the UI.
      return;
    }

    if (normalizedBundleStatus) {
      if (normalizedBundleStatus === "PENDING") return;
      if (normalizedBundleStatus === "FAILED" || normalizedBundleStatus === "ERROR") {
        setIsConfirmingMint(false);
        setPendingCallsId(null);
        alert("❌ Mint transaction failed. Please try again.");
        return;
      }
      // For other statuses, we keep going and evaluate receipts if present.
    }

    if (!allSuccess) {
      setIsConfirmingMint(false);
      setPendingCallsId(null);
      alert("❌ Mint transaction reverted. Please try again.");
      return;
    }

    // If bundle status exists and is not confirmed/success, don't finalize yet.
    if (
      normalizedBundleStatus &&
      normalizedBundleStatus !== "CONFIRMED" &&
      normalizedBundleStatus !== "SUCCESS"
    ) {
      return;
    }

    // Only after confirmation + success we consider it minted.
    finalizeMint();
  }, [
    callsStatusData,
    finalizeMint,
    interpretCallsStatus,
    isConfirmingMint,
    pendingCallsId,
    waitCallsError,
    waitCallsStatus,
  ]);

  // Fallback poll: some miniapp/webviews fail to update wagmi's calls status hook.
  // In that case, directly query `wallet_getCallsStatus` and finalize when confirmed.
  React.useEffect(() => {
    if (!pendingCallsId || !isConfirmingMint) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const eth = (
          globalThis as unknown as {
            ethereum?: {
              request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
            };
          }
        ).ethereum;
        if (!eth?.request) return;
        const res = await eth.request({
          method: "wallet_getCallsStatus",
          params: [pendingCallsId],
        });
        if (cancelled) return;

        const { normalizedStatus, allSuccess, receipts } = interpretCallsStatus(res);
        if (!normalizedStatus && (!receipts || receipts.length === 0)) return;
        if (normalizedStatus === "PENDING") return;
        if (normalizedStatus === "FAILED" || normalizedStatus === "ERROR") {
          setIsConfirmingMint(false);
          setPendingCallsId(null);
          alert("❌ Mint transaction failed. Please try again.");
          return;
        }
        if (!allSuccess) {
          setIsConfirmingMint(false);
          setPendingCallsId(null);
          alert("❌ Mint transaction reverted. Please try again.");
          return;
        }
        if (normalizedStatus && normalizedStatus !== "CONFIRMED" && normalizedStatus !== "SUCCESS") {
          return;
        }
        finalizeMint();
      } catch {
        // Ignore and let the timeout handle worst-case scenarios.
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [finalizeMint, interpretCallsStatus, isConfirmingMint, pendingCallsId]);

  // Safety timeout: sometimes webviews/connectors fail to report the call status,
  // which would otherwise leave the UI stuck in "Confirming...".
  React.useEffect(() => {
    if (!pendingCallsId || !isConfirmingMint) return;

    const idAtStart = pendingCallsId;
    const timeout = setTimeout(() => {
      // Only reset if we're still confirming the same calls bundle.
      setIsConfirmingMint((stillConfirming) => {
        if (!stillConfirming) return stillConfirming;
        setPendingCallsId((current) => {
          if (current !== idAtStart) return current;
          return null;
        });
        alert(
          "⚠️ Confirmation is taking longer than expected. If you approved the tx in your wallet, please wait a bit and try again if needed."
        );
        return false;
      });
    }, 90_000);

    return () => clearTimeout(timeout);
  }, [isConfirmingMint, pendingCallsId]);

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

      const amount = parseUnits("10", 4);
      const result = await sendCallsAsync({
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

      // Wait for confirmation before enabling share.
      const id = (() => {
        const maybe = result as unknown;
        if (!maybe || typeof maybe !== "object") return undefined;
        if (!("id" in maybe)) return undefined;
        const v = (maybe as { id?: unknown }).id;
        return typeof v === "string" ? v : undefined;
      })();
      if (!id) {
        throw new Error("Missing calls id from sendCalls");
      }
      setPendingCallsId(id);
      setIsConfirmingMint(true);
      alert("⏳ Transaction sent. Waiting for confirmation...");
    } catch (error) {
      console.error("Mint error:", error);
      alert("❌ Failed to mint. Please try again.");
    } finally {
      setIsMinting(false);
    }
  };

  const handleShareOnBase = async () => {
    try {
      if (!address) {
        alert("Connect your wallet first.");
        return;
      }

      // Ensure Supabase image_url is updated to the latest share-card design before sharing.
      const ok = await uploadAuraCardImageWithRetry(3);
      if (!ok) {
        alert(
          `❌ Card image could not be uploaded.\n\n${lastUploadError ?? "Unknown error"}\n\nTry again on a stronger connection.`
        );
        return;
      }

      const res = await fetch(
        `/api/aura-card?wallet=${address}&network=base`
      );
      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to fetch latest aura_card:", text);
        alert("Could not load your Aura Card. Try again later.");
        return;
      }

      // We still fetch to ensure the aura card exists (and is uploaded),
      // but we share a dedicated URL that includes `fc:frame` meta tags.
      await res.json();

      const appUrl =
        (typeof window !== "undefined" && window.location?.origin) ||
        "https://bluera.vercel.app";
      // Cache-bust to force Farcaster/Base to refresh OG preview for this URL.
      const shareUrl = `${appUrl}/aura/${address.toLowerCase()}?v=${Date.now()}`;

      const text =
        "My onchain aura is officially live on Bluera 🔮 Curious what yours looks like?";

      await sdk.actions.composeCast({
        text,
        embeds: [shareUrl],
      });
    } catch (e) {
      console.error("Share on Base error:", e);
      alert("Failed to open share composer. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      {showCard && (
        <>
          {/* Just the content, no card wrapper */}
          <div ref={cardRef} className="mx-auto" style={{ maxWidth: "500px" }}>
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
            {(holderTag || traderTag || activeTraderTag) && (
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
                {activeTraderTag && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-xs font-medium">
                    {activeTraderTag}
                  </span>
                )}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Daily Vol
                </p>
                <p className="font-bold text-xs">
                  {fmtMoneyOrNA(allTimeVolumeState)}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Weekly Vol
                </p>
                <p className="font-bold text-xs">
                  {fmtMoneyOrNA(weeklyVolumeState)}
                </p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Monthly Vol
                </p>
                <p className="font-bold text-xs">
                  {fmtMoneyOrNA(monthlyVolumeState)}
                </p>
              </div>

              {mode !== "modal" && (
                <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                  <p className="text-[10px] text-muted-foreground mb-0.5">
                    Net Worth
                  </p>
                  <p className="font-bold text-xs">
                    {fmtMoneyOrNA(networthState)}
                  </p>
                </div>
              )}

              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Daily Trades
                </p>
                <p className="font-bold text-xs">{dailyTradesState ?? 0}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Weekly Trades
                </p>
                <p className="font-bold text-xs">{weeklyTradesState ?? 0}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-background/50 border border-border">
                <p className="text-[10px] text-muted-foreground mb-0.5">
                  Monthly Trades
                </p>
                <p className="font-bold text-xs">{monthlyTradesState ?? 0}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Generate Button'u kaldır (satır 702-721) */}

      {/* Actions Row */}
      {showActions && (
        <div className="flex flex-col items-center gap-3 w-full">
          {!hasMinted ? (
            <Button
              onClick={handleMint}
              disabled={isMinting || isConfirmingMint}
              size="lg"
              className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all w-full"
            >
              {isMinting || isConfirmingMint ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white mr-2" />
                  {isMinting ? "Minting..." : "Confirming..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Mint Aura NFT
                </>
              )}
            </Button>
          ) : null}

          {/* Always show Share button in modal. Even if hasMinted state fails to flip,
              users should still be able to upload+share once the tx is confirmed. */}
          {mode === "modal" && (
            <div className="flex flex-col gap-2 w-full">
              {showShareButton && hasMinted ? (
                <Button
                  onClick={handleShareOnBase}
                  size="lg"
                  disabled={isMinting || isConfirmingMint || isUploadingImage}
                  className="bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 text-white font-semibold px-8 shadow-lg hover:shadow-xl transition-all w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isUploadingImage
                    ? "Uploading..."
                    : isConfirmingMint
                      ? "Confirming..."
                      : "Share on Base"}
                </Button>
              ) : null}
              {lastUploadError ? (
                <p className="text-xs text-muted-foreground text-center">
                  Upload error: {lastUploadError}
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {mode === "inline" && showPreview && previewUrl && (
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