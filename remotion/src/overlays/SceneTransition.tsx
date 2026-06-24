import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { C, FONT, SIZE, FPS } from "../tokens";

// 全幕場景切換卡 — 4 秒紙質卡
//
// 設計原則：
// - 純紙底色 (C.paper)，覆蓋全幕
// - 講者音軌在 transition 期間靜音（在 index.tsx 的 segment 結構自然發生）
// - BGM 持續（在 index.tsx 全域 Audio）
// - 進場 fade + 微 scale (1.02→1.0)，退場 fade
//
// 用法：放在 index.tsx 的 Sequence 內，from 是 output frame
export type SceneTransitionProps = {
  label: string; // "PART 3"
  title: string; // "Prompt 設計與打開 Claude"
  description?: string; // 一句話說明
  durationSec?: number; // default 4s
};

export const SceneTransition: React.FC<SceneTransitionProps> = ({
  label,
  title,
  description,
  durationSec = 4,
}) => {
  const frame = useCurrentFrame();
  const totalFrames = durationSec * FPS;
  const inFrames = 18;
  const outFrames = 12;

  const opIn = interpolate(frame, [0, inFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const opOut = interpolate(
    frame,
    [totalFrames - outFrames, totalFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const opacity = Math.min(opIn, opOut);

  const scale = interpolate(frame, [0, inFrames], [1.02, 1.0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: C.paper,
        opacity,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          padding: "0 80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.lg,
            color: C.accent,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: FONT.serif,
            fontSize: 96,
            color: C.ink,
            fontWeight: 600,
            lineHeight: 1.15,
            marginBottom: 36,
          }}
        >
          {title}
        </div>
        <div
          style={{
            width: 100,
            height: 2,
            background: C.accent,
            margin: "0 auto 36px",
          }}
        />
        {description && (
          <div
            style={{
              fontFamily: FONT.sans,
              fontSize: SIZE.xl,
              color: C.inkSoft,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
