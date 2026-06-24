import React from "react";
import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";

/**
 * think-clearly — 純預覽：直接播 raw.mp4（remux 自 raw.mkv）
 * 用途：給 James 在 Remotion Studio 滑時間軸確認整支影片畫面內容。
 */
export const ThinkClearlyPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo src={staticFile("think-clearly/raw.mp4")} />
    </AbsoluteFill>
  );
};
