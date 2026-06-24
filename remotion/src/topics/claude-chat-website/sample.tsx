import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile, useVideoConfig } from "remotion";
import { C } from "../../tokens";
import { SectionIntro } from "../../overlays/SectionIntro";
import { LowerThird } from "../../overlays/LowerThird";
import { TermCard } from "../../overlays/TermCard";
import { TipCallout } from "../../overlays/TipCallout";

// 30s 樣本 (源檔 11s-41s) — Claude Chat → 質感網頁
// 字幕由 James 後台另上傳，影片內**不**渲染 Subtitles
//
// Whisper-corrected timing (after trim):
//   0-4: greeting end
//   4-6: "Claude 實戰課程"
//   6-13: hook line "不會寫 code 也可以做出..."
//   13-16: pivot
//   16-18: "我們會使用 Claude Chat" (first mention)
//   18-21: "輸入一段 Prompt"
//   21-28: deploy 流程說明
//   28-30: "不需要任何的程式背景" reassurance
export const ClaudeChatWebsiteSample: React.FC = () => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: C.ink }}>
      {/* 底層：真人錄影（全幕） */}
      <OffthreadVideo
        src={staticFile("claude-chat-website/sample.mp4")}
        style={{ width, height, objectFit: "cover" }}
      />

      {/* 段開頭大標卡：0–3.5s 告訴觀眾接下來看什麼 */}
      {/* SectionIntro 一個就夠 — 不需要 corner badge 持續干擾畫面 */}
      <SectionIntro
        fromSec={0}
        durationSec={3.5}
        label="PART 1"
        title="開場"
        description="用 Claude Chat 做出質感網頁，10 分鐘 GitHub Pages 部署上線"
      />

      {/* 系列識別：左下，5–12s 配合 greeting 段落 */}
      <LowerThird
        fromSec={5}
        toSec={12}
        series="Claude 實戰"
        title="用 Claude Chat 做質感網頁"
        subtitle="10 分鐘部署上線"
      />

      {/* 名詞解釋卡：16–22s — James 在 16-18s 第一次說「Claude Chat」*/}
      <TermCard
        fromSec={16}
        toSec={22}
        term="Claude Chat"
        explain="Anthropic 推出的 AI 對話平台，可直接在瀏覽器使用，免下載"
      />

      {/* Reassurance pill：28–30s — James 28-30 講「那不需要任何的程式背景」字面對齊 */}
      <TipCallout
        fromSec={28}
        toSec={30}
        icon="✓"
        text="不需要程式背景"
      />

      {/* ⚠️ SlideOverlay 故意不放：這 30s James 沒有列舉「三件事」(他只是順著講部署流程)，
           硬塞 list 觀眾會困惑「這從哪冒出來？」。SlideOverlay 風格會在整集 PART 2 流程說明段測試
           — 那段 James 明確列舉。

           原則：疊層內容必須跟講者**當下**說的對得上，不可預告/不可總結未說出口的東西。 */}

      {/* ⚠️ Subtitles 元件刻意不引用 — James 後台另上字幕 */}
    </AbsoluteFill>
  );
};
