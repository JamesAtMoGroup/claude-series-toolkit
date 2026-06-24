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
// 開場全幕概念片 — 取代原始錄影開頭 OBS 套娃介面 (source 0..100s)
//
// 5 張 Editorial Doc 全幕片，跟著講者 PART 1 旁白走。
// 切換點：raw t=100s 已切到 claude.ai 主頁，之後是真實 demo。
// ============================================================

type Panel = {
  from: number;
  dur: number;
  kicker?: string;
  headline: string;
  sub?: string;
  items?: string[];
  flow?: string[];
  caption?: string;
};

const PANELS: Panel[] = [
  {
    from: 0,
    dur: 12,
    kicker: "本集",
    headline: "讓 Claude 當你的思考夥伴",
    sub: "不只執行 — 跟你一起把問題想清楚",
  },
  {
    from: 12,
    dur: 24,
    kicker: "你有沒有遇過",
    headline: "想了很久，就是繞不出去",
    items: [
      "腦袋裡有問題，繞不出去",
      "面對選擇，說不清楚理由",
      "卡在同一個地方，跳不出去",
    ],
  },
  {
    from: 36,
    dur: 14,
    kicker: "你需要的不是",
    headline: "更多資訊",
    sub: "你需要的是一個能幫你整理思緒的對話對象",
  },
  {
    from: 50,
    dur: 18,
    kicker: "本集核心",
    headline: "第一次輸出只是起點",
    sub: "真正的價值，在繼續追問、繼續深挖、讓對話一層一層往下走",
  },
  {
    from: 68,
    dur: 32,
    kicker: "今天會走四種方式",
    headline: "把模糊問題、變成清楚答案",
    items: [
      "情境 1 — 分析問題找盲點",
      "情境 2 — A vs B 系統性決策",
      "情境 3 — 多角色腦力激盪",
      "進階技巧 — 讓 Claude 反問你",
    ],
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

        {p.flow && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 14,
              maxWidth: 1400,
              opacity: bodyOp,
            }}
          >
            {p.flow.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <span
                    style={{
                      fontFamily: FONT.sans,
                      fontSize: SIZE.lg,
                      color: C.muted,
                    }}
                  >
                    →
                  </span>
                )}
                <span
                  style={{
                    fontFamily: FONT.sans,
                    fontSize: SIZE.lg,
                    color: C.ink,
                    fontWeight: 500,
                    background: C.paperSoft,
                    border: `1px solid ${C.rule}`,
                    borderRadius: 8,
                    padding: "10px 20px",
                  }}
                >
                  {s}
                </span>
              </React.Fragment>
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
            }}
          >
            {p.caption}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

export const OpeningConcept: React.FC = () => {
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
