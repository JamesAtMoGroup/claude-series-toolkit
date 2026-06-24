import React from "react";
import { Sequence } from "remotion";
import { C, FONT, SIZE, SAFE, FPS } from "../tokens";
import { useOverlayMotion } from "../lib/motion";

export type TermCardProps = {
  fromSec: number;
  toSec: number;
  term: string; // "Prompt"
  explain: string; // "你輸入給 Claude 的指令"
};

const Inner: React.FC<TermCardProps> = ({ fromSec, toSec, term, explain }) => {
  const { opacity, translateY } = useOverlayMotion({
    fromFrame: 0,
    toFrame: (toSec - fromSec) * FPS,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 80,
        right: SAFE.right,
        width: 420,
        opacity,
        transform: `translateY(${translateY}px)`,
        background: C.paper,
        border: `1px solid ${C.accentBorder}`,
        borderRadius: 6,
        padding: "16px 20px",
        boxShadow: "0 4px 16px rgba(26,26,26,0.06)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.xs,
            color: C.accent,
            letterSpacing: 1.5,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          名詞
        </span>
        <span
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.lg,
            color: C.ink,
            fontWeight: 700,
          }}
        >
          {term}
        </span>
      </div>
      <div
        style={{
          fontFamily: FONT.sans,
          fontSize: SIZE.sm,
          color: C.inkSoft,
          lineHeight: 1.55,
        }}
      >
        {explain}
      </div>
    </div>
  );
};

export const TermCard: React.FC<TermCardProps> = (props) => (
  <Sequence
    from={Math.round(props.fromSec * FPS)}
    durationInFrames={Math.round((props.toSec - props.fromSec) * FPS)}
    layout="none"
  >
    <Inner {...props} />
  </Sequence>
);
