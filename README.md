# claude-series-toolkit

> James 的「Claude 實戰」課程影片製作 pipeline，給合作同事一鍵安裝跑。
>
> 真人錄影 (.mkv) → Whisper 轉字幕 → VTT 校正 → Remotion 疊層 → Editorial Doc 全幕場景。

---

## 安裝（就 2 條指令）

```bash
git clone https://github.com/JamesAtMoGroup/claude-series-toolkit ~/claude-series-toolkit
cd ~/claude-series-toolkit && ./install.sh
```

裝完就有：
- `~/.claude/skills/claude-series/` — 跟 James 一樣的 skill，Claude Code 對話打 `/claude-series` 就能用
- `~/.claude/scripts/{vtt-correct.sh, vtt-shift.py, ...}` — 工具腳本
- `~/Projects/claude-series/` — Remotion 程式碼 + npm install 完

**沒有 token、沒有 PAT、不需要 GitHub 授權**。repo 是 public，clone 完就跑。

---

## 機器需求

```bash
brew install ffmpeg node git rclone python3
pip3 install openai-whisper
```

`install.sh` 開頭會自動檢查、缺什麼會告訴你。

---

## 第一次做一集影片

1. **拿到素材** — 把 3 個檔放進 `~/Projects/claude-series/inbox/<slug>/`：
   - `raw.mkv` 原始錄影
   - `slides.md` 投影片大綱
   - `transcript.md` 規劃稿

2. **Claude Code 對話打**：
   ```
   /claude-series 處理 <slug>
   ```

3. **Director 會自動跑** Phase 1–5（trim → audio → whisper → 校字 → overlay 設計 → TSX → QA 視覺 premortem），到 **Phase 5 預覽** 才停下來叫你看。

4. **預覽 OK 後打「render」**，Phase 6 渲染 mp4 + VTT 出來在 `~/Projects/claude-series/out/<slug>/`。

**到這裡完全離線、不用任何 token / Drive remote**。

---

## (Optional) Phase 6 上傳到 bot / Drive

如果你想自動同步給 bot 知識庫 + 上 James 的 Drive、要再做兩件事：

### 1. 跟 James 拿 bot upload token
James admin 端 mint 一把 machine_token、私訊給你。寫進 `~/.claude/secrets/claude-series.env`：
```env
BOT_UPLOAD_URL=https://claude-ai-futurecoach.zeabur.app
BOT_UPLOAD_TOKEN=<向 James 拿>
```

### 2. 設你自己的 rclone gdrive remote
```bash
rclone config
# New remote → name=gdrive → type=Google Drive → 用你自己的 Google 帳號
```
然後請 James share Drive folder `1ljbamIk9reIFPs3_YqVj1eTn_cNZ194p` 給你的 Google 帳號。

**不設這兩個也能跑** — 你會拿到 mp4，自己手動丟給 James。

---

## Pipeline 文件

裝完後在 `~/.claude/skills/claude-series/`：

| 文件 | 內容 |
|---|---|
| `SKILL.md` | 啟動 + 6 phase 概覽 + 26 條鐵律 |
| `pipeline.md` | 每 phase 詳細步驟 + 指令範例 |
| `design.md` | Editorial Doc design tokens + overlay 元件規格 + audio chain |
| `vtt-corrections.md` | Whisper 中文錯字對照（200+ 條 sed 規則） |

---

## 更新

```bash
cd ~/claude-series-toolkit && git pull
# skill / scripts 是 symlink → 自動同步
# Remotion 程式碼如有更新需手動：cp -R remotion/. ~/Projects/claude-series/
```

---

## 出問題

- 跟 James 開 thread + 把 `pipeline.log` 跟 Claude Code 對話貼上
