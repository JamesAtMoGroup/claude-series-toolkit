import React from "react";
import { Composition } from "remotion";
import { ClaudeChatWebsite } from "./topics/claude-chat-website";
import { ClaudeChatWebsiteSample } from "./topics/claude-chat-website/sample";
import { MeetingNotesOrganizer } from "./topics/meeting-notes-organizer";
import { ReplyTemplateLibrary } from "./topics/reply-template-library";
import { CommunityCalendar } from "./topics/community-calendar";
import { PdfSummaryAnalysis } from "./topics/pdf-summary-analysis";
import { ClaudeProjectsWorkspace } from "./topics/claude-projects-workspace";
import { ThinkClearlyPreview } from "./topics/think-clearly/preview";
import { ThinkClearly } from "./topics/think-clearly";
import { FPS, W, H } from "./tokens";

// Composition ID 用 topic slug — 永不出現 EP 序列號
// 因為 James 的課程不照順序製作
export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 30s 試做樣本 */}
      <Composition
        id="claude-chat-website-sample"
        component={ClaudeChatWebsiteSample}
        durationInFrames={30 * FPS}
        fps={FPS}
        width={W}
        height={H}
      />

      {/* 整集 — source 1513s + 4 × 4s SceneTransition (T0 開場 + T1/T2/T3) = 1529s = 45870 frames */}
      <Composition
        id="claude-chat-website"
        component={ClaudeChatWebsite}
        durationInFrames={45870}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />

      {/* 整集 — RAW 版（零處理，A/B 比對用） */}
      <Composition
        id="claude-chat-website-raw"
        component={ClaudeChatWebsite}
        durationInFrames={45870}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* meeting-notes-organizer — source 852s + 4×4s = 868s = 26040 frames @ 30fps */}
      <Composition
        id="meeting-notes-organizer"
        component={MeetingNotesOrganizer}
        durationInFrames={24270}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="meeting-notes-organizer-raw"
        component={MeetingNotesOrganizer}
        durationInFrames={24270}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* reply-template-library — 砍死時間後 source 819.9s + 4×4s SceneTransition = 835.9s = 25077 frames @ 30fps */}
      <Composition
        id="reply-template-library"
        component={ReplyTemplateLibrary}
        durationInFrames={25077}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="reply-template-library-raw"
        component={ReplyTemplateLibrary}
        durationInFrames={25077}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* community-calendar — source 1386s + 2×4s SceneTransition (T0+T_end) = 1394s = 41820 frames @ 30fps
       *  ⚠️ 中段無 transition — 教學畫面永不被卡片蓋住（James 2026-05-27 鐵律） */}
      <Composition
        id="community-calendar"
        component={CommunityCalendar}
        durationInFrames={41820}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="community-calendar-raw"
        component={CommunityCalendar}
        durationInFrames={41820}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* pdf-summary-analysis — source 938s + 2×4s SceneTransition (T0+T_end) = 946s = 28380 frames @ 30fps
       *  ⚠️ 鐵律 #6 中段無 transition；鐵律 #24 開頭 OBS 介面以 OpeningConcept 蓋掉 source 0–103s */}
      <Composition
        id="pdf-summary-analysis"
        component={PdfSummaryAnalysis}
        durationInFrames={28380}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="pdf-summary-analysis-raw"
        component={PdfSummaryAnalysis}
        durationInFrames={28380}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* claude-projects-workspace — source 856s + 2×4s = 864s = 25920 frames @ 30fps
       *  鐵律 #6 中段無 transition；鐵律 #24 OpeningConcept 蓋 source 0–115s */}
      <Composition
        id="claude-projects-workspace"
        component={ClaudeProjectsWorkspace}
        durationInFrames={25920}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="claude-projects-workspace-raw"
        component={ClaudeProjectsWorkspace}
        durationInFrames={25920}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />

      {/* think-clearly — 純預覽 raw.mp4（43:56 = 79080 frames @ 30fps）
       *  確認整支影片畫面內容後再決定視覺策略 */}
      <Composition
        id="think-clearly-preview"
        component={ThinkClearlyPreview}
        durationInFrames={79080}
        fps={FPS}
        width={W}
        height={H}
      />

      {/* think-clearly — source 2636s + 2×4s = 2644s = 79320 frames @ 30fps
       *  鐵律 #6 中段無 transition；鐵律 #24 OpeningConcept 蓋 source 0–100s */}
      <Composition
        id="think-clearly"
        component={ThinkClearly}
        durationInFrames={79320}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "denoise" as const }}
      />
      <Composition
        id="think-clearly-raw"
        component={ThinkClearly}
        durationInFrames={79320}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ audioVariant: "raw" as const }}
      />
    </>
  );
};
