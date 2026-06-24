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
// Claude 實戰 — 用 Claude Chat 做回信模板庫
//
// 時間軸（已砍死時間）：source 819.9s + 4 個全幕 SceneTransition × 4s = 835.9s output
// （原始 896.5s，QA 砍掉 76.6s 中間死air 後 = 819.9s）
//
// 4 個 transitions（source 秒，砍後時間軸）:
//   T0 = output 0..4s   (開場 — Claude 實戰 / 集標題)，全部 source 都 shift +4
//   T1 = source 163.4s  (進 Demo：打開 Claude 產出模板庫)
//   T2 = source 495.5s  (實際操作：用模板回真實來信)
//   T3 = source 722.9s  (收尾：存起來當工具書)
//
// ⚠️ 切點放在 cut 接縫的「深靜音」上（量測 -82~-91dB），不可壓在講者起音：
//   T1 講者「好」起音 164.0s → 切在 163.4s（seam）讓整句留在卡片後
//   T3 講者「好」起音 723.5s → 切在 722.9s（seam）
// 講者音 + 影片切成 4 segments，transition 之間自動暫停
// 所有 overlay fromSec 用 shift() 自動加 +4 開場 + 後續 transition 累積
// ============================================================

const SOURCE_DURATION_SEC = 819.9;
const TRANSITION_SEC = 4;
const T1_SEC = 163.4;
const T2_SEC = 495.5;
const T3_SEC = 722.9;

// Output 總長 = 源長 + 4 × 4s = 835.9s = 25077 frames
export const TOTAL_FRAMES = Math.round(
  (SOURCE_DURATION_SEC + 4 * TRANSITION_SEC) * FPS,
); // 25077

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

export const ReplyTemplateLibrary: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "reply-template-library/speaker-raw.wav"
      : "reply-template-library/speaker.wav";

  // 4 個 source segment 的邊界（source seconds，砍後時間軸）
  const segments = [
    { from: 0, to: T1_SEC }, // 0..163.4
    { from: T1_SEC, to: T2_SEC }, // 163.4..495.5
    { from: T2_SEC, to: T3_SEC }, // 495.5..722.9
    { from: T3_SEC, to: SOURCE_DURATION_SEC }, // 722.9..819.9
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
            {i === 0 ? (
              // 開頭原始錄影是 OBS 介面 → 換成設計感全幕概念片（保留旁白）
              <OpeningConcept />
            ) : (
              <OffthreadVideo
                src={staticFile("reply-template-library/raw.mp4")}
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

      {/* ========== 4 個全幕 SceneTransition ========== */}
      {/* T0 — 開場 (output 0..4s) */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="用 Claude Chat 做回信模板庫"
          description="把難回的信整理成模板，下次複製填空 30 秒搞定"
        />
      </Sequence>

      {/* T1 — 進 Demo：產出模板庫 */}
      <Sequence
        from={outFrame(T1_SEC + TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="示範"
          title="打開 Claude，產出模板庫"
          description="貼上一段 Prompt，一次生出四種情境的回信模板"
        />
      </Sequence>

      {/* T2 — 實際操作：用模板回真實來信 */}
      <Sequence
        from={outFrame(T2_SEC + 2 * TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="實際操作"
          title="用模板回一封真實來信"
          description="貼上客戶來信 → 套用模板 → 填空 → 直接寄出"
        />
      </Sequence>

      {/* T3 — 收尾：存起來當工具書 */}
      <Sequence
        from={outFrame(T3_SEC + 3 * TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="收尾"
          title="存起來，當你的專屬工具書"
          description="把對話命名收藏，以後不必再開 Claude 也能快速回信"
        />
      </Sequence>

      {/* ========== BGM 全域 — 跨整個 output 不切 ========== */}
      <Audio
        src={staticFile("reply-template-library/bgm-looped.wav")}
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

      {/* ============== PART 1+2 開場/觀念 (source 0–163.4) ============== */}
      {/* 內容由 <OpeningConcept/> 全幕概念片承載；原本的小疊層 #1–7 已移除 */}

      {/* ============== PART 3 產出模板 — SceneTransition T1 ============== */}
      <SlideOverlay
        fromSec={shift(189.2)}
        toSec={shift(205.2)}
        kind="list"
        title="這段 Prompt 要交代"
        items={["你的身份／職位", "格式：填空處用【】標示", "四種常見情境"]}
      />
      <TermCard
        fromSec={shift(215.2)}
        toSec={shift(231.2)}
        term="【填空欄位】"
        explain="模板裡用【】標示的地方，每次使用換成具體內容，例如【專案名稱】、【具體日期】"
      />
      <TipCallout
        fromSec={shift(258.2)}
        toSec={shift(265.2)}
        icon="✓"
        text="第一行換成你的職位／產業"
      />
      <SlideOverlay
        fromSec={shift(288.2)}
        toSec={shift(308.2)}
        kind="list"
        title="Claude 產出的四種模板"
        items={[
          "情境一　客戶催進度（我方有延誤）",
          "情境二　客戶要求降價",
          "情境三　客戶抱怨交付品質",
          "情境四　客戶臨時改需求",
        ]}
      />
      <SlideOverlay
        fromSec={shift(416.2)}
        toSec={shift(434.2)}
        kind="list"
        title="套用時要填的欄位"
        items={["【專案名稱】", "【延誤原因】", "【具體日期】", "【交付項目】"]}
      />

      {/* ============== PART 4 實際操作 — SceneTransition T2 ============== */}
      <TipCallout
        fromSec={shift(583.3)}
        toSec={shift(589.6)}
        icon="✓"
        text="四種情境，一次全部搞定"
      />
      <SectionIntro
        fromSec={shift(655.0)}
        durationSec={3.5}
        label="調整"
        title="不滿意，直接叫它改"
        description="在同一個對話裡持續更新、持續擴充"
      />
      <SlideOverlay
        fromSec={shift(665.6)}
        toSec={shift(678.8)}
        kind="list"
        title="可以這樣調整模板"
        items={[
          "語氣改強硬、不要道歉",
          "新增情境：新客戶詢問合作",
          "全部壓到 100 字以內",
        ]}
      />

      {/* ============== PART 5 存工具書 + 收尾 — SceneTransition T3 ============== */}
      <SlideOverlay
        fromSec={shift(732.5)}
        toSec={shift(744.5)}
        kind="list"
        title="兩種保存方式"
        items={["留在 Claude 對話，直接回來用", "複製到文字檔自己存一份"]}
      />
      <TipCallout
        fromSec={shift(751.5)}
        toSec={shift(759.5)}
        icon="✓"
        text="把對話改名「📋 回信模板庫」"
      />
      <TipCallout
        fromSec={shift(791.5)}
        toSec={shift(799.5)}
        icon="✓"
        text="做的是工具，不是單次回信"
      />
      <SlideOverlay
        fromSec={shift(799.5)}
        toSec={shift(814.4)}
        kind="list"
        title="一樣的方法可以延伸到"
        items={["常用的 Prompt 模板", "常寫的報告格式", "常查的參考資訊"]}
      />

      {/* ⚠️ Subtitles 元件刻意不引用 — VTT 給 James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
