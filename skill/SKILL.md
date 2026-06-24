---
name: claude-series
description: Claude 實戰課程系列影片自動製作 pipeline（真人錄影 + Remotion 疊層 + 全幕場景切換）。觸發場景：(1) James 說「做 Claude 實戰新一集」「處理 claude-series：{topic}」「跑 Claude 實戰 {slug}」(2) 對話中提到 claude-series 專案 (3) `~/Projects/claude-series/inbox/{slug}/` 出現新素材 (raw.mkv + slides.md + transcript.md)。包含完整 6-phase pipeline（Footage Ingest + Audio Enhancement + Whisper + VTT 校正三步驟 + Overlay Spec + Scene Dev + QA + Render + VTT shift 對齊 mp4 + Drive 上傳）、Editorial Doc 設計系統、23 條鐵律、9 個 sub-agent 分工。
---

# claude-series — Skill

> **Identity:** James 的「Claude 實戰」課程系列影片製作 Director。任何 claude-series 任務從這個 skill 啟動。
>
> **跟其他 video pipeline 的差異：** 這條 pipeline 是「真人錄影 (.mkv) + Remotion 疊層 + 全幕場景切換」，不是 TTS 配音生成。視覺 Editorial Doc 風格（米白 + 招牌橘）跟 article-video 的黑底霓綠 / vibe-coding 的 Glassmorphism 完全不同。

---

## Activation Behavior

被觸發時立即執行：

1. **讀 design tokens**：`design.md` — Editorial Doc 設計系統、7 種 overlay 元件、Audio chain（鎖死配方）。**Phase 4 Scene Dev Agent 寫 TSX 時 MUST 依照這份。**
2. **讀 pipeline 細節**：`pipeline.md` — 6 phase 完整步驟 + ffmpeg / Whisper / rclone 指令模板
3. **讀 VTT 校正詞表**：`vtt-corrections.md` — Whisper 中文錯字對照（200+ 條）
4. **檢視 inbox**：`ls ~/Projects/claude-series/inbox/{slug}/` 確認三檔齊全（raw.mkv + slides.md + transcript.md）
5. **依 Pipeline 流程一段一段執行**，phase 之間不打斷 James — 唯一檢查點是 Phase 5 QA pass 後 iMessage

---

## Pipeline Overview — 6 Phase

```
inbox/{topic-slug}/ (raw.mkv + slides.md + transcript.md)
        ↓
[Phase 1]  Director 決策（人工，~3 min token）
           • 看頭 30s + 尾 30s → trim.json
           • 決定 transitions.json (T0 開場 + 3-4 個重大切點)
        ↓
[Phase 2]  4 個 sub-agent 平行 (~5-10 min)
           🎞️ Footage Ingest    ffmpeg trim + 轉 mp4
           🎙️ Audio Enhancement speaker.wav (鎖死 chain) + BGM 預先 loop
           🗣️ Transcript Align  Whisper base + sed 校正 + Claude 通讀 + cross-ref inbox 全部來源檔（三步驟）
           📑 Slide Mapping     slides.md → cues
        ↓
[Phase 3]  🎨 Overlay Spec Agent (~10 min token)
           20-30 個疊層；對齊講者當下說的話；輸出 overlay-spec.json
        ↓
[Phase 4]  🛠 Scene Dev Agent (~15 min token)
           寫 src/topics/{slug}/index.tsx
           4 個 media segment + 4 個 SceneTransition + shift() 函數
        ↓
[Phase 5]  ✅ QA + iMessage Gate
           Layer 0 視覺 premortem（render 每個卡/疊層/開場片 settled 幀 → 逐張用眼睛看，自己先抓錯）
           → 三層 audits → Studio preview → iMessage 等「通過」
           ⚠️ 鐵律 #24：給 James 預覽前，Director 必須先 premortem 把錯抓出來修掉，不是讓 James 抓
        ↓
[Phase 6]  🎬 Render Agent (~30-60 min CPU)
           npm run build:{slug} → mp4
           **vtt-shift.py：把 source-time VTT 平移到 mp4-time（鐵律 #23）**
             ~/.claude/scripts/vtt-shift.py processed/$SLUG/$SLUG.vtt \
               out/$SLUG/Claude實戰-$TITLE-$DATE.vtt \
               --from-tsx src/topics/$SLUG/index.tsx
           rclone upload → Drive folder 1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p
           sync 3 檔 → POST /admin/knowledge (claude-series-bot-upload.sh)
           iMessage 通知含 Drive + bot link
```

---

## 25 條鐵律（不可違反）

最重要 12 條：

| # | 規則 | Why |
|---|------|-----|
| 1 | 永不出現 EP 序列號 | 課程不照順序製作，用 topic slug |
| 2 | Audio chain 鎖死 = `loudnorm I=-16 LRA=11 TP=-1.5`（純 loudnorm，跟 vibe-coding-video 對齊）；Remotion volume=1.0；Phase 5 QA 必量測 LUFS | 2026-06-05 拍板：所有 processing 都壓掉 peak 害 loudnorm 拉不動 |
| 3 | T0 開場 SceneTransition + 3 個重大切換 transition | 不要每 PART 都加 |
| 4 | 疊層內容必須對齊講者當下說的話 | 不可預告/總結/改寫 |
| 5 | 不產 HTML、不產 thumbnail | James 後台處理 |
| 6 | VTT 校正必跑**三步驟**：sed + Claude 通讀 + **cross-ref inbox 全部來源檔** | sed 抓不到 contextual 錯字；inbox materials 是專有名詞唯一 source of truth |
| 7 | Render 完成必 rclone 上傳到 Drive folder `1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p` | 每 topic 一個中文標題子資料夾 |
| 8 | Render 完成必同步 3 檔（vtt + transcript.md + slides.md）到 claude-line-bot — 用 `~/.claude/scripts/claude-series-bot-upload.sh` POST `/admin/knowledge`（2026-06-24 取代 cp + git push） | 學員 LINE 問 bot 時要能答內容；endpoint DB upsert 多機並行安全、同事的 Mac 也能跑 |
| 22 | Phase 2 完成 = sed + 通讀 + **cross-ref inbox 全部 .md/.txt**；少一步算沒做完 | EP2 試做漏掉第 3 步 → 60+ 處錯字漏網（人名/Prompt 模板/動詞開頭等）|
| **23** | **Phase 6 Render 後交付 VTT 前必跑 `vtt-shift.py` 把 source-time 平移到 mp4-time**（套 `shift(sourceSec)` 邏輯） | VTT 從 speaker.wav (source) 來；mp4 因 4 個 SceneTransition × 4s = 16s 插入比 source 長；不 shift = 字幕從第 0 秒就早，後段累積錯位 16 秒 |
| **24** | **Phase 5 必跑視覺 premortem**：給 James 預覽前 render 每個轉場卡 + 每個 overlay + 開場片的 settled 幀，**逐張 Read PNG 用眼睛看**（背景對不對／OBS 介面／重疊／安全區／文字底板／真人名／對齊旁白），自己先抓錯修掉 | reply-template-library 試做時 premortem 抓到「開頭 2.5 分鐘背景是 OBS Studio 介面」——靜態 tsc/grep 完全看不到。James 要的是我先抓錯，不是他來抓 |
| **25** | **切點落深靜音**：T0 / T_end SceneTransition 切點放 cut 接縫深靜音（≤−60dB），**不可壓講者起音**（Whisper 時間戳比實際起音晚 0.3–0.5s） | reply-template-library T1/T3 照 VTT 切點切到半個「好」字被 James 抓包 |
| **26** | **禁砍中段「死air」教學影片**（2026-05-27 改）：talking-head 課程中段 silenceremove / 任何 ffmpeg cut 都禁用；silencedetect -30dB 抓的「死air」可能是「思考＋低音量解說＋Claude 載入」，Whisper 重複幻覺看起來像 dead loop 但周邊 cue 是真教學 | community-calendar 用 silenceremove 砍 84.6s「死air」誤砍 Step 4 三方向解說 + Step 8 A/B 結果分析 |
| **27** | **VTT 通讀必抓「字母逐字念」cue**（2026-06-05 加）：句子出現「輸入 X、Y、Z」「打 A、B、C」這類逐字念字母 → **cross-ref 實際 demo 畫面**確認字母順序+數量對齊；Whisper 聽起來都對但跟畫面對不上會被 James 抓 | pdf-summary-analysis：transcript「輸入 C、A、U、D、E」(5字母) 實際是「claude」(6字母) — Whisper 沒錯但教材稿就漏 LL |

完整 25 條：見 `pipeline.md` 末尾

---

## 9 個 Sub-Agent

| Agent | Phase | 角色 |
|-------|-------|------|
| Director | All | 總指揮 + Phase 1 人工決策 |
| 🎞️ Footage Ingest | 2 | mkv → mp4 (libx264 crf 18) + 抽 audio.wav + ffprobe metadata |
| 🎙️ Audio Enhancement | 2 | speaker.wav (純 loudnorm I=-16) + BGM 預先 loop |
| 🗣️ Transcript Align | 2 | Whisper base + sed 校正 + Claude 通讀 contextual 校對 |
| 📑 Slide Mapping | 2 | slides.md → JSON |
| 🎨 Overlay Spec | 3 | 設計 ~25 個 overlays（資深剪輯眼） |
| 🛠 Scene Dev | 4 | index.tsx (4 segment + 4 transition + shift) |
| ✅ QA | 5 | 自動 audits + iMessage |
| 🎬 Render | 6 | mp4 + vtt copy + Drive upload |

---

## 檔案結構慣例

```
~/Projects/claude-series/
├── inbox/{slug}/             # James 提供
│   ├── raw.mkv               # 原始錄影
│   ├── slides.md             # 投影片大綱
│   └── transcript.md         # 規劃稿（含【畫面】標記，源 of truth for 專有名詞）
├── processed/{slug}/         # 中間產物
│   ├── trim.json             # {trimStartSec, trimEndSec}
│   ├── transitions.json      # 4 個 SceneTransition 切點
│   ├── slide-mapping.json    # 投影片 → cue
│   ├── overlay-spec.json     # 20-30 個 overlay 設計
│   ├── audio.wav             # 給 Whisper（16kHz mono）
│   ├── whisper-out/audio.vtt # raw whisper 不要動
│   ├── {slug}.vtt            # 校正過的最終 VTT
│   └── checklist-*.md        # 每個 agent 的完成 checklist
├── public/{slug}/            # Remotion 載入
│   ├── raw.mp4               # trim 後的 mp4
│   ├── speaker.wav           # 處理過的講者音軌
│   ├── speaker-raw.wav       # 零處理 backup（A/B 比對）
│   ├── bgm.wav               # BGM 原曲（60s）
│   └── bgm-looped.wav        # BGM 預先 loop 到 total duration
├── src/topics/{slug}/
│   ├── index.tsx             # 主 composition (4 segment + transitions)
│   └── sample.tsx            # 30s 試做樣本（可選）
└── out/{slug}/
    ├── Claude實戰-{title}-{date}.mp4
    └── Claude實戰-{title}-{date}.vtt
```

---

## 對外 reference

- 📋 完整 pipeline 細節 + 指令：`pipeline.md`
- 🎨 設計 tokens + overlay 元件 + audio chain：`design.md`
- 🗣️ VTT 校正詞表（200+ 條 sed 規則 + Whisper 錯字邏輯）：`vtt-corrections.md`
- 🤖 Sub-agent 完整分工 + 觸發 cheatsheet：`~/.claude/commands/agents.md` 「🎓 Claude Series Director」段
- 📁 Project rules（同步 source of truth）：`~/Projects/claude-series/.agents/rules/`
- 💾 試做學到的 feedback：`~/.claude/projects/-Users-jamesshih/memory/feedback_claude_series_*.md`
- ☁️ Drive 上傳資料夾：`memory/reference_drive_claude_series.md`

---

## 觸發詞（自動 activate 此 skill）

- 「做 Claude 實戰新一集 / claude-series：{topic}」
- 「處理 claude-series {slug}」
- 「跑 Claude 實戰 {slug}」
- `/claude-series`
- 對話中提到 `~/Projects/claude-series/` 任務
- inbox 出現新 topic 資料夾
