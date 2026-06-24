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
// 開場全幕概念片 — 取代原始錄影開頭 OBS 介面 (source 0..90s)
//
// 5 張 Editorial Doc 全幕片，跟著講者 VTT 旁白走。背景永遠米白紙質。
// 克制動效：內容 fade + 微 translateY；背景不切（= 自然 crossfade 感）。
//
// 2026-06-04 James 反饋：原本到 103s 把講者「打開網頁→輸入 claude」實際操作 demo 蓋掉
// → 縮短到 90s（OBS 結束秒）；移除 Panel 6「Demo」段；Panel 5 縮短到 65-90s
// → 90s 起切回真實錄影：Google 搜尋 claude → claude.ai 載入
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
  {
    from: 0,
    dur: 10,
    kicker: "開場",
    headline: "讓 AI 幫你讀懂任何 PDF",
    sub: "上傳就能摘要、找風險、追問細節",
  },
  {
    from: 10,
    dur: 23,
    kicker: "痛點",
    headline: "桌上的這三種文件，你是不是都不想讀？",
    items: [
      "密密麻麻的合約 — 不確定有沒有坑",
      "30 頁的提案書 — 明天就要做決定",
      "看不懂的財務報表 — 一堆數字",
    ],
  },
  {
    from: 33,
    dur: 19,
    kicker: "解法",
    headline: "用 Claude 幫你讀，5 分鐘搞定",
    flow: ["上傳 PDF", "整理重點", "找出風險", "繼續追問"],
    caption: "你只需要看精華，跟在意的部分",
  },
  {
    from: 52,
    dur: 13,
    kicker: "本集核心",
    headline: "一個 Prompt，套三種文件",
    sub: "今天會示範服務合約、品牌重塑提案書、年度財務報告——重點不是學三種做法",
  },
  {
    from: 65,
    dur: 25,
    kicker: "通用框架",
    headline: "換掉兩個關鍵字就能用",
    flow: ["文件類型", "你的角色"],
    caption: "其他都不用動 — 學會這個框架，任何文件都能套",
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
