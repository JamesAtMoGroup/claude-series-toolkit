import React from "react";
import { Sequence } from "remotion";
import { C, FONT, SIZE, SAFE, FPS } from "../tokens";
import { useOverlayMotion } from "../lib/motion";

// 規則：
// 1. 永不出現 EP 序列號（課程不照順序製作）
// 2. 全部文字都要有不透明底板（不能依賴影片背景對比）
// 3. series 是固定品牌（"Claude 實戰"），不是 episode 編號
export type LowerThirdProps = {
  fromSec: number;
  toSec: number;
  series?: string; // "Claude 實戰" — 系列識別，非序列號
  title: string; // 主標題（這集主題）
  subtitle?: string; // 副標題（補充說明）
};

const Inner: React.FC<LowerThirdProps> = ({
  fromSec,
  toSec,
  series,
  title,
  subtitle,
}) => {
  const { opacity, translateY } = useOverlayMotion({
    fromFrame: 0,
    toFrame: (toSec - fromSec) * FPS,
    slideY: 12,
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200, // 高於字幕區
        left: SAFE.left,
        opacity,
        transform: `translateY(${translateY}px)`,
        maxWidth: 720,
        // 整張卡共用一個不透明底板，所有文字保證可讀
        background: C.paperSoft,
        border: `1px solid ${C.rule}`,
        borderLeft: `4px solid ${C.accent}`,
        borderRadius: 4,
        padding: "14px 22px",
        backdropFilter: "blur(10px)",
      }}
    >
      {series && (
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.xs,
            color: C.accent,
            letterSpacing: 1.6,
            fontWeight: 700,
            marginBottom: 6,
            textTransform: "uppercase",
          }}
        >
          {series}
        </div>
      )}
      <div
        style={{
          fontFamily: FONT.serif,
          fontSize: SIZE.lg,
          color: C.ink,
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: SIZE.sm,
            color: C.ink, // ← 改用 ink (不再 inkSoft) — 配合底板更可讀
            marginTop: 6,
            fontWeight: 500,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

export const LowerThird: React.FC<LowerThirdProps> = (props) => (
  <Sequence
    from={Math.round(props.fromSec * FPS)}
    durationInFrames={Math.round((props.toSec - props.fromSec) * FPS)}
    layout="none"
  >
    <Inner {...props} />
  </Sequence>
);
