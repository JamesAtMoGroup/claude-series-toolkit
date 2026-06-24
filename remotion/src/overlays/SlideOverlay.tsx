import React from "react";
import { Sequence } from "remotion";
import { C, FONT, SIZE, SAFE, FPS } from "../tokens";
import { useOverlayMotion, useStaggerMotion } from "../lib/motion";

export type SlideOverlayProps = {
  fromSec: number;
  toSec: number;
  kind: "list" | "code" | "term";
  title?: string;
  items?: string[];
  body?: string;
};

const Inner: React.FC<SlideOverlayProps> = ({
  fromSec,
  toSec,
  kind,
  title,
  items,
  body,
}) => {
  const totalFrames = (toSec - fromSec) * FPS;
  const { opacity, translateY } = useOverlayMotion({
    fromFrame: 0,
    toFrame: totalFrames,
  });

  return (
    <div
      style={{
        position: "absolute",
        top: SAFE.top + 80,
        right: SAFE.right,
        width: 480,
        opacity,
        transform: `translateY(${translateY}px)`,
        background: C.paperSoft,
        border: `1px solid ${C.rule}`,
        borderRadius: 6,
        padding: "20px 24px",
        backdropFilter: "blur(10px)",
      }}
    >
      {title && (
        <div
          style={{
            fontFamily: FONT.serif,
            fontSize: SIZE.base,
            color: C.ink,
            fontWeight: 600,
            marginBottom: 14,
            paddingBottom: 10,
            borderBottom: `1px solid ${C.rule}`,
          }}
        >
          {title}
        </div>
      )}

      {kind === "list" && items && (
        <ol
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {items.map((item, i) => (
            <ListItem
              key={i}
              index={i}
              total={totalFrames}
              text={item}
            />
          ))}
        </ol>
      )}

      {kind === "code" && body && (
        <pre
          style={{
            fontFamily: FONT.mono,
            fontSize: SIZE.sm,
            color: C.ink,
            background: "rgba(26,26,26,0.04)",
            padding: 12,
            margin: 0,
            borderRadius: 4,
            whiteSpace: "pre-wrap",
            lineHeight: 1.5,
          }}
        >
          {body}
        </pre>
      )}

      {kind === "term" && body && (
        <div
          style={{
            fontFamily: FONT.sans,
            fontSize: SIZE.sm,
            color: C.inkSoft,
            lineHeight: 1.55,
          }}
        >
          {body}
        </div>
      )}
    </div>
  );
};

const ListItem: React.FC<{
  index: number;
  total: number;
  text: string;
}> = ({ index, total, text }) => {
  // Stagger: 每項延後 6 frames 進場
  const { opacity, translateY } = useStaggerMotion(0, total, index, 6);
  return (
    <li
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        display: "flex",
        gap: 12,
        alignItems: "baseline",
      }}
    >
      <span
        style={{
          fontFamily: FONT.mono,
          fontSize: SIZE.xs,
          color: C.accent,
          fontWeight: 700,
          minWidth: 24,
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <span
        style={{
          fontFamily: FONT.sans,
          fontSize: SIZE.sm,
          color: C.ink,
          lineHeight: 1.45,
        }}
      >
        {text}
      </span>
    </li>
  );
};

export const SlideOverlay: React.FC<SlideOverlayProps> = (props) => (
  <Sequence
    from={Math.round(props.fromSec * FPS)}
    durationInFrames={Math.round((props.toSec - props.fromSec) * FPS)}
    layout="none"
  >
    <Inner {...props} />
  </Sequence>
);
