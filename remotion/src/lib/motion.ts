import { interpolate, useCurrentFrame, Easing } from "remotion";

// Editorial Doc 動效：克制 — fade + 微 slide
// 入場 12 frames (200ms @ 60fps)，退場 8 frames (133ms)
// 規則禁 spring/scale/blur

export type MotionParams = {
  fromFrame: number;
  toFrame: number;
  inFrames?: number;
  outFrames?: number;
  slideY?: number; // 入場時從下方多少 px slide 上來，退場時往上 slide 多少 px
};

export const useOverlayMotion = ({
  fromFrame,
  toFrame,
  inFrames = 12,
  outFrames = 8,
  slideY = 8,
}: MotionParams) => {
  const frame = useCurrentFrame();
  const localFrame = frame - fromFrame;
  const totalFrames = toFrame - fromFrame;
  const remaining = totalFrames - localFrame;

  const opacityIn = interpolate(localFrame, [0, inFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacityOut = interpolate(remaining, [0, outFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opacity = Math.min(opacityIn, opacityOut);

  const translateInY = interpolate(localFrame, [0, inFrames], [slideY, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const translateOutY = interpolate(
    remaining,
    [0, outFrames],
    [-slideY / 2, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  const translateY = translateInY + translateOutY;

  return { opacity, translateY };
};

// Stagger 工具：每個子項延遲 N frames 進場
export const useStaggerMotion = (
  baseFromFrame: number,
  baseToFrame: number,
  index: number,
  staggerFrames = 6,
) => {
  return useOverlayMotion({
    fromFrame: baseFromFrame + index * staggerFrames,
    toFrame: baseToFrame,
  });
};
