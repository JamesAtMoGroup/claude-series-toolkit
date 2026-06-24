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
// 開場全幕概念片 — 取代 source 0..115s OBS 介面
//
// 5 張 Editorial Doc 全幕片，跟著 VTT 旁白走。米白紙質背景。
// 鐵律 #24 救援：OBS 介面延伸到 ~115s 才切到 Claude.ai
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
    dur: 10,
    kicker: "開場",
    headline: "Claude Projects 個人記憶空間",
    sub: "打造一個認識你的 AI 工作空間",
  },
  {
    from: 10,
    dur: 32,
    kicker: "痛點",
    headline: "每次開新對話，Claude 都不認識你",
    items: [
      "重新說你是誰",
      "重新解釋你的工作",
      "重新貼 Prompt 模板",
      "重新說要什麼格式",
    ],
    caption: "做個一兩次沒什麼，但每天用就很重複",
  },
  {
    from: 42,
    dur: 30,
    kicker: "解法",
    headline: "Projects ＝ 你專屬的工作空間",
    flow: ["背景資訊", "Prompt 模板", "參考文件", "對話記憶"],
    caption: "全部存在 Project 裡，下次對話直接帶入",
  },
  {
    from: 72,
    dur: 26,
    kicker: "本集核心",
    headline: "從「每次都是陌生人」變成「認識你的工作夥伴」",
    sub: "你不用每次重新介紹自己 — Claude 直接進入狀況",
  },
  {
    from: 98,
    dur: 17,
    kicker: "Demo",
    headline: "好，那就打開 Claude 開始建立吧",
    sub: "進到 claude.ai，左側欄找到 Projects",
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
                    ＋
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
