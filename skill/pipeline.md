# claude-series — Pipeline 詳細步驟

> Director 從 Phase 1 開始，phase 之間不打斷 James — 唯一檢查點是 Phase 5 QA pass 後的 iMessage。

---

## Phase 1｜Director 決策（人工，~3 min token）

### 1.1 命名 + 建資料夾

```bash
SLUG=...        # kebab-case，例：claude-chat-website / mcp-config-basics
TITLE=...       # 中文集標題，例：用Claude做質感網頁
DATE=$(date +%F)

mkdir -p ~/Projects/claude-series/{inbox,processed,public,out}/$SLUG
```

### 1.2 Trim 範圍（trim.json）

**目視 raw.mkv 前 30s + 後 30s**，決定剪掉的死時間：

```bash
# 開頭：通常 5-15s greeting/設定
ffprobe -v quiet -ss 0 -t 30 inbox/$SLUG/raw.mkv

# 結尾：「下部影片見囉」後通常還有 3-10s 沉默
TOTAL=$(ffprobe -v quiet -print_format json -show_format inbox/$SLUG/raw.mkv | jq -r '.format.duration | tonumber | floor')
ffprobe -v quiet -ss $((TOTAL - 30)) inbox/$SLUG/raw.mkv
```

寫進 `processed/$SLUG/trim.json`：
```json
{
  "trimStartSec": 11,
  "startReason": "前 11s greeting 沉默",
  "trimEndSec": 1524,
  "endReason": "末尾「下部影片見囉」後 3s 空白；剪到剩 1s 自然尾"
}
```

### 1.3 SceneTransition 切點（transitions.json）

**3-4 個重大認知切換點**（不是每 PART 都加）。挑：
- ✅ 進新工具（如進 GitHub Pages）
- ✅ 從講概念進操作 Demo
- ✅ 收尾段
- ❌ 同類段落內的小切換（用 SectionIntro 小卡）

寫進 `processed/$SLUG/transitions.json`：
```json
[
  { "id": "T0", "outputSec": 0, "label": "Claude 實戰", "title": "用 Claude Chat 做質感網頁", "description": "10 分鐘部署上線" },
  { "id": "T1", "sourceSec": 184, "label": "PART 3", "title": "Prompt 設計與打開 Claude", "description": "Prompt 是「填空」邏輯：固定規格 + 你的關鍵字" },
  { "id": "T2", "sourceSec": 1081, "label": "PART 5", "title": "部署到 GitHub Pages", "description": "建 Repository → 上傳 HTML → 開啟 Pages → 拿到網址" },
  { "id": "T3", "sourceSec": 1456, "label": "PART 6", "title": "收尾 + 你的作業", "description": "三件事回顧 + 換成你的關鍵字做出你的版本" }
]
```

> **T0 開場永遠要**。

---

## Phase 2｜4 個 sub-agent 平行 (~5-10 min)

### 2.1 🎞️ Footage Ingest Agent

```bash
SLUG=...
TRIM_START=$(jq .trimStartSec processed/$SLUG/trim.json)
TRIM_END=$(jq .trimEndSec processed/$SLUG/trim.json)
DURATION=$((TRIM_END - TRIM_START))

# mkv → mp4 + trim 頭尾
ffmpeg -y -ss $TRIM_START -t $DURATION -i inbox/$SLUG/raw.mkv \
  -c:v libx264 -preset medium -crf 18 \
  -c:a aac -b:a 192k -movflags +faststart \
  public/$SLUG/raw.mp4

# metadata
ffprobe -v quiet -print_format json -show_format public/$SLUG/raw.mp4 \
  > processed/$SLUG/duration.json

echo "[x] mp4 轉檔" > processed/$SLUG/checklist-footage.md
```

### 2.2 🎙️ Audio Enhancement Agent

```bash
SLUG=...
SOURCE_SEC=$(ffprobe -v quiet -print_format json -show_format public/$SLUG/raw.mp4 | jq -r '.format.duration | tonumber | floor')

# A. Speaker enhanced (2026-06-05 對齊 vibe-coding-video — 純 loudnorm broadcast 標準)
ffmpeg -y -i public/$SLUG/raw.mp4 -vn \
  -af "loudnorm=I=-16:LRA=11:TP=-1.5" \
  -ar 48000 -ac 2 -c:a pcm_s16le \
  public/$SLUG/speaker.wav

# 量測確認（必跑，Target: Integrated ≈ -16 LUFS, True Peak ≤ -1 dBTP）
ffmpeg -hide_banner -i public/$SLUG/speaker.wav -af "loudnorm=print_format=summary" -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"

# B. Speaker raw (零處理 backup)
ffmpeg -y -i public/$SLUG/raw.mp4 -vn -ar 48000 -ac 2 -c:a pcm_s16le \
  public/$SLUG/speaker-raw.wav

# C. BGM copy + 預先 loop
TOTAL_OUT_SEC=$((SOURCE_SEC + 16))
cp ~/Projects/article-video/public/audio/course_background_music.wav public/$SLUG/bgm.wav
ffmpeg -y -stream_loop -1 -i public/$SLUG/bgm.wav -t $TOTAL_OUT_SEC \
  -c:a pcm_s16le public/$SLUG/bgm-looped.wav

echo "[x] speaker enhanced + BGM looped" > processed/$SLUG/checklist-audio.md
```

> **不要再加 compressor / EQ / denoise**。所有 processing 都讓音色變差且壓掉 peak 害 loudnorm 拉不動。純 loudnorm 是唯一正解（跟 [[vibe-coding-video]] 的 `0_normalize_audio.sh` 對齊）。詳細試錯：[[feedback-claude-series-audio]]

### 2.3 🗣️ Transcript Align Agent — **2 步驟必跑**

#### Step 1: sed 機械替換 (1 秒)

```bash
SLUG=...

# 抽 16kHz mono 給 Whisper
ffmpeg -y -i public/$SLUG/raw.mp4 -vn -ac 1 -ar 16000 \
  processed/$SLUG/audio.wav

# Whisper base (medium 在 Mac CPU 太慢)
/Users/jamesshih/Library/Python/3.9/bin/whisper processed/$SLUG/audio.wav \
  --model base --language zh \
  --output_format vtt \
  --output_dir processed/$SLUG/whisper-out/

# sed 校正 (200+ 條規則涵蓋 Claude/Claude Chat/HTML/Prompt/GitHub Pages 等)
~/.claude/scripts/vtt-correct.sh \
  processed/$SLUG/whisper-out/audio.vtt \
  processed/$SLUG/$SLUG.vtt
```

#### Step 2: Claude 通讀 contextual 校對 (~5 min token，**必跑**)

完整讀 VTT，比對 `inbox/$SLUG/transcript.md`，找出：

1. **Whisper hallucination** — 整段聽錯（中瓜號 / 成績馬出生 / 程式碼賺血）
2. **同音異字** — 國語近音錯字（紙色→紫色 / 板面→版面 / 預言→語言）
3. **不合理的詞** — 一看就奇怪的組合（多小頁面 / 訂家 / 報名業）
4. **拼湊不全的英文** — YoureSide / Tammy的確診 之類胡謅

抓到的新 pattern 加進 `vtt-correct.sh` → re-run。

詳細詞表：見 `vtt-corrections.md`

```bash
echo "[x] sed + Claude 通讀完成 + grep 殘留 = 0" > processed/$SLUG/checklist-transcript.md
```

> ⚠️ **少一步就不算完成。** Phase 2 鎖死**三步驟**：sed → Claude 通讀 → cross-ref inbox 全部來源檔（鐵律 #22）。詳細 rationale：`memory/feedback_vtt_cross_ref_inbox.md` + `memory/feedback_vtt_must_correct.md`

### 2.4 📑 Slide Mapping Agent

讀 `inbox/{slug}/slides.md` + `transcript.md` → 輸出 `processed/{slug}/slide-mapping.json`：每個 PART 的 concept candidates（term / list / tip / code）。

```json
{
  "parts": [
    {
      "id": "PART_2",
      "title": "今天的流程 + 名詞速查",
      "concepts": [
        { "kind": "list", "title": "今天會做的三件事", "items": ["Claude Chat 用 Prompt 產出 HTML", "存檔，瀏覽器預覽", "GitHub Pages 部署上線"] },
        { "kind": "term", "term": "Prompt", "explain": "你輸入給 Claude 的指令" },
        { "kind": "term", "term": "HTML", "explain": "網頁的原始檔案格式..." }
      ]
    }
  ]
}
```

---

## Phase 3｜🎨 Overlay Spec Agent (~10 min token)

讀 `{slug}.vtt` + `slide-mapping.json` + `transitions.json` → 設計 `overlay-spec.json`（~20-30 個疊層）

**疊層類型 + 用途：**

| Type | 用途 | 觸發點 |
|------|------|--------|
| `SectionIntro` | sub-section 小卡 (3.5s) | PART 邊界**但不在 SceneTransition 名單**裡的 |
| `TermCard` | 名詞解釋 (5-8s) | 講者**第一次說**該名詞 |
| `SlideOverlay` | 條列項目 (8-12s) | 講者**明確列舉**時，items 字面對齊 |
| `TipCallout` | 提示 / reassurance (4-6s) | ⚠️ 警告 或 ✓ 強化 |
| `LowerThird` | 系列識別（**有 T0 可省**）| 開場 5-12s |

**鐵律：疊層內容必須跟講者當下說的話對齊**

| ❌ 違反 | ✅ 對 |
|---------|------|
| 預告未來內容 | 同步講者當下 |
| 總結已講過的 | 在他正在說那句的時刻出現 |
| 改寫意思（"不會寫 code 也行" vs 講者說的「不需要程式背景」）| 字面對齊 |

**密度規則：** 任一秒最多 2 個 active overlay；同類型 ≥40 秒間隔；25min → 20-30 個

---

## Phase 4｜🛠 Scene Dev Agent (~15 min token)

讀 `overlay-spec.json` + `transitions.json` → 寫 `src/topics/{slug}/index.tsx`

**結構模板**（複製 claude-chat-website 改）：

```tsx
import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useVideoConfig } from "remotion";
import { C, FPS } from "../../tokens";
import { SectionIntro } from "../../overlays/SectionIntro";
import { SceneTransition } from "../../overlays/SceneTransition";
import { TermCard } from "../../overlays/TermCard";
// ...

const SOURCE_DURATION_SEC = 1513;
const TRANSITION_SEC = 4;
const T1_SOURCE_SEC = 184;
const T2_SOURCE_SEC = 1081;
const T3_SOURCE_SEC = 1456;

export const TOTAL_FRAMES = (SOURCE_DURATION_SEC + 4 * TRANSITION_SEC) * FPS;

const shift = (sourceSec: number): number => {
  let s = sourceSec + TRANSITION_SEC; // T0 開場
  if (sourceSec >= T1_SOURCE_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T2_SOURCE_SEC) s += TRANSITION_SEC;
  if (sourceSec >= T3_SOURCE_SEC) s += TRANSITION_SEC;
  return s;
};

export const Topic{Slug}: React.FC = () => {
  // 4 個 media segment
  const segments = [
    { from: 0, to: T1_SOURCE_SEC },
    { from: T1_SOURCE_SEC, to: T2_SOURCE_SEC },
    { from: T2_SOURCE_SEC, to: T3_SOURCE_SEC },
    { from: T3_SOURCE_SEC, to: SOURCE_DURATION_SEC },
  ];
  return (
    <AbsoluteFill>
      {segments.map((seg, i) => (
        <Sequence from={shift(seg.from) * FPS} durationInFrames={(seg.to - seg.from) * FPS}>
          <OffthreadVideo src={...} startFrom={seg.from * FPS} endAt={seg.to * FPS} muted />
          <Audio src=speaker.wav startFrom={seg.from * FPS} endAt={seg.to * FPS} volume={1.3} />
        </Sequence>
      ))}

      {/* 4 個 SceneTransition 卡在 segment 之間 */}
      <Sequence from={0} durationInFrames={TRANSITION_SEC * FPS}>
        <SceneTransition label="Claude 實戰" title={...} />
      </Sequence>
      {/* T1, T2, T3... */}

      {/* BGM 全域 */}
      <Audio src=bgm-looped.wav volume={(f) => fade-in 45f / 0.05 / fade-out 150f} />

      {/* 所有 overlay 用 fromSec={shift(sourceSec)} */}
      <TermCard fromSec={shift(17)} toSec={shift(23)} term="Claude Chat" ... />
    </AbsoluteFill>
  );
};
```

**Grep 自檢：**
```bash
SLUG=...
# hardcode 色
grep -nE '#[0-9a-fA-F]{6}' src/topics/$SLUG/*.tsx
# 字級
grep -nE 'fontSize:\s*[0-9]+' src/topics/$SLUG/*.tsx
# Framer Motion
grep -rn "framer-motion" src/
# 文字 wrapper 必有 background
grep -nE 'fontFamily:.*FONT' src/overlays/*.tsx
```

**tsc：** `npx tsc --noEmit` 必 0 errors

更新 `src/Root.tsx` 註冊新 composition：
```tsx
<Composition id="{slug}" component={Topic{Slug}} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
```

更新 `package.json` build script：
```json
"build:{slug}": "remotion render {slug} out/{slug}/Claude實戰-{title}-$(date +%F).mp4 --codec h264"
```

---

## Phase 5｜✅ QA Agent + iMessage Gate

> **鐵律 #24 — Premortem 必跑**：給 James 預覽前，Director 必須先「預演會出什麼錯」並自己抓出來，而不是讓 James 抓。靜態檢查（tsc/grep）+ 音訊檢查看不到「某一幀的畫面」。**必跑 Layer 0 視覺 premortem**：render 每個 transition 卡 + 每個 overlay 的 settled 幀，**實際 Read 每張 PNG 用眼睛看**。reply-template-library 試做時 premortem 抓到「開頭 2.5 分鐘背景是 OBS Studio 介面」——靜態檢查完全看不到。

### Layer 0: 視覺 premortem（frame-sampling，必跑）

```bash
# 1. 算取樣幀（output frame）：每個 transition 卡 mid（card_start+60f）+ 每個 overlay shift(from)*FPS+30f settle
# 2. bundle 一次 render 全部（省時）— 腳本須從專案目錄跑（ESM 要 resolve 專案 node_modules）
cp ~/.claude/scripts/claude-series-qa-stills.mjs scripts/qa-stills.mjs
node scripts/qa-stills.mjs "$(pwd)" {slug} /tmp/qa-{slug} /tmp/qa-frames.tsv
# 3. ⚠️ 逐張 Read PNG 用眼睛看，逐項檢查：
#    - 底下真人/螢幕錄影背景對不對（是不是 OBS 介面 / 黑屏 / 切錯畫面）← premortem 主要價值
#    - 疊層重疊 / 超出安全區 / 文字底板夠不夠 / 文字有沒有被背景吃掉
#    - 字卡有無真人名字、EP 序號
#    - overlay 內容對不對齊講者當下 / 有沒有錯字
#    - transition 卡文字置中、無孤字換行
# 全綠才往下做三層 + 開 Studio。詳見 memory/feedback_claude_series_premortem.md
```

QA **強制三層檢查**（任一層 fail = QA 不算過）：

### Layer 1: Code audits (grep + tsc)

1. Grep audits（hardcode / 字級 / Framer / 文字底板）
2. `tsc --noEmit` 0 errors
3. ffprobe public/{slug}/raw.mp4 + speaker.wav + bgm-looped.wav 都存在

### Layer 2: silencedetect — 找空白並砍

```bash
ffmpeg -hide_banner -i public/$SLUG/speaker.wav \
  -af "silencedetect=noise=-40dB:duration=2" \
  -f null - 2>&1 | grep "silence_duration"
```

- 開頭/結尾沉默 → 調 trim.json
- 中間 >5s 沉默 → splice 砍掉（ffmpeg filter_complex trim+concat）。**砍法**：cut region 兩側各留 1s pad；VTT/overlay/transition 全部數學 remap（不用重跑 Whisper，寫 remap 函數平移時間戳即可，見 reply-template-library/build_cut_plan.py 範本）
- ⚠️ **SceneTransition 切點（T_SEC）必須落在 cut 接縫的「深靜音」上（≤ −60dB），不可壓在講者下一句起音**。Whisper 時間戳常比實際起音晚 0.3~0.5s，照 VTT 時間戳切會切到「好…」半個字（reply-template-library 試做被 James 抓包）。設完用 `ffmpeg -ss X -t 0.3 -i speaker.wav -af volumedetect` 量 segment 結尾確認 ≤ −60dB。詳見 `memory/feedback_claude_series_cut_on_silence.md`

### Layer 3: Overlay collision check (Python)

```python
panels = {"TermCard": "right", "SlideOverlay": "right",
          "TipCallout": "topright", "SectionIntro": "topcenter"}
# 任兩 overlay 同 panel 且時間重疊 → ⚠️ COLLISION
```

### Layer 4: 講者響度量測（2026-06-05 新增，必跑）

```bash
ffmpeg -hide_banner -i public/$SLUG/speaker.wav -af "loudnorm=print_format=summary" -f null - 2>&1 \
  | grep -E "Input Integrated|Input True Peak"
```

**Target（必須在範圍內，否則重做 wav）：**
- Integrated Loudness: **-16 ±1 LUFS**（broadcast 標準）
- True Peak: **≤ -1 dBTP**（safe headroom）

❌ 不在 target 範圍 → **重做 ffmpeg loudnorm**，**不靠 Remotion runtime gain** 補救（pdf-summary-analysis 試過 volume=2.0/3.0 都不能根治）。

**完整 SOP：** `~/.claude/projects/-Users-jamesshih/memory/feedback_claude_series_real_qa.md`

QA pass：
- 開 Studio preview `http://localhost:3300/{slug}`
- iMessage 發給 James：

```bash
~/.claude/scripts/imessage_send.sh "🎬 Claude實戰｜$TITLE

✅ QA passed
  • $OVERLAY_COUNT overlays
  • 4 個 SceneTransition (T0 + T1/T2/T3)
  • 總長 $TOTAL_TIME

🔍 建議檢查點: 0:00 / $T1 / $T2 / $T3
http://localhost:3300/$SLUG

請回覆「通過」開始 render"

~/.claude/scripts/imessage_wait_approval.sh 3600
```

QA fail → Fix Agent 自動修常見錯誤 → 重 QA。修不了才 escalate iMessage。

---

## Phase 6｜🎬 Render Agent (~30-60 min CPU)

通過後自動跑：

```bash
SLUG=...
TITLE=...
DATE=$(date +%F)
DRIVE_FOLDER_ID="1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p"

# 1. Render mp4
npm run build:$SLUG

# 2. VTT shift — source time → mp4 time（鐵律 #23，**絕對不可漏**）
# processed/$SLUG/$SLUG.vtt 是 Whisper 從 speaker.wav 跑出來的 source time，
# 但 mp4 多了 N 個 SceneTransition × TRANSITION_SEC 秒（典型 4×4=16s）
# vtt-shift.py 自動讀 index.tsx 的 TRANSITION_SEC + T1_SEC/T2_SEC/... 套 shift()
~/.claude/scripts/vtt-shift.py \
  processed/$SLUG/$SLUG.vtt \
  out/$SLUG/Claude實戰-$TITLE-$DATE.vtt \
  --from-tsx src/topics/$SLUG/index.tsx

# 驗證：VTT 最後一個 cue 結束時間應 ≈ mp4 長度 (±1s)
MP4_DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 \
          out/$SLUG/Claude實戰-$TITLE-$DATE.mp4)
VTT_LAST=$(tail -20 out/$SLUG/Claude實戰-$TITLE-$DATE.vtt | grep -oE '[0-9]+:[0-9]+\.[0-9]+ --> [0-9]+:[0-9]+\.[0-9]+' | tail -1)
echo "[shift QA] mp4=$MP4_DUR  VTT last cue=$VTT_LAST"

# 3. Drive 上傳 (自動化必跑) — 命名鐵律：「Claude Chat - {中文標題}」前綴一致 ⚠️
rclone copy out/$SLUG/ "gdrive:Claude Chat - $TITLE/" \
  --drive-root-folder-id $DRIVE_FOLDER_ID \
  --progress

# 4. 同步 knowledge 給 claude-line-bot — POST endpoint（取代舊 cp + git push 鏈）
#    2026-06-24 改：用 admin/knowledge endpoint → bot DB upsert idempotent
#    多機並行安全；同事的 Mac 也能跑（不需 GitHub push 權 / 不需 git clone bot repo）
#    舊「cp 進 ~/claude-line-bot-v2/knowledge/... + sync-bot.sh」已退役
~/.claude/scripts/claude-series-bot-upload.sh \
  "$SLUG" \
  "out/$SLUG/Claude實戰-$TITLE-$DATE.vtt" \
  "inbox/$SLUG/transcript.md" \
  "inbox/$SLUG/slides.md" \
  "$TITLE"
# 需要在 ~/.claude/secrets/claude-series.env 設 BOT_UPLOAD_URL + BOT_UPLOAD_TOKEN
# 一台機器一把 machine_token，admin mint：POST /admin/machine-tokens {"label":"<machine>"}

# 5. iMessage 通知含 Drive + bot 連結
~/.claude/scripts/imessage_send.sh "✅ Render done: $TITLE
  out/$SLUG/Claude實戰-$TITLE-$DATE.mp4
  out/$SLUG/Claude實戰-$TITLE-$DATE.vtt
☁️ Drive: https://drive.google.com/drive/folders/$DRIVE_FOLDER_ID
🤖 Bot knowledge synced (3 檔: vtt + transcript + slides)"
```

**最終交付物（2 個檔案 + 3 個 bot knowledge 檔）：**
- `out/{slug}/Claude實戰-{title}-{date}.mp4` (給 James 後台上影片)
- `out/{slug}/Claude實戰-{title}-{date}.vtt` (給 James 後台上字幕)
- + Drive 同步上傳到 `1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p` 子資料夾
- + claude-line-bot 知識庫同步 3 檔（vtt + transcript.md + slides.md）讓 bot 能答學員問題

---

## 26 條鐵律（永遠不可違反）

| # | 規則 | Why |
|---|------|-----|
| 1 | FPS 永遠 30 | 60fps Studio 預覽會卡 |
| 2 | Audio chain 鎖死 = `loudnorm I=-16 LRA=11 TP=-1.5`（純 loudnorm，跟 vibe-coding-video 對齊）；Remotion volume=1.0 | 2026-06-05 拍板：所有 processing 都讓音色變差或壓掉 peak |
| 3 | BGM 必預先 loop 成完整長度 | Remotion `<Audio loop>` 不可靠 |
| 4 | 講者 volume 1.3，BGM volume 0.05 | 經 James 確認比例 |
| 5 | T0 開場 + T_end 結尾 SceneTransition 永遠要（邊界卡） | James 決定 |
| 6 | **中段全幕轉場禁絕對禁蓋教學畫面**（2026-05-27 改）：source 中段任何位置都不放 SceneTransition；分段交給右側 overlay。例外：原始畫面就是死畫面（Chrome 桌面 / OBS / 黑屏）才用 OpeningConcept 全幕概念片接住 | community-calendar 試 T0+T1+T2+T3 共 4 卡，T1/T2/T3 蓋掉 Claude 操作畫面被 James 抓「我就是不要有任何教學講解畫面被擋住」。詳見 `memory/feedback_claude_series_scene_transition.md` |
| 7 | SceneTransition 4 秒、純 paper、Editorial Doc 風 | 設計風格 |
| 8 | Speaker pause + BGM continue 在 transition 期間 | 用 Sequence 自動實現 |
| 9 | 永不出現 EP 序列號 | 不照順序製作 |
| 10 | 字幕只產 VTT 不渲染進影片 | 後台另上 |
| 11 | 疊層內容必須對齊講者當下說的話 | 不可預告/總結/改寫 |
| 12 | 任何文字疊層必須有不透明底板 (alpha ≥0.92) | 真人錄影背景變化大 |
| 13 | 不要持續性 corner badge | 擋畫面 |
| 14 | 開頭結尾死時間都要 trim | 提升節奏 |
| 15 | Whisper 用 base 模型 | medium 在 Mac CPU 太慢 |
| 16 | 不產 HTML 課程頁、不產 thumbnail | James 後台處理 |
| 17 | iMessage 在 QA pass 之後才發 | 不打擾 |
| 18 | VTT 校正必跑**三步驟**：sed + Claude 通讀 + cross-ref inbox 全部來源檔 | sed 抓不到 contextual 錯字；inbox 是專有名詞唯一 source of truth |
| 19 | Render 完成必 rclone 上傳到 Drive folder `1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p` | James 後台從 Drive 拉 |
| 20 | Render 完成必同步 3 檔到 claude-line-bot — `~/.claude/scripts/claude-series-bot-upload.sh` POST `/admin/knowledge`（2026-06-24 改 endpoint 鏈、舊 cp + git push 退役） | 學員 LINE 問 bot 時要能答內容；endpoint DB upsert 多機並行安全、同事的 Mac 也能跑 |
| 21 | Phase 5 QA 必跑三層（code audits + silencedetect + overlay collision） | grep 只驗 code，不驗內容；少跑就會像 meeting-notes-organizer 試做時：21 處空白 + 5s overlay 撞區被 James 抓包 |
| 22 | Phase 2 VTT 校正必跑三步驟（sed + Claude 通讀 + **cross-ref inbox 全部來源檔**） | inbox 的 transcript.md/slides.md/prompt.txt 等就是 source of truth；不 cross-ref 漏 60+ 錯字（如「動時開桶」應該是 prompt.txt 的「動詞開頭」） |
| **23** | **Phase 6 交付 VTT 前必跑 `vtt-shift.py` 把 source-time 平移到 mp4-time**（讀 `src/topics/$SLUG/index.tsx` 的 `TRANSITION_SEC` + `T1_SEC..TN_SEC` 套 shift()） | VTT 從 speaker.wav 出來是 source time；mp4 因 N+1 個 SceneTransition × 4s 比 speaker.wav 長（典型 16s）；不 shift = 字幕從第 0 秒就早 4s，到結尾累積錯位 16s。EP1+EP2 試做都踩過這坑 |
| **24** | **Phase 5 必跑視覺 premortem**（Layer 0）：給 James 預覽前 render 每個轉場卡 + overlay + 開場片 settled 幀，逐張 Read PNG 用眼睛看（背景對不對／OBS介面／重疊／安全區／底板／真人名／對齊旁白），自己先抓錯修掉，需決策的整理選項問 James | reply-template-library 試做 premortem 抓到開頭 2.5 分鐘背景是 OBS Studio 介面；靜態 tsc/grep 看不到。詳見 `memory/feedback_claude_series_premortem.md` |
| **25** | **切點落深靜音**：T0 / T_end SceneTransition 切點放 cut 接縫深靜音 ≤−60dB，不可壓講者起音 | reply-template-library 試做切點照 VTT 切到半個「好」被抓包。詳見 `memory/feedback_claude_series_cut_on_silence.md` |
| **26** | **禁砍中段「死air」教學影片**（2026-05-27 加）：ffmpeg silenceremove / 任何 ffmpeg cut 在 talking-head 課程中段是禁用的。silencedetect -30dB 抓的「死air」很可能是「James 思考＋低音量解說＋Claude 載入」，Whisper 重複幻覺看起來像 dead loop 但周邊 cue 是真教學。唯一例外：開頭 trimStartSec / 結尾 trimEndSec | community-calendar 試做我用 silenceremove 想砍 84.6s「死air」，結果砍掉 Step 4 三方向解說 + Step 8 A/B 結果分析，被 James 抓「教學畫面根本就被切掉了」。詳見 `memory/feedback_claude_series_no_cut_teaching.md` |
| **27** | **VTT 通讀必抓「字母逐字念」cue**（2026-06-05 加）：句子出現「輸入 X、Y、Z」「打 A、B、C」逐字念字母 → cross-ref 實際 demo 畫面確認字母順序+數量對齊；Whisper 聽起來都對但跟畫面對不上 | pdf-summary-analysis：transcript「輸入 C、A、U、D、E」(5字母) 實際是「claude」(6字母) 漏 LL |

> 開頭原始錄影若是 OBS 介面 / 黑屏 / 切錯畫面（premortem 抓到）→ 可用全幕 Editorial Doc 概念片頭取代該段（保留旁白），範本見 `src/topics/reply-template-library/OpeningConcept.tsx`。
