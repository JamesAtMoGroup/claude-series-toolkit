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
// 開場全幕概念片 — 取代原始錄影開頭的 OBS 介面 (source 0..163.4s)
// 7 張 Editorial Doc 全幕片，跟著講者旁白走。背景永遠米白紙質。
// 克制動效：內容 fade + 微 translateY；背景不切（= 自然 crossfade 感）。
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
    dur: 9.5,
    kicker: "開場",
    headline: "用 Claude 做你的專屬回信模板庫",
    sub: "把難回的信，變成可以重複套用的工具",
  },
  {
    from: 9.5,
    dur: 15.5,
    kicker: "痛點",
    headline: "職場的信，其實就那幾種",
    items: ["客戶催進度", "客戶要求降價", "客戶抱怨品質", "客戶臨時改需求"],
  },
  {
    from: 25,
    dur: 11,
    headline: "每一封，都要重想一次怎麼回",
    sub: "語氣要多強硬？要不要道歉？怎麼拒絕又不得罪人？",
  },
  {
    from: 36,
    dur: 19,
    kicker: "解法",
    headline: "其實，你只需要想一次",
    sub: "用 Claude 把這些情境整理成模板，存在對話裡——之後遇到類似的信，複製過來填空，30 秒完成回覆。",
  },
  {
    from: 55,
    dur: 33,
    kicker: "觀念",
    headline: "很多人是「每次都請 Claude 回信」",
    flow: ["收到信", "開 Claude", "解釋情況", "等它回", "確認語氣", "複製送出"],
    caption: "每一封，都要重跑一次這個流程",
  },
  {
    from: 88,
    dur: 44,
    kicker: "換個方法",
    headline: "先請 Claude「做模板」，不是回這封信",
    flow: ["收到信", "複製模板", "填空", "送出"],
    caption: "模板做好就存在對話裡，這個流程快十倍",
  },
  {
    from: 132,
    dur: 31.4,
    kicker: "核心",
    headline: "把 Claude 當成你的工具書",
    sub: "後半段完全不用再開 Claude——模板已經幫你把語氣和結構想好，你只需要填空。常用的東西都能這樣存起來，需要時回來複製。",
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
