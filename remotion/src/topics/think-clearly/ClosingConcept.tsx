import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { C, FONT, SIZE, FPS } from "../../tokens";

// ============================================================
// 收尾全幕概念片 — 取代原始錄影末段 OBS 介面 (source 2580..2636s, 56s)
//
// PART 6 收尾：講者切回 OBS 講話、沒有 demo 畫面 → 全幕 Editorial Doc 蓋。
// 跟 OpeningConcept 同 pattern、同 design tokens（米白紙質、招牌橘 kicker）。
// ============================================================

type Panel = {
  from: number;
  dur: number;
  kicker?: string;
  headline: string;
  sub?: string;
  items?: string[];
  caption?: string;
};

const PANELS: Panel[] = [
  {
    from: 0,
    dur: 18,
    kicker: "今天 4 種方式",
    headline: "把模糊變清楚的四條路",
    items: [
      "情境 1 — 分析問題找盲點：4 層追問",
      "情境 2 — A vs B 決策：反問 + 更新 + 逼明確",
      "情境 3 — 多角色腦力激盪：深挖挑戰者 + 扮演受眾",
      "進階技巧 — 讓 Claude 反問你：5 題訪問",
    ],
    caption: "每一種都不是貼一次 Prompt 就結束 — 繼續往下問、往下挖",
  },
  {
    from: 18,
    dur: 16,
    kicker: "想說清楚的一件事",
    headline: "Claude 的分析是參考，不是答案",
    sub: "他只知道你告訴他的東西 — 不知道你生活的全貌。最終判斷還是你自己的。",
  },
  {
    from: 34,
    dur: 22,
    kicker: "但他能幫你",
    headline: "把該問的問題、問清楚",
    items: [
      "把你沒想到的角度，想到",
      "把說不清楚的問題，說清楚",
      "做決定之前，把該問的都問清楚",
    ],
    caption: "課程資料在說明欄 — 所有 Prompt 與追問層次都可以直接複製",
  },
];

const PanelView: React.FC<{ p: Panel }> = ({ p }) => {
  const frame = useCurrentFrame();
  const total = Math.round(p.dur * FPS);
  const inEnd = 14;
  const outStart = total - 12;

  const op = Math.min(
    interpolate(frame, [0, inEnd], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    interpolate(frame, [outStart, total], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const ty = interpolate(frame, [0, inEnd], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const bodyOp = interpolate(frame, [8, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: op,
        justifyContent: "center",
        alignItems: "center",
        padding: "0 160px",
      }}
    >
      <div
        style={{
          maxWidth: 1500,
          transform: `translateY(${ty}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 30,
        }}
      >
        {p.kicker && (
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: SIZE.base,
              color: C.accent,
              letterSpacing: 6,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {p.kicker}
          </div>
        )}

        <div
          style={{
            fontFamily: FONT.serif,
            fontSize: SIZE.display,
            color: C.ink,
            fontWeight: 600,
            lineHeight: 1.18,
          }}
        >
          {p.headline}
        </div>

        <div style={{ width: 90, height: 3, background: C.accent }} />

        {p.sub && (
          <div
            style={{
              fontFamily: FONT.sans,
              fontSize: SIZE.lg,
              color: C.inkSoft,
              lineHeight: 1.6,
              maxWidth: 1150,
              opacity: bodyOp,
            }}
          >
            {p.sub}
          </div>
        )}

        {p.items && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              opacity: bodyOp,
            }}
          >
            {p.items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "baseline",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    fontSize: SIZE.base,
                    color: C.accent,
                    fontWeight: 700,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: SIZE.xl,
                    color: C.ink,
                    fontWeight: 500,
                  }}
                >
                  {it}
                </span>
              </div>
            ))}
          </div>
        )}

        {p.caption && (
          <div
            style={{
              fontFamily: FONT.sans,
              fontSize: SIZE.base,
              color: C.muted,
              opacity: bodyOp,
              maxWidth: 1100,
              lineHeight: 1.6,
            }}
          >
            {p.caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const ClosingConcept: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      {PANELS.map((p, i) => (
        <Sequence
          key={i}
          from={Math.round(p.from * FPS)}
          durationInFrames={Math.round(p.dur * FPS)}
          layout="none"
        >
          <PanelView p={p} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
