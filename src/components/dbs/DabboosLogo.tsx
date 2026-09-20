/**
 * شعار «دبّوس» — ورقة صفراء + دبوس أحمر.
 * SVG ثابت (الألوان جزء من هوية الشعار، لا تتبع ثيم الصفحة).
 */

interface DabboosLogoProps {
  size?: number;
  className?: string;
}

export function DabboosLogo({ size = 48, className = "" }: DabboosLogoProps) {
  const height = Math.round(size * (170 / 150));
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 150 170"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="دبّوس"
    >
      <g transform="rotate(-4 75 90)">
        <path
          d="M30 48 H118 a6 6 0 0 1 6 6 V128 a6 6 0 0 1 -6 6 H44 L30 118 Z"
          fill="#FFD23F"
        />
        <path d="M30 118 L44 134 H36 a6 6 0 0 1 -6 -6 Z" fill="#F4B400" />
      </g>
      <circle cx="75" cy="40" r="20" fill="#E63946" />
      <ellipse cx="68" cy="33" rx="6" ry="4" fill="#fff" opacity="0.55" />
      <rect x="72.5" y="56" width="5" height="26" rx="2.5" fill="#9E0E18" />
      <path d="M72.5 80 L77.5 80 L75 90 Z" fill="#9E0E18" />
    </svg>
  );
}

export default DabboosLogo;
