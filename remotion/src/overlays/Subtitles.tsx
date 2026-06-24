import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { C, FONT, SIZE, FPS } from "../tokens";
import type { Cue } from "../lib/parseVtt";

// 高亮字（Editorial Doc — 專有名詞變橘色加粗）
const KEYWORDS = [
  "Claude Chat",
  "GitHub Pages",
  "GitHub",
  "Prompt",
  "HTML",
  "CSS",
  "RWD",
  "Framework",
  "CTA",
  "Repository",
  "Branch",
  "Commit",
  "Deploy",
  "TextEdit",
  "index.html",
  "code",
].sort((a, b) => b.length - a.length);

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const KEYWORD_RE = new RegExp(`(${KEYWORDS.map(escapeRe).join("|")})`, "g");

const highlight = (text: string): React.ReactNode =>
  text.split(KEYWORD_RE).map((part, i) =>
    KEYWORDS.includes(part) ? (
      <span
        key={i}
        style={{
          color: C.accent,
          fontFamily: FONT.mono,
          fontWeight: 700,
          padding: "0 2px",
        }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

export const Subtitles: React.FC<{ cues: Cue[] }> = ({ cues }) => {
  const frame = useCurrentFrame();
  const sec = frame / FPS;
  const cue = cues.find((c) => sec >= c.fromSec && sec <= c.toSec);
  if (!cue) return null;

  const fromFrame = cue.fromSec * FPS;
  const toFrame = cue.toSec * FPS;
  const fadeIn = interpolate(frame, [fromFrame, fromFrame + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const fadeOut = interpolate(frame, [toFrame - 5, toFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(fadeIn, fadeOut);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          opacity,
          maxWidth: 1400,
          padding: "12px 28px",
          background: C.paperSoft,
          border: `1px solid ${C.rule}`,
          borderRadius: 6,
          fontFamily: FONT.sans,
          fontSize: SIZE.base,
          color: C.ink,
          lineHeight: 1.45,
          textAlign: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        {highlight(cue.text)}
      </div>
    </div>
  );
};
