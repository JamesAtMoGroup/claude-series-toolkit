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

// ============================================================
// Claude 實戰 — 用 Claude Chat 做質感網頁，10 分鐘部署上線
//
// 時間軸架構：source 1513s + 4 個全幕 SceneTransition × 4s = 1529s output
//
// 4 個 transitions:
//   T0 = output 0..4s  (開場 — Claude 實戰 / 集標題)，全部 source 都 shift +4
//   T1 = source 184s   (進 PART 3 Demo)
//   T2 = source 1081s  (進 PART 5 GitHub Pages)
//   T3 = source 1456s  (進 PART 6 收尾)
//
// 講者音 + 影片切成 4 segments，transition 之間自動暫停
// 所有 overlay fromSec 用 shift() 自動加 +4 開場 + 後續 transition 累積
// ============================================================

const SOURCE_DURATION_SEC = 1513;
const TRANSITION_SEC = 4;
const T1_SEC = 184;
const T2_SEC = 1081;
const T3_SEC = 1456;

// Output 總長 = 源長 + 4 × 4s = 1529s
export const TOTAL_FRAMES = (SOURCE_DURATION_SEC + 4 * TRANSITION_SEC) * FPS; // 45870

// 把 source 秒數轉成 output 秒數
// 永遠先加 +4（開場 T0 把所有東西都往後推），再加 T1/T2/T3 經過的累積
const shift = (sourceSec: number): number => {
  let s = sourceSec + TRANSITION_SEC; // 開場 T0
  if (sourceSec >= T1_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T2_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T3_SEC) s += TRANSITION_SEC;
  return s;
};

// Output 秒數對應的 frame
const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const ClaudeChatWebsite: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "claude-chat-website/speaker-raw.wav"
      : "claude-chat-website/speaker.wav";

  // 4 個 source segment 的邊界（source seconds）
  const segments = [
    { from: 0, to: T1_SEC }, // 0..184
    { from: T1_SEC, to: T2_SEC }, // 184..1081
    { from: T2_SEC, to: T3_SEC }, // 1081..1456
    { from: T3_SEC, to: SOURCE_DURATION_SEC }, // 1456..1513
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* ========== 4 個 segment 的影片 + 講者音軌 ========== */}
      {segments.map((seg, i) => {
        const outStart = shift(seg.from); // segment 在 output 上的起點
        const dur = seg.to - seg.from; // segment 長度（source/output 一樣）
        return (
          <Sequence
            key={`seg-${i}`}
            from={outFrame(outStart)}
            durationInFrames={Math.round(dur * FPS)}
          >
            <OffthreadVideo
              src={staticFile("claude-chat-website/raw.mp4")}
              startFrom={Math.round(seg.from * FPS)}
              endAt={Math.round(seg.to * FPS)}
              style={{ width, height, objectFit: "cover" }}
              muted
            />
            <Audio
              src={staticFile(speakerSrc)}
              startFrom={Math.round(seg.from * FPS)}
              endAt={Math.round(seg.to * FPS)}
              volume={1.3}
            />
          </Sequence>
        );
      })}

      {/* ========== 4 個全幕 SceneTransition ========== */}
      {/* T0 — 開場 (output 0..4s) */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="用 Claude Chat 做質感網頁"
          description="10 分鐘 GitHub Pages 部署上線，不需要程式背景"
        />
      </Sequence>

      {/* T1 — 進 PART 3 Demo (output T1+4) */}
      <Sequence
        from={outFrame(T1_SEC + TRANSITION_SEC)} // 188s
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 3"
          title="Prompt 設計與打開 Claude"
          description="Prompt 是「填空」邏輯：固定規格 + 你的關鍵字"
        />
      </Sequence>

      {/* T2 — 進 PART 5 GitHub Pages (output T2 + 2*4) */}
      <Sequence
        from={outFrame(T2_SEC + 2 * TRANSITION_SEC)} // 1089s
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 5"
          title="部署到 GitHub Pages"
          description="建 Repository → 上傳 HTML → 開啟 Pages → 拿到網址"
        />
      </Sequence>

      {/* T3 — 進 PART 6 收尾 (output T3 + 3*4) */}
      <Sequence
        from={outFrame(T3_SEC + 3 * TRANSITION_SEC)} // 1468s
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 6"
          title="收尾 + 你的作業"
          description="三件事回顧 + 換成你的關鍵字做出你的版本"
        />
      </Sequence>

      {/* ========== BGM 全域 — 跨整個 output 不切 ========== */}
      <Audio
        src={staticFile("claude-chat-website/bgm-looped.wav")}
        volume={(f) => {
          const v = 0.05;
          const fi = interpolate(f, [0, 45], [0, v], { extrapolateRight: "clamp" });
          const fo = interpolate(
            f,
            [TOTAL_FRAMES - 150, TOTAL_FRAMES],
            [v, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          );
          return Math.min(fi, fo);
        }}
      />

      {/* ============== PART 1 開場 ============== */}
      {/* SectionIntro PART 1 + LowerThird 移除 — 開場 T0 已經宣告 */}
      <TermCard
        fromSec={shift(17)}
        toSec={shift(23)}
        term="Claude Chat"
        explain="Anthropic 推出的 AI 對話平台，可直接在瀏覽器使用"
      />
      <TipCallout
        fromSec={shift(28)}
        toSec={shift(33)}
        icon="✓"
        text="不需要程式背景"
      />

      {/* ============== PART 2 流程 + 名詞 (source 35–183) ============== */}
      <SectionIntro
        fromSec={shift(35)}
        durationSec={3.5}
        label="PART 2"
        title="今天的流程 + 名詞"
        description="三步驟概觀 + 解釋等等會用到的詞"
      />
      <SlideOverlay
        fromSec={shift(79)}
        toSec={shift(110)}
        kind="list"
        title="今天會做的三件事"
        items={[
          "Claude Chat 用 Prompt 產出 HTML 網頁",
          "存到電腦，用瀏覽器打開預覽",
          "GitHub Pages 免費部署上線",
        ]}
      />
      <TermCard
        fromSec={shift(117)}
        toSec={shift(142)}
        term="Prompt"
        explain="你輸入給 Claude 的指令；告訴它你要什麼，寫得越清楚產出越符合需求"
      />
      <TermCard
        fromSec={shift(146)}
        toSec={shift(162)}
        term="HTML"
        explain="網頁的原始檔案格式，副檔名 .html；瀏覽器看得懂並顯示成你看到的畫面"
      />
      <TermCard
        fromSec={shift(162)}
        toSec={shift(180)}
        term="Deploy／部署"
        explain="把電腦上做好的網頁放到網路上，讓任何人都可以看到"
      />

      {/* ============== PART 3 (source 184–1080) — SectionIntro 移除（升級成 SceneTransition T1） ============== */}
      <TermCard
        fromSec={shift(421)}
        toSec={shift(458)}
        term="RWD"
        explain="Responsive Web Design 響應式設計：網頁自動適應手機 / 平板 / 電腦不同螢幕"
      />
      <TermCard
        fromSec={shift(458)}
        toSec={shift(504)}
        term="CSS"
        explain="負責網頁外觀：HTML 決定有什麼，CSS 決定長什麼樣（顏色 / 字型 / 排版）"
      />
      <TermCard
        fromSec={shift(505)}
        toSec={shift(519)}
        term="Framework"
        explain="別人寫好的工具包；今天不用，保持單純從頭寫"
      />
      <TermCard
        fromSec={shift(519)}
        toSec={shift(533)}
        term="CTA"
        explain="Call To Action — 行動呼籲按鈕：「立即報名」「聯絡我」之類引導下一步的按鈕"
      />

      {/* ============== PART 4 (source 882–1080) ============== */}
      <SectionIntro
        fromSec={shift(882)}
        durationSec={3.5}
        label="PART 4"
        title="下載完成 + 修改示範"
        description="拿到 HTML 檔 → 瀏覽器打開 → 想改回 Claude 直接說"
      />

      {/* ============== PART 5 (source 1081–1455) — SectionIntro 移除（升級成 SceneTransition T2） ============== */}
      <TermCard
        fromSec={shift(1109)}
        toSec={shift(1135)}
        term="GitHub"
        explain="全球最大的程式碼儲存平台；很多工程師和設計師把專案放這裡，免費穩定"
      />
      <TermCard
        fromSec={shift(1201)}
        toSec={shift(1222)}
        term="Repository (Repo)"
        explain="GitHub 上的「專案資料夾」；你的網頁檔放這裡。每個網站獨立一個 repo"
      />
      <TipCallout
        fromSec={shift(1238)}
        toSec={shift(1248)}
        icon="⚠"
        text="Public 必選 — Private 無法用 Pages"
      />
      <TermCard
        fromSec={shift(1328)}
        toSec={shift(1350)}
        term="Commit"
        explain="確認儲存這次的變更；像按下存檔加上記錄。GitHub 會記住你做了什麼"
      />
      <TermCard
        fromSec={shift(1382)}
        toSec={shift(1403)}
        term="Branch"
        explain="檔案的「版本軌道」；預設只有一條叫 main，直接選它就好"
      />

      {/* ============== PART 6 (source 1456–1513) — SectionIntro 移除（升級成 SceneTransition T3） ============== */}
      <TipCallout
        fromSec={shift(1480)}
        toSec={shift(1490)}
        icon="✓"
        text="不需要付任何一毛錢"
      />

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
