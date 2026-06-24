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

// ============================================================
// Claude 實戰 — 用 Claude Chat 讀懂任何 PDF
//
// 鐵律 #6（2026-05-27 改）：只 T0+T_end 邊界卡，中段不放 SceneTransition
// 鐵律 #24 觸發：開頭 0–105s 原始錄影是 OBS 介面 / Google 搜尋過渡
//   → 用 OpeningConcept 全幕概念片頭蓋掉 source 0–103s（保留旁白）
//
// 時間軸：
//   output 0–4s     T0 SceneTransition (開場)
//   output 4–107s   OpeningConcept 蓋 source 0–103s (PART 1+2+3 前半)
//   output 107–942s 真實錄影 source 103–938s (PART 3 後半 + 4 + 5 + 6 + 7 + 8)
//   output 942–946s T_end SceneTransition (收尾)
//
// 所有 source 秒推 +4 (T0 開場) → shift(sourceSec) = sourceSec + 4
// ============================================================

const SOURCE_DURATION_SEC = 938; // raw.mp4 939s, 留 1s buffer
const TRANSITION_SEC = 4;
// 2026-06-04 James 反饋：原本 103s 把「打開網頁→搜尋 claude→點 claude.ai」實際 demo (source 90-105s) 蓋掉
// 改成 90s — OBS 在 source 90s 切到 Chrome，之後是真實操作畫面要露出來給觀眾跟著做
const OPENING_CONCEPT_END_SEC = 90;

// Output 總長 = T0 + source + T_end = 4 + 938 + 4 = 946s = 28380 frames
export const TOTAL_FRAMES = Math.round(
  (SOURCE_DURATION_SEC + 2 * TRANSITION_SEC) * FPS,
); // 28380

// shift: 所有 source 秒推 +4 (T0 開場)
const shift = (sourceSec: number): number => sourceSec + TRANSITION_SEC;

// Output 秒數對應的 frame
const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const PdfSummaryAnalysis: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "pdf-summary-analysis/speaker-raw.wav"
      : "pdf-summary-analysis/speaker.wav";

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* ============== OpeningConcept 蓋 source 0–103s（output 4–107s） ============== */}
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

      {/* ============== 真實錄影 source 103–938s（output 107–942s） ============== */}
      <Sequence
        from={outFrame(TRANSITION_SEC + OPENING_CONCEPT_END_SEC)}
        durationInFrames={Math.round(
          (SOURCE_DURATION_SEC - OPENING_CONCEPT_END_SEC) * FPS,
        )}
      >
        <OffthreadVideo
          src={staticFile("pdf-summary-analysis/raw.mp4")}
          startFrom={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
          endAt={Math.round(SOURCE_DURATION_SEC * FPS)}
          style={{ width, height, objectFit: "cover" }}
          muted
        />
        <Audio
          src={staticFile(speakerSrc)}
          startFrom={Math.round(OPENING_CONCEPT_END_SEC * FPS)}
          endAt={Math.round(SOURCE_DURATION_SEC * FPS)}
          volume={1.0}
        />
      </Sequence>

      {/* ============== T0 開場 SceneTransition (output 0–4s) ============== */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="用 Claude Chat 讀懂任何 PDF"
          description="合約、提案書、財報 — 一個通用 Prompt，換兩個關鍵字套任何文件"
        />
      </Sequence>

      {/* ============== T_end 收尾 SceneTransition (output 942–946s) ============== */}
      <Sequence
        from={outFrame(TRANSITION_SEC + SOURCE_DURATION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="帶回去用"
          title="一個 Prompt 套任何文件"
          description="租房合約、保險條款、廠商報價、工作說明書 — 框架完全一樣，換掉文件類型 ＋ 你的角色"
        />
      </Sequence>

      {/* ============== BGM 全域 — 跨整個 output 不切 ============== */}
      <Audio
        src={staticFile("pdf-summary-analysis/bgm-looped.wav")}
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

      {/* ============== Overlays (23) — 全部從 source 105s 起 ============== */}

      {/* PART 3 後半 — PDF 必須文字型 */}
      <TipCallout
        fromSec={shift(126)}
        toSec={shift(134)}
        icon="⚠️"
        text="PDF 必須文字型 — 掃描版要先 OCR"
      />

      {/* PART 4 — 通用 Prompt 結構 */}
      <SectionIntro
        fromSec={shift(144)}
        durationSec={3.5}
        label="PART 4"
        title="通用 Prompt 結構"
        description="三段結構 ＋ 換掉兩個關鍵字就能套任何文件"
      />
      <SlideOverlay
        fromSec={shift(152)}
        toSec={shift(168)}
        kind="list"
        title="Prompt 三段結構"
        items={[
          "5 點以內條列核心重點",
          "從你的角色找出需注意處",
          "標示模糊 / 有風險 / 需確認的內容",
        ]}
      />
      <TipCallout
        fromSec={shift(168)}
        toSec={shift(176)}
        icon="💡"
        text="結尾關鍵句：「請問我：你最想深入了解哪個部分？」"
      />
      <TermCard
        fromSec={shift(178)}
        toSec={shift(184)}
        term="兩個關鍵字"
        explain="文件類型（合約／提案書／財報）＋ 你的角色（甲方／決策者／管理者）— 其他都不用動"
      />

      {/* PART 5 — 情境 1 服務合約 */}
      <SectionIntro
        fromSec={shift(184)}
        durationSec={3.5}
        label="情境 1"
        title="服務合約"
        description="甲方視角 ＋ 追問不利條款 → 找出隱藏陷阱"
      />
      <SlideOverlay
        fromSec={shift(192)}
        toSec={shift(204)}
        kind="list"
        title="本案設定"
        items={["甲方：行銷公司（委託方）", "乙方：設計工作室", "月費 8 萬｜合約 1 年"]}
      />
      <TipCallout
        fromSec={shift(270)}
        toSec={shift(278)}
        icon="🔍"
        text="追問「有沒有對我不利的條款？」"
      />
      <SlideOverlay
        fromSec={shift(335)}
        toSec={shift(358)}
        kind="list"
        title="Claude 抓到的合約陷阱"
        items={[
          "違約金不對等：甲方終止付 30%，乙方終止僅補 1 月",
          "自動續約：期滿前 30 天未通知就再綁半年",
        ]}
      />
      <SlideOverlay
        fromSec={shift(376)}
        toSec={shift(396)}
        kind="list"
        title="排他條款的反向風險"
        items={[
          "競業認定由甲方書面通知為準",
          "乙方異議期間仍須暫緩接案",
          "偷接競業案 → 罰款三個月月費",
        ]}
      />
      <SlideOverlay
        fromSec={shift(418)}
        toSec={shift(432)}
        kind="list"
        title="修改次數的隱藏成本"
        items={[
          "每件設計案 2 次免費修改",
          "第 3 次起每次 +NT$ 2,000",
          "改很多次的客戶 → 費用疊加很快",
        ]}
      />
      <TipCallout
        fromSec={shift(442)}
        toSec={shift(452)}
        icon="⚖️"
        text="Claude 不是律師 — 帶具體問題去問律師更省時省錢"
      />

      {/* PART 6 — 情境 2 提案書 */}
      <SectionIntro
        fromSec={shift(453)}
        durationSec={3.5}
        label="情境 2"
        title="專案提案書"
        description="決策者視角 ＋ 追問「沒提到該問什麼」→ 找出盲點"
      />
      <SlideOverlay
        fromSec={shift(474)}
        toSec={shift(488)}
        kind="list"
        title="本案設定"
        items={[
          "品牌重塑提案書｜35 頁",
          "報價 NT$ 58 萬｜4 個月執行",
          "你的角色：決策者",
        ]}
      />
      <TipCallout
        fromSec={shift(543)}
        toSec={shift(558)}
        icon="💎"
        text="高價值追問：「幫我列出提案沒提到，但我該問對方的問題」"
      />
      <SlideOverlay
        fromSec={shift(580)}
        toSec={shift(620)}
        kind="list"
        title="提案沒寫但該問的盲點"
        items={[
          "修改次數沒說明：無限改？要加錢？",
          "智慧財產權歸屬沒提",
          "執行團隊組成與資歷未定",
        ]}
      />

      {/* PART 7 — 情境 3 財報 */}
      <SectionIntro
        fromSec={shift(637)}
        durationSec={3.5}
        label="情境 3"
        title="年度財務報告"
        description="管理者視角 ＋ 白話翻譯 ＋ 警示數字 → 4 個健康警訊"
      />
      <SlideOverlay
        fromSec={shift(652)}
        toSec={shift(666)}
        kind="list"
        title="本案財報內容"
        items={[
          "中小型食品公司年度財報",
          "損益表 ＋ 資產負債表",
          "現金流量表 ＋ 財務比率分析",
        ]}
      />
      <TipCallout
        fromSec={shift(728)}
        toSec={shift(740)}
        icon="🗣️"
        text="追問 1：「用白話解釋，假設我沒有財務背景」"
      />
      <TipCallout
        fromSec={shift(808)}
        toSec={shift(820)}
        icon="🚨"
        text="追問 2：「哪些數字需要特別注意？用一句話說明問題」"
      />
      <SlideOverlay
        fromSec={shift(876)}
        toSec={shift(902)}
        kind="list"
        title="Claude 抓到的財務警訊"
        items={[
          "負債比超標：每 100 元資產 60 元是借的",
          "利息費用 +133%：42 萬 → 98 萬",
          "獲利被借款成本吃掉一大塊",
        ]}
      />

      {/* PART 8 — 收尾 */}
      <SectionIntro
        fromSec={shift(904)}
        durationSec={3.5}
        label="收尾"
        title="一個 Prompt，三種文件"
        description="框架完全一樣，換的只有「文件類型 ＋ 你的角色」"
      />
      <SlideOverlay
        fromSec={shift(918)}
        toSec={shift(932)}
        kind="list"
        title="可延伸到任何文件"
        items={["租房合約", "保險條款", "工作說明書", "廠商報價單"]}
      />

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
