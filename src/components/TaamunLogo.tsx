type TaamunLogoProps = {
  shadowScale?: number;
};

export default function TaamunLogo({ shadowScale = 1 }: TaamunLogoProps) {
  return (
    <div className="logo-wrapper">
      <svg viewBox="0 0 600 400" className="logo-svg" aria-label="Taamun logo">
        <ellipse
          cx="320"
          cy="310"
          rx={180 * shadowScale}
          ry="40"
          fill="black"
          opacity="0.45"
        />

        <circle cx="180" cy="230" r="22" fill="#2E2E2E" />
        <circle cx="220" cy="252" r="24" fill="#3A3A3A" />
        <circle cx="260" cy="274" r="26" fill="#4A4A4A" />
        <circle cx="300" cy="296" r="28" fill="#5A5A5A" />

        <circle cx="340" cy="296" r="28" fill="#7A7A7A" />
        <circle cx="380" cy="274" r="26" fill="#8A8A8A" />
        <circle cx="420" cy="252" r="24" fill="#9A9A9A" />
        <circle cx="460" cy="230" r="22" fill="#A0A0A0" />

        <rect
          x="295"
          y="120"
          width="10"
          height="200"
          rx="5"
          fill="#5C3A21"
        />
      </svg>
    </div>
  );
}
