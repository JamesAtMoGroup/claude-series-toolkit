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
// 開場全幕概念片 — 取代原始錄影開頭的 Chrome+Google 首頁畫面 (source 0..150s)
// 學員視角：看到的是「Claude 實戰開場」的設計卡，不是 James 的空 Chrome 桌面。
// Premortem (鐵律 #24) 抓到：原 0~145s 講者還沒打開 Claude，畫面只有 Google 首頁。
// 5 張 Editorial Doc 全幕片，跟著講者旁白走；背景永遠米白紙質、克制動效。
// 150s 之後接回 OffthreadVideo（James 已打開 Claude，畫面開始有實際操作內容）。
// ============================================================

type Panel = {
  from: number; // segment-local 秒（= source 秒）
  dur: number;
  kicker?: string;
  headline: string;
  sub?: string;
  items?: string[];
  flow?: string[];
  caption?: string;
};

const PANELS: Panel[] = [
  // 0..27 — 開場標題（對齊 PART 1 「大家好，今天主題...用 Claude 規劃社群」）
  {
    from: 0,
    dur: 27,
    kicker: "開場",
    headline: "用 Claude 規劃整月社群行事曆",
    sub: "每天不再煩惱要發什麼 — 從定位到 A/B 測試，一次搞定",
  },
  // 27..60 — 社群為什麼重要
  {
    from: 27,
    dur: 33,
    kicker: "為什麼是社群",
    headline: "消費者透過貼文想像你的品牌",
    sub: "你發什麼樣的貼文，就決定他們追不追蹤、會不會買單",
  },
  // 60..95 — 今天的目標 + 8 步驟概覽
  {
    from: 60,
    dur: 35,
    kicker: "今天會做的",
    headline: "一次規劃整個月的貼文",
    flow: ["品牌定位", "內容支柱", "月度行事曆", "單篇文案", "多平台 × A/B"],
    caption: "8 個步驟產出可直接執行的行事曆表格",
  },
  // 95..118 — PART 2 入口問題
  {
    from: 95,
    dur: 23,
    kicker: "為什麼要提前規劃",
    headline: "「想到才發」會出兩個問題",
    sub: "斷更掉粉、隨機亂發無方向 — 都是因為沒提前規劃",
  },
  // 118..150 — 4 大好處
  {
    from: 118,
    dur: 32,
    kicker: "提前規劃 4 大好處",
    headline: "你會得到的四件事",
    items: [
      "避免靈感枯竭、發文斷更",
      "確保有策略、不是隨機亂發",
      "提前抓住節慶 / 活動最佳時機",
      "固定排互動貼文搜集回饋",
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
              alignItems: "flex-start",
              textAlign: "left",
              maxWidth: 1200,
            }}
          >
            {p.items.map((s, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 18,
                  fontFamily: FONT.sans,
                  fontSize: SIZE.lg,
                  color: C.ink,
                  lineHeight: 1.5,
                }}
              >
                <span
                  style={{
                    fontFamily: FONT.mono,
                    color: C.accent,
                    fontWeight: 700,
                    minWidth: 36,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{s}</span>
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
