import React from "react";
import { Sequence, interpolate, useCurrentFrame, Easing } from "remotion";
import { C, FONT, SIZE, SAFE, FPS } from "../tokens";

// SectionIntro：每段開頭出 3 秒的大標卡，告訴觀眾這段要看什麼
// 不取代 ChapterMark — ChapterMark 是持續性的 corner badge；SectionIntro 是 punctuation
//
// 規則：
// - 永不出現 EP 序列號（用 PART label / 段名）
// - 自帶不透明底板 (paperSoft)
// - 位置：頂部 banner，避開 speaker 中央禁區
export type SectionIntroProps = {
  fromSec: number;
  durationSec?: number; // default 3.5s
  label: string; // "PART 1"
  title: string; // "開場"
  description?: string; // 一行字描述「接下來會看到什麼」
};

const Inner: React.FC<Required<Omit<SectionIntroProps, "fromSec">>> = ({
  durationSec,
  label,
  title,
  description,
}) => {
  const frame = useCurrentFrame();
  const totalFrames = durationSec * FPS;
  const inFrames = 14;
  const outFrames = 10;

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

  const tyIn = interpolate(frame, [0, inFrames], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const tyOut = interpolate(
    frame,
    [totalFrames - outFrames, totalFrames],
    [0, -6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const translateY = tyIn + tyOut;

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top,
        left: 240,
        right: 240,
        opacity,
        transform: `translateY(${translateY}px)`,
        // 不透明底板 — 鐵律
        background: C.paperSoft,
        border: `1px solid ${C.rule}`,
        borderTop: `4px solid ${C.accent}`,
        borderRadius: 4,
        padding: "24px 32px",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        boxShadow: "0 6px 24px rgba(26,26,26,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 16,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.sm,
            color: C.accent,
            letterSpacing: 2,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: FONT.serif,
            fontSize: SIZE.xl,
            color: C.ink,
            fontWeight: 600,
            lineHeight: 1.1,
          }}
        >
          {title}
        </span>
      </div>
      {description && (
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: SIZE.base,
            color: C.ink,
            lineHeight: 1.4,
            marginTop: 4,
            paddingLeft: 2,
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};

export const SectionIntro: React.FC<SectionIntroProps> = ({
  fromSec,
  durationSec = 3.5,
  ...rest
}) => (
  <Sequence
    from={Math.round(fromSec * FPS)}
    durationInFrames={Math.round(durationSec * FPS)}
    layout="none"
  >
    <Inner durationSec={durationSec} {...rest} description={rest.description ?? ""} />
  </Sequence>
);
