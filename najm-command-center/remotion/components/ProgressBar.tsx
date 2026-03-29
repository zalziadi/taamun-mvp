import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame / durationInFrames) * 100;

  return (
    <AbsoluteFill style={{ zIndex: 100 }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 6,
          width: `${progress}%`,
          background: "linear-gradient(90deg, #C9A84C, #E8D48B)",
          boxShadow: "0 0 20px rgba(201, 168, 76, 0.5)",
        }}
      />
    </AbsoluteFill>
  );
};
