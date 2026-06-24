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
// Claude 實戰 — Claude Projects 個人記憶空間
//
// 鐵律 #6 (2026-05-27)：只 T0+T_end 邊界卡，中段不放 SceneTransition
// 鐵律 #24 觸發：開頭 0–115s 原始錄影是 OBS 介面 → OpeningConcept 蓋
// 鐵律 #2 (2026-06-05)：audio chain 純 loudnorm I=-16，volume=1.0
//
// 時間軸：
//   output 0–4s     T0 SceneTransition
//   output 4–119s   OpeningConcept 蓋 source 0–115s (PART 1+2+PART 3 開頭)
//   output 119–860s 真實錄影 source 115–856s
//   output 860–864s T_end SceneTransition
//
// shift: 所有 source 秒推 +4 (T0 開場) → shift(sourceSec) = sourceSec + 4
// ============================================================

const SOURCE_DURATION_SEC = 856;
const TRANSITION_SEC = 4;
const OPENING_CONCEPT_END_SEC = 115;

// Output 總長 = 4 + 856 + 4 = 864s = 25920 frames
export const TOTAL_FRAMES = Math.round(
  (SOURCE_DURATION_SEC + 2 * TRANSITION_SEC) * FPS,
);

const shift = (sourceSec: number): number => sourceSec + TRANSITION_SEC;
const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const ClaudeProjectsWorkspace: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "claude-projects-workspace/speaker-raw.wav"
      : "claude-projects-workspace/speaker.wav";

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* OpeningConcept 蓋 source 0–115s (output 4–119s) */}
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

      {/* 真實錄影 source 115–856s (output 119–860s) */}
      <Sequence
        from={outFrame(TRANSITION_SEC + OPENING_CONCEPT_END_SEC)}
        durationInFrames={Math.round(
          (SOURCE_DURATION_SEC - OPENING_CONCEPT_END_SEC) * FPS,
        )}
      >
        <OffthreadVideo
          src={staticFile("claude-projects-workspace/raw.mp4")}
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

      {/* T0 開場 (output 0–4s) */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="Claude Projects 個人記憶空間"
          description="打造一個認識你的 AI 工作空間 — Instructions ＋ Files ＋ 對話記憶"
        />
      </Sequence>

      {/* T_end 收尾 (output 860–864s) */}
      <Sequence
        from={outFrame(TRANSITION_SEC + SOURCE_DURATION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="帶回去用"
          title="三件事帶回去做"
          description="建一個 Project → 寫 Instructions → 上傳常用文件 — 從此 Claude 認識你"
        />
      </Sequence>

      {/* BGM 全域 */}
      <Audio
        src={staticFile("claude-projects-workspace/bgm-looped.wav")}
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

      {/* ============== 27 Overlays — 全部 src 115s+ ============== */}

      {/* PART 3 建立 Project */}
      <SectionIntro
        fromSec={shift(130)}
        durationSec={3.5}
        label="PART 3"
        title="建立第一個 Project"
        description="左側欄 → New Project → 用工作情境命名"
      />
      <TipCallout
        fromSec={shift(142)}
        toSec={shift(152)}
        icon="💡"
        text="命名訣竅：用「工作情境」（例：禾日甜點工作區）"
      />
      <SlideOverlay
        fromSec={shift(156)}
        toSec={shift(170)}
        kind="list"
        title="本集示範的兩種情境"
        items={["個人品牌 / 小型創業：禾日甜點工作區", "職場工作者：客戶溝通助手"]}
      />

      {/* PART 4 Instructions */}
      <SectionIntro
        fromSec={shift(175)}
        durationSec={3.5}
        label="PART 4"
        title="設定 Instructions（最重要）"
        description="Project 的「背景說明」— 每次對話自動帶入"
      />
      <TermCard
        fromSec={shift(178)}
        toSec={shift(188)}
        term="Instructions"
        explain="Project 的「背景說明」— 每次對話開始自動告訴 Claude 你是誰、要什麼風格"
      />
      <SlideOverlay
        fromSec={shift(196)}
        toSec={shift(218)}
        kind="list"
        title="Instructions 基本結構"
        items={[
          "① 我是誰（身份）",
          "② 我做什麼（工作）",
          "③ 這個 Project 用來做什麼",
          "④ 不想要 Claude 做的事",
        ]}
      />
      <TipCallout
        fromSec={shift(220)}
        toSec={shift(232)}
        icon="⚡"
        text="最容易被忽略：把「不想要什麼」寫進去（emoji 太多 / 回覆太長）"
      />
      <TipCallout
        fromSec={shift(270)}
        toSec={shift(278)}
        icon="✨"
        text="你看 — 我什麼都沒說，Claude 就知道我是禾日甜點的創辦人"
      />

      {/* PART 5 Files */}
      <SectionIntro
        fromSec={shift(281)}
        durationSec={3.5}
        label="PART 5"
        title="上傳 Files 文件"
        description="永久參考文件庫 — 對話裡會一直重複貼的東西就放進來"
      />
      <TermCard
        fromSec={shift(285)}
        toSec={shift(295)}
        term="Files"
        explain="Project 內的「文件庫」— Claude 在這個 Project 的任何對話都能直接取用"
      />
      <TipCallout
        fromSec={shift(296)}
        toSec={shift(308)}
        icon="🔍"
        text="判斷標準：對話裡會一直重複貼的東西 → 放 Files"
      />
      <SlideOverlay
        fromSec={shift(308)}
        toSec={shift(322)}
        kind="list"
        title="適合放 Files 的文件"
        items={["品牌語氣說明書", "回信模板庫", "產品說明", "常見 QA"]}
      />

      {/* PART 6 職場版 */}
      <SectionIntro
        fromSec={shift(400)}
        durationSec={3.5}
        label="PART 6"
        title="職場版：按情境分多個 Project"
        description="不同類型工作 → 不同 Project，各有自己的 Instructions ＋ Files"
      />
      <SlideOverlay
        fromSec={shift(408)}
        toSec={shift(425)}
        kind="list"
        title="職場版的 Project 設計"
        items={[
          "客戶溝通 → 一個 Project",
          "會議整理 → 另一個 Project",
          "文件分析 → 又一個 Project",
          "各有自己的 Instructions ＋ Files",
        ]}
      />
      <TipCallout
        fromSec={shift(491)}
        toSec={shift(502)}
        icon="✨"
        text="完全沒解釋背景 → Claude 直接用正確格式回信"
      />

      {/* PART 7 Instructions 進階 3 件事 */}
      <SectionIntro
        fromSec={shift(527)}
        durationSec={3.5}
        label="PART 7"
        title="Instructions 進階 3 件事"
        description="不想要什麼 ＋ 給角色 ＋ 固定輸出格式"
      />
      <TipCallout
        fromSec={shift(555)}
        toSec={shift(565)}
        icon="1️⃣"
        text="第一件事：告訴 Claude「你不想要什麼」"
      />
      <SlideOverlay
        fromSec={shift(568)}
        toSec={shift(588)}
        kind="list"
        title="把這些寫進「請不要」"
        items={["回覆太長或有過多開場白", "通用模板感的建議", "使用過多 emoji"]}
      />
      <TipCallout
        fromSec={shift(615)}
        toSec={shift(626)}
        icon="2️⃣"
        text="第二件事：給 Claude 一個「角色」"
      />
      <SlideOverlay
        fromSec={shift(630)}
        toSec={shift(655)}
        kind="list"
        title="角色設定示範"
        items={[
          "「你是我的資深客服顧問」",
          "「熟悉我們的服務內容」",
          "「回得既專業又有溫度」",
        ]}
      />
      <TipCallout
        fromSec={shift(658)}
        toSec={shift(668)}
        icon="💎"
        text="角色設定 = 讓 Claude 從那個位置思考，不只是填格子"
      />
      <TipCallout
        fromSec={shift(690)}
        toSec={shift(700)}
        icon="3️⃣"
        text="第三件事：固定輸出格式（主旨／內容／備註）"
      />

      {/* PART 8 Files 整理 */}
      <SectionIntro
        fromSec={shift(731)}
        durationSec={3.5}
        label="PART 8"
        title="定期整理檔案庫"
        description="Files 不是放著就好 — 三個維護習慣"
      />
      <SlideOverlay
        fromSec={shift(747)}
        toSec={shift(776)}
        kind="list"
        title="Files 維護 3 個習慣"
        items={[
          "① 文件更新 → 換掉舊版（Claude 會讀舊的）",
          "② 不再用的 → 清掉（容量有限）",
          "③ 命名寫清楚內容（不要 final / final2 / 新版）",
        ]}
      />
      <TipCallout
        fromSec={shift(790)}
        toSec={shift(804)}
        icon="📝"
        text="命名範例：❌ final.txt → ✅ 品牌語氣說明書 2025"
      />

      {/* PART 9 收尾 */}
      <SectionIntro
        fromSec={shift(810)}
        durationSec={3.5}
        label="PART 9"
        title="收尾 — 三件事帶回去做"
        description="建一個 Project ＋ 寫 Instructions ＋ 上傳常用文件"
      />
      <SlideOverlay
        fromSec={shift(836)}
        toSec={shift(854)}
        kind="list"
        title="前幾集內容 × Projects"
        items={[
          "EP03 回信模板 → 放進 Files",
          "EP04 社群內容規劃 → 放進 Files",
          "EP05 文件分析 → 放進 Files",
          "效率再往上一層 — 你不用每次從零開始",
        ]}
      />

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
