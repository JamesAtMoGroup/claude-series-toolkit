# claude-series — VTT 校正詞表

> Whisper base 中文常見錯字。腳本：`~/.claude/scripts/vtt-correct.sh`
>
> Phase 2 Transcript Align 必跑**三步驟**：sed + Claude 通讀 + **cross-ref inbox 全部來源檔**（鐵律 #22）。少一步算沒做完 Phase 2。

---

## 三步驟流程

### Step 1: sed 機械替換 (1 秒)

```bash
~/.claude/scripts/vtt-correct.sh \
  processed/$SLUG/whisper-out/audio.vtt \
  processed/$SLUG/$SLUG.vtt
```

涵蓋 200+ 條規則，分 5 類：
- 通用專有名詞（Claude / Claude Chat / HTML / Prompt / GitHub / Repository / Branch / Commit / Public）
- 高頻 contextual 錯字（中瓜號 / 板面 / 預言 / 多小頁面）
- Whisper hallucinations（成績馬出生 / 程式碼賺血 / YoureSide）
- claude-chat-website 特有（美洲相聚 / 主書會 / 希望區）
- 同音異字（紙色→紫色 / 訂家→店家 / 油標→游標）

### Step 2: Claude 通讀 contextual 校對 (~5 min token)

**完整讀 VTT，找出：**

1. **Whisper hallucination** — 整段聽錯成另一段奇怪的話
2. **同音異字** — 國語近音的錯字
3. **不合理的詞** — 一看就奇怪的組合
4. **拼湊不全的英文/外來語** — 像「YoureSide」「Tammy的確診」之類胡謅
5. **⚠️ 字母逐字念 cue（pdf-summary-analysis 教訓 2026-06-05）** — 句子裡出現「輸入 X、Y、Z」「打 A、B、C」這類**逐字念字母**的 cue，**必須 cross-ref 實際 demo 畫面**確認字母順序+數量對。例：transcript 寫「輸入 C、A、U、D、E」(5 字母)，但實際 Google 搜尋框是「claude」(6 字母 c-l-a-u-d-e) → 字幕該改成「輸入 claude」或補齊「C、L、A、U、D、E」。**Whisper 聽起來都對（講者真的逐字念），但跟畫面對不上**。

抓到的新 pattern → 加進 `vtt-correct.sh` 讓未來 topic 也受惠 → re-run script

### Step 3: Cross-ref inbox 全部來源檔（~5-10 min token，必跑）

**`inbox/$SLUG/` 全部 `.md` `.txt` 檔都是專有名詞 source of truth**。逐一比對：

| 來源檔 | 拿來驗 VTT 的什麼 |
|--------|-------------------|
| `transcript.md` | 規劃稿，含【畫面】標記，整體內容正確性 |
| `slides.md` (教材) | 名詞速查表（逐字稿/Prompt/Context/Action Items 等）|
| `prompt.txt` | Prompt 模板文字（【會議基本資訊】/【行動項目】/「動詞開頭」/「正式書面中文」等）|
| `meeting-sample.md` 或其他 demo 素材 | 人名（Amy/Brian/Cathy）、公司名（緯創）等 proper nouns |

**操作流程：**
1. `ls inbox/$SLUG/` 列出所有 source 檔
2. 列每個來源檔的關鍵詞 / 名詞 / 模板文字
3. 在 VTT grep 對應位置
4. 對照確認 VTT 寫的跟來源檔一致
5. 抓到的新 pattern → 加進 `vtt-correct.sh`
6. Re-run sed
7. Final grep 確認 0 殘留

**Phase 2 完成定義：** Step 1 + Step 2 + Step 3 都 pass + grep 0 殘留 → 才能進 Phase 3

> **EP2 試做教訓：** meeting-notes-organizer 第一次 render 漏掉 Step 3，60+ 處錯字漏網（人名「葛總」「Brian/Cathy」、Prompt 模板「動詞開頭」誤聽成「動時開桶」、「正式書面中文」誤聽成「正式輸面中文」等）。James 指出後重新跑 Step 3 才補齊。

---

## 已知 Whisper 錯字對照表

### 專有名詞

| Whisper 聽的 | 正確 | 場景 |
|--------------|------|------|
| 特奧 / 特勞 / Kerl / 客的 / 靠的 / Cloud | Claude | 講者提到 Anthropic |
| Bullshit / cloud shared / 卻的 | Claude Chat | claude.ai 平台 |
| STNL / HTN / agmail | HTML | 網頁格式 |
| Pamp / Pound / Planter | Prompt | Prompt 詞 |
| Github page / GilePage | GitHub Pages | 部署平台 |
| RuPaul / report / 獨三圍 | Repository | GitHub 倉庫 |
| 卡密 / Tammy / Tammy的確診 | Commit / Commit changes | git commit |
| PAPE | Public | repo 可見性 |
| Bridge | Branch | git 分支 |
| Satins | Settings | GitHub Settings |
| Front and Warp | Framework | 前端框架 |
| Coto action | Call To Action / CTA | 按鈕類型 |

### 同音異字

| Whisper 聽的 | 正確 | 注意 |
|--------------|------|------|
| 城市背景 | 程式背景 | 「不需要程式背景」 |
| 為寫 code | 不會寫 code | 否定誤聽 |
| 流氧 / 溜氧 / 流氧機 / 溜氧機 | 瀏覽 / 瀏覽器 | 講瀏覽器時 |
| 多小頁面 / 多小頁頁頁面 | 縮小頁面 | RWD 演示時 |
| 設立師 | 設計師 | |
| 進貸網頁 | 靜態網頁 | 講靜態時 |
| 不足到 / 不足 | 部署到 / 部署 | 講部署時 |
| 抖扣 | coding | 「不需要 coding」 |
| 紙色 | 紫色 | 顏色描述 |
| 訂家 | 店家 | 商家 |
| 板面 / 台版上 | 版面 / 排版上 | RWD 內容 |
| 油標 / 郵寶 | 游標 | mouse cursor |
| 預言 | 語言 | 「CSS 是一種語言」 |
| 自行排版 | 字型排版 | CSS 內容 |
| 出起很大 | 特別大 | 標題描述 |
| 單刺 / 最單刺 | 單純 / 最單純 | |
| 完全動它 | 完全懂它 | |
| 直接器換 | 直接替換 | |
| 活樂一點 | 活潑一點 | 風格 |
| 溫馨感重明點 | 溫馨感重一點 | |
| 關鍵制 | 關鍵字 | Prompt 結構 |
| 負置 | 複製 | 操作 |
| 打拆 | 打開 | 開啟動作 |
| new 確的 | New Chat 的 | Claude UI |
| 我們這邊按當 | 我們這邊按下載 | 下載按鈕 |

### Hallucinations（Whisper 整段聽錯）

| Whisper 聽的 | 正確 | 上下文 |
|--------------|------|--------|
| **中瓜號** | **中括號** | Prompt 模板的 [...] |
| **成績馬出生的平台** | **程式碼儲存的平台** | GitHub 介紹 |
| 程式碼賺血 | 程式碼撰寫 | 完成網頁時 |
| 希望區 | Hero 區 | 大標題區 |
| 美洲相聚 / 美洲是晚上 | 每週相聚 / 每週是晚上 | 讀書會內容 |
| 主書會 | 讀書會 | 主題 |
| YoureSide | Your site is live | GitHub Pages 完成提示 |
| 在IT來一個網址 | 給你一個網址 | |
| 系列按鈕 | CTA 按鈕 | |
| 報名業 | 報名頁 | 活動報名頁 |
| 老實已經跑好 | 老師已經跑好 | Demo 預先準備 |
| 桌填寫 | 逐一填寫 | |
| 開啟GitHub的配具 | 開啟 GitHub Pages 的配置 | |
| 點到Man / 選Man / 做Man的 | 點到 main / 選 main / 做 main 的 | git branch |
| 按下Set | 按下 Save | UI 按鈕 |
| 這型的分裂 / Settings這個分裂 | 這個分頁 / Settings 分頁 | |
| Apple row | upload | 上傳功能 |
| 那只有但預設機 | 預設只 | |
| Gam大概 | GitHub 大概 | |
| HTL / H 線有 / Index 點 H 線有 | HTML / index.html | 檔名 |
| HTM跟系列 / 有的跟系列 | HTML 跟 CSS | |

---

## 通用補充規則（claude-series 跨 topic 適用）

當你在新 topic 發現 Whisper 錯字模式：

1. **檢查 `transcript.md`** 確認正確詞
2. **檢查 `vtt-correct.sh`** 看是否已有規則
3. **如果是高頻通用** → 加進 vtt-correct.sh
4. **如果是 topic-specific**（如「美洲相聚」只 claude-chat-website 有） → 也可加進 vtt-correct.sh，未來 topic 不會誤觸發
5. **re-run** sed 後 Claude 再通讀一次

---

## 自檢

```bash
# 確認沒殘留高頻錯字
grep -E "Cloud|特奧|特勞|STNL|HTN |Bullshit|cloud shared|卻的|Pamp|Pound|GilePage|RuPaul|卡密|Tammy|PAPE|Bridge|Satins|Front and|Coto|城市背景|為寫 code|流氧|溜氧|多小頁面|設立師|進貸|不足到|抖扣|讓我的實戰|獨三圍|中瓜|板面|預言|YoureSide|希望區|美洲相聚|主書會|報名業|老實|桌填寫|H線有|HTL|點到Man|按下Set|這個分裂|Gam大概|配具|程式碼賺血|成績馬|不會寫code|為寫code|科技改|紙色|訂家|油標|郵寶" \
  processed/$SLUG/$SLUG.vtt | head -10

# 應該空 = 全乾淨
```

**Source of truth：** `inbox/{slug}/transcript.md` (規劃稿) + `slides.md` (名詞表)
