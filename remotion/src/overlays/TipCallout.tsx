import React from "react";
import { Sequence } from "remotion";
import { C, FONT, SIZE, SAFE, FPS } from "../tokens";
import { useOverlayMotion } from "../lib/motion";

export type TipCalloutProps = {
  fromSec: number;
  toSec: number;
  icon?: string; // "✓" / "⚠️"
  text: string;
};

const Inner: React.FC<TipCalloutProps> = ({ fromSec, toSec, icon, text }) => {
  const { opacity, translateY } = useOverlayMotion({
    fromFrame: 0,
    toFrame: (toSec - fromSec) * FPS,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top,
        right: SAFE.right,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 18px",
        background: C.forest,
        borderRadius: 30,
        boxShadow: "0 4px 16px rgba(46,93,79,0.25)",
      }}
    >
      {icon && (
        <span
          style={{
            fontFamily: FONT.sans,
            fontSize: SIZE.base,
            color: C.paper,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {icon}
        </span>
      )}
      <span
        style={{
          fontFamily: FONT.sans,
          fontSize: SIZE.base,
          color: C.paper,
          fontWeight: 600,
        }}
      >
        {text}
      </span>
    </div>
  );
};

export const TipCallout: React.FC<TipCalloutProps> = (props) => (
  <Sequence
    from={Math.round(props.fromSec * FPS)}
    durationInFrames={Math.round((props.toSec - props.fromSec) * FPS)}
    layout="none"
  >
    <Inner {...props} />
  </Sequence>
);
