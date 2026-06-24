# claude-series — Editorial Doc 設計系統

> Phase 4 Scene Dev Agent 寫 TSX MUST 依照這份。所有 token 從 `src/tokens.ts` 取，**禁 hardcode**。

---

## Canvas

```ts
W = 1920;      // 1080p native (源檔 1080p，不上採樣)
H = 1080;
FPS = 30;      // 60fps Studio 預覽會卡 — 永遠 30fps
```

---

## 色票（Editorial Doc）

```ts
paper:        "#F4EFE6"               // 米白底（卡背景）
paperSoft:    "rgba(244,239,230,0.92)" // 半透卡背景
ink:          "#1A1A1A"               // 深墨字
inkSoft:      "rgba(26,26,26,0.72)"   // 副字（避免大量裸用）
rule:         "rgba(26,26,26,0.12)"   // 細邊線
accent:       "#E85D2F"               // 招牌橘（重點）
forest:       "#2E5D4F"               // 第二重點（深森林綠）
warn:         "#C77700"               // 警示
muted:        "#8A8478"               // 次要
```

---

## 字體

```ts
serif: "Source Serif 4 / Noto Serif TC"   // 主標、章節標
sans:  "Inter / Noto Sans TC"             // 內文、解說
mono:  "JetBrains Mono"                   // 技術名詞、Prompt code、URL
```

```ts
SIZE = { xs: 18, sm: 22, base: 28, lg: 36, xl: 48, display: 72 }
// SIZE.xs (18) 僅給短英文標籤；中文字最低 sm (22)
```

---

## 7 種 Overlay 元件

| Component | 用途 | 位置 | 渲染? |
|-----------|------|------|------|
| `<SectionIntro>` | 段開頭小標卡 (3.5s) | 頂部 banner | ✅ |
| `<SceneTransition>` | **全幕 4 秒紙質卡**（T0 開場 + 3 重大切換） | 全幕 | ✅ |
| `<TermCard>` | 名詞解釋 (5-8s) | 右側 | ✅ |
| `<SlideOverlay>` | 條列項目 (8-12s, items 字面對齊講者) | 右側 | ✅ |
| `<TipCallout>` | 提示 / reassurance (4-6s) | 右上 pill | ✅ |
| `<LowerThird>` | 系列識別（若有 T0 開場可省） | 左下 | ⚠️ 通常不用 |
| `<Subtitles>` | VTT 字幕 | 底部 | ❌ **永不渲染**（James 後台另上） |

> **絕不出現的 overlay：** ChapterMark（持續性 corner badge）— 試做時加過，James 立刻說會擋畫面。

---

## SceneTransition 規則

- **時長**：4 秒
- **視覺**：純 paper #F4EFE6 全幕，serif 大標 + accent 橘小標 + 細邊線 + sans 描述
- **動效**：fade + 微 scale (1.02→1.0)，**禁** spring/blur
- **音軌**：講者音停（自動，因為被 Sequence segment 切開），BGM 持續（全域 Audio）
- **數量**：T0 開場永遠要 + 3 個重大認知切換點 = **共 4 個 / 集**
- **挑切點原則**：進新工具 / 新概念 / 從講概念進操作 Demo / 收尾

技術實作 — Freeze & Extend：講者音 + 影片切成 N+1 個 segment（`<Sequence startFrom/endAt>`），N 個 SceneTransition 卡在 segment 之間。整集總長 = source + N × 4s。所有疊層 fromSec 用 `shift()` 函數自動位移。

```tsx
// 範本：3 個切換點 (T1/T2/T3) + T0 開場
const T1_SOURCE = 184, T2_SOURCE = 1081, T3_SOURCE = 1456;
const TRANSITION = 4;
const shift = (sourceSec: number) => {
  let s = sourceSec + TRANSITION; // T0 開場推所有 +4
  if (sourceSec >= T1_SOURCE) s += TRANSITION;
  if (sourceSec >= T2_SOURCE) s += TRANSITION;
  if (sourceSec >= T3_SOURCE) s += TRANSITION;
  return s;
};
```

---

## 動效規則（克制）

- **入場**：`opacity 0→1 + translateY(8→0)` over 12 frames (200ms @ 30fps... 算 6 frames @ 30fps)
- **退場**：`opacity 1→0 + translateY(0→-4)` over 8 frames
- 一律 `interpolate` + `Easing.out(Easing.cubic)`
- **禁** spring 彈跳、scale 放大、blur — Editorial Doc 要克制
- **禁** Framer Motion（Remotion wall-clock 不相容）

---

## 文字底板鐵律

任何疊層上的文字都必須有不透明底板（`paperSoft` ≥0.92 alpha 或 `paper` 全不透）。**永遠不能依賴影片背景的對比** — 真人錄影背景變化大，沒底板的字一定有看不見的時候。

副文字也要在同一塊底板內，不能裸露。文字色用 `ink` 或 `paper`，**不要用 `inkSoft` 在裸文字上**（踩過：副標 inkSoft 被深背景吃掉）。

---

## 安全區（speaker 禁區）

```ts
SAFE = { top: 48, bottom: 48, left: 48, right: 48,
         speakerH: { from: 0.3, to: 0.7 },   // 中央 30~70% 不可放
         speakerV: { from: 0.2, to: 0.95 } } // 中央 20~95% 不可放
```

疊層**只能在邊邊**：上邊緣帶 / 左右邊欄 (≤480px) / 下三分之一。Scene Dev 寫完必 grep 確認。

---

## Audio Chain（鎖死，不可改）

### Speaker enhancement (ffmpeg) — 2026-06-05 對齊 vibe-coding-video broadcast 標準

```bash
ffmpeg -y -i public/$SLUG/raw.mp4 -vn \
  -af "loudnorm=I=-16:LRA=11:TP=-1.5" \
  -ar 48000 -ac 2 -c:a pcm_s16le \
  public/$SLUG/speaker.wav
```

**目標：** Integrated **-16 LUFS**（YouTube / podcast broadcast 標準，跟 vibe-coding-video 對齊）、True Peak **-1.5 dBTP**（safe headroom）。

**為什麼是 loudnorm only（演進史）：**
- 2026-05 早期：`loudnorm only I=-19` — 試錯「less is more」結論
- 2026-05 中：誤加 `acompressor + 低 shelf + loudnorm I=-25` — 看似品質提升但實際 **acompressor 把 peak 壓掉，loudnorm 沒空間拉**，整體響度反而掉到 -22 LUFS
- 2026-06-05 **拍板**：照搬 [[vibe-coding-video]] 的 `0_normalize_audio.sh`：純 loudnorm，**移除 compressor + EQ**，I=-16 LRA=11 TP=-1.5
- 觸發：pdf-summary-analysis preview James 反映「還是很小聲」，看 vibe-coding-video chain 才發現問題在 compressor

**未來不要再加 compressor / EQ / denoise / highpass / lowpass — ALL processing makes it worse**。詳細試錯：[[feedback-claude-series-audio]]

### 響度量測（Phase 5 QA 必跑）

```bash
ffmpeg -hide_banner -i public/$SLUG/speaker.wav -af "loudnorm=print_format=summary" -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
# Target: Integrated ≈ -16 LUFS (允許 ±1 LUFS), True Peak ≤ -1 dBTP
# 不在此範圍 → 重做 wav，不要靠 Remotion runtime gain 補

```bash
# 同時保留 speaker-raw.wav (零處理 backup, A/B 比對用)
ffmpeg -y -i public/$SLUG/raw.mp4 -vn -ar 48000 -ac 2 -c:a pcm_s16le \
  public/$SLUG/speaker-raw.wav
```

### BGM (預先 loop)

```bash
TOTAL_OUT_SEC=$((SOURCE_SEC + 16))  # +4 transitions × 4s
cp ~/Projects/article-video/public/audio/course_background_music.wav public/$SLUG/bgm.wav
ffmpeg -y -stream_loop -1 -i public/$SLUG/bgm.wav -t $TOTAL_OUT_SEC \
  -c:a pcm_s16le public/$SLUG/bgm-looped.wav
```

> **不靠 Remotion `<Audio loop>`** — Studio preview 不可靠。預先 loop 一個檔案 = 100% 穩定。

### Remotion 接法

```tsx
// OffthreadVideo 必須 muted
<OffthreadVideo src={staticFile(`${slug}/raw.mp4`)} muted />

// Speaker 軌 volume 1.0 — wav 本身已 -16 LUFS broadcast 標準，不靠 runtime gain
<Audio src={staticFile(`${slug}/speaker.wav`)} volume={1.0} />

// BGM 0.05 + fade in 45f + fade out 150f
<Audio
  src={staticFile(`${slug}/bgm-looped.wav`)}
  volume={(f) => {
    const v = 0.05;
    const fi = interpolate(f, [0, 45], [0, v], { extrapolateRight: "clamp" });
    const fo = interpolate(f, [TOTAL_FRAMES - 150, TOTAL_FRAMES], [v, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return Math.min(fi, fo);
  }}
/>
```

---

## Render Output

```bash
npm run build:{slug}
# → out/{slug}/Claude實戰-{title}-{date}.mp4 (1080p 30fps h264 + aac stereo)
```

僅 2 個交付物：mp4 + vtt（**不產 HTML、不產 thumbnail** — James 後台處理）

---

## 試錯歷史（為什麼是這些參數）

完整踩坑紀錄：`~/.claude/projects/-Users-jamesshih/memory/feedback_claude_series_*.md`

- `feedback_claude_series_audio.md` — Audio chain 試 6 種的過程
- `feedback_claude_series_30fps.md` — 60fps Studio 卡到沒辦法看
- `feedback_claude_series_scene_transition.md` — SceneTransition Freeze & Extend 設計
- `feedback_no_corner_badge.md` — ChapterMark 為什麼被砍
- `feedback_text_plate_mandatory.md` — 文字底板鐵律
- `feedback_overlay_must_match_speech.md` — 疊層內容對齊講者
