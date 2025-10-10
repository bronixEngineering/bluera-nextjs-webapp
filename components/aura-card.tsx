"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuraCardProps = {
  score: number;
  tags?: string[];
  className?: string;
  ctaLabel?: string;
  loading?: boolean;
  onClick?: () => void;
};

export function AuraCard({
  score,
  tags = [],
  className,
  ctaLabel,
  loading,
  onClick,
}: AuraCardProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border p-6", className)}
      style={{
        background:
          "radial-gradient(340px 220px at -10% -15%, rgba(255,255,255,0.10), rgba(0,0,0,0) 65%)",
      }}
    >
      <div className="mx-auto flex max-w-md flex-col items-center gap-5">
        <div className="relative grid place-items-center">
          {/* Outer subtle glow */}
          <div
            className="h-32 w-32 rounded-full ring-1 ring-white/10"
            style={{
              background:
                "radial-gradient(90px 70px at 30% 25%, rgba(255,255,255,0.14), rgba(0,0,0,0) 72%)",
            }}
          />
          {/* Numeric score */}
          <div className="absolute text-5xl font-extrabold text-white/85">{score}</div>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-white/60">
            {tags.map((t) => (
              <span key={t} className="rounded-full border border-white/10 px-2 py-0.5">
                {t}
              </span>
            ))}
          </div>
        )}

        {ctaLabel && (
          <Button
            onClick={onClick}
            className="w-full border border-white/15 bg-black/30 text-white hover:bg-white/5"
            size="lg"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Generating...
              </div>
            ) : (
              ctaLabel
            )}
          </Button>
        )}
      </div>
    </div>
  );
}


