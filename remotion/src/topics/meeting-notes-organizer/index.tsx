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
// Claude 實戰 — 用 Claude 整理會議紀錄
//
// Source: raw.mp4 已 splice 砍掉 8 個 >5s 沉默（節省 ~60s）
// 從原 852s → 793s spliced
//
// Output 時間軸：source 793s + 4 SceneTransition × 4s = 809s
//
// 4 transitions:
//   T0 = output 0..4s  (開場)
//   T1 = source 152s   (PART 3 進示範)
//   T2 = source 596s   (PART 5 微調)
//   T3 = source 719s   (PART 6 收尾)
// ============================================================

const SOURCE_DURATION_SEC = 793;
const TRANSITION_SEC = 4;
const T1_SEC = 152;
const T2_SEC = 597; // 596 卡在「對話就好」mid-sentence；推 1s 讓「說」講完 + 0.3s 自然停頓
const T3_SEC = 719;

export const TOTAL_FRAMES = (SOURCE_DURATION_SEC + 4 * TRANSITION_SEC) * FPS; // 24270

const shift = (sourceSec: number): number => {
  let s = sourceSec + TRANSITION_SEC; // T0 開場
  if (sourceSec >= T1_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T2_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T3_SEC) s += TRANSITION_SEC;
  return s;
};

const outFrame = (outputSec: number): number => Math.round(outputSec * FPS);

type AudioVariant = "denoise" | "raw";

export const MeetingNotesOrganizer: React.FC<{ audioVariant?: AudioVariant }> = ({
  audioVariant = "denoise",
}) => {
  const { width, height } = useVideoConfig();
  const speakerSrc =
    audioVariant === "raw"
      ? "meeting-notes-organizer/speaker-raw.wav"
      : "meeting-notes-organizer/speaker.wav";

  const segments = [
    { from: 0, to: T1_SEC },
    { from: T1_SEC, to: T2_SEC },
    { from: T2_SEC, to: T3_SEC },
    { from: T3_SEC, to: SOURCE_DURATION_SEC },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* ========== 4 media segments ========== */}
      {segments.map((seg, i) => {
        const outStart = shift(seg.from);
        const dur = seg.to - seg.from;
        return (
          <Sequence
            key={`seg-${i}`}
            from={outFrame(outStart)}
            durationInFrames={Math.round(dur * FPS)}
          >
            <OffthreadVideo
              src={staticFile("meeting-notes-organizer/raw.mp4")}
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

      {/* ========== 4 SceneTransitions ========== */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition
          label="Claude 實戰"
          title="用 Claude 整理會議紀錄"
          description="把亂糟糟的會議逐字稿，5 分鐘變成清楚的行動清單"
        />
      </Sequence>

      <Sequence
        from={outFrame(T1_SEC + TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 3"
          title="示範：看 Claude 整理會議"
          description="從一份很亂的逐字稿開始，看它怎麼變成結構清晰的會議紀錄"
        />
      </Sequence>

      <Sequence
        from={outFrame(T2_SEC + 2 * TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 5"
          title="示範：請 Claude 微調"
          description="覺得太長或想換語氣？直接跟 Claude 講，它會幫你改"
        />
      </Sequence>

      <Sequence
        from={outFrame(T3_SEC + 3 * TRANSITION_SEC)}
        durationInFrames={TRANSITION_SEC * FPS}
      >
        <SceneTransition
          label="PART 6"
          title="收尾 + 你的作業"
          description="今天三步驟回顧 + 找一份你的會議來練習看看"
        />
      </Sequence>

      {/* ========== BGM ========== */}
      <Audio
        src={staticFile("meeting-notes-organizer/bgm-looped.wav")}
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

      {/* ============== PART 1 ============== */}
      <TipCallout
        fromSec={shift(62)}
        toSec={shift(70)}
        icon="✓"
        text="5 分鐘就搞定"
      />

      {/* ============== PART 2 (78.5–152) ============== */}
      <SectionIntro
        fromSec={shift(78.5)}
        durationSec={3.5}
        label="PART 2"
        title="三步驟 + 名詞速查"
        description="今天會用到的工作流跟專有名詞"
      />
      <SlideOverlay
        fromSec={shift(83)}
        toSec={shift(96)}
        kind="list"
        title="今天三步驟"
        items={[
          "取得逐字稿",
          "貼給 Claude 加上 Prompt",
          "複製輸出後直接用",
        ]}
      />
      {/* TermCard 逐字稿 — 推遲到 SlideOverlay 退場之後（97），避開右側 panel 撞區 */}
      <TermCard
        fromSec={shift(97)}
        toSec={shift(119)}
        term="逐字稿"
        explain="把錄音或會議內容一字不漏轉成文字的稿子；通常很亂、有很多語助詞 — 但這很正常"
      />
      <TermCard
        fromSec={shift(120)}
        toSec={shift(134)}
        term="Context（上下文）"
        explain="Claude 在這次對話裡看到的所有內容；把逐字稿貼進去就會被當作參考資料"
      />
      <TermCard
        fromSec={shift(135)}
        toSec={shift(151)}
        term="Action Items"
        explain="開完會後每個人要做的具體任務；要有負責人和截止時間，不然開了等於沒開"
      />

      {/* ============== PART 3+4 (152–596) ============== */}
      <TipCallout
        fromSec={shift(216)}
        toSec={shift(226)}
        icon="✓"
        text="「亂」是正常的"
      />
      <SlideOverlay
        fromSec={shift(327)}
        toSec={shift(369)}
        kind="code"
        title="Prompt 模板"
        body={`請幫我整理成正式的會議紀錄：\n\n【會議基本資訊】\n- 日期、出席者、主持人\n\n【討論重點摘要】\n（不超過 3 句）\n\n【行動項目】\n表格：事項／負責人／截止\n\n【下次會議】`}
      />
      <SlideOverlay
        fromSec={shift(370)}
        toSec={shift(391)}
        kind="list"
        title="Prompt 4 個區塊"
        items={[
          "會議基本資訊",
          "討論重點摘要",
          "行動項目（表格）",
          "下次會議",
        ]}
      />
      <TipCallout
        fromSec={shift(395)}
        toSec={shift(406)}
        icon="⚠"
        text="行動項目要動詞開頭"
      />

      {/* ============== TipCallout 改格式 — 放 T2 前，配合講者「你其實不需要做重來，直接跟Claude說」(new 591-596.66) ============== */}
      <TipCallout
        fromSec={shift(590)}
        toSec={shift(596)}
        icon="✓"
        text="想改格式 → 直接跟 Claude 說"
      />

      {/* ============== PART 5 (597–719) — T2 已宣告 ============== */}

      {/* ============== PART 6 (719–793) ============== */}
      <SlideOverlay
        fromSec={shift(726)}
        toSec={shift(746)}
        kind="list"
        title="今天三步驟回顧"
        items={[
          "貼上逐字稿",
          "貼 Prompt 模板",
          "微調 → 複製輸出",
        ]}
      />
      <TipCallout
        fromSec={shift(771)}
        toSec={shift(783)}
        icon="✓"
        text="5 分鐘以內搞定"
      />
    </AbsoluteFill>
  );
};
