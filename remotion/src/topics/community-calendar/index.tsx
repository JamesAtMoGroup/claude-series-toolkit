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
import { SceneTransition } from "../../overlays/SceneTransition";
import { SlideOverlay } from "../../overlays/SlideOverlay";
import { TermCard } from "../../overlays/TermCard";
import { TipCallout } from "../../overlays/TipCallout";
import { OpeningConcept } from "./OpeningConcept";

// premortem 抓到：原 0~150s 是 Chrome+Google 首頁 → 用 OpeningConcept 全幕概念片接住
const OPENING_CONCEPT_END_SEC = 150;

// ============================================================
// Claude 實戰 — 用 Claude 規劃整月社群行事曆
//
// Source 1386s (trim 後) + T0 開場卡 4s + T_end 結尾卡 4s = 1394s output = 41820 frames @ 30fps
//
// ⚠️ 鐵律（James 2026-05-27 明確化）：教學畫面任何時刻都不能被全幕卡片蓋住。
//    即使講者短暫沒說話，畫面 Claude 還在跑教學內容、或老師在打字 — 都算教學。
//    → T1/T2/T3 中段轉場卡片已全數移除，分段交給 22 個 overlay（右側 panel 不擋主畫面）。
//
// 只剩 2 個 SceneTransition：
//   T0    output 0..4s     開場 Claude 實戰 / 集標題 (source 之前，不蓋任何東西)
//   T_end output 1390..1394s 結尾「下次見」(source 之後，不蓋任何東西)
//
// OpeningConcept 0~150s 仍保留 — 原始 Chrome+Google 首頁沒教學畫面可蓋，
//   是「補上原本沒視覺的口白」，James 之前已認可。
//
// shift() 只 +4 (T0)；所有 overlay sourceSec 與 overlay-spec.json 對齊（原始 trim time）。
// O21（8 步驟回顧）對齊 1356 ＝ 講者實際說「我們建立了一套完整的社群內容」
// O22（後續每月…）對齊 1369 ＝ 講者實際說「只有每個月只要把活動告訴 Claude」
// ============================================================

const SOURCE_DURATION_SEC = 1386;
const TRANSITION_SEC = 4;

// Output 總長 = 源長 + 2 × 4s (T0 + T_end) = 1394s = 41820 frames @ 30fps
export const TOTAL_FRAMES = Math.round(
  (SOURCE_DURATION_SEC + 2 * TRANSITION_SEC) * FPS,
); // 41820

// source seconds → output seconds — 只 +4 (T0 開場卡)
const shift = (sourceSec: number): number => sourceSec + TRANSITION_SEC;

const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const CommunityCalendar: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "community-calendar/speaker-raw.wav"
      : "community-calendar/speaker.wav";

  // 兩段：1a OpeningConcept (0~150) + 1b 真實 Claude footage (150~1386)
  // 中段沒有任何 SceneTransition 切斷 — 教學畫面 1236s 一路播完
  const segments = [
    { from: 0, to: OPENING_CONCEPT_END_SEC, useConcept: true },        // 1a
    { from: OPENING_CONCEPT_END_SEC, to: SOURCE_DURATION_SEC, useConcept: false }, // 1b
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* ========== 2 個 segment 的影片 + 講者音軌 ========== */}
      {segments.map((seg, i) => {
        const outStart = shift(seg.from);
        const dur = seg.to - seg.from;
        return (
          <Sequence
            key={`seg-${i}`}
            from={outFrame(outStart)}
            durationInFrames={Math.round(dur * FPS)}
          >
            {seg.useConcept ? (
              <OpeningConcept />
            ) : (
              <OffthreadVideo
                src={staticFile("community-calendar/raw.mp4")}
                startFrom={Math.round(seg.from * FPS)}
                endAt={Math.round(seg.to * FPS)}
                style={{ width, height, objectFit: "cover" }}
                muted
              />
            )}
            <Audio
              src={staticFile(speakerSrc)}
              startFrom={Math.round(seg.from * FPS)}
              endAt={Math.round(seg.to * FPS)}
              volume={1.3}
            />
          </Sequence>
        );
      })}

      {/* ========== T0 開場 (output 0..4s) ========== */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="用 Claude 規劃社群行事曆"
          description="從定位到 A/B 測試，8 步驟產出整月可執行行事曆"
        />
      </Sequence>

      {/* ========== T_end 結尾 (output 1390..1394s) ========== */}
      <Sequence
        from={outFrame(SOURCE_DURATION_SEC + TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="下次見"
          title="把你的關鍵字換進這 8 步驟"
          description="從定位到 A/B 測試 — 動手做出你的第一份行事曆"
        />
      </Sequence>

      {/* ========== BGM 全域 ========== */}
      <Audio
        src={staticFile("community-calendar/bgm-looped.wav")}
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

      {/* ============== PART 1+2 (0~150s) 由 <OpeningConcept/> 全幕承載 ============== */}

      {/* ============== PART 3 Step 1 — 品牌顧問 ============== */}
      <SlideOverlay
        fromSec={shift(173)}
        toSec={shift(183)}
        kind="list"
        title="Step 1 Prompt 重點"
        items={[
          "扮演品牌顧問身分",
          "用 5 個問題訪問",
          "一次只問一題",
          "整理成品牌定位摘要",
        ]}
      />
      <TipCallout
        fromSec={shift(187)}
        toSec={shift(193)}
        icon="✓"
        text="一次只問一題，對話品質高很多"
      />

      {/* ============== PART 4 Step 2 — 內容支柱 ============== */}
      <TermCard
        fromSec={shift(343)}
        toSec={shift(351)}
        term="內容支柱"
        explain="品牌固定圍繞的 3-4 個主題；每篇貼文有所屬方向，不用每次從零想"
      />
      <SlideOverlay
        fromSec={shift(379)}
        toSec={shift(389)}
        kind="list"
        title="每個支柱要說明"
        items={[
          "1. 支柱名稱",
          "2. 為什麼對受眾重要",
          "3. 可發哪些貼文（≥3 例）",
        ]}
      />
      <TipCallout
        fromSec={shift(393)}
        toSec={shift(399)}
        icon="✓"
        text="貼入 Step 1 摘要 → Claude 給的不是通用答案"
      />

      {/* ============== PART 5 Step 3 — 月度行事曆 ============== */}
      <SlideOverlay
        fromSec={shift(487)}
        toSec={shift(498)}
        kind="list"
        title="行事曆 6 欄"
        items={[
          "週次",
          "星期",
          "內容支柱",
          "貼文主題",
          "貼文類型",
          "建議發文時段",
        ]}
      />
      <SlideOverlay
        fromSec={shift(503)}
        toSec={shift(512)}
        kind="list"
        title="貼文類型"
        items={["教學", "故事", "互動", "促銷"]}
      />
      <TipCallout
        fromSec={shift(575)}
        toSec={shift(581)}
        icon="✓"
        text="直接複製進 Notion / Google Sheets"
      />

      {/* ============== PART 6 Step 4-5 — 微調 + 展開 ============== */}
      <SlideOverlay
        fromSec={shift(638)}
        toSec={shift(650)}
        kind="list"
        title="Step 4 — 微調方向"
        items={[
          "加強節慶暖身",
          "加欄位（如 hashtag）",
          "加互動型貼文",
          "調整發文頻率",
        ]}
      />
      <SlideOverlay
        fromSec={shift(818)}
        toSec={shift(828)}
        kind="list"
        title="Step 5 — 展開貼文"
        items={[
          "促銷／教學／互動：給日期＋主題即可",
          "故事型：多給真實素材",
        ]}
      />
      <TermCard
        fromSec={shift(880)}
        toSec={shift(887)}
        term="CTA"
        explain="Call To Action — 引導粉絲行動的最後一句（留言／點連結／預訂）"
      />
      <TipCallout
        fromSec={shift(935)}
        toSec={shift(942)}
        icon="✓"
        text="故事型是個人品牌最有力 — 大品牌複製不了"
      />

      {/* ============== PART 7 Step 6 — 品牌語氣說明書 ============== */}
      <TermCard
        fromSec={shift(970)}
        toSec={shift(978)}
        term="品牌語氣說明書"
        explain="你寫作風格的文件，每次帶入讓 Claude 越來越像你寫"
      />
      <SlideOverlay
        fromSec={shift(1022)}
        toSec={shift(1033)}
        kind="list"
        title="說明書 4 項內容"
        items={[
          "常用句型 / 開頭方式",
          "語氣特色",
          "你習慣強調的事",
          "你避免的用詞 / 風格",
        ]}
      />
      <TipCallout
        fromSec={shift(1042)}
        toSec={shift(1048)}
        icon="✓"
        text="貼 3 篇你寫過的貼文 → Claude 反向分析"
      />

      {/* ============== PART 8 Step 7-8 — 多平台 + A/B ============== */}
      <SlideOverlay
        fromSec={shift(1145)}
        toSec={shift(1157)}
        kind="list"
        title="Step 7 — 各平台特色"
        items={[
          "IG：畫面感開頭 + 200 字內 + 3 hashtag",
          "Threads：50 字內 + 觀點 + 想轉發",
          "Facebook：300 字 + 親切 + 帶動留言",
        ]}
      />
      <TermCard
        fromSec={shift(1235)}
        toSec={shift(1243)}
        term="A/B 測試"
        explain="兩版開頭並行測試 → 看哪個互動高 → 下次同類用那個策略"
      />
      <SlideOverlay
        fromSec={shift(1255)}
        toSec={shift(1265)}
        kind="list"
        title="Step 8 — 兩版開頭模板"
        items={[
          "版本 A：提問式（讓讀者代入）",
          "版本 B：驚人數字 / 反常識（製造好奇）",
        ]}
      />

      {/* ============== PART 9 收尾 ==============
       * O21 對齊 1356 ＝ 講者實際說「我們建立了一套完整的社群內容」
       * O22 對齊 1369 ＝ 講者實際說「只有每個月只要把活動告訴 Claude」
       */}
      <SlideOverlay
        fromSec={shift(1356)}
        toSec={shift(1368)}
        kind="list"
        title="8 步驟回顧"
        items={[
          "1. 品牌顧問釐清定位",
          "2. 建立 4 個內容支柱",
          "3. 產出月度行事曆",
          "4. 微調",
          "5. 展開單篇文案",
          "6. 品牌語氣說明書",
          "7. 多平台改寫",
          "8. A/B 測試開頭",
        ]}
      />
      <TipCallout
        fromSec={shift(1369)}
        toSec={shift(1375)}
        icon="✓"
        text="後續每月告訴 Claude 新活動 → 自動排好"
      />

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
