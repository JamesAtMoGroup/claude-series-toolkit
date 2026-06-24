import React from "react";
import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useVideoConfig,
} from "remotion";
import { C, FPS } from "../../tokens";
import { SectionIntro } from "../../overlays/SectionIntro";
import { SceneTransition } from "../../overlays/SceneTransition";
import { SlideOverlay } from "../../overlays/SlideOverlay";
import { TermCard } from "../../overlays/TermCard";
import { TipCallout } from "../../overlays/TipCallout";
import { OpeningConcept } from "./OpeningConcept";
import { ClosingConcept } from "./ClosingConcept";

// ============================================================
// Claude 實戰 — Claude 思考夥伴：分析、決策、突破盲點
//
// 鐵律 #6 (2026-05-27)：只 T0+T_end 邊界卡，中段不放 SceneTransition
// 鐵律 #24 觸發：開頭 0–100s 原始錄影是 OBS 套娃 → OpeningConcept 蓋
//                末段 2580–2636s 也是 OBS（PART 6 收尾）→ ClosingConcept 蓋
// 鐵律 #2 (2026-06-05)：audio chain 純 loudnorm I=-16，volume=1.0
//
// 時間軸：
//   output 0–4s        T0 SceneTransition
//   output 4–104s      OpeningConcept 蓋 source 0–100s (PART 1 開場)
//   output 104–2584s   真實錄影 source 100–2580s (PART 2–5 demo)
//   output 2584–2640s  ClosingConcept 蓋 source 2580–2636s (PART 6 收尾)
//   output 2640–2644s  T_end SceneTransition
//
// shift: 所有 source 秒推 +4 (T0 開場) → shift(sourceSec) = sourceSec + 4
// ============================================================

const SOURCE_DURATION_SEC = 2636;
const TRANSITION_SEC = 4;
const OPENING_CONCEPT_END_SEC = 100;
const CLOSING_CONCEPT_START_SEC = 2580;

// Output 總長 = 4 + 2636 + 4 = 2644s = 79320 frames @ 30fps
export const TOTAL_FRAMES = Math.round(
  (SOURCE_DURATION_SEC + 2 * TRANSITION_SEC) * FPS,
);

const shift = (sourceSec: number): number => sourceSec + TRANSITION_SEC;
const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const ThinkClearly: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "think-clearly/speaker-raw.wav"
      : "think-clearly/speaker.wav";

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* OpeningConcept 蓋 source 0–100s (output 4–104s) */}
      <Sequence
        from={outFrame(TRANSITION_SEC)}
        durationInFrames={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
      >
        <OpeningConcept />
        <Audio
          src={staticFile(speakerSrc)}
          startFrom={0}
          endAt={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
          volume={1.0}
        />
      </Sequence>

      {/* 真實錄影 source 100–2580s (output 104–2584s) — PART 2-5 demo */}
      <Sequence
        from={outFrame(TRANSITION_SEC + OPENING_CONCEPT_END_SEC)}
        durationInFrames={Math.round(
          (CLOSING_CONCEPT_START_SEC - OPENING_CONCEPT_END_SEC) * FPS,
        )}
      >
        <OffthreadVideo
          src={staticFile("think-clearly/raw.mp4")}
          startFrom={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
          endAt={Math.round(CLOSING_CONCEPT_START_SEC * FPS)}
          style={{ width, height, objectFit: "cover" }}
          muted
        />
        <Audio
          src={staticFile(speakerSrc)}
          startFrom={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
          endAt={Math.round(CLOSING_CONCEPT_START_SEC * FPS)}
          volume={1.0}
        />
      </Sequence>

      {/* ClosingConcept 蓋 source 2580–2636s (output 2584–2640s) — PART 6 收尾 */}
      <Sequence
        from={outFrame(TRANSITION_SEC + CLOSING_CONCEPT_START_SEC)}
        durationInFrames={Math.round(
          (SOURCE_DURATION_SEC - CLOSING_CONCEPT_START_SEC) * FPS,
        )}
      >
        <ClosingConcept />
        <Audio
          src={staticFile(speakerSrc)}
          startFrom={Math.round(CLOSING_CONCEPT_START_SEC * FPS)}
          endAt={Math.round(SOURCE_DURATION_SEC * FPS)}
          volume={1.0}
        />
      </Sequence>

      {/* T0 開場 (output 0–4s) */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="Claude 思考夥伴"
          description="用 Claude 把模糊問題想清楚 — 分析、決策、突破盲點"
        />
      </Sequence>

      {/* T_end 收尾 (output 2640–2644s) */}
      <Sequence
        from={outFrame(TRANSITION_SEC + SOURCE_DURATION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="帶回去做"
          title="四種情境，挑一個試試"
          description="不是貼一次 Prompt 就結束 — 繼續往下問、往下挖才是真的價值"
        />
      </Sequence>

      {/* BGM 全域 */}
      <Audio
        src={staticFile("think-clearly/bgm-looped.wav")}
        volume={(f) => {
          const v = 0.05;
          const fi = interpolate(f, [0, 45], [0, v], {
            extrapolateRight: "clamp",
          });
          const fo = interpolate(
            f,
            [TOTAL_FRAMES - 150, TOTAL_FRAMES],
            [v, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return Math.min(fi, fo);
        }}
      />

      {/* ============== ~28 Overlays — 對齊 VTT 講者時間軸 ============== */}

      {/* PART 2 情境 1｜分析問題找盲點 (source 100-911s) */}
      <SectionIntro
        fromSec={shift(108)}
        durationSec={3.5}
        label="情境 1"
        title="分析問題找盲點"
        description="範例：接不接低預算、但曝光度高的案子"
      />
      <TipCallout
        fromSec={shift(128)}
        toSec={shift(138)}
        icon="💡"
        text="Prompt 請 Claude 做 4 件事：好處 / 風險 / 你忽略的角度 / 關鍵變數"
      />
      <SlideOverlay
        fromSec={shift(161)}
        toSec={shift(178)}
        kind="list"
        title="第一層 Prompt 框架"
        items={[
          "列出潛在好處（不只最明顯的）",
          "列出潛在風險（不只最明顯的）",
          "指出我可能忽略、但應考慮的角度",
          "關鍵變數是什麼？",
        ]}
      />
      <TipCallout
        fromSec={shift(196)}
        toSec={shift(206)}
        icon="⚡"
        text="第 3、4 點才是關鍵 — 你早就想過的利弊，不是價值所在"
      />
      <TermCard
        fromSec={shift(244)}
        toSec={shift(254)}
        term="主導權"
        explain="低價接案有時不只交換金錢，還會讓修改次數、設計方向、交件時間的主導權跟著下降"
      />
      <TermCard
        fromSec={shift(431)}
        toSec={shift(441)}
        term="價格錨點"
        explain="這次折扣不只是「一次性」— 會變成未來談價格時對方心裡的參考基準"
      />
      <SlideOverlay
        fromSec={shift(553)}
        toSec={shift(573)}
        kind="list"
        title="Claude 把複雜問題濃縮成兩個變數"
        items={[
          "① 能不能拿到作品展示權",
          "② 你現在到底忙不忙",
        ]}
      />
      <SectionIntro
        fromSec={shift(636)}
        durationSec={3.5}
        label="第二層追問"
        title="針對關鍵變數深挖"
        description="拿到關鍵變數後，問 Claude：我應該問自己哪些問題來判斷？"
      />
      <TipCallout
        fromSec={shift(862)}
        toSec={shift(872)}
        icon="🎯"
        text="Claude 很少直接給答案 — 他把模糊概念一層層拆，讓你看見真正要回答的問題"
      />

      {/* PART 3 情境 2｜A vs B 系統性決策 (source 911-1379s) */}
      <SectionIntro
        fromSec={shift(916)}
        durationSec={3.5}
        label="情境 2"
        title="A vs B 系統性決策"
        description="範例：換不換工作 — 現職穩定 vs 新創高薪但才兩年"
      />
      <SlideOverlay
        fromSec={shift(960)}
        toSec={shift(982)}
        kind="list"
        title="第一層 Prompt 框架（兩個選項）"
        items={[
          "從我最在意的維度比較兩個選項",
          "指出各自最大的風險",
          "如果你是我，你會怎麼想？",
          "你有什麼問題想問我？(關鍵 — 讓 Claude 反問)",
        ]}
      />
      <TipCallout
        fromSec={shift(1077)}
        toSec={shift(1087)}
        icon="🔍"
        text="Claude 把問題拆三維度：職涯發展、財務穩定性、工作生活平衡"
      />
      <TipCallout
        fromSec={shift(1145)}
        toSec={shift(1158)}
        icon="✨"
        text="Claude 重新定義：問題不是「要不要換」，是「我有沒有掌握足夠資訊」"
      />
      <TipCallout
        fromSec={shift(1278)}
        toSec={shift(1290)}
        icon="⚡"
        text="加「不要說取決於你的價值觀」逼 Claude 給出有立場的明確建議"
      />
      <TermCard
        fromSec={shift(1407)}
        toSec={shift(1417)}
        term="收斂"
        explain="把一個模糊的大問題慢慢收斂成一個具體的小問題、最後再做決定"
      />

      {/* PART 4 情境 3｜多角色腦力激盪 (source 1379-2189s) */}
      <SectionIntro
        fromSec={shift(1429)}
        durationSec={3.5}
        label="情境 3"
        title="多角色腦力激盪"
        description="範例：社群帳號流量卡關 — 樂觀者 / 悲觀者 / 挑戰者"
      />
      <SlideOverlay
        fromSec={shift(1500)}
        toSec={shift(1525)}
        kind="list"
        title="第一層 Prompt — 三種角色"
        items={[
          "樂觀者：看到機會與可能性",
          "悲觀者：找出風險與警示",
          "挑戰者：質疑你的前提假設 ← 最有價值",
        ]}
      />
      <TipCallout
        fromSec={shift(1604)}
        toSec={shift(1616)}
        icon="🎯"
        text="挑戰者：你的問題不是內容不好，是定位本身模糊"
      />
      <TipCallout
        fromSec={shift(1756)}
        toSec={shift(1769)}
        icon="💡"
        text="主題 ≠ 定位：主題說「你做什麼」、定位說「為什麼別人選你而非別人」"
      />
      <SectionIntro
        fromSec={shift(1847)}
        durationSec={3.5}
        label="第三層追問"
        title="讓 Claude 扮演你的目標受眾"
        description="從受眾視角看你的帳號 — 他為什麼可能不買單？"
      />
      <TipCallout
        fromSec={shift(1910)}
        toSec={shift(1922)}
        icon="⚡"
        text="按讚 ≠ 追蹤：按讚是喜歡這篇，追蹤是相信你未來會持續產出"
      />
      <TipCallout
        fromSec={shift(2057)}
        toSec={shift(2069)}
        icon="📊"
        text="30 天實驗 — 不看追蹤數，看儲存率／分享率／陌生人觸及"
      />

      {/* PART 5 進階技巧｜讓 Claude 反問你 (source 2189-2581s) */}
      <SectionIntro
        fromSec={shift(2166)}
        durationSec={3.5}
        label="進階技巧"
        title="讓 Claude 反問你"
        description="當你連問題在哪都說不清楚 — 反過來讓 Claude 用 5 題訪問你"
      />
      <SlideOverlay
        fromSec={shift(2198)}
        toSec={shift(2225)}
        kind="list"
        title="反問 Prompt 三件事"
        items={[
          "請先不要給我建議或分析",
          "用 5 個問題訪問我（每次只問一個）",
          "最後幫我整理出問題的核心",
        ]}
      />
      <TipCallout
        fromSec={shift(2278)}
        toSec={shift(2290)}
        icon="✨"
        text="這個技巧的力量：在回答的過程中，你可能就已經想通了"
      />
      <TipCallout
        fromSec={shift(2432)}
        toSec={shift(2444)}
        icon="🎯"
        text="不是倦怠，是成長停滯 — 兩個差很多，後續選擇完全不同"
      />
      <TermCard
        fromSec={shift(2458)}
        toSec={shift(2468)}
        term="準確命名問題"
        explain="當一個人能準確描述自己的問題時 — 其實答案往往已經浮現了"
      />

      {/* PART 6 收尾｜source 2580-2636s 由 ClosingConcept 全幕蓋（上面 Sequence） */}

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
