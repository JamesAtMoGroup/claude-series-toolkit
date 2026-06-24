// 極簡 VTT parser — 只處理我們自己生成的格式
// 不處理 cue settings / styling / NOTE 之外的指令

export type Cue = {
  fromSec: number;
  toSec: number;
  text: string;
};

const tsToSec = (ts: string): number => {
  // 00:00:08.500
  const [hms, ms] = ts.trim().split(".");
  const [h, m, s] = hms.split(":").map(Number);
  return h * 3600 + m * 60 + s + (ms ? Number(ms) / 1000 : 0);
};

export const parseVtt = (vtt: string): Cue[] => {
  const blocks = vtt.split(/\r?\n\r?\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith("NOTE") && l !== "WEBVTT");
    if (lines.length < 2) continue;
    const timing = lines.find((l) => l.includes("-->"));
    if (!timing) continue;
    const [from, to] = timing.split("-->").map(tsToSec);
    const textIdx = lines.indexOf(timing);
    const text = lines.slice(textIdx + 1).join(" ").trim();
    if (text) cues.push({ fromSec: from, toSec: to, text });
  }
  return cues;
};
