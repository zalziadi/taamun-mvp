import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  Easing,
} from "remotion";

interface SceneProps {
  children: React.ReactNode;
  from: number;
  duration: number;
}

/** Fade-in/fade-out wrapper for each scene */
export const Scene: React.FC<SceneProps> = ({ children, from, duration }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - from;

  if (localFrame < -5 || localFrame > duration + 5) return null;

  const fadeIn = interpolate(localFrame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const fadeOut = interpolate(
    localFrame,
    [duration - 12, duration],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <AbsoluteFill
      style={{
        opacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
