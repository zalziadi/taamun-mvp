"use client";

import Image from "next/image";
import { BRAND_LOGOS } from "@/lib/brand";

type LogoVariant = "full" | "mark" | "wordmark" | "favicon";
type LogoTheme = "light" | "dark";

interface BrandLogoProps {
  variant?: LogoVariant;
  theme?: LogoTheme;
  size?: number;
  className?: string;
}

const ASPECT_RATIOS: Record<LogoVariant, { w: number; h: number }> = {
  full: { w: 200, h: 260 },
  mark: { w: 200, h: 220 },
  wordmark: { w: 240, h: 48 },
  favicon: { w: 32, h: 32 },
};

export function BrandLogo({
  variant = "mark",
  theme = "light",
  size = 80,
  className = "",
}: BrandLogoProps) {
  const src =
    variant === "mark" && theme === "dark"
      ? "/brand/logo-mark-dark.svg"
      : BRAND_LOGOS[variant];

  const aspect = ASPECT_RATIOS[variant];
  const width = size;
  const height = Math.round(size * (aspect.h / aspect.w));

  return (
    <Image
      src={src}
      alt="تمعّن"
      width={width}
      height={height}
      className={className}
      priority={variant === "mark" || variant === "full"}
    />
  );
}
